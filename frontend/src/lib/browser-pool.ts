import puppeteer, { Browser, Page, BrowserConnectOptions, BrowserLaunchArgumentOptions, LaunchOptions } from 'puppeteer';

interface BrowserPoolOptions {
  maxPages?: number;
  maxIdleTime?: number;
  launchOptions?: LaunchOptions;
}

interface PageWithMetadata {
  page: Page;
  inUse: boolean;
  lastUsed: number;
  id: string;
}

/**
 * Puppeteerブラウザプール管理クラス
 * シングルトンパターンでブラウザインスタンスを管理し、
 * ページのプーリングによってメモリ効率を最適化
 */
class BrowserPool {
  private static instance: BrowserPool;
  private browser: Browser | null = null;
  private readonly maxPages: number;
  private readonly maxIdleTime: number;
  private readonly launchOptions: LaunchOptions;
  private pages: Map<string, PageWithMetadata> = new Map();
  private initPromise: Promise<void> | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor(options: BrowserPoolOptions = {}) {
    this.maxPages = options.maxPages || 5;
    this.maxIdleTime = options.maxIdleTime || 60000; // 60秒
    this.launchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        // メモリ最適化のための追加オプション
        '--memory-pressure-off',
        '--max_old_space_size=2048',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      ...options.launchOptions
    };
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(options?: BrowserPoolOptions): BrowserPool {
    if (!BrowserPool.instance) {
      BrowserPool.instance = new BrowserPool(options);
    }
    return BrowserPool.instance;
  }

  /**
   * ブラウザの初期化（一度だけ実行される）
   */
  private async initialize(): Promise<void> {
    // 既に初期化中の場合は待機
    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    // 既に初期化済みの場合はスキップ
    if (this.browser && this.browser.isConnected()) {
      return;
    }

    this.initPromise = this.doInitialize();
    await this.initPromise;
    this.initPromise = null;
  }

  /**
   * 実際の初期化処理
   */
  private async doInitialize(): Promise<void> {
    try {
      console.log('🚀 ブラウザプール初期化中...');
      
      this.browser = await puppeteer.launch(this.launchOptions);
      
      // ブラウザ切断イベントのハンドリング
      this.browser.on('disconnected', () => {
        console.log('⚠️ ブラウザが切断されました。クリーンアップ中...');
        this.handleBrowserDisconnect();
      });

      // ヘルスチェックの開始（30秒ごと）
      this.startHealthCheck();
      
      // 未使用ページのクリーンアップ（10秒ごと）
      this.startCleanupTimer();

      console.log('✅ ブラウザプール初期化完了');
    } catch (error) {
      console.error('❌ ブラウザプール初期化エラー:', error);
      this.browser = null;
      throw error;
    }
  }

