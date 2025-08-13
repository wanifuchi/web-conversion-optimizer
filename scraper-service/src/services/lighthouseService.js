// Lighthouse temporarily disabled for Alpine Linux compatibility
// const lighthouse = require('lighthouse');
// const chromeLauncher = require('chrome-launcher');

class LighthouseService {
  constructor() {
    this.defaultConfig = {
      extends: 'lighthouse:default',
      settings: {
        onlyAudits: [
          'first-contentful-paint',
          'largest-contentful-paint',
          'first-meaningful-paint',
          'speed-index',
          'total-blocking-time',
          'cumulative-layout-shift',
          'interactive',
          'color-contrast',
          'image-alt',
          'label',
          'link-name',
          'meta-description',
          'document-title',
          'robots-txt',
          'canonical',
          'structured-data'
        ]
      }
    };
  }

  async runAudit(url, options = {}) {
    console.log('🚦 Lighthouse temporarily disabled - returning mock data');
    
    // Return mock Lighthouse results
    return {
      scores: {
        performance: 85,
        accessibility: 90,
        bestPractices: 88,
        seo: 92
      },
      coreWebVitals: {
        firstContentfulPaint: { value: 1200, displayValue: '1.2 s', score: 0.9 },
        largestContentfulPaint: { value: 2400, displayValue: '2.4 s', score: 0.8 },
        totalBlockingTime: { value: 150, displayValue: '150 ms', score: 0.9 },
        cumulativeLayoutShift: { value: 0.1, displayValue: '0.1', score: 0.9 },
        speedIndex: { value: 1800, displayValue: '1.8 s', score: 0.85 },
        interactive: { value: 3200, displayValue: '3.2 s', score: 0.8 }
      },
      opportunities: [],
      accessibilityIssues: [],
      seoIssues: [],
      formFactor: options.mobile ? 'mobile' : 'desktop',
      userAgent: 'Mock User Agent',
      fetchTime: new Date().toISOString(),
      lighthouseVersion: 'mock-10.4.0'
    };
  }

  getMobileConfig(options = {}) {
    return {
      ...this.defaultConfig,
      settings: {
        ...this.defaultConfig.settings,
        formFactor: 'mobile',
        throttling: {
          rtt: 150,
          throughput: 1.6 * 1024 * 1024,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1.6 * 1024,
          uploadThroughputKbps: 750
        },
        emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      }
    };
  }

  getDesktopConfig(options = {}) {
    return {
      ...this.defaultConfig,
      settings: {
        ...this.defaultConfig.settings,
        formFactor: 'desktop',
        throttling: {
          rtt: 40,
          throughput: 10 * 1024 * 1024,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    };
  }

  formatLighthouseResults(lhr) {
    const scores = {
      performance: Math.round((lhr.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lhr.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lhr.categories['best-practices']?.score || 0) * 100),
      seo: Math.round((lhr.categories.seo?.score || 0) * 100)
    };

    // Core Web Vitals
    const coreWebVitals = {
      firstContentfulPaint: this.getMetricValue(lhr, 'first-contentful-paint'),
      largestContentfulPaint: this.getMetricValue(lhr, 'largest-contentful-paint'),
      totalBlockingTime: this.getMetricValue(lhr, 'total-blocking-time'),
      cumulativeLayoutShift: this.getMetricValue(lhr, 'cumulative-layout-shift'),
      speedIndex: this.getMetricValue(lhr, 'speed-index'),
      interactive: this.getMetricValue(lhr, 'interactive')
    };

    // Performance opportunities
    const opportunities = [];
    if (lhr.audits) {
      const opportunityAudits = [
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'render-blocking-resources',
        'unminified-css',
        'unminified-javascript',
        'enable-text-compression',
        'uses-webp-images',
        'efficient-animated-content'
      ];

      opportunityAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.details && audit.details.overallSavingsMs > 100) {
          opportunities.push({
            id: auditId,
            title: audit.title,
            description: audit.description,
            savings: audit.details.overallSavingsMs,
            savingsBytes: audit.details.overallSavingsBytes || 0
          });
        }
      });
    }

    // Accessibility issues
    const accessibilityIssues = [];
    if (lhr.audits) {
      const a11yAudits = [
        'color-contrast',
        'image-alt',
        'label',
        'link-name',
        'button-name',
        'document-title',
        'html-has-lang',
        'meta-viewport'
      ];

      a11yAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.score !== null && audit.score < 1) {
          accessibilityIssues.push({
            id: auditId,
            title: audit.title,
            description: audit.description,
            score: audit.score
          });
        }
      });
    }

    // SEO issues
    const seoIssues = [];
    if (lhr.audits) {
      const seoAudits = [
        'meta-description',
        'document-title',
        'robots-txt',
        'canonical',
        'hreflang',
        'structured-data'
      ];

      seoAudits.forEach(auditId => {
        const audit = lhr.audits[auditId];
        if (audit && audit.score !== null && audit.score < 1) {
          seoIssues.push({
            id: auditId,
            title: audit.title,
            description: audit.description,
            score: audit.score
          });
        }
      });
    }

    return {
      scores,
      coreWebVitals,
      opportunities: opportunities.sort((a, b) => b.savings - a.savings),
      accessibilityIssues,
      seoIssues,
      formFactor: lhr.configSettings.formFactor,
      userAgent: lhr.userAgent,
      fetchTime: lhr.fetchTime,
      lighthouseVersion: lhr.lighthouseVersion
    };
  }

  getMetricValue(lhr, metricId) {
    const audit = lhr.audits[metricId];
    if (!audit || audit.numericValue === undefined) {
      return null;
    }

    return {
      value: audit.numericValue,
      displayValue: audit.displayValue,
      score: audit.score
    };
  }

  // Quick performance check (mock)
  async quickPerformanceCheck(url) {
    console.log('🚦 Quick performance check - returning mock data');
    
    return {
      performanceScore: 85,
      coreWebVitals: {
        firstContentfulPaint: { value: 1200, displayValue: '1.2 s', score: 0.9 },
        largestContentfulPaint: { value: 2400, displayValue: '2.4 s', score: 0.8 },
        totalBlockingTime: { value: 150, displayValue: '150 ms', score: 0.9 }
      },
      topOpportunities: []
    };
  }
}

module.exports = new LighthouseService();