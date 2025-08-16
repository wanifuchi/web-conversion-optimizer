/**
 * キャッシュマネージャー
 * Next.js 14のRoute Cacheと、カスタムメモリキャッシュのハイブリッド実装
 */

import crypto from 'crypto';

/**
 * メモリキャッシュの型定義
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hash?: string;
}

/**
 * キャッシュオプション
 */
interface CacheOptions {
  ttl?: number; // Time To Live (秒)
  forceRefresh?: boolean; // キャッシュを無視して強制更新
}

/**
 * インメモリキャッシュストア
 * 開発環境やエッジ環境での高速キャッシュを提供
 */
class MemoryCacheStore {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 100; // 最大キャッシュエントリ数
  private readonly checkInterval = 60000; // 1分ごとにクリーンアップ

  constructor() {
    // 定期的なクリーンアップ
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), this.checkInterval);
    }
  }

  /**
   * キャッシュから値を取得
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // TTLチェック
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * キャッシュに値を設定
   */
  set<T>(key: string, data: T, ttl: number = 3600): void {
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxSize) {
      // 最も古いエントリを削除
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hash: this.generateHash(data)
    };

    this.cache.set(key, entry);
  }

  /**
   * キャッシュから値を削除
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * パターンに一致するキーを削除
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 期限切れエントリのクリーンアップ
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 最も古いキーを見つける
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * データのハッシュを生成
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data);
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * キャッシュ統計を取得
   */
  getStats(): {
    size: number;
    maxSize: number;
    keys: string[];
    memoryUsage: number;
  } {
    const keys = Array.from(this.cache.keys());
    const memoryUsage = process.memoryUsage().heapUsed;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys,
      memoryUsage
    };
  }
}

/**
 * キャッシュマネージャークラス
 */
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: MemoryCacheStore;

  // デフォルトTTL設定（秒）
  public static readonly TTL = {
    SCRAPE: 3600,       // 1時間
    ANALYSIS: 86400,    // 24時間
    LIGHTHOUSE: 7200,   // 2時間
    SCREENSHOT: 1800,   // 30分
    DEFAULT: 3600       // 1時間
  } as const;

  private constructor() {
    this.memoryCache = new MemoryCacheStore();
  }

  /**
   * シングルトンインスタンスを取得
   */
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * キャッシュキーを生成
   */
  public generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    const paramStr = JSON.stringify(sortedParams);
    const hash = crypto.createHash('md5').update(paramStr).digest('hex');
    
    return `${prefix}:${hash}`;
  }

  /**
   * URLベースのキャッシュキーを生成
   */
  public generateUrlKey(prefix: string, url: string, options?: Record<string, any>): string {
    const params = {
      url,
      ...options
    };
    return this.generateKey(prefix, params);
  }

  /**
   * キャッシュから取得または計算
   */
  public async getOrCompute<T>(
    key: string,
    computeFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttl = CacheManager.TTL.DEFAULT, forceRefresh = false } = options;

    // 強制更新の場合はキャッシュをスキップ
    if (!forceRefresh) {
      const cached = this.memoryCache.get<T>(key);
      if (cached !== null) {
        console.log(`✅ キャッシュヒット: ${key}`);
        return cached;
      }
    }

    console.log(`🔄 キャッシュミス/更新: ${key}`);
    
    // 計算を実行
    const result = await computeFn();
    
    // 結果をキャッシュに保存
    this.memoryCache.set(key, result, ttl);
    
    return result;
  }

  /**
   * キャッシュから値を取得
   */
  public get<T>(key: string): T | null {
    return this.memoryCache.get<T>(key);
  }

  /**
   * キャッシュに値を設定
   */
  public set<T>(key: string, value: T, ttl: number = CacheManager.TTL.DEFAULT): void {
    this.memoryCache.set(key, value, ttl);
  }

  /**
   * キャッシュから値を削除
   */
  public invalidate(key: string): void {
    this.memoryCache.delete(key);
    console.log(`🗑️ キャッシュ無効化: ${key}`);
  }

  /**
   * パターンに一致するキャッシュを無効化
   */
  public invalidatePattern(pattern: string): void {
    this.memoryCache.invalidatePattern(pattern);
    console.log(`🗑️ パターンキャッシュ無効化: ${pattern}`);
  }

  /**
   * URLに関連するすべてのキャッシュを無効化
   */
  public invalidateUrl(url: string): void {
    const urlHash = crypto.createHash('md5').update(url).digest('hex');
    this.invalidatePattern(`.*:${urlHash}.*`);
    console.log(`🗑️ URL関連キャッシュ無効化: ${url}`);
  }

  /**
   * すべてのキャッシュをクリア
   */
  public clear(): void {
    this.memoryCache.clear();
    console.log('🗑️ すべてのキャッシュをクリア');
  }

  /**
   * キャッシュ統計を取得
   */
  public getStats() {
    return this.memoryCache.getStats();
  }
}

// シングルトンインスタンスをエクスポート
export const cacheManager = CacheManager.getInstance();

// TTL定数をエクスポート
export const CACHE_TTL = CacheManager.TTL;