import { NextRequest, NextResponse } from 'next/server';
import { browserPool } from '@/lib/browser-pool';

/**
 * ブラウザプールの統計情報を取得するAPIエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const stats = browserPool.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    console.error('ブラウザプール統計取得エラー:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get browser pool stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}