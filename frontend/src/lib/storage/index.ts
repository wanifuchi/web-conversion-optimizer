// Storage API - Main entry point for all storage operations

export * from './database';
export * from './analysisStore';
export * from './settingsStore';
export * from './cacheStore';

import { dbManager } from './database';
import { analysisStore } from './analysisStore';
import { settingsStore } from './settingsStore';
import { cacheStore } from './cacheStore';

// Storage API class that combines all stores
export class StorageAPI {
  // Analysis operations
  readonly analysis = analysisStore;
  
  // Settings operations
  readonly settings = settingsStore;
  
  // Cache operations
  readonly cache = cacheStore;

  // Database management
  async initialize(): Promise<void> {
    try {
      await dbManager.getDatabase();
      console.log('✅ Storage initialized successfully');
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await dbManager.closeDatabase();
    console.log('📪 Storage closed');
  }

  async clear(): Promise<void> {
    await dbManager.clearDatabase();
    console.log('🧹 Storage cleared');
  }

  // Get storage usage information
  async getStorageInfo(): Promise<{
    isSupported: boolean;
    quota?: number;
    usage?: number;
    analysisCount: number;
    cacheStats: any;
  }> {
    const isSupported = typeof window !== 'undefined' && 'indexedDB' in window;
    
    if (!isSupported) {
      return {
        isSupported: false,
        analysisCount: 0,
        cacheStats: null
      };
    }

    // Get quota information if available
    let quota, usage;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota;
        usage = estimate.usage;
      } catch (error) {
        console.warn('Failed to get storage estimate:', error);
      }
    }

    // Get analysis count
    const analyses = await this.analysis.getAnalyses(undefined, undefined, 1);
    const analysisStats = await this.analysis.getStatistics();
    
    // Get cache statistics
    const cacheStats = await this.cache.getCacheStats();

    return {
      isSupported: true,
      quota,
      usage,
      analysisCount: analysisStats.totalCount,
      cacheStats
    };
  }

  // Perform storage maintenance
  async performMaintenance(): Promise<{
    cacheCleanup: any;
    analysisCleanup?: any;
  }> {
    console.log('🔧 Performing storage maintenance...');
    
    // Clean expired cache
    const cacheCleanup = await this.cache.performMaintenance();
    
    // TODO: Add analysis cleanup based on retention settings
    const settings = await this.settings.getAllSettings();
    const retentionDays = settings.retentionDays;
    const maxAnalyses = settings.maxStoredAnalyses;
    
    // Clean old analyses if retention limit is set
    let analysisCleanup;
    if (retentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const oldAnalyses = await this.analysis.getAnalyses({
        dateRange: {
          from: '1970-01-01',
          to: cutoffDate.toISOString()
        }
      });
      
      if (oldAnalyses.length > 0) {
        await this.analysis.deleteAnalyses(oldAnalyses.map(a => a.id));
        analysisCleanup = { deletedOldAnalyses: oldAnalyses.length };
      }
    }
    
    // Limit total number of analyses
    if (maxAnalyses > 0) {
      const allAnalyses = await this.analysis.getAnalyses(
        undefined,
        { field: 'timestamp', direction: 'desc' }
      );
      
      if (allAnalyses.length > maxAnalyses) {
        const excessAnalyses = allAnalyses.slice(maxAnalyses);
        await this.analysis.deleteAnalyses(excessAnalyses.map(a => a.id));
        
        analysisCleanup = {
          ...analysisCleanup,
          deletedExcessAnalyses: excessAnalyses.length
        };
      }
    }

    console.log('✅ Storage maintenance completed');
    
    return {
      cacheCleanup,
      analysisCleanup
    };
  }

  // Backup all data
  async exportAllData(): Promise<string> {
    console.log('📦 Exporting all data...');
    
    const [analyses, settings] = await Promise.all([
      this.analysis.exportAnalyses(),
      this.settings.exportSettings()
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      application: 'Web Conversion Optimizer',
      data: {
        analyses: JSON.parse(analyses),
        settings: JSON.parse(settings)
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Restore all data
  async importAllData(jsonData: string): Promise<{
    analyses: { imported: number; skipped: number };
    settings: boolean;
  }> {
    console.log('📥 Importing all data...');
    
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.data) {
        throw new Error('Invalid backup format');
      }

      const results = {
        analyses: { imported: 0, skipped: 0 },
        settings: false
      };

      // Import analyses
      if (data.data.analyses?.analyses) {
        results.analyses = await this.analysis.importAnalyses(
          JSON.stringify(data.data.analyses)
        );
      }

      // Import settings
      if (data.data.settings?.settings) {
        await this.settings.importSettings(
          JSON.stringify(data.data.settings)
        );
        results.settings = true;
      }

      console.log('✅ Data import completed');
      return results;
      
    } catch (error) {
      console.error('❌ Data import failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const storage = new StorageAPI();

// Auto-initialize storage when imported (browser only)
if (typeof window !== 'undefined') {
  storage.initialize().catch(console.error);
  
  // Perform maintenance on load (after 10 seconds)
  setTimeout(() => {
    storage.performMaintenance().catch(console.error);
  }, 10000);
  
  // Schedule periodic maintenance (every 6 hours)
  setInterval(() => {
    storage.performMaintenance().catch(console.error);
  }, 6 * 60 * 60 * 1000);
}

// React hooks for storage operations
export function useStorage() {
  return storage;
}

// Storage event emitter for real-time updates
class StorageEventEmitter extends EventTarget {
  emit(event: string, data?: any) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  on(event: string, callback: (data: any) => void) {
    this.addEventListener(event, (e) => callback((e as CustomEvent).detail));
  }

  off(event: string, callback: (data: any) => void) {
    this.removeEventListener(event, callback);
  }
}

export const storageEvents = new StorageEventEmitter();

// Wrap storage operations to emit events
const originalSaveAnalysis = analysisStore.saveAnalysis.bind(analysisStore);
analysisStore.saveAnalysis = async (...args) => {
  const result = await originalSaveAnalysis(...args);
  storageEvents.emit('analysis:saved', { id: result });
  return result;
};

const originalDeleteAnalysis = analysisStore.deleteAnalysis.bind(analysisStore);
analysisStore.deleteAnalysis = async (...args) => {
  const result = await originalDeleteAnalysis(...args);
  storageEvents.emit('analysis:deleted', { id: args[0] });
  return result;
};