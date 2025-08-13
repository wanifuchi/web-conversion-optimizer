// Cache Store - Manages temporary data and caching in IndexedDB

import { 
  dbManager, 
  STORES, 
  CacheRecord, 
  generateId,
  createExpirationDate,
  isExpired 
} from './database';

class CacheStore {
  // Set cache item
  async setCache(key: string, data: any, expirationHours: number = 24): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);

    const cacheItem: CacheRecord = {
      id: `cache_${key}`,
      key,
      data,
      expiresAt: createExpirationDate(expirationHours),
      createdAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheItem);
      
      request.onsuccess = () => {
        console.log(`✅ Cache set: ${key} (expires in ${expirationHours}h)`);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get cache item
  async getCache(key: string): Promise<any | null> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readonly');
    const store = transaction.objectStore(STORES.CACHE);

    return new Promise((resolve, reject) => {
      const request = store.index('key').get(key);
      
      request.onsuccess = () => {
        const result = request.result as CacheRecord | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (isExpired(result.expiresAt)) {
          console.log(`⏰ Cache expired: ${key}`);
          this.deleteCache(key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete cache item
  async deleteCache(key: string): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);

    return new Promise((resolve, reject) => {
      const getRequest = store.index('key').get(key);
      
      getRequest.onsuccess = () => {
        const result = getRequest.result as CacheRecord | undefined;
        
        if (!result) {
          resolve();
          return;
        }

        const deleteRequest = store.delete(result.id);
        
        deleteRequest.onsuccess = () => {
          console.log(`🗑️ Cache deleted: ${key}`);
          resolve();
        };
        
        deleteRequest.onerror = () => {
          reject(deleteRequest.error);
        };
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  // Check if cache exists and is valid
  async hasValidCache(key: string): Promise<boolean> {
    const data = await this.getCache(key);
    return data !== null;
  }

  // Clear expired cache items
  async clearExpiredCache(): Promise<number> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);

    return new Promise((resolve, reject) => {
      const index = store.index('expiresAt');
      const now = new Date().toISOString();
      const request = index.openCursor(IDBKeyRange.upperBound(now));
      
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (!cursor) {
          console.log(`🧹 Cleared ${deletedCount} expired cache items`);
          resolve(deletedCount);
          return;
        }

        const deleteRequest = cursor.delete();
        
        deleteRequest.onsuccess = () => {
          deletedCount++;
          cursor.continue();
        };
        
        deleteRequest.onerror = () => {
          console.error('Failed to delete expired cache item:', deleteRequest.error);
          cursor.continue();
        };
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Clear all cache
  async clearAllCache(): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('🧹 All cache cleared');
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    totalItems: number;
    totalSize: number;
    expiredItems: number;
    oldestItem: string | null;
    newestItem: string | null;
  }> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readonly');
    const store = transaction.objectStore(STORES.CACHE);

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      
      const stats = {
        totalItems: 0,
        totalSize: 0,
        expiredItems: 0,
        oldestItem: null as string | null,
        newestItem: null as string | null
      };

      let oldestDate = new Date();
      let newestDate = new Date(0);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (!cursor) {
          resolve(stats);
          return;
        }

        const record = cursor.value as CacheRecord;
        stats.totalItems++;
        
        // Calculate approximate size
        const dataSize = JSON.stringify(record.data).length;
        stats.totalSize += dataSize;

        // Check if expired
        if (isExpired(record.expiresAt)) {
          stats.expiredItems++;
        }

        // Track oldest and newest
        const createdDate = new Date(record.createdAt);
        if (createdDate < oldestDate) {
          oldestDate = createdDate;
          stats.oldestItem = record.key;
        }
        if (createdDate > newestDate) {
          newestDate = createdDate;
          stats.newestItem = record.key;
        }

        cursor.continue();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Cache with refresh callback
  async getCacheOrRefresh<T>(
    key: string, 
    refreshFn: () => Promise<T>, 
    expirationHours: number = 24
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.getCache(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - refresh data
    console.log(`🔄 Cache miss for ${key}, refreshing...`);
    const data = await refreshFn();
    
    // Store in cache
    await this.setCache(key, data, expirationHours);
    
    return data;
  }

  // Batch cache operations
  async setCacheBatch(items: Array<{ key: string; data: any; expirationHours?: number }>): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.CACHE], 'readwrite');
    const store = transaction.objectStore(STORES.CACHE);

    const promises = items.map(item => 
      new Promise<void>((resolve, reject) => {
        const cacheItem: CacheRecord = {
          id: `cache_${item.key}`,
          key: item.key,
          data: item.data,
          expiresAt: createExpirationDate(item.expirationHours || 24),
          createdAt: new Date().toISOString()
        };

        const request = store.put(cacheItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
    console.log(`✅ Batch cache set: ${items.length} items`);
  }

  // Automatic cleanup - should be called periodically
  async performMaintenance(): Promise<{
    expiredCleared: number;
    totalItems: number;
    totalSize: number;
  }> {
    const expiredCleared = await this.clearExpiredCache();
    const stats = await this.getCacheStats();
    
    return {
      expiredCleared,
      totalItems: stats.totalItems,
      totalSize: stats.totalSize
    };
  }
}

export const cacheStore = new CacheStore();

// Auto-cleanup expired cache items on initialization
if (typeof window !== 'undefined') {
  // Run cleanup after 5 seconds to avoid blocking initial load
  setTimeout(() => {
    cacheStore.clearExpiredCache().catch(console.error);
  }, 5000);

  // Run cleanup every hour
  setInterval(() => {
    cacheStore.clearExpiredCache().catch(console.error);
  }, 60 * 60 * 1000);
}