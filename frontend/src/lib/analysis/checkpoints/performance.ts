// Performance Checkpoints

import { Checkpoint, AnalysisInput, CheckpointResult } from '../types';

export const performanceCheckpoints: Checkpoint[] = [
  {
    id: 'perf_001',
    category: 'performance',
    name: 'Core Web Vitals - LCP',
    description: 'Largest Contentful Paint (LCP) のパフォーマンスをチェック',
    weight: 10,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const lcp = data.lighthouseData?.metrics.largestContentfulPaint;
      
      if (!lcp) {
        return {
          id: 'perf_001',
          category: 'performance',
          name: 'Core Web Vitals - LCP',
          description: 'Largest Contentful Paint (LCP) のパフォーマンスをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['LCPデータ: なし']
        };
      }

      let score = 100;
      if (lcp > 4000) score = 20;
      else if (lcp > 2500) score = 50;
      else if (lcp > 1500) score = 80;

      return {
        id: 'perf_001',
        category: 'performance',
        name: 'Core Web Vitals - LCP',
        description: 'Largest Contentful Paint (LCP) のパフォーマンスをチェック',
        score,
        impact: lcp > 2500 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: lcp > 2500 ? 
          'LCPを2.5秒以下に改善してください。画像最適化、サーバー応答時間の改善を検討してください' :
          'LCPは良好です',
        evidence: [`LCP: ${lcp}ms`]
      };
    }
  },

  {
    id: 'perf_002',
    category: 'performance',
    name: 'Core Web Vitals - FID',
    description: 'First Input Delay (FID) のパフォーマンスをチェック',
    weight: 9,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const fid = data.lighthouseData?.metrics.firstInputDelay;
      
      if (!fid) {
        return {
          id: 'perf_002',
          category: 'performance',
          name: 'Core Web Vitals - FID',
          description: 'First Input Delay (FID) のパフォーマンスをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['FIDデータ: なし']
        };
      }

      let score = 100;
      if (fid > 300) score = 20;
      else if (fid > 100) score = 50;
      else if (fid > 50) score = 80;

      return {
        id: 'perf_002',
        category: 'performance',
        name: 'Core Web Vitals - FID',
        description: 'First Input Delay (FID) のパフォーマンスをチェック',
        score,
        impact: fid > 100 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: fid > 100 ? 
          'FIDを100ms以下に改善してください。JavaScriptの最適化、コード分割を検討してください' :
          'FIDは良好です',
        evidence: [`FID: ${fid}ms`]
      };
    }
  },

  {
    id: 'perf_003',
    category: 'performance',
    name: 'Core Web Vitals - CLS',
    description: 'Cumulative Layout Shift (CLS) のパフォーマンスをチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const cls = data.lighthouseData?.metrics.cumulativeLayoutShift;
      
      if (!cls) {
        return {
          id: 'perf_003',
          category: 'performance',
          name: 'Core Web Vitals - CLS',
          description: 'Cumulative Layout Shift (CLS) のパフォーマンスをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['CLSデータ: なし']
        };
      }

      let score = 100;
      if (cls > 0.25) score = 20;
      else if (cls > 0.1) score = 50;
      else if (cls > 0.05) score = 80;

      return {
        id: 'perf_003',
        category: 'performance',
        name: 'Core Web Vitals - CLS',
        description: 'Cumulative Layout Shift (CLS) のパフォーマンスをチェック',
        score,
        impact: cls > 0.1 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: cls > 0.1 ? 
          'CLSを0.1以下に改善してください。画像サイズの指定、フォント読み込みの最適化を検討してください' :
          'CLSは良好です',
        evidence: [`CLS: ${cls}`]
      };
    }
  },

  {
    id: 'perf_004',
    category: 'performance',
    name: 'First Contentful Paint',
    description: 'First Contentful Paint (FCP) のパフォーマンスをチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const fcp = data.lighthouseData?.metrics.firstContentfulPaint;
      
      if (!fcp) {
        return {
          id: 'perf_004',
          category: 'performance',
          name: 'First Contentful Paint',
          description: 'First Contentful Paint (FCP) のパフォーマンスをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['FCPデータ: なし']
        };
      }

      let score = 100;
      if (fcp > 3000) score = 20;
      else if (fcp > 1800) score = 50;
      else if (fcp > 1000) score = 80;

      return {
        id: 'perf_004',
        category: 'performance',
        name: 'First Contentful Paint',
        description: 'First Contentful Paint (FCP) のパフォーマンスをチェック',
        score,
        impact: fcp > 1800 ? 'high' : 'medium',
        status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: fcp > 1800 ? 
          'FCPを1.8秒以下に改善してください。クリティカルリソースの最適化を検討してください' :
          'FCPは良好です',
        evidence: [`FCP: ${fcp}ms`]
      };
    }
  },

  {
    id: 'perf_005',
    category: 'performance',
    name: 'Image Optimization',
    description: '画像の最適化状況をチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const images = data.scrapedData.images;
      const imagesWithDimensions = images.filter(img => img.width && img.height).length;
      
      let score = 50;
      
      if (images.length > 0) {
        const dimensionRatio = imagesWithDimensions / images.length;
        score += dimensionRatio * 30;
      }

      // Check for modern image formats (this would need to be enhanced with actual format detection)
      const modernFormats = images.filter(img => 
        /\.(webp|avif)$/i.test(img.src)
      ).length;
      
      if (images.length > 0 && modernFormats > 0) {
        score += (modernFormats / images.length) * 20;
      }

      return {
        id: 'perf_005',
        category: 'performance',
        name: 'Image Optimization',
        description: '画像の最適化状況をチェック',
        score,
        impact: 'medium',
        status: score >= 80 ? 'pass' : score >= 60 ? 'warning' : 'fail',
        recommendation: score < 60 ? 
          '画像のwidth/height属性設定、WebPなどの最新フォーマット使用を検討してください' :
          '画像の最適化は良好です',
        evidence: [
          `画像数: ${images.length}`,
          `サイズ指定率: ${images.length > 0 ? Math.round((imagesWithDimensions/images.length)*100) : 0}%`,
          `最新フォーマット: ${modernFormats}`
        ]
      };
    }
  },

  {
    id: 'perf_006',
    category: 'performance',
    name: 'HTTPS Implementation',
    description: 'HTTPS（SSL）の実装状況をチェック',
    weight: 7,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const hasSSL = data.scrapedData.hasSSL;
      const score = hasSSL ? 95 : 10;

      return {
        id: 'perf_006',
        category: 'performance',
        name: 'HTTPS Implementation',
        description: 'HTTPS（SSL）の実装状況をチェック',
        score,
        impact: 'high',
        status: score >= 90 ? 'pass' : 'fail',
        recommendation: !hasSSL ? 
          'HTTPSを実装してください。セキュリティとSEOの向上に重要です' :
          'HTTPSが適切に実装されています',
        evidence: [`HTTPS: ${hasSSL ? '実装済み' : '未実装'}`]
      };
    }
  },

  {
    id: 'perf_007',
    category: 'performance',
    name: 'Speed Index',
    description: 'Speed Index のパフォーマンスをチェック',
    weight: 6,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const speedIndex = data.lighthouseData?.metrics.speedIndex;
      
      if (!speedIndex) {
        return {
          id: 'perf_007',
          category: 'performance',
          name: 'Speed Index',
          description: 'Speed Index のパフォーマンスをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['Speed Indexデータ: なし']
        };
      }

      let score = 100;
      if (speedIndex > 5800) score = 20;
      else if (speedIndex > 3400) score = 50;
      else if (speedIndex > 2000) score = 80;

      return {
        id: 'perf_007',
        category: 'performance',
        name: 'Speed Index',
        description: 'Speed Index のパフォーマンスをチェック',
        score,
        impact: speedIndex > 3400 ? 'medium' : 'low',
        status: score >= 80 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: speedIndex > 3400 ? 
          'Speed Indexを3.4秒以下に改善してください。重要コンテンツの優先読み込みを検討してください' :
          'Speed Indexは良好です',
        evidence: [`Speed Index: ${speedIndex}ms`]
      };
    }
  },

  {
    id: 'perf_008',
    category: 'performance',
    name: 'Performance Score',
    description: 'Lighthouse パフォーマンススコアをチェック',
    weight: 8,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const performanceScore = data.lighthouseData?.performance;
      
      if (!performanceScore) {
        return {
          id: 'perf_008',
          category: 'performance',
          name: 'Performance Score',
          description: 'Lighthouse パフォーマンススコアをチェック',
          score: 50,
          impact: 'medium',
          status: 'info',
          recommendation: 'Lighthouseデータが利用できません',
          evidence: ['パフォーマンススコア: なし']
        };
      }

      const score = performanceScore;

      return {
        id: 'perf_008',
        category: 'performance',
        name: 'Performance Score',
        description: 'Lighthouse パフォーマンススコアをチェック',
        score,
        impact: score < 70 ? 'high' : 'medium',
        status: score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail',
        recommendation: score < 70 ? 
          'パフォーマンススコアが低いです。Core Web Vitals、画像最適化、JavaScript最適化を実施してください' :
          score < 90 ? 'さらなるパフォーマンス改善の余地があります' : 'パフォーマンスは優秀です',
        evidence: [`Lighthouseスコア: ${score}/100`]
      };
    }
  },

  {
    id: 'perf_009',
    category: 'performance',
    name: 'Resource Loading',
    description: 'リソースの読み込み効率をチェック',
    weight: 5,
    analyze: (data: AnalysisInput): CheckpointResult => {
      const images = data.scrapedData.images;
      const links = data.scrapedData.links;
      const externalLinks = links.filter(link => link.isExternal).length;
      
      let score = 70;
      
      // Too many external resources penalty
      if (externalLinks > 10) score -= 20;
      
      // Too many images penalty
      if (images.length > 20) score -= 15;

      return {
        id: 'perf_009',
        category: 'performance',
        name: 'Resource Loading',
        description: 'リソースの読み込み効率をチェック',
        score: Math.max(20, score),
        impact: 'low',
        status: score >= 70 ? 'pass' : score >= 50 ? 'warning' : 'fail',
        recommendation: score < 50 ? 
          '外部リソースや画像の数を最適化し、読み込み効率を改善してください' :
          'リソース読み込みは適切です',
        evidence: [`外部リンク: ${externalLinks}`, `画像数: ${images.length}`]
      };
    }
  },

  {
    id: 'perf_010',
    category: 'performance',
    name: 'Cache Strategy',
    description: 'キャッシュ戦略の実装をチェック',
    weight: 4,
    analyze: (data: AnalysisInput): CheckpointResult => {
      // This would need actual cache headers analysis in a real implementation
      // For now, we'll use heuristics based on the site structure
      
      const images = data.scrapedData.images;
      const cdnImages = images.filter(img => 
        /cdn\.|cloudfront\.|amazonaws\.com|cloudflare/i.test(img.src)
      ).length;

      let score = 50;
      if (images.length > 0) {
        const cdnRatio = cdnImages / images.length;
        score += cdnRatio * 30;
      }

      return {
        id: 'perf_010',
        category: 'performance',
        name: 'Cache Strategy',
        description: 'キャッシュ戦略の実装をチェック',
        score,
        impact: 'low',
        status: score >= 70 ? 'pass' : 'warning',
        recommendation: score < 70 ? 
          'CDNの使用、ブラウザキャッシュの最適化を検討してください' :
          'キャッシュ戦略は良好です',
        evidence: [`CDN使用画像: ${cdnImages}/${images.length}`]
      };
    }
  }
];