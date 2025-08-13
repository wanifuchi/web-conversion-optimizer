// Psychology and Behavioral Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const psychologyCheckpoints: Checkpoint[] = [
  {
    id: 'psych_001',
    category: 'psychology',
    name: 'Social Proof Presence',
    description: '社会的証明要素（お客様の声、レビュー等）が効果的に配置されているかチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const socialProof = data.scrapedData.socialProof;
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const socialWords = ['レビュー', '評価', 'お客様の声', '体験談', '推薦', 'review', 'testimonial', 'rating'];
      const hasSocialWords = socialWords.some(word => content.includes(word.toLowerCase()));

      let score = 20;
      if (socialProof.length > 0) score += 50;
      if (hasSocialWords) score += 30;

      return {
        id: 'psych_001',
        category: 'psychology',
        name: 'Social Proof Presence',
        description: '社会的証明要素（お客様の声、レビュー等）が効果的に配置されているかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'お客様の声、レビュー、評価、導入実績などの社会的証明要素を追加してください' :
          '社会的証明要素は良好ですが、さらなる充実を検討してください',
        evidence: [`社会的証明要素: ${socialProof.length}`, `関連キーワード: ${hasSocialWords}`]
      };
    }
  },

  {
    id: 'psych_002',
    category: 'psychology',
    name: 'Authority Signals',
    description: '権威性を示す要素（専門家推薦、メディア掲載等）があるかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const authorityWords = [
        '専門家', '医師', '博士', 'テレビ', 'メディア掲載', '雑誌', '新聞',
        'expert', 'doctor', 'phd', 'media', 'featured', 'award', '受賞'
      ];

      const hasAuthority = authorityWords.some(word => content.includes(word.toLowerCase()));
      
      // Check for badges/certifications in social proof
      const certificationProof = data.scrapedData.socialProof.filter(sp => 
        sp.type === 'badge' || 
        /認定|証明|certified|verified/i.test(sp.content)
      );

      let score = 30;
      if (hasAuthority) score += 40;
      if (certificationProof.length > 0) score += 30;

      return {
        id: 'psych_002',
        category: 'psychology',
        name: 'Authority Signals',
        description: '権威性を示す要素（専門家推薦、メディア掲載等）があるかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '専門家の推薦、メディア掲載実績、認定マーク等の権威性を示す要素を追加してください' :
          '権威性の表現は良好です',
        evidence: [`権威性キーワード: ${hasAuthority}`, `認定・証明要素: ${certificationProof.length}`]
      };
    }
  },

  {
    id: 'psych_003',
    category: 'psychology',
    name: 'Cognitive Load Reduction',
    description: '認知負荷を軽減するシンプルな設計になっているかチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const headingCount = data.scrapedData.headings.h1.length + 
                          data.scrapedData.headings.h2.length + 
                          data.scrapedData.headings.h3.length;
      
      const linkCount = data.scrapedData.links.length;
      const ctaCount = data.scrapedData.ctaElements.length;
      const imageCount = data.scrapedData.images.length;

      // Calculate complexity score (lower is better)
      let complexityScore = 0;
      if (headingCount > 10) complexityScore += 20;
      if (linkCount > 20) complexityScore += 20;
      if (ctaCount > 5) complexityScore += 20;
      if (imageCount > 15) complexityScore += 20;

      const score = Math.max(20, 100 - complexityScore);

      return {
        id: 'psych_003',
        category: 'psychology',
        name: 'Cognitive Load Reduction',
        description: '認知負荷を軽減するシンプルな設計になっているかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'ページの要素数を減らし、シンプルで分かりやすいデザインに変更してください' :
          '認知負荷は適切にコントロールされています',
        evidence: [
          `見出し数: ${headingCount}`, 
          `リンク数: ${linkCount}`, 
          `CTA数: ${ctaCount}`,
          `画像数: ${imageCount}`
        ]
      };
    }
  },

  {
    id: 'psych_004',
    category: 'psychology',
    name: 'Loss Aversion Triggers',
    description: '損失回避の心理を活用した表現があるかチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.ctaElements.map(c => c.text)
      ].join(' ').toLowerCase();

      const lossAversionWords = [
        '見逃す', '逃す', '後悔', '損する', '取り残される', '終了',
        'miss out', 'lose', 'regret', 'ending', 'last chance'
      ];

      const hasLossAversion = lossAversionWords.some(word => 
        content.includes(word.toLowerCase())
      );

      const score = hasLossAversion ? 80 : 35;

      return {
        id: 'psych_004',
        category: 'psychology',
        name: 'Loss Aversion Triggers',
        description: '損失回避の心理を活用した表現があるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'fail',
        recommendation: !hasLossAversion ? 
          '「このチャンスを逃さないで」「後悔する前に」など損失回避の心理を活用した表現を追加してください' :
          '損失回避の心理を効果的に活用しています',
        evidence: [`損失回避表現: ${hasLossAversion}`]
      };
    }
  },

  {
    id: 'psych_005',
    category: 'psychology',
    name: 'Reciprocity Principle',
    description: '返報性の原理を活用した要素があるかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const reciprocityWords = [
        '無料', '特典', 'プレゼント', 'ギフト', '提供', 'おまけ',
        'free', 'gift', 'bonus', 'complimentary', 'giveaway'
      ];

      const hasReciprocity = reciprocityWords.some(word => 
        content.includes(word.toLowerCase())
      );

      const score = hasReciprocity ? 75 : 40;

      return {
        id: 'psych_005',
        category: 'psychology',
        name: 'Reciprocity Principle',
        description: '返報性の原理を活用した要素があるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: !hasReciprocity ? 
          '無料サンプル、特典、ボーナスなど返報性の原理を活用した要素を追加してください' :
          '返報性の原理を効果的に活用しています',
        evidence: [`返報性要素: ${hasReciprocity}`]
      };
    }
  },

  {
    id: 'psych_006',
    category: 'psychology',
    name: 'Anchoring Effect Usage',
    description: 'アンカリング効果を活用した価格設定があるかチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ');

      // Look for price anchoring patterns
      const anchoringPatterns = [
        /通常価格.*?[¥$]\s*[\d,]+/gi,
        /定価.*?[¥$]\s*[\d,]+/gi,
        /[¥$]\s*[\d,]+\s*→\s*[¥$]\s*[\d,]+/gi,
        /\d+%\s*OFF/gi,
        /\d+円引き/gi
      ];

      const hasAnchoring = anchoringPatterns.some(pattern => pattern.test(content));

      const score = hasAnchoring ? 85 : 45;

      return {
        id: 'psych_006',
        category: 'psychology',
        name: 'Anchoring Effect Usage',
        description: 'アンカリング効果を活用した価格設定があるかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: !hasAnchoring ? 
          '通常価格や定価を表示してから割引価格を示すなど、アンカリング効果を活用してください' :
          'アンカリング効果を効果的に活用しています',
        evidence: [`価格アンカリング: ${hasAnchoring}`]
      };
    }
  },

  {
    id: 'psych_007',
    category: 'psychology',
    name: 'Commitment and Consistency',
    description: '一貫性の原理を活用した設計になっているかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      const ctaElements = data.scrapedData.ctaElements;

      // Check for progressive engagement
      const hasMultiStepForms = forms.some(form => form.fields.length > 3);
      const hasProgressiveCtAs = ctaElements.some(cta => 
        /始める|開始|step|試す|見る/i.test(cta.text)
      );

      let score = 40;
      if (hasMultiStepForms) score += 30;
      if (hasProgressiveCtAs) score += 30;

      return {
        id: 'psych_007',
        category: 'psychology',
        name: 'Commitment and Consistency',
        description: '一貫性の原理を活用した設計になっているかチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: score < 70 ? 
          '段階的なコミットメント（無料トライアル→有料プラン等）を設計してください' :
          '一貫性の原理を適切に活用しています',
        evidence: [`多段階フォーム: ${hasMultiStepForms}`, `段階的CTA: ${hasProgressiveCtAs}`]
      };
    }
  },

  {
    id: 'psych_008',
    category: 'psychology',
    name: 'Emotional Triggers',
    description: '感情に訴える要素が効果的に使用されているかチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const emotionalWords = [
        // Positive emotions
        '嬉しい', '楽しい', '安心', '満足', '幸せ', '成功', '達成',
        'happy', 'joy', 'secure', 'satisfied', 'success',
        // Negative emotions (pain points)
        '悩み', '困る', '心配', '不安', '失敗', '問題',
        'worry', 'problem', 'pain', 'struggle', 'frustrated'
      ];

      const emotionalCount = emotionalWords.filter(word => 
        content.includes(word.toLowerCase())
      ).length;

      const score = Math.min(100, emotionalCount * 15 + 30);

      return {
        id: 'psych_008',
        category: 'psychology',
        name: 'Emotional Triggers',
        description: '感情に訴える要素が効果的に使用されているかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'ユーザーの感情に訴える表現（悩み解決、成功体験等）を追加してください' :
          '感情的訴求は効果的に行われています',
        evidence: [`感情的キーワード数: ${emotionalCount}`]
      };
    }
  },

  {
    id: 'psych_009',
    category: 'psychology',
    name: 'Bandwagon Effect',
    description: 'バンドワゴン効果を活用した表現があるかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2
      ].join(' ').toLowerCase();

      const bandwagonWords = [
        '人気', '話題', '選ばれている', '多くの人', '皆', 'みんな',
        'popular', 'trending', 'everyone', 'millions', 'thousands'
      ];

      const hasBandwagon = bandwagonWords.some(word => 
        content.includes(word.toLowerCase())
      );

      // Check for usage numbers in social proof
      const usageNumbers = data.scrapedData.socialProof.filter(sp => 
        /\d+.*?(人|名|社|件|users?|customers?)/i.test(sp.content)
      );

      let score = 30;
      if (hasBandwagon) score += 35;
      if (usageNumbers.length > 0) score += 35;

      return {
        id: 'psych_009',
        category: 'psychology',
        name: 'Bandwagon Effect',
        description: 'バンドワゴン効果を活用した表現があるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: score < 70 ? 
          '「100万人が選んだ」「話題の商品」など、多くの人が選択していることを示す表現を追加してください' :
          'バンドワゴン効果を効果的に活用しています',
        evidence: [`バンドワゴン表現: ${hasBandwagon}`, `利用者数表示: ${usageNumbers.length}`]
      };
    }
  },

  {
    id: 'psych_010',
    category: 'psychology',
    name: 'Fear of Missing Out (FOMO)',
    description: '機会損失への恐怖を活用した要素があるかチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const content = [
        data.scrapedData.title,
        data.scrapedData.description,
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.ctaElements.map(c => c.text)
      ].join(' ').toLowerCase();

      const fomoWords = [
        '今だけ', '期間限定', '売り切れ御免', '完売間近', '残り僅か',
        'limited time', 'while supplies last', 'almost sold out', 'hurry'
      ];

      const hasFomo = fomoWords.some(word => 
        content.includes(word.toLowerCase())
      );

      const score = hasFomo ? 80 : 35;

      return {
        id: 'psych_010',
        category: 'psychology',
        name: 'Fear of Missing Out (FOMO)',
        description: '機会損失への恐怖を活用した要素があるかチェック',
        score,
        impact: 'medium',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: !hasFomo ? 
          '「今だけ限定」「売り切れ御免」など機会損失への恐怖を適度に活用してください' :
          'FOMO要素を効果的に活用しています',
        evidence: [`FOMO要素: ${hasFomo}`]
      };
    }
  }
];