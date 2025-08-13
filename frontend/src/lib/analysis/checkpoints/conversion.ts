// Conversion Optimization Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const conversionOptimizationCheckpoints: Checkpoint[] = [
  {
    id: 'conv_001',
    category: 'conversion_optimization',
    name: 'Primary CTA Visibility',
    description: 'プライマリCTAが目立つ位置に配置され、視認性が高いかチェック',
    weight: 10,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const primaryCTA = ctaElements.find(cta => 
        cta.position.y < 800 && cta.isVisible
      );

      const score = primaryCTA ? 
        (primaryCTA.position.y < 600 ? 100 : 80) : 30;

      return {
        id: 'conv_001',
        category: 'conversion_optimization',
        name: 'Primary CTA Visibility',
        description: 'プライマリCTAが目立つ位置に配置され、視認性が高いかチェック',
        score,
        impact: score < 70 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'プライマリCTAをファーストビュー内（画面上部600px以内）に配置し、コントラストを高めてください' :
          'CTAの位置は良好ですが、さらなる最適化を検討してください',
        evidence: [`CTAボタンの数: ${ctaElements.length}`, `最上位CTA位置: ${primaryCTA?.position.y || 'なし'}px`]
      };
    }
  },

  {
    id: 'conv_002',
    category: 'conversion_optimization',
    name: 'CTA Button Text Clarity',
    description: 'CTAボタンのテキストが明確で行動を促すものかチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const actionWords = ['購入', '申込', '登録', '開始', '試す', '見る', '確認', 'buy', 'start', 'sign up', 'get', 'download'];
      
      const effectiveCTAs = ctaElements.filter(cta => 
        actionWords.some(word => 
          cta.text.toLowerCase().includes(word.toLowerCase())
        )
      );

      const score = ctaElements.length > 0 ? 
        Math.min(100, (effectiveCTAs.length / ctaElements.length) * 100) : 0;

      return {
        id: 'conv_002',
        category: 'conversion_optimization',
        name: 'CTA Button Text Clarity',
        description: 'CTAボタンのテキストが明確で行動を促すものかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'CTAボタンのテキストを「今すぐ購入」「無料で試す」など、具体的な行動を促すものに変更してください' :
          'CTAテキストは良好ですが、さらに具体的にできる箇所があります',
        evidence: [`効果的なCTA: ${effectiveCTAs.length}/${ctaElements.length}`, 
                  `CTA例: ${ctaElements.slice(0, 3).map(c => c.text).join(', ')}`]
      };
    }
  },

  {
    id: 'conv_003',
    category: 'conversion_optimization',
    name: 'Value Proposition Clarity',
    description: '価値提案が明確で分かりやすく表現されているかチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const title = data.scrapedData.title;
      const h1s = data.scrapedData.headings.h1;
      const description = data.scrapedData.description;

      const benefitWords = ['無料', '最安', '最高', '安心', '簡単', '即日', '保証', '限定', 'free', 'best', 'secure', 'easy', 'instant'];
      
      const hasValueWords = [title, ...h1s, description].some(text => 
        text && benefitWords.some(word => 
          text.toLowerCase().includes(word.toLowerCase())
        )
      );

      const hasNumericBenefit = [title, ...h1s, description].some(text => 
        text && /\d+%|No\.\d+|第\d+位|満足度\d+%/.test(text)
      );

      let score = 0;
      if (hasValueWords) score += 40;
      if (hasNumericBenefit) score += 30;
      if (h1s.length > 0 && h1s[0].length > 10) score += 30;

      return {
        id: 'conv_003',
        category: 'conversion_optimization',
        name: 'Value Proposition Clarity',
        description: '価値提案が明確で分かりやすく表現されているかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'ファーストビューで明確な価値提案を表示し、具体的な数値やベネフィットを含めてください' :
          '価値提案は良好ですが、より具体的な数値を追加することを検討してください',
        evidence: [`価値ワード: ${hasValueWords}`, `数値ベネフィット: ${hasNumericBenefit}`, `H1: ${h1s[0] || 'なし'}`]
      };
    }
  },

  {
    id: 'conv_004',
    category: 'conversion_optimization',
    name: 'Form Field Optimization',
    description: 'フォームのフィールド数が適切で、入力しやすいかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      
      if (forms.length === 0) {
        return {
          id: 'conv_004',
          category: 'conversion_optimization',
          name: 'Form Field Optimization',
          description: 'フォームのフィールド数が適切で、入力しやすいかチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'フォームが見つかりません。リード獲得やコンバージョンのためのフォーム設置を検討してください',
          evidence: ['フォーム数: 0']
        };
      }

      const primaryForm = forms[0];
      const fieldCount = primaryForm.fields.length;
      const requiredFields = primaryForm.fields.filter(f => f.required).length;
      
      // Optimal field count: 3-5 fields
      let score = 100;
      if (fieldCount > 8) score = 40;
      else if (fieldCount > 5) score = 70;
      else if (fieldCount < 2) score = 60;

      // Too many required fields penalty
      if (requiredFields > fieldCount * 0.8) score -= 20;

      return {
        id: 'conv_004',
        category: 'conversion_optimization',
        name: 'Form Field Optimization',
        description: 'フォームのフィールド数が適切で、入力しやすいかチェック',
        score: Math.max(0, score),
        impact: fieldCount > 7 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: fieldCount > 7 ? 
          'フォームのフィールド数を3-5個に削減し、必須項目を最小限にしてください' :
          'フォームは適切ですが、ユーザビリティの向上を検討してください',
        evidence: [`フィールド数: ${fieldCount}`, `必須フィールド: ${requiredFields}`, `フォーム数: ${forms.length}`]
      };
    }
  },

  {
    id: 'conv_005',
    category: 'conversion_optimization',
    name: 'Urgency and Scarcity',
    description: '緊急性や希少性を表現する要素があるかチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.ctaElements.map(c => c.text)
      ].join(' ').toLowerCase();

      const urgencyWords = ['限定', '期間限定', '今だけ', '残り', '在庫', 'タイムセール', 'limited', 'urgent', 'hurry', 'deadline'];
      const scarcityWords = ['先着', '限り', '完売', '売切れ', 'only', 'last', 'exclusive'];

      const hasUrgency = urgencyWords.some(word => content.includes(word.toLowerCase()));
      const hasScarcity = scarcityWords.some(word => content.includes(word.toLowerCase()));

      let score = 30; // Base score
      if (hasUrgency) score += 35;
      if (hasScarcity) score += 35;

      return {
        id: 'conv_005',
        category: 'conversion_optimization',
        name: 'Urgency and Scarcity',
        description: '緊急性や希少性を表現する要素があるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: score < 50 ? 
          '「期間限定」「先着順」「残りわずか」など、緊急性や希少性を表現する要素を追加してください' :
          '緊急性の表現は良好ですが、さらなる改善余地があります',
        evidence: [`緊急性表現: ${hasUrgency}`, `希少性表現: ${hasScarcity}`]
      };
    }
  },

  {
    id: 'conv_006',
    category: 'conversion_optimization',
    name: 'Multiple CTA Strategy',
    description: '複数のCTAが適切に配置されているかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const uniqueCTAs = new Set(ctaElements.map(c => c.text.toLowerCase().trim())).size;
      
      let score = 0;
      if (ctaElements.length >= 2) score += 40;
      if (ctaElements.length >= 3) score += 30;
      if (uniqueCTAs > 1) score += 30; // Different CTA texts

      return {
        id: 'conv_006',
        category: 'conversion_optimization',
        name: 'Multiple CTA Strategy',
        description: '複数のCTAが適切に配置されているかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: ctaElements.length < 2 ? 
          'ページの異なる箇所に複数のCTAを配置し、ユーザーの行動機会を増やしてください' :
          'CTA配置は良好です',
        evidence: [`CTA総数: ${ctaElements.length}`, `ユニークCTA: ${uniqueCTAs}`]
      };
    }
  },

  {
    id: 'conv_007',
    category: 'conversion_optimization',
    name: 'Price Display Strategy',
    description: '価格表示が効果的で分かりやすいかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ');

      const pricePattern = /[¥$€£]\s*[\d,]+|[\d,]+\s*[¥円ドル]|無料|free|0円/gi;
      const hasPricing = pricePattern.test(content);
      
      const comparePattern = /通常|定価|[0-9,]+円→[0-9,]+円|割引|OFF/gi;
      const hasComparison = comparePattern.test(content);

      let score = 40; // Base score
      if (hasPricing) score += 40;
      if (hasComparison) score += 20;

      return {
        id: 'conv_007',
        category: 'conversion_optimization',
        name: 'Price Display Strategy',
        description: '価格表示が効果的で分かりやすいかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: !hasPricing ? 
          '価格を明確に表示し、可能であれば比較価格や割引率も併記してください' :
          hasComparison ? '価格表示は良好です' : '割引前価格や競合比較を追加することを検討してください',
        evidence: [`価格表示: ${hasPricing}`, `価格比較: ${hasComparison}`]
      };
    }
  },

  {
    id: 'conv_008',
    category: 'conversion_optimization',
    name: 'Risk Reversal Elements',
    description: 'リスク軽減要素（保証、返金など）があるかチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.headings.h3
      ].join(' ').toLowerCase();

      const riskReversalWords = [
        '保証', '返金', '無料体験', 'キャンセル可', '満足度保証', 
        'guarantee', 'refund', 'trial', 'money back', 'risk free'
      ];

      const hasRiskReversal = riskReversalWords.some(word => 
        content.includes(word.toLowerCase())
      );

      const score = hasRiskReversal ? 85 : 25;

      return {
        id: 'conv_008',
        category: 'conversion_optimization',
        name: 'Risk Reversal Elements',
        description: 'リスク軽減要素（保証、返金など）があるかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'fail',
        recommendation: !hasRiskReversal ? 
          '「30日間返金保証」「満足度保証」「無料体験」などのリスク軽減要素を追加してください' :
          'リスク軽減要素が適切に配置されています',
        evidence: [`リスク軽減要素: ${hasRiskReversal}`]
      };
    }
  },

  {
    id: 'conv_009',
    category: 'conversion_optimization',
    name: 'Contact Information Visibility',
    description: '連絡先情報が見つけやすい場所にあるかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const contactLinks = links.filter(link => 
        /contact|連絡|問い合わせ|サポート|tel:|mailto:|support/i.test(link.href) ||
        /contact|連絡|問い合わせ|サポート/i.test(link.text)
      );

      const content = data.scrapedData.description + data.scrapedData.headings.h1.join(' ');
      const phonePattern = /\d{2,4}-\d{2,4}-\d{4}|\d{10,11}/;
      const hasPhone = phonePattern.test(content);

      let score = 30;
      if (contactLinks.length > 0) score += 40;
      if (hasPhone) score += 30;

      return {
        id: 'conv_009',
        category: 'conversion_optimization',
        name: 'Contact Information Visibility',
        description: '連絡先情報が見つけやすい場所にあるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: score < 50 ? 
          'ヘッダーやフッターに電話番号やお問い合わせリンクを明確に表示してください' :
          '連絡先情報の表示は良好です',
        evidence: [`お問い合わせリンク: ${contactLinks.length}`, `電話番号表示: ${hasPhone}`]
      };
    }
  },

  {
    id: 'conv_010',
    category: 'conversion_optimization',
    name: 'Exit Intent Optimization',
    description: '離脱防止のための要素があるかチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const ctaElements = data.scrapedData.ctaElements;
      const links = data.scrapedData.links;
      
      // Check for multiple engagement options
      const internalLinks = links.filter(link => !link.isExternal).length;
      const multipleCtaTypes = new Set(ctaElements.map(c => c.type)).size;

      let score = 40;
      if (internalLinks >= 5) score += 30;
      if (multipleCtaTypes > 1) score += 30;

      return {
        id: 'conv_010',
        category: 'conversion_optimization',
        name: 'Exit Intent Optimization',
        description: '離脱防止のための要素があるかチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: score < 50 ? 
          '関連コンテンツへのリンクや二次的なCTAを追加し、ユーザーの離脱を防いでください' :
          '離脱防止要素は適切に配置されています',
        evidence: [`内部リンク数: ${internalLinks}`, `CTAタイプ数: ${multipleCtaTypes}`]
      };
    }
  }
];