import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '../../../../lib/job-storage';

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

    // Check if KV storage is available - if not, use in-memory storage
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('📦 Using in-memory job storage for results');
      
      const jobData = jobStorage.get(jobId);
      
      if (jobData) {
        if (jobData.status === 'completed') {
          console.log(`✅ Found completed job ${jobId} in memory`);
          return NextResponse.json({
            jobId,
            status: 'completed',
            completedAt: jobData.updatedAt,
            analysisResult: jobData.data
          });
        } else {
          console.log(`⏳ Job ${jobId} not yet completed (status: ${jobData.status})`);
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
      }
      
      // If job not found in memory, generate appropriate mock data based on URL
      console.log('⚠️ Job not found in memory, generating mock data');
      
      // Try to determine the original URL from the job (this is a fallback)
      // In a real implementation, this should be stored when the job is created
      const mockUrl = 'https://example.com'; // Default fallback
      
      const { createMockAnalysisInput } = await import('../../../../lib/analysis');
      const { AnalysisEngine } = await import('../../../../lib/analysis/engine');
      
      // Generate mock analysis result
      const engine = new AnalysisEngine();
      const mockInput = createMockAnalysisInput(mockUrl);
      const mockResult = await engine.analyzeWebsite(mockInput);

      return NextResponse.json({
        jobId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        analysisResult: mockResult,
        mock: true,
        message: 'Using mock analysis data (job not found in storage)'
      });
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