import { NextRequest, NextResponse } from 'next/server';

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

    // Store job in temporary storage (Vercel KV)
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
  // This is a simplified analysis - will be enhanced with actual AI integration
  const { scrapeData, lighthouseData } = data;
  
  console.log('🧠 Running AI analysis...');

  // Calculate scores based on available data
  const performanceScore = lighthouseData?.scores?.performance || 50;
  const accessibilityScore = lighthouseData?.scores?.accessibility || 50;
  const seoScore = lighthouseData?.scores?.seo || 50;
  
  // Simple usability scoring based on page structure
  let usabilityScore = 70;
  if (scrapeData?.pageData?.forms?.length === 0) usabilityScore -= 10;
  if (scrapeData?.conversionElements?.ctaButtons?.length === 0) usabilityScore -= 20;
  if (scrapeData?.pageData?.textContent?.length < 500) usabilityScore -= 10;

  // Simple conversion scoring
  let conversionScore = 60;
  if (scrapeData?.conversionElements?.phoneNumbers?.length > 0) conversionScore += 10;
  if (scrapeData?.conversionElements?.emailAddresses?.length > 0) conversionScore += 5;
  if (scrapeData?.conversionElements?.ctaButtons?.length > 0) conversionScore += 15;
  if (scrapeData?.conversionElements?.forms?.length > 0) conversionScore += 10;

  const overallScore = Math.round(
    (performanceScore + usabilityScore + conversionScore + accessibilityScore + seoScore) / 5
  );

  // Generate issues and opportunities (simplified)
  const criticalIssues = [];
  const opportunities = [];

  if (performanceScore < 50) {
    criticalIssues.push({
      title: 'Page Performance Issues',
      description: 'ページの読み込み速度が遅く、ユーザー体験に悪影響を与えています。',
      impact: 'high' as const,
      category: 'Performance',
      recommendation: 'Core Web Vitalsの改善とリソース最適化を実施してください。'
    });
  }

  if (scrapeData?.conversionElements?.ctaButtons?.length === 0) {
    criticalIssues.push({
      title: 'CTAボタンが見つかりません',
      description: '明確なCall to Actionボタンが検出されませんでした。',
      impact: 'high' as const,
      category: 'Conversion',
      recommendation: '目立つ位置に明確なCTAボタンを配置してください。'
    });
  }

  if (accessibilityScore < 80) {
    opportunities.push({
      title: 'アクセシビリティの改善',
      description: 'より多くのユーザーがサイトを利用できるようアクセシビリティを向上させましょう。',
      expectedImprovement: '10-15%のコンバージョン率向上',
      effort: 'medium' as const
    });
  }

  if (scrapeData?.conversionElements?.phoneNumbers?.length === 0) {
    opportunities.push({
      title: '電話番号の追加',
      description: '電話でのお問い合わせを促進するため、目立つ場所に電話番号を配置しましょう。',
      expectedImprovement: '5-10%のコンバージョン率向上',
      effort: 'low' as const
    });
  }

  return {
    overallScore,
    categories: {
      performance: performanceScore,
      usability: usabilityScore,
      conversion: conversionScore,
      accessibility: accessibilityScore,
      seo: seoScore
    },
    criticalIssues,
    opportunities
  };
}

async function updateJobStatus(jobId: string, status: string, data: any) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    console.log(`Job ${jobId} status: ${status}`);
    return;
  }

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
    console.error('Failed to update job status:', error);
  }
}