import { NextRequest, NextResponse } from 'next/server';
import { jobStorage } from '../../../../lib/job-storage';
import { extractUrlFromJobId } from '../../../../lib/job-utils';

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
      console.log('⚠️ Job not found in memory, extracting URL from job ID...');
      
      // Extract the original URL from the job ID
      const extractedUrl = extractUrlFromJobId(jobId);
      const mockUrl = extractedUrl || 'https://example.com'; // Use extracted URL or fallback
      
      console.log(`🔍 Using URL for mock data: ${mockUrl} (extracted: ${!!extractedUrl})`);
      
      const { createMockAnalysisInput } = await import('../../../../lib/analysis');
      const { AnalysisEngine } = await import('../../../../lib/analysis/engine');
      
      // Generate mock analysis result
      const engine = new AnalysisEngine();
      const mockInput = createMockAnalysisInput(mockUrl);
      const mockResult = await engine.analyzeWebsite(mockInput);
      
      // モックデータ使用時は詳細指示を非表示にし、エラーメッセージを追加
      mockResult.detailedInstructions = [];
      mockResult.error = {
        type: 'scraping_failed',
        message: '実際のページデータを取得できませんでした。一般的な分析結果を表示しています。',
        suggestion: 'サイトがアクセス可能であることを確認し、再度お試しください。'
      };
      mockResult.note = 'スクレイピングエラーのためモックデータを使用して分析を実行しました';

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
      
      // Extract URL from job ID for fallback
      const extractedUrl = extractUrlFromJobId(jobId);
      const mockUrl = extractedUrl || 'https://example.com';
      
      console.log(`🔍 KV error fallback using URL: ${mockUrl} (extracted: ${!!extractedUrl})`);
      
      // Import the mock analysis data for development fallback
      const { createMockAnalysisInput } = await import('../../../../lib/analysis');
      const { AnalysisEngine } = await import('../../../../lib/analysis/engine');
      
      // Generate mock analysis result
      const engine = new AnalysisEngine();
      const mockInput = createMockAnalysisInput(mockUrl);
      const mockResult = await engine.analyzeWebsite(mockInput);
      
      // モックデータ使用時は詳細指示を非表示にし、エラーメッセージを追加
      mockResult.detailedInstructions = [];
      mockResult.error = {
        type: 'scraping_failed',
        message: '実際のページデータを取得できませんでした。一般的な分析結果を表示しています。',
        suggestion: 'サイトがアクセス可能であることを確認し、再度お試しください。'
      };
      mockResult.note = 'スクレイピングエラーのためモックデータを使用して分析を実行しました';

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