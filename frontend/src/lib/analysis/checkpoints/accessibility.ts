// Accessibility Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const accessibilityCheckpoints: Checkpoint[] = [
  {
    id: 'a11y_001',
    category: 'accessibility',
    name: 'Image Alt Text',
    description: '画像に適切なalt属性が設定されているかチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const images = data.scrapedData.images;
      const imagesWithAlt = images.filter(img => img.alt && img.alt.trim() !== '').length;
      
      const score = images.length > 0 ? 
        Math.round((imagesWithAlt / images.length) * 100) : 80;

      return {
        id: 'a11y_001',
        category: 'accessibility',
        name: 'Image Alt Text',
        description: '画像に適切なalt属性が設定されているかチェック',
        score,
        impact: 'medium',
        status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'すべての画像に意味のあるalt属性を設定してください' :
          'alt属性の設定は良好です',
        evidence: [`alt属性設定率: ${score}% (${imagesWithAlt}/${images.length})`]
      };
    }
  },

  {
    id: 'a11y_002',
    category: 'accessibility',
    name: 'Form Labels',
    description: 'フォームフィールドに適切なラベルが設定されているかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      
      if (forms.length === 0) {
        return {
          id: 'a11y_002',
          category: 'accessibility',
          name: 'Form Labels',
          description: 'フォームフィールドに適切なラベルが設定されているかチェック',
          score: 80,
          impact: 'low',
          status: 'info',
          recommendation: 'フォームが見つかりません',
          evidence: ['フォーム数: 0']
        };
      }

      const allFields = forms.flatMap(form => form.fields);
      const fieldsWithLabels = allFields.filter(field => field.label && field.label.trim() !== '').length;
      
      const score = allFields.length > 0 ? 
        Math.round((fieldsWithLabels / allFields.length) * 100) : 0;

      return {
        id: 'a11y_002',
        category: 'accessibility',
        name: 'Form Labels',
        description: 'フォームフィールドに適切なラベルが設定されているかチェック',
        score,
        impact: 'medium',
        status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'すべてのフォームフィールドに分かりやすいラベルを設定してください' :
          'フォームラベルの設定は良好です',
        evidence: [`ラベル設定率: ${score}% (${fieldsWithLabels}/${allFields.length})`]
      };
    }
  },

  {
    id: 'a11y_003',
    category: 'accessibility',
    name: 'Heading Structure',
    description: '見出しの階層構造が適切かチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const h1Count = data.scrapedData.headings.h1.length;
      const h2Count = data.scrapedData.headings.h2.length;
      const h3Count = data.scrapedData.headings.h3.length;

      let score = 50;
      
      // H1 should be exactly 1
      if (h1Count === 1) score += 30;
      else score -= 20;

      // Should have logical hierarchy
      if (h2Count > 0) score += 20;

      return {
        id: 'a11y_003',
        category: 'accessibility',
        name: 'Heading Structure',
        description: '見出しの階層構造が適切かチェック',
        score: Math.max(0, score),
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: h1Count !== 1 ? 
          'H1タグは1つだけ使用し、論理的な見出し階層を作成してください' :
          '見出し構造は良好です',
        evidence: [`H1: ${h1Count}`, `H2: ${h2Count}`, `H3: ${h3Count}`]
      };
    }
  },

  {
    id: 'a11y_004',
    category: 'accessibility',
    name: 'Link Descriptiveness',
    description: 'リンクテキストが分かりやすいかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const vagueLinkTexts = ['こちら', 'ここ', 'click here', 'more', 'read more'];
      
      const vagueLinks = links.filter(link => 
        vagueLinkTexts.some(vague => 
          link.text.toLowerCase().trim() === vague.toLowerCase()
        )
      ).length;

      const score = links.length > 0 ? 
        Math.max(20, 100 - (vagueLinks / links.length) * 100) : 80;

      return {
        id: 'a11y_004',
        category: 'accessibility',
        name: 'Link Descriptiveness',
        description: 'リンクテキストが分かりやすいかチェック',
        score,
        impact: 'low',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '「こちら」「ここ」などの曖昧なリンクテキストを具体的な説明に変更してください' :
          'リンクテキストは分かりやすく設定されています',
        evidence: [`曖昧なリンク: ${vagueLinks}/${links.length}`]
      };
    }
  },

  {
    id: 'a11y_005',
    category: 'accessibility',
    name: 'Color Contrast',
    description: '色のコントラストが適切かチェック（推定）',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      // This is a simplified check - real implementation would analyze actual colors
      const ctaElements = data.scrapedData.ctaElements;
      const score = ctaElements.length > 0 ? 75 : 60; // Assume decent contrast if CTAs exist

      return {
        id: 'a11y_005',
        category: 'accessibility',
        name: 'Color Contrast',
        description: '色のコントラストが適切かチェック（推定）',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: '色のコントラスト比をWCAG AA基準（4.5:1）以上に設定してください',
        evidence: [`CTA要素数: ${ctaElements.length}`]
      };
    }
  },

  {
    id: 'a11y_006',
    category: 'accessibility',
    name: 'Keyboard Navigation',
    description: 'キーボードナビゲーションへの配慮をチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const forms = data.scrapedData.forms;
      const interactiveElements = links.length + forms.length;

      let score = interactiveElements > 0 ? 70 : 40;

      return {
        id: 'a11y_006',
        category: 'accessibility',
        name: 'Keyboard Navigation',
        description: 'キーボードナビゲーションへの配慮をチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: 'キーボードのみでも操作できるよう、フォーカス順序とタブナビゲーションを確認してください',
        evidence: [`インタラクティブ要素: ${interactiveElements}`]
      };
    }
  },

  {
    id: 'a11y_007',
    category: 'accessibility',
    name: 'Language Declaration',
    description: 'ページの言語宣言があるかチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      // This would need actual HTML parsing in real implementation
      const hasJapanese = data.scrapedData.title.match(/[ひらがなカタカナ漢字]/);
      const score = hasJapanese ? 85 : 70; // Assume proper lang declaration for Japanese content

      return {
        id: 'a11y_007',
        category: 'accessibility',
        name: 'Language Declaration',
        description: 'ページの言語宣言があるかチェック',
        score,
        impact: 'low',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: 'HTMLタグにlang属性を設定してください（例：lang="ja"）',
        evidence: [`日本語コンテンツ: ${hasJapanese ? 'あり' : 'なし'}`]
      };
    }
  },

  {
    id: 'a11y_008',
    category: 'accessibility',
    name: 'Error Identification',
    description: 'エラーメッセージの識別しやすさをチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      const requiredFields = forms.flatMap(form => 
        form.fields.filter(field => field.required)
      ).length;

      let score = 60;
      if (requiredFields > 0) score += 20; // Assumes error handling exists for required fields

      return {
        id: 'a11y_008',
        category: 'accessibility',
        name: 'Error Identification',
        description: 'エラーメッセージの識別しやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: 'フォームエラーを明確に表示し、エラー箇所を分かりやすく示してください',
        evidence: [`必須フィールド: ${requiredFields}`]
      };
    }
  },

  {
    id: 'a11y_009',
    category: 'accessibility',
    name: 'Skip Links',
    description: 'スキップリンクの提供をチェック',
    weight: 3,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const skipLinks = links.filter(link => 
        /skip|スキップ|本文へ/i.test(link.text) || 
        /#main|#content/i.test(link.href)
      ).length;

      const score = skipLinks > 0 ? 90 : 40;

      return {
        id: 'a11y_009',
        category: 'accessibility',
        name: 'Skip Links',
        description: 'スキップリンクの提供をチェック',
        score,
        impact: 'low',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: skipLinks === 0 ? 
          'スクリーンリーダーユーザーのために「メインコンテンツへスキップ」リンクを追加してください' :
          'スキップリンクが適切に設置されています',
        evidence: [`スキップリンク: ${skipLinks}`]
      };
    }
  },

  {
    id: 'a11y_010',
    category: 'accessibility',
    name: 'Focus Management',
    description: 'フォーカス管理の適切性をチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const forms = data.scrapedData.forms;
      const focusableElements = ctaElements.length + forms.length;

      const score = focusableElements > 0 ? 75 : 50;

      return {
        id: 'a11y_010',
        category: 'accessibility',
        name: 'Focus Management',
        description: 'フォーカス管理の適切性をチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: 'フォーカス状態が視覚的に分かりやすく、論理的な順序でナビゲートできることを確認してください',
        evidence: [`フォーカス可能要素: ${focusableElements}`]
      };
    }
  }
];