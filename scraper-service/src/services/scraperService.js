const puppeteer = require('puppeteer');
const Jimp = require('jimp');

class ScraperService {
  constructor() {
    this.browserOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-features=VizDisplayCompositor'
      ]
    };
  }

  async scrapePage(url, options = {}) {
    const browser = await this.launchBrowser();
    
    try {
      const page = await browser.newPage();
      
      // Configure page
      await this.configurePage(page, options);
      
      // Navigate to URL
      console.log(`🌐 Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: options.timeout || 30000
      });

      // Wait for additional content to load
      await page.waitForTimeout(2000);

      // Extract page data
      const pageData = await this.extractPageData(page);
      
      // Take screenshot if requested
      let screenshot = null;
      if (options.screenshot) {
        screenshot = await this.takeScreenshotFromPage(page, options);
      }

      // Extract conversion elements
      const conversionElements = await this.extractConversionElements(page);
      
      // Extract performance metrics
      const performanceMetrics = await this.extractPerformanceMetrics(page);

      return {
        url,
        pageData,
        screenshot: screenshot ? screenshot.toString('base64') : null,
        conversionElements,
        performanceMetrics,
        extractedAt: new Date().toISOString()
      };

    } finally {
      await browser.close();
    }
  }

  async takeScreenshot(url, options = {}) {
    const browser = await this.launchBrowser();
    
    try {
      const page = await browser.newPage();
      await this.configurePage(page, options);
      
      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: options.timeout || 30000
      });

      await page.waitForTimeout(2000);

      return await this.takeScreenshotFromPage(page, options);

    } finally {
      await browser.close();
    }
  }

  async launchBrowser() {
    console.log('🚀 Launching browser...');
    return await puppeteer.launch(this.browserOptions);
  }

  async configurePage(page, options = {}) {
    // Set viewport
    const viewport = options.mobile 
      ? { width: 375, height: 667, isMobile: true, hasTouch: true }
      : { width: 1920, height: 1080 };
    
    await page.setViewport(viewport);

    // Set user agent
    if (options.mobile) {
      await page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      );
    }

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    });
  }

  async extractPageData(page) {
    return await page.evaluate(() => {
      // Basic page information
      const pageInfo = {
        title: document.title,
        url: window.location.href,
        description: document.querySelector('meta[name="description"]')?.content || '',
        keywords: document.querySelector('meta[name="keywords"]')?.content || '',
        
        // Open Graph data
        ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
        ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
        ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        
        // Structured data
        jsonLd: Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map(script => {
            try {
              return JSON.parse(script.textContent);
            } catch {
              return null;
            }
          })
          .filter(Boolean),
        
        // HTML structure
        headings: {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
          h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
          h3: Array.from(document.querySelectorAll('h3')).map(h => h.textContent.trim())
        },
        
        // Links
        links: Array.from(document.querySelectorAll('a[href]')).map(a => ({
          href: a.href,
          text: a.textContent.trim(),
          title: a.title
        })),
        
        // Images
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        })),
        
        // Forms
        forms: Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action,
          method: form.method,
          fieldCount: form.querySelectorAll('input, select, textarea').length
        })),
        
        // Text content
        textContent: document.body.textContent.trim(),
        wordCount: document.body.textContent.trim().split(/\s+/).length,
        
        // Technical info
        doctype: document.doctype ? document.doctype.name : '',
        lang: document.documentElement.lang,
        charset: document.characterSet,
        
        // Viewport
        viewport: document.querySelector('meta[name="viewport"]')?.content || ''
      };

      return pageInfo;
    });
  }

  async extractConversionElements(page) {
    return await page.evaluate(() => {
      const elements = {
        phoneNumbers: [],
        emailAddresses: [],
        ctaButtons: [],
        forms: [],
        socialLinks: [],
        chatWidgets: []
      };

      // Phone numbers (tel: links and text patterns)
      document.querySelectorAll('a[href^="tel:"]').forEach(tel => {
        elements.phoneNumbers.push({
          number: tel.href.replace('tel:', ''),
          text: tel.textContent.trim(),
          position: tel.getBoundingClientRect()
        });
      });

      // Email addresses
      document.querySelectorAll('a[href^="mailto:"]').forEach(email => {
        elements.emailAddresses.push({
          email: email.href.replace('mailto:', ''),
          text: email.textContent.trim(),
          position: email.getBoundingClientRect()
        });
      });

      // CTA Buttons (common patterns)
      const ctaSelectors = [
        'button:not([type="submit"])',
        '.btn', '.button', '.cta',
        'a[class*="btn"]', 'a[class*="button"]', 'a[class*="cta"]',
        '[role="button"]'
      ];

      ctaSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(btn => {
          const text = btn.textContent.trim().toLowerCase();
          if (text.includes('お問い合わせ') || text.includes('申し込み') || 
              text.includes('購入') || text.includes('今すぐ') ||
              text.includes('contact') || text.includes('buy') || 
              text.includes('order') || text.includes('signup')) {
            elements.ctaButtons.push({
              text: btn.textContent.trim(),
              href: btn.href || '',
              position: btn.getBoundingClientRect(),
              classes: btn.className
            });
          }
        });
      });

      // Forms
      document.querySelectorAll('form').forEach(form => {
        const inputs = form.querySelectorAll('input, select, textarea');
        elements.forms.push({
          action: form.action,
          method: form.method,
          fieldCount: inputs.length,
          fieldTypes: Array.from(inputs).map(input => input.type || input.tagName.toLowerCase()),
          position: form.getBoundingClientRect()
        });
      });

      // Social links
      const socialPatterns = /facebook|twitter|instagram|linkedin|youtube|tiktok|line/i;
      document.querySelectorAll('a[href]').forEach(link => {
        if (socialPatterns.test(link.href)) {
          elements.socialLinks.push({
            platform: link.href.match(socialPatterns)?.[0].toLowerCase(),
            href: link.href,
            text: link.textContent.trim(),
            position: link.getBoundingClientRect()
          });
        }
      });

      // Chat widgets (common patterns)
      const chatSelectors = [
        '[class*="chat"]', '[id*="chat"]',
        '[class*="support"]', '[id*="support"]',
        '.intercom', '#intercom',
        '.zendesk', '#zendesk',
        '.livechat', '#livechat'
      ];

      chatSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(widget => {
          if (widget.offsetWidth > 0 && widget.offsetHeight > 0) {
            elements.chatWidgets.push({
              selector,
              classes: widget.className,
              position: widget.getBoundingClientRect()
            });
          }
        });
      });

      return elements;
    });
  }

  async extractPerformanceMetrics(page) {
    return await page.evaluate(() => {
      const performance = window.performance;
      const navigation = performance.getEntriesByType('navigation')[0];
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        firstContentfulPaint: 0, // Will be enhanced with Lighthouse data
        resources: performance.getEntriesByType('resource').length,
        
        // Page metrics
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight,
        
        // DOM metrics
        domElements: document.querySelectorAll('*').length,
        images: document.querySelectorAll('img').length,
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length
      };
    });
  }

  async takeScreenshotFromPage(page, options = {}) {
    const screenshotOptions = {
      type: 'png',
      fullPage: options.fullPage !== false,
      quality: options.quality || 90
    };

    const screenshot = await page.screenshot(screenshotOptions);

    // Optimize screenshot if needed
    if (options.optimize !== false) {
      const image = await Jimp.read(screenshot);
      return await image
        .quality(80)
        .getBufferAsync(Jimp.MIME_PNG);
    }

    return screenshot;
  }
}

module.exports = new ScraperService();