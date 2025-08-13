// Navigation Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const navigationCheckpoints: Checkpoint[] = [
  {
    id: 'nav_001',
    category: 'navigation',
    name: 'Main Navigation Clarity',
    description: 'メインナビゲーションの明確性をチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const navWords = ['home', 'about', 'service', 'product', 'contact', 'ホーム', '会社概要', 'サービス', '商品', 'お問い合わせ'];
      
      const navLinks = links.filter(link => 
        navWords.some(word => 
          link.text.toLowerCase().includes(word.toLowerCase())
        )
      );

      let score = 40;
      if (navLinks.length >= 3) score += 30;
      if (navLinks.length >= 5) score += 20;
      if (navLinks.length <= 7) score += 10;

      return {
        id: 'nav_001',
        category: 'navigation',
        name: 'Main Navigation Clarity',
        description: 'メインナビゲーションの明確性をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: navLinks.length < 3 ? 
          'メインナビゲーションを設置し、主要ページへのリンクを明確にしてください' :
          navLinks.length > 7 ? 
          'ナビゲーション項目を7つ以下に整理してください' :
          'メインナビゲーションは適切です',
        evidence: [`ナビゲーションリンク: ${navLinks.length}`]
      };
    }
  },

  {
    id: 'nav_002',
    category: 'navigation',
    name: 'Breadcrumb Navigation',
    description: 'パンくずナビゲーションの実装をチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const breadcrumbLinks = links.filter(link => 
        />\s*$|>$|→|»|breadcrumb/i.test(link.text) ||
        /breadcrumb/i.test(link.href)
      );

      const score = breadcrumbLinks.length > 0 ? 80 : 40;

      return {
        id: 'nav_002',
        category: 'navigation',
        name: 'Breadcrumb Navigation',
        description: 'パンくずナビゲーションの実装をチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: breadcrumbLinks.length === 0 ? 
          'パンくずナビゲーションを実装してユーザーの位置を明確にしてください' :
          'パンくずナビゲーションが実装されています',
        evidence: [`パンくず要素: ${breadcrumbLinks.length}`]
      };
    }
  },

  {
    id: 'nav_003',
    category: 'navigation',
    name: 'Footer Navigation',
    description: 'フッターナビゲーションの充実度をチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const links = data.scrapedData.links;
      const internalLinks = links.filter(link => !link.isExternal).length;
      
      let score = 50;
      if (internalLinks >= 5) score += 25;
      if (internalLinks >= 10) score += 25;

      return {
        id: 'nav_003',
        category: 'navigation',
        name: 'Footer Navigation',
        description: 'フッターナビゲーションの充実度をチェック',
        score,
        impact: 'low',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: internalLinks < 5 ? 
          'フッターに重要ページへのリンクを追加してください' :
          'フッターナビゲーションは充実しています',
        evidence: [`内部リンク数: ${internalLinks}`]
      };
    }
  },

  {
    id: 'nav_004',
    category: 'navigation',
    name: 'Search Functionality',
    description: '検索機能の実装をチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const forms = data.scrapedData.forms;
      const searchForm = forms.find(form => 
        form.fields.some(field => 
          field.name.toLowerCase().includes('search') || 
          field.name.toLowerCase().includes('query')
        )
      );

      const score = searchForm ? 85 : 45;

      return {
        id: 'nav_004',
        category: 'navigation',
        name: 'Search Functionality',
        description: '検索機能の実装をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : 'warning',
        recommendation: !searchForm ? 
          '検索機能を実装してユーザビリティを向上させてください' :
          '検索機能が実装されています',
        evidence: [`検索フォーム: ${searchForm ? 'あり' : 'なし'}`]
      };
    }
  },

  {
    id: 'nav_005',
    category: 'navigation',
    name: 'Mobile Navigation',
    description: 'モバイルナビゲーションの使いやすさをチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const mobileOptimized = data.scrapedData.mobileOptimized;
      const links = data.scrapedData.links;
      const internalLinks = links.filter(link => !link.isExternal).length;

      let score = 40;
      if (mobileOptimized) score += 40;
      if (internalLinks <= 7) score += 20; // Fewer links better for mobile

      return {
        id: 'nav_005',
        category: 'navigation',
        name: 'Mobile Navigation',
        description: 'モバイルナビゲーションの使いやすさをチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: !mobileOptimized ? 
          'モバイル対応のナビゲーション（ハンバーガーメニュー等）を実装してください' :
          'モバイルナビゲーションは適切です',
        evidence: [`モバイル最適化: ${mobileOptimized}`, `ナビ項目数: ${internalLinks}`]
      };
    }
  }
];