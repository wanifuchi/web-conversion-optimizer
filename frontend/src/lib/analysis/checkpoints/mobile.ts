// Mobile Optimization Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const mobileCheckpoints: Checkpoint[] = [
  {
    id: 'mobile_001',
    category: 'mobile',
    name: 'Mobile Responsiveness',
    description: 'モバイル対応の実装状況をチェック',
    weight: 10,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const mobileOptimized = data.scrapedData.mobileOptimized;
      const score = mobileOptimized ? 95 : 20;

      return {
        id: 'mobile_001',
        category: 'mobile',
        name: 'Mobile Responsiveness',
        description: 'モバイル対応の実装状況をチェック',
        score,
        impact: 'high',
        status: score >= 90 ? 'pass' : 'fail',
        recommendation: !mobileOptimized ? 
          'レスポンシブデザインを実装してください' :
          'モバイル対応は良好です',
        evidence: [`モバイル最適化: ${mobileOptimized}`]
      };
    }
  },

  {
    id: 'mobile_002',
    category: 'mobile',
    name: 'Touch Target Size',
    description: 'タッチターゲットサイズの適切性をチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const buttonElements = ctaElements.filter(cta => cta.type === 'button').length;
      
      let score = 60;
      if (buttonElements > 0) score += 30;

      return {
        id: 'mobile_002',
        category: 'mobile',
        name: 'Touch Target Size',
        description: 'タッチターゲットサイズの適切性をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: 'タッチターゲットを最低44px×44pxに設定してください',
        evidence: [`ボタン要素: ${buttonElements}`]
      };
    }
  },

  {
    id: 'mobile_003',
    category: 'mobile',
    name: 'Mobile Form Usability',
    description: 'モバイルでのフォーム使いやすさをチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      
      if (forms.length === 0) {
        return {
          id: 'mobile_003',
          category: 'mobile',
          name: 'Mobile Form Usability',
          description: 'モバイルでのフォーム使いやすさをチェック',
          score: 70,
          impact: 'low',
          status: 'info',
          recommendation: 'フォームが見つかりません',
          evidence: ['フォーム数: 0']
        };
      }

      const primaryForm = forms[0];
      const fieldCount = primaryForm.fields.length;
      
      let score = 50;
      if (fieldCount <= 5) score += 30;
      if (fieldCount <= 3) score += 20;

      return {
        id: 'mobile_003',
        category: 'mobile',
        name: 'Mobile Form Usability',
        description: 'モバイルでのフォーム使いやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: fieldCount > 5 ? 
          'モバイル用にフォームを簡素化してください' :
          'モバイルフォームは適切です',
        evidence: [`フィールド数: ${fieldCount}`]
      };
    }
  }
];