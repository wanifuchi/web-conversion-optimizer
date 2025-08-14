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

    // Generate unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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
      throw new Error(`Scraper service error: ${scrapeResponse.status}`);
    }

    const scrapeData = await scrapeResponse.json();

    await updateJobStatus(jobId, 'processing', { 
      step: 'Running AI analysis...',
      progress: 60
    });

    // Run AI analysis
    const analysisData = await runAIAnalysis(scrapeData);

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

    console.log(`✅ Analysis completed for job ${jobId}`);

  } catch (error) {
    console.error(`❌ Analysis failed for job ${jobId}:`, error);
    await updateJobStatus(jobId, 'error', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function runAIAnalysis(data: any) {
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
      hasSSL: scrapeData?.pageData?.hasSSL || false
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
    checkpoints: analysisResult.checkpoints
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