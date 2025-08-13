// User Experience Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const userExperienceCheckpoints: Checkpoint[] = [
  {
    id: 'ux_001',
    category: 'user_experience',
    name: 'Page Load Speed',
    description: 'ページの読み込み速度が適切かチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const loadTime = data.scrapedData.loadTime;
      
      let score = 100;
      if (loadTime > 5000) score = 20;
      else if (loadTime > 3000) score = 50;
      else if (loadTime > 2000) score = 70;
      else if (loadTime > 1000) score = 90;

      return {
        id: 'ux_001',
        category: 'user_experience',
        name: 'Page Load Speed',
        description: 'ページの読み込み速度が適切かチェック',
        score,
        impact: loadTime > 3000 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: loadTime > 3000 ? 
          'ページの読み込み速度を改善してください。画像の最適化、キャッシュ設定、CDN利用を検討してください' :
          loadTime > 1000 ? 'さらなる速度改善の余地があります' : '読み込み速度は良好です',
        evidence: [`読み込み時間: ${loadTime}ms`]
      };
    }
  },

  {
    id: 'ux_002',
    category: 'user_experience',
    name: 'Mobile Responsiveness',
    description: 'モバイル対応が適切に行われているかチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const mobileOptimized = data.scrapedData.mobileOptimized;
      const score = mobileOptimized ? 90 : 25;

      return {
        id: 'ux_002',
        category: 'user_experience',
        name: 'Mobile Responsiveness',
        description: 'モバイル対応が適切に行われているかチェック',
        score,
        impact: 'high',
        status: score >= 80 ? 'pass' : 'fail',
        recommendation: !mobileOptimized ? 
          'レスポンシブデザインを実装し、モバイルデバイスでの表示を最適化してください' :
          'モバイル対応は良好です',
        evidence: [`モバイル最適化: ${mobileOptimized}`]
      };
    }
  },

  {
    id: 'ux_003',
    category: 'user_experience',
    name: 'Navigation Clarity',
    description: 'ナビゲーションが分かりやすく設計されているかチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const internalLinks = links.filter(link => !link.isExternal);
      
      // Check for common navigation elements
      const navWords = ['home', 'about', 'contact', 'service', 'product', 'ホーム', '会社概要', 'サービス', '商品', 'お問い合わせ'];
      const navLinks = internalLinks.filter(link => 
        navWords.some(word => 
          link.text.toLowerCase().includes(word.toLowerCase())
        )
      );

      let score = 40;
      if (navLinks.length >= 3) score += 30;
      if (navLinks.length >= 5) score += 20;
      if (internalLinks.length >= 5) score += 10;

      return {
        id: 'ux_003',
        category: 'user_experience',
        name: 'Navigation Clarity',
        description: 'ナビゲーションが分かりやすく設計されているかチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'メインナビゲーションを分かりやすく設計し、主要ページへのリンクを明確に表示してください' :
          'ナビゲーションは良好です',
        evidence: [`ナビゲーションリンク: ${navLinks.length}`, `内部リンク総数: ${internalLinks.length}`]
      };
    }
  },

  {
    id: 'ux_004',
    category: 'user_experience',
    name: 'Content Hierarchy',
    description: 'コンテンツの階層構造が適切かチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const h1Count = data.scrapedData.headings.h1.length;
      const h2Count = data.scrapedData.headings.h2.length;
      const h3Count = data.scrapedData.headings.h3.length;

      let score = 50;
      
      // H1 should be exactly 1
      if (h1Count === 1) score += 30;
      else if (h1Count === 0) score -= 20;
      else score -= 10; // Multiple H1s

      // Should have some H2s for structure
      if (h2Count >= 2 && h2Count <= 6) score += 20;

      return {
        id: 'ux_004',
        category: 'user_experience',
        name: 'Content Hierarchy',
        description: 'コンテンツの階層構造が適切かチェック',
        score: Math.max(0, score),
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: h1Count !== 1 ? 
          'H1タグは1つだけ使用し、H2、H3で適切な階層構造を作成してください' :
          h2Count < 2 ? 'H2タグを使用してコンテンツの構造を明確にしてください' :
          'コンテンツの階層構造は良好です',
        evidence: [`H1: ${h1Count}`, `H2: ${h2Count}`, `H3: ${h3Count}`]
      };
    }
  },

  {
    id: 'ux_005',
    category: 'user_experience',
    name: 'Visual Clarity',
    description: '視覚的な明確さと読みやすさをチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const imageCount = data.scrapedData.images.length;
      const imagesWithAlt = data.scrapedData.images.filter(img => img.alt && img.alt.trim() !== '').length;
      
      const headingLength = data.scrapedData.headings.h1.concat(data.scrapedData.headings.h2)
        .reduce((sum, heading) => sum + heading.length, 0);
      const avgHeadingLength = headingLength / Math.max(1, data.scrapedData.headings.h1.length + data.scrapedData.headings.h2.length);

      let score = 50;
      
      // Alt text coverage
      if (imageCount > 0) {
        const altCoverage = imagesWithAlt / imageCount;
        score += altCoverage * 25;
      }

      // Heading readability
      if (avgHeadingLength > 10 && avgHeadingLength < 60) score += 25;

      return {
        id: 'ux_005',
        category: 'user_experience',
        name: 'Visual Clarity',
        description: '視覚的な明確さと読みやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '画像のalt属性設定、見出しの長さ調整により視覚的な明確さを改善してください' :
          '視覚的な明確さは良好です',
        evidence: [`画像のalt属性率: ${imageCount > 0 ? Math.round((imagesWithAlt/imageCount)*100) : 0}%`, `平均見出し長: ${Math.round(avgHeadingLength)}文字`]
      };
    }
  },

  {
    id: 'ux_006',
    category: 'user_experience',
    name: 'Form Usability',
    description: 'フォームの使いやすさをチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      
      if (forms.length === 0) {
        return {
          id: 'ux_006',
          category: 'user_experience',
          name: 'Form Usability',
          description: 'フォームの使いやすさをチェック',
          score: 50,
          impact: 'low',
          status: 'info',
          recommendation: 'フォームが見つかりません',
          evidence: ['フォーム数: 0']
        };
      }

      const primaryForm = forms[0];
      const fieldsWithLabels = primaryForm.fields.filter(field => field.label && field.label.trim() !== '').length;
      const totalFields = primaryForm.fields.length;
      
      let score = 40;
      
      // Label coverage
      if (totalFields > 0) {
        const labelCoverage = fieldsWithLabels / totalFields;
        score += labelCoverage * 40;
      }

      // Optimal field count (3-5 fields)
      if (totalFields >= 3 && totalFields <= 5) score += 20;

      return {
        id: 'ux_006',
        category: 'user_experience',
        name: 'Form Usability',
        description: 'フォームの使いやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          'フォームフィールドに分かりやすいラベルを設定し、入力項目数を最適化してください' :
          'フォームの使いやすさは良好です',
        evidence: [`ラベル設定率: ${totalFields > 0 ? Math.round((fieldsWithLabels/totalFields)*100) : 0}%`, `フィールド数: ${totalFields}`]
      };
    }
  },

  {
    id: 'ux_007',
    category: 'user_experience',
    name: 'Error Prevention',
    description: 'エラー防止の仕組みが適切に設計されているかチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      
      if (forms.length === 0) {
        return {
          id: 'ux_007',
          category: 'user_experience',
          name: 'Error Prevention',
          description: 'エラー防止の仕組みが適切に設計されているかチェック',
          score: 50,
          impact: 'low',
          status: 'info',
          recommendation: 'フォームが見つかりません',
          evidence: ['フォーム数: 0']
        };
      }

      const primaryForm = forms[0];
      const validationFields = primaryForm.fields.filter(field => 
        field.type === 'email' || field.type === 'tel' || field.type === 'url'
      ).length;

      let score = 60;
      if (validationFields > 0) score += 40;

      return {
        id: 'ux_007',
        category: 'user_experience',
        name: 'Error Prevention',
        description: 'エラー防止の仕組みが適切に設計されているかチェック',
        score,
        impact: 'low',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: validationFields === 0 ? 
          'フォームに入力検証機能を追加し、ユーザーのエラーを事前に防いでください' :
          'エラー防止機能は良好です',
        evidence: [`検証フィールド数: ${validationFields}`]
      };
    }
  },

  {
    id: 'ux_008',
    category: 'user_experience',
    name: 'Search Functionality',
    description: '検索機能の有無と使いやすさをチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      const searchForm = forms.find(form => 
        form.fields.some(field => 
          field.name.toLowerCase().includes('search') || 
          field.name.toLowerCase().includes('query')
        )
      );

      const links = data.scrapedData.links;
      const searchLinks = links.filter(link => 
        /search|検索/i.test(link.text) || /search|検索/i.test(link.href)
      );

      let score = 40;
      if (searchForm) score += 40;
      if (searchLinks.length > 0) score += 20;

      return {
        id: 'ux_008',
        category: 'user_experience',
        name: 'Search Functionality',
        description: '検索機能の有無と使いやすさをチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: score < 70 ? 
          '検索機能を追加し、ユーザーが目的の情報を素早く見つけられるようにしてください' :
          '検索機能は適切に配置されています',
        evidence: [`検索フォーム: ${searchForm ? 'あり' : 'なし'}`, `検索リンク: ${searchLinks.length}`]
      };
    }
  },

  {
    id: 'ux_009',
    category: 'user_experience',
    name: 'Breadcrumb Navigation',
    description: 'パンくずナビゲーションの有無をチェック',
    weight: 3,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      
      // Look for breadcrumb patterns
      const breadcrumbIndicators = links.filter(link => 
        />\s*$|>$|→|»|breadcrumb/i.test(link.text) ||
        /breadcrumb/i.test(link.href)
      );

      const score = breadcrumbIndicators.length > 0 ? 80 : 40;

      return {
        id: 'ux_009',
        category: 'user_experience',
        name: 'Breadcrumb Navigation',
        description: 'パンくずナビゲーションの有無をチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: breadcrumbIndicators.length === 0 ? 
          'パンくずナビゲーションを追加し、ユーザーの現在位置を明確にしてください' :
          'パンくずナビゲーションが適切に設置されています',
        evidence: [`パンくず要素: ${breadcrumbIndicators.length}`]
      };
    }
  },

  {
    id: 'ux_010',
    category: 'user_experience',
    name: 'Content Readability',
    description: 'コンテンツの読みやすさをチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const description = data.scrapedData.description || '';
      const headings = [
        ...data.scrapedData.headings.h1,
        ...data.scrapedData.headings.h2,
        ...data.scrapedData.headings.h3
      ];

      const totalText = description + ' ' + headings.join(' ');
      const sentences = totalText.split(/[。．.!?]/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.length > 0 ? 
        totalText.length / sentences.length : 0;

      let score = 50;
      
      // Optimal sentence length: 15-25 characters per sentence in Japanese
      if (avgSentenceLength > 10 && avgSentenceLength < 40) score += 30;
      
      // Content volume check
      if (totalText.length > 100 && totalText.length < 2000) score += 20;

      return {
        id: 'ux_010',
        category: 'user_experience',
        name: 'Content Readability',
        description: 'コンテンツの読みやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '文章の長さを調整し、読みやすいコンテンツ量にしてください' :
          'コンテンツの読みやすさは良好です',
        evidence: [`平均文長: ${Math.round(avgSentenceLength)}文字`, `総文字数: ${totalText.length}`]
      };
    }
  }
];