import { NextRequest, NextResponse } from 'next/server';
import { cacheManager } from '@/lib/cache/cache-manager';

/**
 * キャッシュ統計情報を取得するAPIエンドポイント
 */
export async function GET(request: NextRequest) {
  try {
    const stats = cacheManager.getStats();
    
    return NextResponse.json({
      success: true,
      stats: {
        ...stats,
        timestamp: new Date().toISOString(),
        // メモリ使用量をMB単位で表示
        memoryUsageMB: Math.round(stats.memoryUsage / 1024 / 1024 * 100) / 100
      }
    });
  } catch (error) {
    console.error('キャッシュ統計取得エラー:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get cache stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * キャッシュをクリアするAPIエンドポイント
 */
export async function DELETE(request: NextRequest) {
  try {
    // URLパラメータからパターンを取得
    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');
    const url = searchParams.get('url');
    
    if (url) {
      // 特定のURLに関連するキャッシュを無効化
      cacheManager.invalidateUrl(url);
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for URL: ${url}`
      });
    } else if (pattern) {
      // パターンに一致するキャッシュを無効化
      cacheManager.invalidatePattern(pattern);
      return NextResponse.json({
        success: true,
        message: `Cache invalidated for pattern: ${pattern}`
      });
    } else {
      // すべてのキャッシュをクリア
      cacheManager.clear();
      return NextResponse.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    console.error('キャッシュクリアエラー:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to clear cache',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}