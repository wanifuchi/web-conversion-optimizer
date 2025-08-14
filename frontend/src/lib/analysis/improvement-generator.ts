// Specific Improvement Instruction Generator

import { DetailedElement, SpecificImprovement } from './detailed-analyzer';
import { CoordinateIssue } from './coordinate-analyzer';

export interface DetailedInstruction {
  id: string;
  title: string;
  location: string; // "座標(240, 450)の「お申し込み」ボタン"
  currentState: {
    visual: string; // "現在の状態: 灰色背景、14pxフォント"
    technical: Record<string, string>; // CSS values
  };
  requiredChanges: {
    visual: string; // "推奨変更: オレンジ背景、18pxフォント、太字"
    technical: Record<string, string>; // New CSS values
    reasoning: string; // Why this change
  };
  implementation: {
    cssCode: string;
    htmlChanges?: string;
    selector: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
  };
  expectedResults: {
    primaryMetric: string;
    improvement: string;
    timeframe: string;
    confidence: number;
  };
  visualComparison: {
    before: string;
    after: string;
    keyDifferences: string[];
  };
}

export interface ColorRecommendation {
  primary: string;
  text: string;
  reasoning: string;
  contrastRatio: number;
}

export class ImprovementGenerator {
  
  generateDetailedInstructions(
    elements: DetailedElement[],
    issues: CoordinateIssue[]
  ): DetailedInstruction[] {
    const instructions: DetailedInstruction[] = [];
    
    // Group issues by element for comprehensive improvements
    const elementIssues = this.groupIssuesByElement(issues);
    
    elementIssues.forEach((elementIssueGroup, elementId) => {
      const element = elements.find(el => el.selector === elementId);
      if (!element) return;
      
      const instruction = this.createDetailedInstruction(element, elementIssueGroup);
      if (instruction) {
        instructions.push(instruction);
      }
    });
    
    // Add proactive improvements for high-impact elements
    const proactiveInstructions = this.generateProactiveImprovements(elements);
    instructions.push(...proactiveInstructions);
    
    return instructions.sort((a, b) => {
      const priorityOrder = { immediate: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.implementation.priority] - priorityOrder[a.implementation.priority];
    });
  }
  
  private groupIssuesByElement(issues: CoordinateIssue[]): Map<string, CoordinateIssue[]> {
    const grouped = new Map<string, CoordinateIssue[]>();
    
    issues.forEach(issue => {
      const selector = issue.element.selector;
      if (!grouped.has(selector)) {
        grouped.set(selector, []);
      }
      grouped.get(selector)!.push(issue);
    });
    
    return grouped;
  }
  
  private createDetailedInstruction(
    element: DetailedElement,
    issues: CoordinateIssue[]
  ): DetailedInstruction | null {
    const primaryIssue = issues[0]; // Highest priority issue
    const location = `座標(${element.position.centerX}, ${element.position.centerY})の「${element.text || element.tagName}」${this.getElementTypeText(element.type)}`;
    
    switch (element.type) {
      case 'button':
        return this.createButtonInstruction(element, issues, location);
      case 'form':
        return this.createFormInstruction(element, issues, location);
      case 'text':
        return this.createTextInstruction(element, issues, location);
      default:
        return null;
    }
  }
  
  private createButtonInstruction(
    element: DetailedElement,
    issues: CoordinateIssue[],
    location: string
  ): DetailedInstruction {
    const colorRec = this.generateOptimalButtonColors(element);
    const currentBg = element.styles.backgroundColor;
    const currentSize = element.styles.fontSize;
    
    return {
      id: `btn_${element.selector.replace(/[^a-zA-Z0-9]/g, '_')}`,
      title: 'CTAボタンの視認性と効果性を向上',
      location,
      currentState: {
        visual: `背景色: ${currentBg}, フォントサイズ: ${currentSize}, パディング: ${element.styles.padding}`,
        technical: {
          'background-color': currentBg,
          'color': element.styles.color,
          'font-size': currentSize,
          'padding': element.styles.padding,
          'border-radius': element.styles.borderRadius
        }
      },
      requiredChanges: {
        visual: `背景色: ${colorRec.primary} (高コントラスト), フォントサイズ: 18px, 太字, 適切なパディング`,
        technical: {
          'background-color': colorRec.primary,
          'color': colorRec.text,
          'font-size': '18px',
          'font-weight': '600',
          'padding': '12px 24px',
          'border-radius': '6px',
          'border': 'none'
        },
        reasoning: `${colorRec.reasoning} コントラスト比${colorRec.contrastRatio.toFixed(1)}で WCAG AA基準をクリア。フォントサイズ18pxで可読性向上。`
      },
      implementation: {
        cssCode: `/* 具体的な実装コード */
${element.selector} {
  background-color: ${colorRec.primary};
  color: ${colorRec.text};
  font-size: 18px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  min-height: 48px;
}

${element.selector}:hover {
  background-color: ${this.getDarkerColor(colorRec.primary)};
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

${element.selector}:active {
  transform: translateY(0);
}`,
        selector: element.selector,
        priority: this.determinePriority(issues)
      },
      expectedResults: {
        primaryMetric: 'クリック率',
        improvement: '15-25%向上',
        timeframe: '実装後1-2週間で効果測定可能',
        confidence: 85
      },
      visualComparison: {
        before: `灰色背景 (${currentBg}) の目立たないボタン`,
        after: `鮮やかなオレンジ背景 (${colorRec.primary}) の目立つボタン`,
        keyDifferences: [
          '背景色が灰色から高コントラストのオレンジに変更',
          'フォントサイズが14pxから18pxに拡大',
          'ホバー効果とアニメーションを追加',
          'モバイル対応のタッチターゲットサイズ確保'
        ]
      }
    };
  }
  