  /**
   * ページを取得（プールから取得または新規作成）
   */
  public async acquirePage(): Promise<Page> {
    await this.initialize();

    if (!this.browser || !this.browser.isConnected()) {
      throw new Error('ブラウザが利用できません');
    }

    // 利用可能なページを探す
    for (const [id, pageData] of this.pages.entries()) {
      if (!pageData.inUse && pageData.page && !pageData.page.isClosed()) {
        pageData.inUse = true;
        pageData.lastUsed = Date.now();
        console.log(`♻️ ページを再利用: ${id}`);
        
        // ページをクリーンな状態にリセット
        try {
          await this.resetPage(pageData.page);
        } catch (error) {
          console.error(`ページリセットエラー (${id}):`, error);
          // リセットに失敗した場合は新しいページを作成
          try {
            await pageData.page.close();
          } catch {}
          this.pages.delete(id);
          // 再帰的に新しいページを取得
          return this.acquirePage();
        }
        return pageData.page;
      }
    }

    // 最大ページ数に達している場合は待機
    if (this.pages.size >= this.maxPages) {
      console.log('⏳ 利用可能なページを待機中...');
      await this.waitForAvailablePage();
      return this.acquirePage();
    }

    // 新しいページを作成
    const page = await this.browser.newPage();
    const pageId = `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pageData: PageWithMetadata = {
      page,
      inUse: true,
      lastUsed: Date.now(),
      id: pageId
    };
    
    this.pages.set(pageId, pageData);
    console.log(`📄 新しいページを作成: ${pageId}`);
    
    return page;
  }

  /**
   * ページを解放（プールに返却）
   */
  public async releasePage(page: Page): Promise<void> {
    // 該当するページを探す
    let found = false;
    for (const [id, pageData] of this.pages.entries()) {
      if (pageData.page === page) {
        found = true;
        if (page.isClosed()) {
          // ページが既に閉じられている場合は削除
          this.pages.delete(id);
          console.log(`🗑️ 閉じられたページを削除: ${id}`);
        } else {
          // ページをプールに返却
          pageData.inUse = false;
          pageData.lastUsed = Date.now();
          console.log(`✅ ページを解放: ${id}`);
          
          // ページをクリーンな状態にリセット
          try {
            await this.resetPage(page);
            // リセット成功した場合はプールに保持
          } catch (error) {
            console.error(`ページリセットエラー (${id}):`, error);
            // リセットに失敗した場合はページを閉じる
            try {
              await page.close();
            } catch {}
            this.pages.delete(id);
          }
        }
        return;
      }
    }
    
    // ページが見つからない場合は閉じる
    console.log('⚠️ 管理外のページを閉じます');
    try {
      await page.close();
    } catch {}
  }

  /**
   * ページをクリーンな状態にリセット
   */
  private async resetPage(page: Page): Promise<void> {
    try {
      // about:blankに移動してメモリをクリア
      await page.goto('about:blank', { waitUntil: 'domcontentloaded', timeout: 5000 });
      
      // クッキーをクリア
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      await client.send('Network.clearBrowserCache');
      
      // ローカルストレージとセッションストレージをクリア
      // about:blankではlocalStorageにアクセスできないため、try-catchで囲む
      try {
        await page.evaluate(() => {
          if (typeof localStorage !== 'undefined') {
            localStorage.clear();
          }
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.clear();
          }
        });
      } catch (storageError) {
        // about:blankページではストレージアクセスエラーが発生するが、問題ない
        // console.debug('ストレージクリアスキップ (about:blank)');
      }
      
      // デフォルトのビューポートに戻す
      await page.setViewport({ width: 1200, height: 800 });
      
      // デフォルトのユーザーエージェントに戻す
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    } catch (error) {
      console.error('ページリセットエラー:', error);
      throw error;
    }
  }

  /**
   * 利用可能なページが出るまで待機
   */
  private async waitForAvailablePage(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const pageData of this.pages.values()) {
        if (!pageData.inUse) {
          return;
        }
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('利用可能なページのタイムアウト');
  }

  /**
   * ヘルスチェックを開始
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (!this.browser || !this.browser.isConnected()) {
        console.log('🔄 ブラウザ再起動中...');
        await this.restart();
      }
    }, 30000); // 30秒ごと
  }

  /**
   * 未使用ページのクリーンアップタイマーを開始
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(async () => {
      const now = Date.now();
      
      for (const [id, pageData] of this.pages.entries()) {
        if (!pageData.inUse && (now - pageData.lastUsed) > this.maxIdleTime) {
          try {
            await pageData.page.close();
            this.pages.delete(id);
            console.log(`🧹 アイドルページをクリーンアップ: ${id}`);
          } catch (error) {
            console.error(`ページクリーンアップエラー (${id}):`, error);
          }
        }
      }
    }, 10000); // 10秒ごと
  }

  /**
   * ブラウザ切断時の処理
   */
  private handleBrowserDisconnect(): void {
    this.browser = null;
    this.pages.clear();
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * ブラウザプールを再起動
   */
  public async restart(): Promise<void> {
    console.log('🔄 ブラウザプールを再起動中...');
    await this.shutdown();
    await this.initialize();
  }

  /**
   * ブラウザプールをシャットダウン
   */
  public async shutdown(): Promise<void> {
    console.log('👋 ブラウザプールをシャットダウン中...');
    
    // タイマーを停止
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // すべてのページを閉じる
    for (const [id, pageData] of this.pages.entries()) {
      try {
        if (!pageData.page.isClosed()) {
          await pageData.page.close();
        }
      } catch (error) {
        console.error(`ページクローズエラー (${id}):`, error);
      }
    }
    this.pages.clear();
    
    // ブラウザを閉じる
    if (this.browser) {
      try {
        await this.browser.close();
      } catch (error) {
        console.error('ブラウザクローズエラー:', error);
      }
      this.browser = null;
    }
    
    console.log('✅ ブラウザプールのシャットダウン完了');
  }

  /**
   * プールの統計情報を取得
   */
  public getStats(): {
    isInitialized: boolean;
    totalPages: number;
    activePages: number;
    idlePages: number;
    browserConnected: boolean;
  } {
    const activePages = Array.from(this.pages.values()).filter(p => p.inUse).length;
    const idlePages = this.pages.size - activePages;
    
    return {
      isInitialized: !!this.browser,
      totalPages: this.pages.size,
      activePages,
      idlePages,
      browserConnected: !!this.browser && this.browser.isConnected()
    };
  }
}

// シングルトンインスタンスをエクスポート
export const browserPool = BrowserPool.getInstance();

// グレースフルシャットダウンの設定
if (typeof process !== 'undefined') {
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n${signal} received. グレースフルシャットダウンを開始...`);
    await browserPool.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}