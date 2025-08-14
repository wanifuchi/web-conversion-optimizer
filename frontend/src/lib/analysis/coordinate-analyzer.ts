// Coordinate-based Problem Identification System

import { DetailedElement, SpecificImprovement } from './detailed-analyzer';

export interface CoordinateIssue {
  location: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  element: DetailedElement;
  issueType: 'visibility' | 'usability' | 'accessibility' | 'conversion' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  specificLocation: string; // "座標(240, 450)の「お申し込み」ボタン"
}

export interface ScreenshotAnalysis {
  width: number;
  height: number;
  viewportSections: {
    aboveFold: { y: 0, height: number };
    belowFold: { y: number, height: number };
  };
  heatmapAreas: {
    high: Array<{ x: number; y: number; width: number; height: number }>;
    medium: Array<{ x: number; y: number; width: number; height: number }>;
    low: Array<{ x: number; y: number; width: number; height: number }>;
  };
}

export class CoordinateAnalyzer {
  
  identifyLocationBasedIssues(
    elements: DetailedElement[], 
    screenshot: ScreenshotAnalysis
  ): CoordinateIssue[] {
    const issues: CoordinateIssue[] = [];
    
    // Analyze CTA button positions
    issues.push(...this.analyzeCTAPositions(elements, screenshot));
    
    // Analyze form field clustering
    issues.push(...this.analyzeFormPositions(elements, screenshot));
    
    // Analyze text readability by position
    issues.push(...this.analyzeTextPositions(elements, screenshot));
    
    // Analyze navigation accessibility
    issues.push(...this.analyzeNavigationPositions(elements, screenshot));
    
    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }
  
  private analyzeCTAPositions(
    elements: DetailedElement[], 
    screenshot: ScreenshotAnalysis
  ): CoordinateIssue[] {
    const issues: CoordinateIssue[] = [];
    const ctaButtons = elements.filter(el => el.type === 'button');
    
    ctaButtons.forEach(button => {
      const centerX = button.position.centerX;
      const centerY = button.position.centerY;
      
      // Check if CTA is below the fold
      if (centerY > screenshot.viewportSections.aboveFold.height) {
        issues.push({
          location: button.position,
          element: button,
          issueType: 'conversion',
          severity: 'high',
          description: 'メインCTAボタンがファーストビュー外に配置されています',
          specificLocation: `座標(${centerX}, ${centerY})の「${button.text}」ボタン`
        });
      }
      
      // Check if CTA is in low-attention area
      const isInLowAttentionArea = this.isInLowAttentionArea(centerX, centerY, screenshot);
      if (isInLowAttentionArea) {
        issues.push({
          location: button.position,
          element: button,
          issueType: 'visibility',
          severity: 'medium',
          description: 'CTAボタンが注意を引きにくい位置に配置されています',
          specificLocation: `座標(${centerX}, ${centerY})の「${button.text}」ボタン`
        });
      }
      
      // Check for optimal CTA positioning (F-pattern consideration)
      if (!this.isInOptimalCTAZone(centerX, centerY, screenshot)) {
        issues.push({
          location: button.position,
          element: button,
          issueType: 'conversion',
          severity: 'medium',
          description: 'CTAボタンの位置をF字パターンの読み終わり地点に最適化できます',
          specificLocation: `座標(${centerX}, ${centerY})の「${button.text}」ボタン`
        });
      }
    });
    
    return issues;
  }
  
  private analyzeFormPositions(
    elements: DetailedElement[], 
    screenshot: ScreenshotAnalysis
  ): CoordinateIssue[] {
    const issues: CoordinateIssue[] = [];
    const formElements = elements.filter(el => el.type === 'form');
    
    // Check form field spacing
    for (let i = 0; i < formElements.length - 1; i++) {
      const currentField = formElements[i];
      const nextField = formElements[i + 1];
      
      const verticalGap = nextField.position.y - (currentField.position.y + currentField.position.height);
      
      if (verticalGap < 16) {
        issues.push({
          location: currentField.position,
          element: currentField,
          issueType: 'usability',
          severity: 'medium',
          description: 'フォームフィールド間の間隔が狭すぎて入力しづらい可能性があります',
          specificLocation: `座標(${currentField.position.centerX}, ${currentField.position.centerY})から座標(${nextField.position.centerX}, ${nextField.position.centerY})のフィールド間`
        });
      }
    }
    
    // Check if form is too wide for mobile
    formElements.forEach(field => {
      if (field.position.width > screenshot.width * 0.9) {
        issues.push({
          location: field.position,
          element: field,
          issueType: 'usability',
          severity: 'high',
          description: 'モバイルデバイスでフォームが画面幅に対して広すぎます',
          specificLocation: `座標(${field.position.centerX}, ${field.position.centerY})の入力フィールド`
        });
      }
    });
    
    return issues;
  }
  
