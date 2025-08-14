import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`📊 Checking status for job: ${jobId}`);

    // Get job status from Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const response = await fetch(`${process.env.KV_REST_API_URL}/get/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          }
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.result) {
            const jobData = JSON.parse(result.result);
            
            return NextResponse.json({
              jobId,
              status: jobData.status,
              data: jobData.data || null,
              updatedAt: jobData.updatedAt,
              ...(jobData.status === 'processing' && {
                step: jobData.data?.step,
                progress: jobData.data?.progress
              })
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch job status from KV:', error);
      }
    }

    // Fallback: return mock status when KV is not available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.log('⚠️ Using mock status (KV storage not configured)');
      
      // Simulate different states based on time elapsed
      // Extract timestamp from jobId (assuming format: job_<timestamp>_<random>)
      let elapsedSeconds = 15; // default to processing state
      
      try {
        const jobIdParts = jobId.split('_');
        if (jobIdParts.length >= 2 && jobIdParts[1]) {
          const jobTimestamp = parseInt(jobIdParts[1]);
          if (!isNaN(jobTimestamp)) {
            elapsedSeconds = Math.floor((Date.now() - jobTimestamp) / 1000);
          }
        }
      } catch (e) {
        console.log('Could not parse job timestamp, using default');
      }

      // Progress simulation based on elapsed time
      let mockStatus;
      
      if (elapsedSeconds < 5) {
        // 0-5 seconds: Pending
        mockStatus = { 
          status: 'pending', 
          data: null 
        };
      } else if (elapsedSeconds < 30) {
        // 5-30 seconds: Processing with increasing progress
        const progress = Math.min(90, Math.floor((elapsedSeconds - 5) / 25 * 90));
        const steps = [
          'ページデータを取得中...',
          'HTML構造を分析中...',
          'パフォーマンス指標を測定中...',
          'ユーザビリティを評価中...',
          'AI による詳細分析を実行中...',
          'レポートを生成中...'
        ];
        const stepIndex = Math.min(steps.length - 1, Math.floor((elapsedSeconds - 5) / 5));
        
        mockStatus = { 
          status: 'processing', 
          data: { 
            step: steps[stepIndex], 
            progress: progress 
          } 
        };
      } else {
        // 30+ seconds: Completed
        // Import the analysis engine for consistent results
        const { createMockAnalysisInput } = await import('../../../../lib/analysis');
        const { AnalysisEngine } = await import('../../../../lib/analysis/engine');
        
        const engine = new AnalysisEngine();
        const mockInput = createMockAnalysisInput('https://example.com');
        const analysisResult = await engine.analyzeWebsite(mockInput);
        
        mockStatus = {
          status: 'completed',
          data: analysisResult
        };
      }

      return NextResponse.json({
        jobId,
        ...mockStatus,
        updatedAt: new Date().toISOString()
      });
    }

    // Job not found
    return NextResponse.json(
      { 
        error: 'Job not found',
        message: 'The specified job ID was not found or has expired'
      },
      { status: 404 }
    );

  } catch (error) {
    console.error('Status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel/delete a job
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId parameter is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting job: ${jobId}`);

    // Delete job from Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await fetch(`${process.env.KV_REST_API_URL}/del/${jobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          }
        });
      } catch (error) {
        console.error('Failed to delete job from KV:', error);
      }
    }

    return NextResponse.json({
      message: 'Job deleted successfully',
      jobId
    });

  } catch (error) {
    console.error('Delete job API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}