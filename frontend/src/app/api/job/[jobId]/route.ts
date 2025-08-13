import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

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
          message: 'Vercel KV storage is required for job tracking'
        },
        { status: 503 }
      );
    }

    // Fetch job status from Vercel KV
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
            { error: 'Job not found', jobId },
            { status: 404 }
          );
        }
        throw new Error(`KV API error: ${response.status}`);
      }

      const jobData = await response.json();

      if (!jobData) {
        return NextResponse.json(
          { error: 'Job not found', jobId },
          { status: 404 }
        );
      }

      // Return job status and data
      return NextResponse.json({
        jobId,
        ...jobData
      });

    } catch (kvError) {
      console.error('KV fetch error:', kvError);
      
      // Fallback: Return a mock response for development
      return NextResponse.json({
        jobId,
        status: 'processing',
        step: 'Analyzing website (mock data)',
        progress: 75,
        message: 'Job status tracking unavailable - using mock data',
        mock: true
      });
    }

  } catch (error) {
    console.error('Job status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}