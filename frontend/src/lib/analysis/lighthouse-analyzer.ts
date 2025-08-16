import lighthouse from 'lighthouse';
import type { Page } from 'puppeteer';
import { createRequestLogger, PerformanceLogger } from '@/lib/logger';
import { TimeoutError, ExternalServiceError, withRetry } from '@/lib/error-handler';
import { cacheManager, CACHE_TTL } from '@/lib/cache/cache-manager';

/**
 * Lighthouse分析オプション
 */
export interface LighthouseOptions {
  mobile?: boolean;
  onlyCategories?: Array<'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'>;
  throttling?: boolean;
  useCache?: boolean;
}

/**
 * Core Web Vitalsデータ
 */
export interface CoreWebVitals {
  lcp?: string | null;  // Largest Contentful Paint
  fid?: string | null;  // First Input Delay
  cls?: string | null;  // Cumulative Layout Shift
  fcp?: string | null;  // First Contentful Paint
  si?: string | null;   // Speed Index
  tbt?: string | null;  // Total Blocking Time
  ttfb?: string | null; // Time to First Byte
  tti?: string | null;  // Time to Interactive
}

/**
 * Lighthouse分析結果
 */
export interface LighthouseResult {
  performanceScore: number;
  accessibilityScore: number;
  bestPracticesScore: number;
  seoScore: number;
  pwaScore?: number;
  coreWebVitals: CoreWebVitals;
  metrics: {
    [key: string]: any;
  };
  audits: {
    [key: string]: {
      title: string;
      description: string;
      score: number | null;
      displayValue?: string;
      details?: any;
    };
  };
  opportunities: Array<{
    title: string;
    description: string;
    savings?: string;
    score: number;
  }>;
  diagnostics: Array<{
    title: string;
    description: string;
    score: number;
    details?: any;
  }>;
  timestamp: string;
  url: string;
}

/**
 * PuppeteerのPageからデバッグポートを取得
 */
const getDebugPort = (page: Page): number => {
  const wsEndpoint = page.browser().wsEndpoint();
  const url = new URL(wsEndpoint);
  
  // WebSocketエンドポイントからHTTPポートを取得
  if (url.protocol === 'ws:') {
    url.protocol = 'http:';
  } else if (url.protocol === 'wss:') {
    url.protocol = 'https:';
  }
  
  return parseInt(url.port, 10);
};

/**
 * Lighthouse分析を実行
 */
export async function runLighthouseAnalysis(
  page: Page,
  url: string,
  options: LighthouseOptions = {}
): Promise<LighthouseResult> {
  const logger = createRequestLogger(crypto.randomUUID(), url, 'LIGHTHOUSE');
  const perfLogger = new PerformanceLogger('lighthouse-analysis', logger);
  
  try {
    logger.info({ url, options }, 'Lighthouse分析開始');
    
    // キャッシュを確認
    if (options.useCache !== false) {
      const cacheKey = cacheManager.generateUrlKey('lighthouse', url, {
        mobile: options.mobile,
        categories: options.onlyCategories
      });
      
      const cachedResult = cacheManager.get<LighthouseResult>(cacheKey);
      if (cachedResult) {
        logger.info({ url, cacheKey }, 'Lighthouseキャッシュヒット');
        perfLogger.end({ cacheHit: true });
        return cachedResult;
      }
    }
    
    // デバッグポートを取得
    const port = getDebugPort(page);
    logger.debug({ port }, 'Chrome DevTools ポート取得');
    
    // Lighthouse設定
    const lighthouseConfig: any = {
      port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: options.onlyCategories || [
        'performance',
        'accessibility',
        'best-practices',
        'seo'
      ],
      disableStorageReset: false,
      emulatedFormFactor: options.mobile ? 'mobile' : 'desktop',
      throttling: options.throttling !== false ? {
        rttMs: options.mobile ? 150 : 40,
        throughputKbps: options.mobile ? 1638 : 10240,
        cpuSlowdownMultiplier: options.mobile ? 4 : 1
      } : null,
      screenEmulation: options.mobile ? {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2
      } : {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1
      }
    };
    
    // Lighthouseを実行（リトライ付き）
    const runLighthouse = async () => {
      const result = await lighthouse(url, lighthouseConfig);
      if (!result || !result.lhr) {
        throw new Error('Lighthouse failed to generate report');
      }
      return result.lhr;
    };
    
    const lhr = await withRetry(runLighthouse, {
      maxAttempts: 2,
      onRetry: (attempt, error) => {
        logger.warn({ attempt, error }, 'Lighthouse実行をリトライ');
      }
    });
    
    logger.info({ url }, 'Lighthouse分析完了');
    
    // 結果を解析
    const result = parseLighthouseResult(lhr, url);
    
    // キャッシュに保存
    if (options.useCache !== false) {
      const cacheKey = cacheManager.generateUrlKey('lighthouse', url, {
        mobile: options.mobile,
        categories: options.onlyCategories
      });
      cacheManager.set(cacheKey, result, CACHE_TTL.LIGHTHOUSE);
      logger.debug({ cacheKey }, 'Lighthouse結果をキャッシュに保存');
    }
    
    perfLogger.end({
      performanceScore: result.performanceScore,
      cacheHit: false
    });
    
    return result;
    
  } catch (error) {
    perfLogger.error(error);
    logger.error({ error }, 'Lighthouse分析エラー');
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new TimeoutError('Lighthouse analysis', 60000);
      }
      throw new ExternalServiceError('Lighthouse', error);
    }
    
    throw error;
  }
}

/**
 * Lighthouse結果を解析して構造化
 */