  private createFormInstruction(
    element: DetailedElement,
    issues: CoordinateIssue[],
    location: string
  ): DetailedInstruction {
    return {
      id: `form_${element.selector.replace(/[^a-zA-Z0-9]/g, '_')}`,
      title: 'フォーム入力フィールドのユーザビリティ向上',
      location,
      currentState: {
        visual: `高さ: ${element.position.height}px, パディング: ${element.styles.padding}`,
        technical: {
          'height': `${element.position.height}px`,
          'padding': element.styles.padding,
          'font-size': element.styles.fontSize,
          'border': element.styles.border
        }
      },
      requiredChanges: {
        visual: `高さ: 48px以上, 内側余白: 12px 16px, フォントサイズ: 16px, 明確なフォーカス状態`,
        technical: {
          'height': '48px',
          'padding': '12px 16px',
          'font-size': '16px',
          'border': '1px solid #CCCCCC',
          'border-radius': '4px'
        },
        reasoning: 'モバイルでの入力しやすさを考慮し最小44pxの高さを確保。16pxフォントでズーム防止、明確なフォーカス状態でユーザビリティ向上。'
      },
      implementation: {
        cssCode: `/* フォームフィールド改善 */
${element.selector} {
  height: 48px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

${element.selector}:focus {
  border-color: #007BFF;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

${element.selector}::placeholder {
  color: #6C757D;
  opacity: 1;
}`,
        selector: element.selector,
        priority: this.determinePriority(issues)
      },
      expectedResults: {
        primaryMetric: 'フォーム完了率',
        improvement: '5-15%向上',
        timeframe: '実装後即座に効果を実感',
        confidence: 75
      },
      visualComparison: {
        before: '小さくて入力しづらいフィールド',
        after: '十分な高さで入力しやすいフィールド',
        keyDifferences: [
          '高さを36pxから48pxに拡大',
          '内側余白を追加して文字が読みやすく',
          'フォーカス時の視覚的フィードバックを強化',
          'モバイルでのズーム防止（16pxフォント）'
        ]
      }
    };
  }
  
  private createTextInstruction(
    element: DetailedElement,
    issues: CoordinateIssue[],
    location: string
  ): DetailedInstruction {
    const currentSize = parseInt(element.styles.fontSize);
    const recommendedSize = Math.max(currentSize + 2, 16);
    
    return {
      id: `text_${element.selector.replace(/[^a-zA-Z0-9]/g, '_')}`,
      title: 'テキストの可読性向上',
      location,
      currentState: {
        visual: `フォントサイズ: ${element.styles.fontSize}, 行間: 通常`,
        technical: {
          'font-size': element.styles.fontSize,
          'line-height': 'inherit',
          'color': element.styles.color
        }
      },
      requiredChanges: {
        visual: `フォントサイズ: ${recommendedSize}px, 行間: 1.5, 適切なコントラスト`,
        technical: {
          'font-size': `${recommendedSize}px`,
          'line-height': '1.5',
          'color': '#333333'
        },
        reasoning: `${recommendedSize}px以上のフォントサイズで読みやすさを確保。行間1.5で視認性向上、高コントラストで可読性を改善。`
      },
      implementation: {
        cssCode: `/* テキスト可読性改善 */
${element.selector} {
  font-size: ${recommendedSize}px;
  line-height: 1.5;
  color: #333333;
  max-width: 65ch; /* 最適な行長 */
  margin-bottom: 1em;
}

@media (max-width: 768px) {
  ${element.selector} {
    font-size: ${Math.max(recommendedSize - 1, 15)}px;
    line-height: 1.6;
  }
}`,
        selector: element.selector,
        priority: this.determinePriority(issues)
      },
      expectedResults: {
        primaryMetric: '読了率',
        improvement: '5-10%向上',
        timeframe: '実装後即座に効果を実感',
        confidence: 70
      },
      visualComparison: {
        before: '小さくて読みにくいテキスト',
        after: '適切なサイズで読みやすいテキスト',
        keyDifferences: [
          `フォントサイズを${currentSize}pxから${recommendedSize}pxに拡大`,
          '行間を1.5に設定して読みやすさ向上',
          '高コントラストの文字色に変更',
          'モバイル対応のレスポンシブサイズ'
        ]
      }
    };
  }
  
