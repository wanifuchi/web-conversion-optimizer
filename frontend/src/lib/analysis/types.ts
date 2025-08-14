// Analysis Engine Types and Interfaces

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  images: Array<{
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }>;
  links: Array<{
    href: string;
    text: string;
    isExternal: boolean;
  }>;
  forms: Array<{
    action: string;
    method: string;
    fields: Array<{
      type: string;
      name: string;
      label?: string;
      required: boolean;
    }>;
  }>;
  ctaElements: Array<{
    text: string;
    type: 'button' | 'link';
    position: { x: number; y: number };
    isVisible: boolean;
  }>;
  socialProof: Array<{
    type: 'testimonial' | 'review' | 'badge' | 'count';
    content: string;
    position: string;
  }>;
  loadTime: number;
  mobileOptimized: boolean;
  hasSSL: boolean;
  screenshot?: string;
}

export interface LighthouseData {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  pwa: number;
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
  };
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    scoreDisplayMode: string;
    numericValue?: number;
  }>;
}

export interface CheckpointResult {
  id: string;
  category: CheckpointCategory;
  name: string;
  description: string;
  score: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  status: 'pass' | 'fail' | 'warning' | 'info';
  recommendation: string;
  details?: string;
  evidence?: string[];
}

export type CheckpointCategory = 
  | 'conversion_optimization'
  | 'user_experience'
  | 'performance'
  | 'accessibility'
  | 'seo'
  | 'psychology'
  | 'mobile'
  | 'trust_signals'
  | 'content'
  | 'navigation';

export interface AnalysisInput {
  scrapedData: ScrapedData;
  lighthouseData?: LighthouseData;
  options: {
    includeScreenshots: boolean;
    mobileAnalysis: boolean;
    deepAnalysis: boolean;
  };
}

export interface DetailedInstruction {
  id: string;
  title: string;
  location: string; // "座標(240, 450)の「お申し込み」ボタン"
  currentState: {
    visual: string; // "現在の状態: 灰色背景、14pxフォント"
    technical: Record<string, string>; // CSS values
  };
  requiredChanges: {
    visual: string; // "推奨変更: オレンジ背景、18pxフォント、太字"
    technical: Record<string, string>; // New CSS values
    reasoning: string; // Why this change
  };
  implementation: {
    cssCode: string;
    htmlChanges?: string;
    selector: string;
    priority: 'immediate' | 'high' | 'medium' | 'low';
  };
  expectedResults: {
    primaryMetric: string;
    improvement: string;
    timeframe: string;
    confidence: number;
  };
  visualComparison: {
    before: string;
    after: string;
    keyDifferences: string[];
  };
}

export interface AnalysisResult {
  id: string;
  url: string;
  timestamp: string;
  overallScore: number;
  categories: {
    performance: number;
    usability: number;
    conversion: number;
    accessibility: number;
    seo: number;
  };
  checkpoints: CheckpointResult[];
  criticalIssues: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    expectedImprovement: string;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;
  insights: {
    psychologicalFactors: string[];
    userExperienceGaps: string[];
    conversionBlockers: string[];
    competitiveAdvantages: string[];
  };
  recommendations: {
    quick_wins: string[];
    medium_term: string[];
    long_term: string[];
  };
  detailedInstructions: DetailedInstruction[]; // 新機能: 具体的な座標ベース改善指示
  rawData?: {
    scrapedData?: ScrapedData;
    lighthouseData?: LighthouseData;
  };
}

export interface Checkpoint {
  id: string;
  category: CheckpointCategory;
  name: string;
  description: string;
  weight: number; // 1-10, importance multiplier
  analyze: (data: AnalysisInput) => CheckpointResult;
}

export interface AnalysisOptions {
  includeScreenshots: boolean;
  mobileAnalysis: boolean;
  deepAnalysis: boolean;
  categories?: CheckpointCategory[];
}