// IndexedDB Database Configuration and Schema

export const DB_NAME = 'WCOAnalysisDB';
export const DB_VERSION = 1;

// Store names
export const STORES = {
  ANALYSES: 'analyses',
  COMPARISONS: 'comparisons',
  SETTINGS: 'settings',
  CACHE: 'cache'
} as const;

// Database schema
export interface AnalysisRecord {
  id: string;
  url: string;
  timestamp: string;
  overallScore: number;
  categories: {
    performance: number;
    usability: number;
    conversion: number;
    accessibility: number;
    seo: number;
  };
  criticalIssues: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
    recommendation: string;
  }>;
  opportunities: Array<{
    title: string;
    description: string;
    expectedImprovement: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  rawData?: {
    scrapeData?: any;
    lighthouseData?: any;
  };
  tags: string[];
  notes: string;
  favorite: boolean;
}

export interface ComparisonRecord {
  id: string;
  name: string;
  analysisIds: string[];
  createdAt: string;
  description: string;
}

export interface SettingsRecord {
  id: string;
  key: string;
  value: any;
  updatedAt: string;
}

export interface CacheRecord {
  id: string;
  key: string;
  data: any;
  expiresAt: string;
  createdAt: string;
}

// Database initialization
export function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create analyses store
      if (!db.objectStoreNames.contains(STORES.ANALYSES)) {
        const analysesStore = db.createObjectStore(STORES.ANALYSES, { 
          keyPath: 'id' 
        });
        
        // Create indexes
        analysesStore.createIndex('url', 'url', { unique: false });
        analysesStore.createIndex('timestamp', 'timestamp', { unique: false });
        analysesStore.createIndex('overallScore', 'overallScore', { unique: false });
        analysesStore.createIndex('favorite', 'favorite', { unique: false });
        analysesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }

      // Create comparisons store
      if (!db.objectStoreNames.contains(STORES.COMPARISONS)) {
        const comparisonsStore = db.createObjectStore(STORES.COMPARISONS, { 
          keyPath: 'id' 
        });
        
        comparisonsStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Create settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        const settingsStore = db.createObjectStore(STORES.SETTINGS, { 
          keyPath: 'id' 
        });
        
        settingsStore.createIndex('key', 'key', { unique: true });
      }

      // Create cache store
      if (!db.objectStoreNames.contains(STORES.CACHE)) {
        const cacheStore = db.createObjectStore(STORES.CACHE, { 
          keyPath: 'id' 
        });
        
        cacheStore.createIndex('key', 'key', { unique: true });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

// Database connection manager
class DatabaseManager {
  private db: IDBDatabase | null = null;
  private isInitializing = false;

  async getDatabase(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.isInitializing) {
      // Wait for initialization to complete
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      return this.db!;
    }

    this.isInitializing = true;
    try {
      this.db = await initDatabase();
      return this.db;
    } finally {
      this.isInitializing = false;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  async clearDatabase(): Promise<void> {
    const db = await this.getDatabase();
    const transaction = db.transaction(
      [STORES.ANALYSES, STORES.COMPARISONS, STORES.CACHE],
      'readwrite'
    );

    await Promise.all([
      this.clearStore(transaction, STORES.ANALYSES),
      this.clearStore(transaction, STORES.COMPARISONS),
      this.clearStore(transaction, STORES.CACHE)
    ]);
  }

  private clearStore(transaction: IDBTransaction, storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(storeName).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbManager = new DatabaseManager();

// Utility functions
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function isExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}

export function createExpirationDate(hours: number = 24): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}