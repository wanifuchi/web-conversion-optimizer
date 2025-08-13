// Settings Store - Manages application settings in IndexedDB

import { dbManager, STORES, SettingsRecord, generateId } from './database';

export interface AppSettings {
  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  
  // Analysis Preferences
  defaultAnalysisOptions: {
    screenshot: boolean;
    lighthouse: boolean;
    mobile: boolean;
    timeout: number;
  };
  
  // Data Management
  autoSave: boolean;
  retentionDays: number;
  maxStoredAnalyses: number;
  
  // Export/Import
  includeRawData: boolean;
  compressionLevel: 'none' | 'standard' | 'high';
  
  // Notifications
  showSuccessNotifications: boolean;
  showErrorNotifications: boolean;
  showProgressNotifications: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'ja',
  defaultAnalysisOptions: {
    screenshot: true,
    lighthouse: true,
    mobile: false,
    timeout: 30000
  },
  autoSave: true,
  retentionDays: 90,
  maxStoredAnalyses: 100,
  includeRawData: false,
  compressionLevel: 'standard',
  showSuccessNotifications: true,
  showErrorNotifications: true,
  showProgressNotifications: true
};

class SettingsStore {
  private cache = new Map<string, any>();

  // Get setting value
  async getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.SETTINGS], 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);

    return new Promise((resolve, reject) => {
      const request = store.index('key').get(key);
      
      request.onsuccess = () => {
        const result = request.result as SettingsRecord | undefined;
        const value = result ? result.value : DEFAULT_SETTINGS[key];
        
        // Cache the value
        this.cache.set(key, value);
        resolve(value);
      };
      
      request.onerror = () => {
        // Return default value on error
        const value = DEFAULT_SETTINGS[key];
        this.cache.set(key, value);
        resolve(value);
      };
    });
  }

  // Set setting value
  async setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);

    const setting: SettingsRecord = {
      id: `setting_${key}`,
      key,
      value,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const request = store.put(setting);
      
      request.onsuccess = () => {
        // Update cache
        this.cache.set(key, value);
        console.log(`✅ Setting updated: ${key} = ${value}`);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get all settings
  async getAllSettings(): Promise<AppSettings> {
    const settings = { ...DEFAULT_SETTINGS };
    
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.SETTINGS], 'readonly');
    const store = transaction.objectStore(STORES.SETTINGS);

    return new Promise((resolve, reject) => {
      const request = store.openCursor();
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (!cursor) {
          // Cache all settings
          Object.entries(settings).forEach(([key, value]) => {
            this.cache.set(key, value);
          });
          
          resolve(settings);
          return;
        }

        const record = cursor.value as SettingsRecord;
        if (record.key in settings) {
          (settings as any)[record.key] = record.value;
        }

        cursor.continue();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Update multiple settings
  async updateSettings(updates: Partial<AppSettings>): Promise<void> {
    const promises = Object.entries(updates).map(([key, value]) =>
      this.setSetting(key as keyof AppSettings, value)
    );

    await Promise.all(promises);
  }

  // Reset settings to defaults
  async resetSettings(): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.SETTINGS], 'readwrite');
    const store = transaction.objectStore(STORES.SETTINGS);

    return new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = async () => {
        // Clear cache
        this.cache.clear();
        
        // Set default values
        await this.updateSettings(DEFAULT_SETTINGS);
        
        console.log('✅ Settings reset to defaults');
        resolve();
      };
      
      clearRequest.onerror = () => {
        reject(clearRequest.error);
      };
    });
  }

  // Export settings
  async exportSettings(): Promise<string> {
    const settings = await this.getAllSettings();
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      settings
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import settings
  async importSettings(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      const settings = data.settings;
      
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings format');
      }

      // Validate and filter settings
      const validSettings: Partial<AppSettings> = {};
      
      Object.entries(settings).forEach(([key, value]) => {
        if (key in DEFAULT_SETTINGS) {
          validSettings[key as keyof AppSettings] = value as any;
        }
      });

      await this.updateSettings(validSettings);
      console.log('✅ Settings imported successfully');
      
    } catch (error) {
      throw new Error('Failed to import settings: Invalid format');
    }
  }

  // Clear cache (useful for forcing refresh)
  clearCache(): void {
    this.cache.clear();
  }
}

export const settingsStore = new SettingsStore();