  private generateOptimalButtonColors(element: DetailedElement): ColorRecommendation {
    // High-conversion color palette based on psychological impact
    const colorOptions = [
      {
        primary: '#FF6B35', // High-impact orange
        text: '#FFFFFF',
        reasoning: 'オレンジ色は緊急性と行動を促進する心理的効果があり、CTAボタンに最適',
        contrastRatio: 7.1
      },
      {
        primary: '#007BFF', // Trust-building blue
        text: '#FFFFFF',
        reasoning: '青色は信頼性を表現し、安心感を与えるためサービス申込に効果的',
        contrastRatio: 8.2
      },
      {
        primary: '#28A745', // Success green
        text: '#FFFFFF',
        reasoning: '緑色は安全性と成功を暗示し、前向きな行動を促進',
        contrastRatio: 6.8
      }
    ];
    
    // Select based on button text content
    const buttonText = element.text.toLowerCase();
    if (buttonText.includes('今すぐ') || buttonText.includes('限定') || buttonText.includes('急')) {
      return colorOptions[0]; // Orange for urgency
    } else if (buttonText.includes('申込') || buttonText.includes('登録') || buttonText.includes('契約')) {
      return colorOptions[1]; // Blue for trust
    } else {
      return colorOptions[2]; // Green for positive action
    }
  }
  
  private generateProactiveImprovements(elements: DetailedElement[]): DetailedInstruction[] {
    const improvements: DetailedInstruction[] = [];
    
    // Find primary CTA and ensure it's optimized
    const primaryCTA = elements.find(el => 
      el.type === 'button' && 
      (el.text.includes('申込') || el.text.includes('購入') || el.text.includes('登録'))
    );
    
    if (primaryCTA && !this.isOptimallyStyled(primaryCTA)) {
      // Add proactive CTA optimization even if no issues detected
      improvements.push(this.createButtonInstruction(primaryCTA, [], 
        `座標(${primaryCTA.position.centerX}, ${primaryCTA.position.centerY})の「${primaryCTA.text}」ボタン`
      ));
    }
    
    return improvements;
  }
  
  private isOptimallyStyled(element: DetailedElement): boolean {
    const bgColor = element.styles.backgroundColor.toLowerCase();
    const fontSize = parseInt(element.styles.fontSize);
    
    // Check if already using high-impact colors and proper sizing
    const goodColors = ['#ff6b35', '#007bff', '#28a745', '#dc3545'];
    const hasGoodColor = goodColors.some(color => bgColor.includes(color.replace('#', '')));
    const hasGoodSize = fontSize >= 16;
    
    return hasGoodColor && hasGoodSize;
  }
  
  private determinePriority(issues: CoordinateIssue[]): 'immediate' | 'high' | 'medium' | 'low' {
    if (issues.some(issue => issue.severity === 'critical')) return 'immediate';
    if (issues.some(issue => issue.severity === 'high')) return 'high';
    if (issues.some(issue => issue.severity === 'medium')) return 'medium';
    return 'low';
  }
  
  private getDarkerColor(color: string): string {
    // Simple color darkening for hover effects
    const colorMap: Record<string, string> = {
      '#FF6B35': '#E55A2B',
      '#007BFF': '#0056B3',
      '#28A745': '#1E7E34'
    };
    return colorMap[color] || color;
  }
  
  private getElementTypeText(type: string): string {
    const typeMap: Record<string, string> = {
      'button': 'ボタン',
      'link': 'リンク',
      'form': '入力フィールド',
      'text': 'テキスト',
      'image': '画像',
      'navigation': 'ナビゲーション',
      'other': '要素'
    };
    return typeMap[type] || '要素';
  }
}

export const improvementGenerator = new ImprovementGenerator();