function parseLighthouseResult(lhr: any, url: string): LighthouseResult {
  const categories = lhr.categories || {};
  const audits = lhr.audits || {};
  
  // Core Web Vitalsを抽出
  const coreWebVitals: CoreWebVitals = {
    lcp: audits['largest-contentful-paint']?.displayValue || null,
    fid: audits['max-potential-fid']?.displayValue || null,
    cls: audits['cumulative-layout-shift']?.displayValue || null,
    fcp: audits['first-contentful-paint']?.displayValue || null,
    si: audits['speed-index']?.displayValue || null,
    tbt: audits['total-blocking-time']?.displayValue || null,
    ttfb: audits['time-to-first-byte']?.displayValue || null,
    tti: audits['interactive']?.displayValue || null
  };
  
  // 改善機会を抽出
  const opportunities: LighthouseResult['opportunities'] = [];
  const diagnostics: LighthouseResult['diagnostics'] = [];
  
  Object.keys(audits).forEach(key => {
    const audit = audits[key];
    
    // スコアが低く、改善の余地があるもの
    if (audit.score !== null && audit.score < 0.9) {
      const item = {
        title: audit.title,
        description: audit.description,
        score: audit.score,
        savings: audit.displayValue,
        details: audit.details
      };
      
      // opportunities（改善機会）とdiagnostics（診断）を分類
      if (audit.details?.type === 'opportunity') {
        opportunities.push(item);
      } else if (audit.score < 0.5) {
        diagnostics.push(item);
      }
    }
  });
  
  // 改善機会を影響度でソート
  opportunities.sort((a, b) => a.score - b.score);
  diagnostics.sort((a, b) => a.score - b.score);
  
  // メトリクスを整理
  const metrics: Record<string, any> = {};
  Object.keys(audits).forEach(key => {
    const audit = audits[key];
    if (audit.numericValue !== undefined) {
      metrics[key] = {
        value: audit.numericValue,
        displayValue: audit.displayValue,
        score: audit.score
      };
    }
  });
  
  // 監査結果を整理
  const auditResults: LighthouseResult['audits'] = {};
  Object.keys(audits).forEach(key => {
    const audit = audits[key];
    auditResults[key] = {
      title: audit.title,
      description: audit.description,
      score: audit.score,
      displayValue: audit.displayValue,
      details: audit.details
    };
  });
  
  return {
    performanceScore: Math.round((categories.performance?.score || 0) * 100),
    accessibilityScore: Math.round((categories.accessibility?.score || 0) * 100),
    bestPracticesScore: Math.round((categories['best-practices']?.score || 0) * 100),
    seoScore: Math.round((categories.seo?.score || 0) * 100),
    pwaScore: categories.pwa ? Math.round(categories.pwa.score * 100) : undefined,
    coreWebVitals,
    metrics,
    audits: auditResults,
    opportunities: opportunities.slice(0, 10), // 上位10個の改善機会
    diagnostics: diagnostics.slice(0, 10),     // 上位10個の診断項目
    timestamp: new Date().toISOString(),
    url
  };
}

/**
 * パフォーマンススコアの評価
 */
export function evaluatePerformanceScore(score: number): {
  rating: 'poor' | 'needs-improvement' | 'good';
  color: string;
  emoji: string;
  message: string;
} {
  if (score >= 90) {
    return {
      rating: 'good',
      color: 'green',
      emoji: '🟢',
      message: '優秀なパフォーマンス'
    };
  } else if (score >= 50) {
    return {
      rating: 'needs-improvement',
      color: 'orange',
      emoji: '🟠',
      message: '改善の余地あり'
    };
  } else {
    return {
      rating: 'poor',
      color: 'red',
      emoji: '🔴',
      message: '大幅な改善が必要'
    };
  }
}

/**
 * Core Web Vitalsの評価
 */
export function evaluateCoreWebVitals(vitals: CoreWebVitals): {
  overall: 'good' | 'needs-improvement' | 'poor';
  details: Record<string, 'good' | 'needs-improvement' | 'poor'>;
} {
  const details: Record<string, 'good' | 'needs-improvement' | 'poor'> = {};
  
  // LCP評価（2.5秒以下: Good, 4秒以下: Needs Improvement, それ以上: Poor）
  if (vitals.lcp) {
    const lcpValue = parseFloat(vitals.lcp);
    if (lcpValue <= 2.5) details.lcp = 'good';
    else if (lcpValue <= 4.0) details.lcp = 'needs-improvement';
    else details.lcp = 'poor';
  }
  
  // CLS評価（0.1以下: Good, 0.25以下: Needs Improvement, それ以上: Poor）
  if (vitals.cls) {
    const clsValue = parseFloat(vitals.cls);
    if (clsValue <= 0.1) details.cls = 'good';
    else if (clsValue <= 0.25) details.cls = 'needs-improvement';
    else details.cls = 'poor';
  }
  
  // FID/TBT評価（100ms以下: Good, 300ms以下: Needs Improvement, それ以上: Poor）
  const fidValue = vitals.fid || vitals.tbt;
  if (fidValue) {
    const value = parseFloat(fidValue);
    if (value <= 100) details.fid = 'good';
    else if (value <= 300) details.fid = 'needs-improvement';
    else details.fid = 'poor';
  }
  
  // 全体評価
  const scores = Object.values(details);
  let overall: 'good' | 'needs-improvement' | 'poor';
  
  if (scores.every(s => s === 'good')) {
    overall = 'good';
  } else if (scores.some(s => s === 'poor')) {
    overall = 'poor';
  } else {
    overall = 'needs-improvement';
  }
  
  return { overall, details };
}