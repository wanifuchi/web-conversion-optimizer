// Detailed DOM Analysis Engine for specific improvement instructions

export interface DetailedElement {
  selector: string;
  tagName: string;
  text: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  styles: {
    backgroundColor: string;
    color: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
    border: string;
    zIndex: string;
    display: string;
    visibility: string;
  };
  accessibility: {
    contrastRatio: number;
    hasAltText: boolean;
    hasAriaLabel: boolean;
    isFocusable: boolean;
  };
  type: 'button' | 'link' | 'form' | 'text' | 'image' | 'navigation' | 'other';
}

export interface DetailedAnalysisInput {
  url: string;
  elements: DetailedElement[];
  screenshot?: {
    url: string;
    width: number;
    height: number;
  };
  pageMetrics: {
    loadTime: number;
    totalElements: number;
    interactiveElements: number;
  };
}

export interface SpecificImprovement {
  elementId: string;
  location: string; // "座標(240, 450)の「お申し込み」ボタン"
  currentState: {
    description: string;
    css: Record<string, string>;
  };
  recommendedChange: {
    description: string;
    css: Record<string, string>;
    reasoning: string;
  };
  expectedImpact: {
    metric: string;
    improvement: string;
    confidence: number;
  };
  implementationCode: {
    css: string;
    selector: string;
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export class DetailedAnalyzer {
  
  analyzeElements(input: DetailedAnalysisInput): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    
    // Analyze CTA buttons
    const ctaButtons = input.elements.filter(el => 
      el.type === 'button' && 
      (el.text.includes('申込') || el.text.includes('購入') || el.text.includes('登録') || 
       el.text.includes('応募') || el.text.includes('お問い合わせ') || el.text.includes('詳細'))
    );
    
    ctaButtons.forEach(button => {
      improvements.push(...this.analyzeCTAButton(button));
    });
    
    // Analyze form elements
    const formElements = input.elements.filter(el => el.type === 'form');
    formElements.forEach(form => {
      improvements.push(...this.analyzeFormElement(form));
    });
    
    // Analyze text elements for readability
    const textElements = input.elements.filter(el => el.type === 'text');
    textElements.forEach(text => {
      improvements.push(...this.analyzeTextElement(text));
    });
    
    // Sort by priority and impact
    return improvements.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  private analyzeCTAButton(button: DetailedElement): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    
    // Color analysis
    const bgColor = button.styles.backgroundColor;
    const textColor = button.styles.color;
    
    if (this.isLowContrastColor(bgColor) || button.accessibility.contrastRatio < 4.5) {
      improvements.push({
        elementId: button.selector,
        location: `座標(${button.position.centerX}, ${button.position.centerY})の「${button.text}」ボタン`,
        currentState: {
          description: `背景色: ${bgColor}, 文字色: ${textColor}, コントラスト比: ${button.accessibility.contrastRatio.toFixed(1)}`,
          css: {
            'background-color': bgColor,
            'color': textColor,
            'font-size': button.styles.fontSize
          }
        },
        recommendedChange: {
          description: '高コントラストな配色に変更してボタンの視認性を向上',
          css: {
            'background-color': '#FF6B35', // High-impact orange
            'color': '#FFFFFF',
            'font-size': this.increaseFontSize(button.styles.fontSize),
            'padding': '12px 24px',
            'border-radius': '6px',
            'font-weight': '600'
          },
          reasoning: 'オレンジ色は緊急性と行動を促す色として効果的。白文字との組み合わせでコントラスト比7.1を確保。'
        },
        expectedImpact: {
          metric: 'クリック率',
          improvement: '15-25%向上',
          confidence: 85
        },
        implementationCode: {
          css: `${button.selector} {
  background-color: #FF6B35;
  color: #FFFFFF;
  font-size: ${this.increaseFontSize(button.styles.fontSize)};
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

${button.selector}:hover {
  background-color: #E55A2B;
}`,
          selector: button.selector
        },
        priority: 'high'
      });
    }
    
    // Size analysis
    if (button.position.width < 120 || button.position.height < 40) {
      improvements.push({
        elementId: button.selector,
        location: `座標(${button.position.centerX}, ${button.position.centerY})の「${button.text}」ボタン`,
        currentState: {
          description: `サイズ: ${button.position.width}px × ${button.position.height}px`,
          css: {
            'width': `${button.position.width}px`,
            'height': `${button.position.height}px`,
            'padding': button.styles.padding
          }
        },
        recommendedChange: {
          description: 'ボタンサイズを拡大してタップエリアを改善',
          css: {
            'min-width': '140px',
            'min-height': '48px',
            'padding': '12px 24px'
          },
          reasoning: 'モバイルでのタップしやすさを考慮し、最小44px×44pxのタッチターゲットサイズを確保。'
        },
        expectedImpact: {
          metric: 'モバイルでのクリック率',
          improvement: '10-20%向上',
          confidence: 80
        },
        implementationCode: {
          css: `${button.selector} {
  min-width: 140px;
  min-height: 48px;
  padding: 12px 24px;
}`,
          selector: button.selector
        },
        priority: 'medium'
      });
    }
    
    return improvements;
  }
  
  private analyzeFormElement(form: DetailedElement): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    
    // Form field size analysis
    if (form.position.height < 44) {
      improvements.push({
        elementId: form.selector,
        location: `座標(${form.position.centerX}, ${form.position.centerY})の入力フィールド`,
        currentState: {
          description: `高さ: ${form.position.height}px`,
          css: {
            'height': `${form.position.height}px`,
            'padding': form.styles.padding
          }
        },
        recommendedChange: {
          description: '入力フィールドの高さを増加してユーザビリティを向上',
          css: {
            'height': '48px',
            'padding': '12px 16px',
            'font-size': '16px'
          },
          reasoning: 'モバイルでの入力しやすさを考慮し、最小44pxの高さを確保。16pxのフォントサイズでズーム防止。'
        },
        expectedImpact: {
          metric: 'フォーム完了率',
          improvement: '5-15%向上',
          confidence: 75
        },
        implementationCode: {
          css: `${form.selector} {
  height: 48px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #CCCCCC;
  border-radius: 4px;
}

${form.selector}:focus {
  border-color: #007BFF;
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}`,
          selector: form.selector
        },
        priority: 'medium'
      });
    }
    
    return improvements;
  }
  
