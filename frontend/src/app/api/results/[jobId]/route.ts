import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ jobId: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { jobId } = await context.params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Check if KV storage is available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json(
        { 
          error: 'Job storage not configured',
          message: 'Vercel KV storage is required for result retrieval'
        },
        { status: 503 }
      );
    }

    // Fetch job results from Vercel KV
    try {
      const response = await fetch(`${process.env.KV_REST_API_URL}/get/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json(
            { error: 'Analysis results not found', jobId },
            { status: 404 }
          );
        }
        throw new Error(`KV API error: ${response.status}`);
      }

      const jobData = await response.json();

      if (!jobData) {
        return NextResponse.json(
          { error: 'Analysis results not found', jobId },
          { status: 404 }
        );
      }

      // Check if analysis is completed
      if (jobData.status !== 'completed') {
        return NextResponse.json(
          { 
            error: 'Analysis not yet completed', 
            jobId, 
            status: jobData.status,
            message: 'Analysis is still in progress'
          },
          { status: 202 } // Accepted but not yet completed
        );
      }

      // Return the analysis results
      const result = {
        jobId,
        status: jobData.status,
        completedAt: jobData.updatedAt,
        analysisResult: jobData.data
      };

      return NextResponse.json(result);

    } catch (kvError) {
      console.error('KV fetch error:', kvError);
      
      // Import the mock analysis data for development fallback
      const { createMockAnalysisInput } = await import('../../../../lib/analysis');
      const { AnalysisEngine } = await import('../../../../lib/analysis/engine');
      
      // Generate mock analysis result
      const engine = new AnalysisEngine();
      const mockInput = createMockAnalysisInput('https://example.com');
      const mockResult = await engine.analyzeWebsite(mockInput);

      return NextResponse.json({
        jobId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        analysisResult: mockResult,
        mock: true,
        message: 'Using mock analysis data due to storage unavailability'
      });
    }

  } catch (error) {
    console.error('Analysis results API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}