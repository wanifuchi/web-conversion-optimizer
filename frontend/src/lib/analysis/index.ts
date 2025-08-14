// Analysis Module - Main Export
import { CHECKPOINT_STATS } from './checkpoints';

export * from './types';
export * from './engine';
export * from './checkpoints';

// Re-export key components for easy import
export { analysisEngine, AnalysisEngine } from './engine';
export { ALL_CHECKPOINTS, getCheckpointsByCategory, CHECKPOINT_STATS } from './checkpoints';

// Analysis utilities
export function validateAnalysisInput(input: any): boolean {
  return !!(
    input?.scrapedData?.url &&
    input?.scrapedData?.title &&
    typeof input?.scrapedData?.headings === 'object' &&
    Array.isArray(input?.scrapedData?.images) &&
    Array.isArray(input?.scrapedData?.links) &&
    Array.isArray(input?.scrapedData?.forms) &&
    Array.isArray(input?.scrapedData?.ctaElements) &&
    typeof input?.scrapedData?.loadTime === 'number'
  );
}

// Mock data for development
export const createMockAnalysisInput = (url: string = 'https://example.com') => {
  // Generate more realistic title and description based on URL
  const domain = url.replace(/https?:\/\//, '').replace(/\/.*$/, '');
  const isJobSite = domain.includes('job') || domain.includes('career') || domain.includes('recruit');
  const title = isJobSite 
    ? `${domain} - 求人・転職サイト` 
    : `${domain} - WEBサイト分析結果`;
  const description = isJobSite
    ? 'あなたに最適な求人情報を見つけて、キャリアアップを支援します。様々な職種・業界から理想の仕事を探せます。'
    : 'WEBコンバージョン最適化ツールによる詳細分析結果です。UI/UX、パフォーマンス、SEO等を総合的に評価しています。';

  return {
    scrapedData: {
      url,
      title,
      description,
    headings: isJobSite ? {
      h1: ['理想の転職を実現'],
      h2: ['新着求人情報', '人気の職種', '転職成功事例'],
      h3: ['求人検索', '履歴書作成', 'キャリア相談']
    } : {
      h1: ['高品質なサービスを提供'],
      h2: ['サービス紹介', 'お客様の声', '安心の保証'],
      h3: ['料金について', 'よくある質問', 'サポート']
    },
    images: [
      { src: '/hero-image.jpg', alt: 'メイン商品画像', width: 800, height: 400 },
      { src: '/product1.jpg', alt: 'おすすめ商品1', width: 300, height: 300 },
      { src: '/product2.jpg', alt: 'おすすめ商品2', width: 300, height: 300 }
    ],
    links: [
      { href: '/', text: 'ホーム', isExternal: false },
      { href: '/about', text: '会社概要', isExternal: false },
      { href: '/products', text: '商品一覧', isExternal: false },
      { href: '/contact', text: 'お問い合わせ', isExternal: false },
      { href: 'https://facebook.com/company', text: 'Facebook', isExternal: true }
    ],
    forms: [
      {
        action: '/contact',
        method: 'POST',
        fields: [
          { type: 'text', name: 'name', label: 'お名前', required: true },
          { type: 'email', name: 'email', label: 'メールアドレス', required: true },
          { type: 'tel', name: 'phone', label: '電話番号', required: false },
          { type: 'textarea', name: 'message', label: 'お問い合わせ内容', required: true }
        ]
      }
    ],
    ctaElements: isJobSite ? [
      { text: '求人を探す', type: 'button' as const, position: { x: 400, y: 500 }, isVisible: true },
      { text: '会員登録', type: 'link' as const, position: { x: 600, y: 800 }, isVisible: true },
      { text: '応募する', type: 'button' as const, position: { x: 300, y: 1200 }, isVisible: true }
    ] : [
      { text: '今すぐ申込', type: 'button' as const, position: { x: 400, y: 500 }, isVisible: true },
      { text: '詳細を見る', type: 'link' as const, position: { x: 600, y: 800 }, isVisible: true },
      { text: 'お問い合わせ', type: 'button' as const, position: { x: 300, y: 1200 }, isVisible: true }
    ],
    socialProof: [
      { type: 'testimonial' as const, content: '商品の品質が素晴らしく、配送も早かったです。', position: 'main' },
      { type: 'review' as const, content: '★★★★★ 5つ星レビュー 1,234件', position: 'header' },
      { type: 'count' as const, content: '累計販売数10万個突破！', position: 'hero' },
      { type: 'badge' as const, content: 'SSL認証済み', position: 'footer' }
    ],
    loadTime: 1800,
    mobileOptimized: true,
    hasSSL: true,
    screenshot: '/screenshot.jpg'
  },
  lighthouseData: {
    performance: 85,
    accessibility: 92,
    bestPractices: 88,
    seo: 90,
    pwa: 75,
    metrics: {
      firstContentfulPaint: 1200,
      largestContentfulPaint: 2100,
      firstInputDelay: 45,
      cumulativeLayoutShift: 0.08,
      speedIndex: 2400
    },
    opportunities: [
      {
        id: 'unused-css-rules',
        title: 'Remove unused CSS',
        description: 'Reduce unused CSS to reduce bytes consumed by network activity.',
        scoreDisplayMode: 'bytes',
        numericValue: 145600
      }
    ]
  },
  options: {
    includeScreenshots: true,
    mobileAnalysis: true,
    deepAnalysis: true
  }
});

console.log('📊 Analysis Engine Loaded');
console.log(`✅ ${CHECKPOINT_STATS.total} checkpoints across ${Object.keys(CHECKPOINT_STATS.byCategory).length} categories`);
console.log('Categories:', Object.keys(CHECKPOINT_STATS.byCategory).join(', '));