  private analyzeTextPositions(
    elements: DetailedElement[], 
    screenshot: ScreenshotAnalysis
  ): CoordinateIssue[] {
    const issues: CoordinateIssue[] = [];
    const textElements = elements.filter(el => el.type === 'text');
    
    textElements.forEach(text => {
      const centerX = text.position.centerX;
      const centerY = text.position.centerY;
      
      // Check line length (optimal: 45-75 characters)
      if (text.position.width > screenshot.width * 0.8) {
        issues.push({
          location: text.position,
          element: text,
          issueType: 'accessibility',
          severity: 'medium',
          description: 'テキストの行長が長すぎて読みにくい可能性があります',
          specificLocation: `座標(${centerX}, ${centerY})のテキストブロック`
        });
      }
      
      // Check if important text is in low-visibility area
      if (text.text.length > 100 && this.isInLowAttentionArea(centerX, centerY, screenshot)) {
        issues.push({
          location: text.position,
          element: text,
          issueType: 'visibility',
          severity: 'low',
          description: '重要なテキストコンテンツが注意を引きにくい位置にあります',
          specificLocation: `座標(${centerX}, ${centerY})のテキストコンテンツ`
        });
      }
    });
    
    return issues;
  }
  
  private analyzeNavigationPositions(
    elements: DetailedElement[], 
    screenshot: ScreenshotAnalysis
  ): CoordinateIssue[] {
    const issues: CoordinateIssue[] = [];
    const navElements = elements.filter(el => el.type === 'navigation');
    
    navElements.forEach(nav => {
      const centerX = nav.position.centerX;
      const centerY = nav.position.centerY;
      
      // Check if navigation is easily accessible
      if (centerY > 100 && centerY < screenshot.viewportSections.aboveFold.height * 0.8) {
        issues.push({
          location: nav.position,
          element: nav,
          issueType: 'usability',
          severity: 'medium',
          description: 'ナビゲーションがアクセスしやすい位置（ヘッダー近く）にありません',
          specificLocation: `座標(${centerX}, ${centerY})のナビゲーション要素`
        });
      }
    });
    
    return issues;
  }
  
  private isInLowAttentionArea(x: number, y: number, screenshot: ScreenshotAnalysis): boolean {
    // Areas typically receiving less attention based on eye-tracking studies
    const width = screenshot.width;
    const height = screenshot.height;
    
    // Right edge (rightmost 20%)
    if (x > width * 0.8) return true;
    
    // Bottom area of above-fold content (bottom 30% of viewport)
    if (y > screenshot.viewportSections.aboveFold.height * 0.7) return true;
    
    // Far left edge (leftmost 10%)
    if (x < width * 0.1) return true;
    
    return false;
  }
  
  private isInOptimalCTAZone(x: number, y: number, screenshot: ScreenshotAnalysis): boolean {
    // Optimal CTA zones based on F-pattern and Z-pattern reading
    const width = screenshot.width;
    const foldHeight = screenshot.viewportSections.aboveFold.height;
    
    // Top-right area (where F-pattern reading typically ends)
    if (x > width * 0.6 && x < width * 0.9 && y > foldHeight * 0.2 && y < foldHeight * 0.6) {
      return true;
    }
    
    // Center-right area (natural scanning endpoint)
    if (x > width * 0.5 && x < width * 0.8 && y > foldHeight * 0.4 && y < foldHeight * 0.8) {
      return true;
    }
    
    return false;
  }
  
  generatePositionBasedRecommendations(issues: CoordinateIssue[]): string[] {
    const recommendations: string[] = [];
    
    issues.forEach(issue => {
      switch (issue.issueType) {
        case 'conversion':
          recommendations.push(
            `🎯 ${issue.specificLocation}: CTAボタンを座標(${Math.round(issue.location.x * 0.7)}, ${Math.round(issue.location.y * 0.5)})付近（ファーストビュー内の最適位置）に移動することを推奨`
          );
          break;
        case 'visibility':
          recommendations.push(
            `👁️ ${issue.specificLocation}: より注意を引く位置（画面中央寄り）への移動を検討`
          );
          break;
        case 'usability':
          recommendations.push(
            `🔧 ${issue.specificLocation}: ユーザビリティ向上のため配置とサイズの調整が必要`
          );
          break;
        case 'accessibility':
          recommendations.push(
            `♿ ${issue.specificLocation}: アクセシビリティ改善のためレイアウト調整を推奨`
          );
          break;
      }
    });
    
    return recommendations;
  }
}

export const coordinateAnalyzer = new CoordinateAnalyzer();