  private analyzeTextElement(text: DetailedElement): SpecificImprovement[] {
    const improvements: SpecificImprovement[] = [];
    
    // Font size analysis
    const fontSize = parseInt(text.styles.fontSize);
    if (fontSize < 14) {
      improvements.push({
        elementId: text.selector,
        location: `座標(${text.position.centerX}, ${text.position.centerY})のテキスト`,
        currentState: {
          description: `フォントサイズ: ${text.styles.fontSize}`,
          css: {
            'font-size': text.styles.fontSize,
            'line-height': 'inherit'
          }
        },
        recommendedChange: {
          description: 'フォントサイズを拡大して可読性を向上',
          css: {
            'font-size': '16px',
            'line-height': '1.5'
          },
          reasoning: '16px以上のフォントサイズで読みやすさを確保。行間1.5で読みやすさを向上。'
        },
        expectedImpact: {
          metric: '読了率',
          improvement: '5-10%向上',
          confidence: 70
        },
        implementationCode: {
          css: `${text.selector} {
  font-size: 16px;
  line-height: 1.5;
}`,
          selector: text.selector
        },
        priority: 'low'
      });
    }
    
    return improvements;
  }
  
  private isLowContrastColor(color: string): boolean {
    // Simple heuristic for low contrast colors
    const lowContrastColors = ['#E0E0E0', '#F0F0F0', '#D3D3D3', '#C0C0C0'];
    return lowContrastColors.includes(color.toUpperCase());
  }
  
  private increaseFontSize(currentSize: string): string {
    const size = parseInt(currentSize);
    return `${Math.max(size + 2, 16)}px`;
  }
}

export const detailedAnalyzer = new DetailedAnalyzer();