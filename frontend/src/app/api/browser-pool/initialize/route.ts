import { NextRequest, NextResponse } from 'next/server';
import { browserPool } from '@/lib/browser-pool';

/**
 * ブラウザプールを手動で初期化するAPIエンドポイント
 * アプリケーション起動時に呼び出すことで、最初のリクエストの遅延を防ぐ
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ブラウザプールの手動初期化を開始...');
    
    // 既に初期化されているか確認
    const statsBefore = browserPool.getStats();
    if (statsBefore.isInitialized && statsBefore.browserConnected) {
      return NextResponse.json({
        success: true,
        message: 'Browser pool is already initialized',
        stats: statsBefore
      });
    }
    
    // ページを取得して初期化をトリガー
    const page = await browserPool.acquirePage();
    
    // すぐに解放
    await browserPool.releasePage(page);
    
    // 初期化後の統計を取得
    const statsAfter = browserPool.getStats();
    
    console.log('✅ ブラウザプールの初期化完了');
    
    return NextResponse.json({
      success: true,
      message: 'Browser pool initialized successfully',
      stats: statsAfter
    });
  } catch (error) {
    console.error('ブラウザプール初期化エラー:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize browser pool',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}