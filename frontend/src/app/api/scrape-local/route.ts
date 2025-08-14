import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface ScrapeRequest {
  url: string;
  options?: {
    screenshot?: boolean;
    lighthouse?: boolean;
    mobile?: boolean;
    timeout?: number;
  };
}

interface ScrapeResult {
  scrapeData: {
    url: string;
    pageData: {
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
      mobileOptimized: boolean;
      hasSSL: boolean;
    };
    conversionElements: {
      ctaButtons: Array<{
        text: string;
        type: 'button' | 'link';
        position: { x: number; y: number };
        isVisible: boolean;
      }>;
    };
    performance: {
      loadTime: number;
    };
  };
  lighthouseData?: any;
}

export async function POST(request: NextRequest) {
  let browser = null;

  try {
    const body: ScrapeRequest = await request.json();
    
    if (!body.url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting local scraping for: ${body.url}`);

    const options = {
      screenshot: body.options?.screenshot !== false,
      mobile: body.options?.mobile || false,
      timeout: body.options?.timeout || 30000,
      ...body.options
    };

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-extensions',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list',
        '--ignore-certificate-errors-ssl-errors'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport for mobile or desktop
    if (options.mobile) {
      await page.setViewport({ width: 375, height: 667, isMobile: true });
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
    } else {
      await page.setViewport({ width: 1200, height: 800 });
    }

    // Set timeout
    page.setDefaultNavigationTimeout(options.timeout);
    page.setDefaultTimeout(options.timeout);

    // Navigate to the page
    const startTime = Date.now();
    await page.goto(body.url, { 
      waitUntil: 'domcontentloaded',
      timeout: options.timeout
    });
    
    // Wait a bit for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    const loadTime = Date.now() - startTime;

    console.log(`📄 Page loaded in ${loadTime}ms`);

    // Extract page data
    const pageData = await page.evaluate(() => {
      // Get title
      const title = document.title || '';

      // Get meta description
      const descriptionMeta = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      const description = descriptionMeta?.content || '';

      // Get headings
      const h1Elements = Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim() || '');
      const h2Elements = Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim() || '');
      const h3Elements = Array.from(document.querySelectorAll('h3')).map(el => el.textContent?.trim() || '');

      // Get images
      const images = Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.src || '',
        alt: img.alt || '',
        width: img.width || undefined,
        height: img.height || undefined
      }));

      // Get links
      const links = Array.from(document.querySelectorAll('a[href]')).map(link => {
        const href = (link as HTMLAnchorElement).href || '';
        const text = link.textContent?.trim() || '';
        const isExternal = !href.startsWith(window.location.origin) && href.startsWith('http');
        return { href, text, isExternal };
      });

      // Get forms
      const forms = Array.from(document.querySelectorAll('form')).map(form => {
        const action = form.action || '';
        const method = form.method || 'GET';
        const fields = Array.from(form.querySelectorAll('input, textarea, select')).map(field => {
          const input = field as HTMLInputElement;
          return {
            type: input.type || 'text',
            name: input.name || '',
            label: (form.querySelector(`label[for="${input.id}"]`) as HTMLLabelElement)?.textContent?.trim() || '',
            required: input.required
          };
        });
        return { action, method, fields };
      });

      // Check for mobile optimization indicators
      const viewport = document.querySelector('meta[name="viewport"]');
      const mobileOptimized = !!viewport;

      // Check SSL
      const hasSSL = window.location.protocol === 'https:';

      // Get CTA buttons
      const ctaButtons = Array.from(document.querySelectorAll('button, a')).map(el => {
        const text = el.textContent?.trim() || '';
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        return {
          text,
          type: el.tagName.toLowerCase() === 'button' ? 'button' as const : 'link' as const,
          position: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          isVisible
        };
      }).filter(btn => btn.text.length > 0);

      return {
        title,
        description,
        headings: { h1: h1Elements, h2: h2Elements, h3: h3Elements },
        images,
        links,
        forms,
        mobileOptimized,
        hasSSL,
        ctaButtons
      };
    });

    console.log(`✅ Successfully scraped data from ${body.url}`);

    // Prepare result in expected format
    const result: ScrapeResult = {
      scrapeData: {
        url: body.url,
        pageData: {
          url: body.url,
          title: pageData.title,
          description: pageData.description,
          headings: pageData.headings,
          images: pageData.images,
          links: pageData.links,
          forms: pageData.forms,
          mobileOptimized: pageData.mobileOptimized,
          hasSSL: pageData.hasSSL
        },
        conversionElements: {
          ctaButtons: pageData.ctaButtons
        },
        performance: {
          loadTime
        }
      },
      lighthouseData: null // Lighthouse data would require additional implementation
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Local scraping error:', error);
    
    // Provide detailed error info in development, generic in production
    const isDev = process.env.NODE_ENV === 'development';
    
    return NextResponse.json(
      { 
        error: 'Local scraping failed',
        details: isDev ? (error instanceof Error ? error.message : 'Unknown error') : 'Please try again later',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );

  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}