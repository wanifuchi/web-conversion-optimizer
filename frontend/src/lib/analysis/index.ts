// Analysis Module - Main Export

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
export const createMockAnalysisInput = (url: string = 'https://example.com') => ({
  scrapedData: {
    url,
    title: 'サンプルECサイト - 最高品質の商品をお届け',
    description: '当社は20年の実績を持つ信頼できるECサイトです。高品質な商品を最安値でお届けします。無料配送、30日間返金保証付き。',
    headings: {
      h1: ['最高品質の商品を最安値でお届け'],
      h2: ['人気商品ランキング', 'お客様の声', '安心の保証制度'],
      h3: ['配送について', '返品・交換', 'よくある質問']
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
    ctaElements: [
      { text: '今すぐ購入', type: 'button', position: { x: 400, y: 500 }, isVisible: true },
      { text: '詳細を見る', type: 'link', position: { x: 600, y: 800 }, isVisible: true },
      { text: 'カートに追加', type: 'button', position: { x: 300, y: 1200 }, isVisible: true }
    ],
    socialProof: [
      { type: 'testimonial', content: '商品の品質が素晴らしく、配送も早かったです。', position: 'main' },
      { type: 'review', content: '★★★★★ 5つ星レビュー 1,234件', position: 'header' },
      { type: 'count', content: '累計販売数10万個突破！', position: 'hero' },
      { type: 'badge', content: 'SSL認証済み', position: 'footer' }
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