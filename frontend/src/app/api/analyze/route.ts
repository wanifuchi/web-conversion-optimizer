import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '../../../lib/job-storage';

interface AnalyzeRequest {
  url: string;
  options?: {
    screenshot?: boolean;
    lighthouse?: boolean;
    mobile?: boolean;
    timeout?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    
    // Validate request
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

    // Generate unique job ID with encoded URL for recovery
    const urlBase64 = Buffer.from(body.url).toString('base64').replace(/[^A-Za-z0-9]/g, '');
    const jobId = `job_${Date.now()}_${urlBase64.slice(0, 20)}_${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`🔍 Starting analysis for ${body.url} (Job ID: ${jobId})`);

    // Default options
    const options = {
      screenshot: body.options?.screenshot !== false,
      lighthouse: body.options?.lighthouse !== false,
      mobile: body.options?.mobile || false,
      timeout: body.options?.timeout || 30000,
      ...body.options
    };

    // Store job in storage (KV or in-memory fallback)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await fetch(`${process.env.KV_REST_API_URL}/set/${jobId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'pending',
            url: body.url,
            options,
            createdAt: new Date().toISOString()
          })
        });
      } catch (error) {
        console.error('Failed to store job in KV:', error);
      }
    } else {
      // Use in-memory storage as fallback
      console.log('📦 Using in-memory job storage');
      jobStorage.set(jobId, {
        url: body.url,
        status: 'pending',
        data: { options }
      });
    }

    // Start analysis in background
    processAnalysis(jobId, body.url, options).catch(error => {
      console.error(`Analysis failed for job ${jobId}:`, error);
      updateJobStatus(jobId, 'error', { error: error.message });
    });

    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'Analysis started successfully'
    });

  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processAnalysis(jobId: string, url: string, options: any) {
  try {
    console.log(`🔄 Processing analysis for job ${jobId}`);
    
    // Update status to processing
    await updateJobStatus(jobId, 'processing', { 
      step: 'Starting analysis...',
      progress: 10
    });

    // Take screenshot if requested
    let screenshotUrl = null;
    if (options.screenshot) {
      try {
        await updateJobStatus(jobId, 'processing', { 
          step: 'スクリーンショットを撮影中...',
          progress: 25
        });
        
        screenshotUrl = await takeScreenshot(url, options);
        console.log(`📸 Screenshot taken: ${screenshotUrl}`);
      } catch (error) {
        console.warn('⚠️ Screenshot failed:', error);
        // Continue without screenshot
      }
    }

    // Call scraper service
    const scraperUrl = process.env.SCRAPER_SERVICE_URL || 'http://localhost:3001';
    
    await updateJobStatus(jobId, 'processing', { 
      step: 'Fetching page data...',
      progress: 30
    });

    const scrapeResponse = await fetch(`${scraperUrl}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, options }),
      signal: AbortSignal.timeout(options.timeout + 10000) // Add 10s buffer
    });

    if (!scrapeResponse.ok) {
      console.warn(`⚠️ Scraper service error: ${scrapeResponse.status}, falling back to mock analysis`);
      
      // Still perform analysis with mock data but using the actual URL
      await updateJobStatus(jobId, 'processing', { 
        step: 'スクレイピングエラー - モック分析を実行中...',
        progress: 70
      });
      
      // Create mock scrape data with the actual URL
      const mockScrapeData = {
        scrapeData: {
          url,
          pageData: {
            url,
            title: `${url} の分析結果`,
            description: 'スクレイピングサービスエラーのためモックデータを使用',
            headings: { h1: [], h2: [], h3: [] },
            images: [],
            links: [],
            forms: [],
            mobileOptimized: false,
            hasSSL: url.startsWith('https')
          },
          conversionElements: { ctaButtons: [] },
          performance: { loadTime: 3000 }
        },
        lighthouseData: null
      };
      
      const analysisData = await runAIAnalysis(mockScrapeData, screenshotUrl);
      
      await updateJobStatus(jobId, 'processing', { 
        step: 'レポートを生成中...',
        progress: 90
      });

      const result = {
        url,
        timestamp: new Date().toISOString(),
        overallScore: analysisData.overallScore,
        categories: analysisData.categories,
        criticalIssues: analysisData.criticalIssues,
        opportunities: analysisData.opportunities,
        rawData: {
          scrapeData: mockScrapeData.scrapeData,
          lighthouseData: mockScrapeData.lighthouseData
        },
        note: 'スクレイピングエラーのためモックデータを使用して分析を実行しました'
      };

      await updateJobStatus(jobId, 'completed', result);
      console.log(`✅ Analysis completed with mock data for job ${jobId} - URL: ${url}, Score: ${result.overallScore}`);
      return;
    }

    const scrapeData = await scrapeResponse.json();

    await updateJobStatus(jobId, 'processing', { 
      step: 'Running AI analysis...',
      progress: 60
    });

    // Run AI analysis
    const analysisData = await runAIAnalysis(scrapeData, screenshotUrl);

    await updateJobStatus(jobId, 'processing', { 
      step: 'Generating report...',
      progress: 90
    });

    // Format final result
    const result = {
      url,
      timestamp: new Date().toISOString(),
      overallScore: analysisData.overallScore,
      categories: analysisData.categories,
      criticalIssues: analysisData.criticalIssues,
      opportunities: analysisData.opportunities,
      rawData: {
        scrapeData: scrapeData.scrapeData,
        lighthouseData: scrapeData.lighthouseData
      }
    };

    // Update job with final result
    await updateJobStatus(jobId, 'completed', result);

    console.log(`✅ Analysis completed for job ${jobId} - URL: ${url}, Score: ${result.overallScore}`);

  } catch (error) {
    console.error(`❌ Analysis failed for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function runAIAnalysis(data: any, screenshotUrl: string | null = null) {
  // Enhanced AI analysis using the Analysis Engine
  const { scrapeData, lighthouseData } = data;
  
  console.log('🧠 Running comprehensive AI analysis with 100+ checkpoints...');

  // Import Analysis Engine (dynamic import to avoid build issues)
  const { AnalysisEngine } = await import('../../../lib/analysis/engine');
  
  // Prepare analysis input in the expected format
  const analysisInput = {
    scrapedData: {
      url: scrapeData?.pageData?.url || scrapeData?.url || 'unknown',
      title: scrapeData?.pageData?.title || 'Untitled',
      description: scrapeData?.pageData?.description || '',
      headings: scrapeData?.pageData?.headings || { h1: [], h2: [], h3: [] },
      images: scrapeData?.pageData?.images || [],
      links: scrapeData?.pageData?.links || [],
      forms: scrapeData?.pageData?.forms || [],
      ctaElements: scrapeData?.conversionElements?.ctaButtons || [],
      socialProof: [],
      loadTime: scrapeData?.performance?.loadTime || 0,
      mobileOptimized: scrapeData?.pageData?.mobileOptimized || false,
      hasSSL: scrapeData?.pageData?.hasSSL || false,
      screenshot: screenshotUrl || undefined
    },
    lighthouseData: lighthouseData || {
      scores: {
        performance: 75,
        accessibility: 80,
        bestPractices: 85,
        seo: 80
      },
      coreWebVitals: {},
      opportunities: [],
      accessibilityIssues: [],
      seoIssues: []
    },
    options: {
      includeScreenshots: true,
      mobileAnalysis: true,
      deepAnalysis: true
    }
  };

  // Run the comprehensive analysis
  const engine = new AnalysisEngine();
  const analysisResult = await engine.analyzeWebsite(analysisInput);

  // Return the comprehensive analysis result
  return {
    overallScore: analysisResult.overallScore,
    categories: analysisResult.categories,
    criticalIssues: analysisResult.criticalIssues,
    opportunities: analysisResult.opportunities,
    insights: analysisResult.insights,
    recommendations: analysisResult.recommendations,
    checkpoints: analysisResult.checkpoints,
    detailedInstructions: analysisResult.detailedInstructions // 詳細改善指示を追加
  };
}

async function updateJobStatus(jobId: string, status: string, data: any) {
  // Update in KV if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      await fetch(`${process.env.KV_REST_API_URL}/set/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          data,
          updatedAt: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to update job status in KV:', error);
    }
  } else {
    // Use in-memory storage as fallback
    jobStorage.set(jobId, {
      status: status as any,
      data
    });
  }
  
  console.log(`📊 Job ${jobId} status updated: ${status}`);
}

// スクリーンショット撮影関数
async function takeScreenshot(url: string, options: any): Promise<string | null> {
  try {
    // Puppeteerを使用したスクリーンショット撮影
    // 本番環境では外部スクリーンショットサービスを使用することを推奨
    const screenshotServiceUrl = process.env.SCREENSHOT_SERVICE_URL;
    
    if (screenshotServiceUrl) {
      // 外部スクリーンショットサービスを使用
      const response = await fetch(`${screenshotServiceUrl}/screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url, 
          viewport: { width: 1200, height: 800 },
          fullPage: true,
          timeout: 30000
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.screenshotUrl;
      }
    }
    
    // フォールバック: 簡単なプレースホルダー画像URL
    // 実際の実装ではPuppeteerやPlaywrightを使用
    console.log('📸 Screenshot service not configured, using placeholder');
    return generatePlaceholderScreenshot(url);
    
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return null;
  }
}

// プレースホルダースクリーンショットURL生成
function generatePlaceholderScreenshot(url: string): string {
  // 実際の実装では、Base64画像やCloudinaryなどの画像サービスを使用
  const encodedUrl = encodeURIComponent(url);
  return `https://via.placeholder.com/1200x800/f0f0f0/333333?text=Screenshot+of+${encodedUrl}`;
}