// Analysis Data Store - IndexedDB wrapper for analysis results

import { 
  dbManager, 
  STORES, 
  AnalysisRecord, 
  generateId,
  type ComparisonRecord 
} from './database';

export interface AnalysisFilter {
  url?: string;
  scoreRange?: { min: number; max: number };
  dateRange?: { from: string; to: string };
  tags?: string[];
  favorite?: boolean;
}

export interface AnalysisSortOptions {
  field: 'timestamp' | 'overallScore' | 'url';
  direction: 'asc' | 'desc';
}

class AnalysisStore {
  // Save analysis result
  async saveAnalysis(data: Omit<AnalysisRecord, 'id' | 'tags' | 'notes' | 'favorite'>): Promise<string> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readwrite');
    const store = transaction.objectStore(STORES.ANALYSES);

    const analysis: AnalysisRecord = {
      ...data,
      id: generateId(),
      tags: [],
      notes: '',
      favorite: false
    };

    return new Promise((resolve, reject) => {
      const request = store.add(analysis);
      
      request.onsuccess = () => {
        console.log('✅ Analysis saved:', analysis.id);
        resolve(analysis.id);
      };
      
      request.onerror = () => {
        console.error('❌ Failed to save analysis:', request.error);
        reject(request.error);
      };
    });
  }

  // Get analysis by ID
  async getAnalysis(id: string): Promise<AnalysisRecord | null> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readonly');
    const store = transaction.objectStore(STORES.ANALYSES);

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Get all analyses with filtering and sorting
  async getAnalyses(
    filter?: AnalysisFilter,
    sort?: AnalysisSortOptions,
    limit?: number,
    offset?: number
  ): Promise<AnalysisRecord[]> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readonly');
    const store = transaction.objectStore(STORES.ANALYSES);

    let cursor: IDBRequest;
    
    // Use index if sorting by indexed field
    if (sort?.field && ['timestamp', 'overallScore', 'favorite'].includes(sort.field)) {
      const index = store.index(sort.field);
      cursor = index.openCursor(null, sort.direction === 'desc' ? 'prev' : 'next');
    } else {
      cursor = store.openCursor();
    }

    return new Promise((resolve, reject) => {
      const results: AnalysisRecord[] = [];
      let skipped = 0;
      let collected = 0;

      cursor.onsuccess = (event) => {
        const result = (event.target as IDBRequest<IDBCursorWithValue>).result;
        
        if (!result) {
          // Sort results if not using index
          if (!sort?.field || !['timestamp', 'overallScore', 'favorite'].includes(sort.field)) {
            this.sortAnalyses(results, sort);
          }
          
          resolve(results);
          return;
        }

        const analysis = result.value as AnalysisRecord;
        
        // Apply filters
        if (filter && !this.matchesFilter(analysis, filter)) {
          result.continue();
          return;
        }

        // Apply pagination
        if (offset && skipped < offset) {
          skipped++;
          result.continue();
          return;
        }

        if (limit && collected >= limit) {
          resolve(results);
          return;
        }

        results.push(analysis);
        collected++;
        result.continue();
      };

      cursor.onerror = () => {
        reject(cursor.error);
      };
    });
  }

  // Update analysis
  async updateAnalysis(id: string, updates: Partial<AnalysisRecord>): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readwrite');
    const store = transaction.objectStore(STORES.ANALYSES);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const analysis = getRequest.result;
        if (!analysis) {
          reject(new Error('Analysis not found'));
          return;
        }

        const updatedAnalysis = { ...analysis, ...updates };
        const putRequest = store.put(updatedAnalysis);
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete analysis
  async deleteAnalysis(id: string): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readwrite');
    const store = transaction.objectStore(STORES.ANALYSES);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        console.log('✅ Analysis deleted:', id);
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // Delete multiple analyses
  async deleteAnalyses(ids: string[]): Promise<void> {
    const db = await dbManager.getDatabase();
    const transaction = db.transaction([STORES.ANALYSES], 'readwrite');
    const store = transaction.objectStore(STORES.ANALYSES);

    const promises = ids.map(id => 
      new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    );

    await Promise.all(promises);
    console.log('✅ Multiple analyses deleted:', ids.length);
  }

  // Get analysis statistics
  async getStatistics(): Promise<{
    totalCount: number;
    averageScore: number;
    scoreDistribution: { range: string; count: number }[];
    recentCount: number;
    topDomains: { domain: string; count: number }[];
  }> {
    const analyses = await this.getAnalyses();
    
    const totalCount = analyses.length;
    const averageScore = totalCount > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + a.overallScore, 0) / totalCount)
      : 0;

    // Score distribution
    const scoreRanges = [
      { range: '90-100', min: 90, max: 100 },
      { range: '80-89', min: 80, max: 89 },
      { range: '70-79', min: 70, max: 79 },
      { range: '60-69', min: 60, max: 69 },
      { range: '0-59', min: 0, max: 59 }
    ];

    const scoreDistribution = scoreRanges.map(range => ({
      range: range.range,
      count: analyses.filter(a => a.overallScore >= range.min && a.overallScore <= range.max).length
    }));

    // Recent analyses (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = analyses.filter(a => 
      new Date(a.timestamp) > sevenDaysAgo
    ).length;

    // Top domains
    const domainCounts = new Map<string, number>();
    analyses.forEach(analysis => {
      try {
        const domain = new URL(analysis.url).hostname;
        domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
      } catch {
        // Invalid URL, skip
      }
    });

    const topDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCount,
      averageScore,
      scoreDistribution,
      recentCount,
      topDomains
    };
  }

  // Search analyses
  async searchAnalyses(query: string): Promise<AnalysisRecord[]> {
    const analyses = await this.getAnalyses();
    const lowercaseQuery = query.toLowerCase();

    return analyses.filter(analysis => 
      analysis.url.toLowerCase().includes(lowercaseQuery) ||
      analysis.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      analysis.notes.toLowerCase().includes(lowercaseQuery) ||
      analysis.criticalIssues.some(issue => 
        issue.title.toLowerCase().includes(lowercaseQuery) ||
        issue.description.toLowerCase().includes(lowercaseQuery)
      ) ||
      analysis.opportunities.some(opp => 
        opp.title.toLowerCase().includes(lowercaseQuery) ||
        opp.description.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  // Export analyses
  async exportAnalyses(ids?: string[]): Promise<string> {
    let analyses: AnalysisRecord[];
    
    if (ids) {
      analyses = await Promise.all(
        ids.map(id => this.getAnalysis(id)).filter(Boolean)
      ) as AnalysisRecord[];
    } else {
      analyses = await this.getAnalyses();
    }

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      count: analyses.length,
      analyses
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import analyses
  async importAnalyses(jsonData: string): Promise<{ imported: number; skipped: number }> {
    try {
      const data = JSON.parse(jsonData);
      const analyses = data.analyses || [];
      
      let imported = 0;
      let skipped = 0;

      for (const analysis of analyses) {
        try {
          // Check if analysis already exists
          const existing = await this.getAnalysisByUrlAndTimestamp(
            analysis.url, 
            analysis.timestamp
          );
          
          if (existing) {
            skipped++;
            continue;
          }

          await this.saveAnalysis(analysis);
          imported++;
        } catch (error) {
          console.error('Failed to import analysis:', error);
          skipped++;
        }
      }

      return { imported, skipped };
    } catch (error) {
      throw new Error('Invalid import data format');
    }
  }

  // Helper method to check if analysis exists
  private async getAnalysisByUrlAndTimestamp(url: string, timestamp: string): Promise<AnalysisRecord | null> {
    const analyses = await this.getAnalyses({ url });
    return analyses.find(a => a.timestamp === timestamp) || null;
  }

  // Helper method to check if analysis matches filter
  private matchesFilter(analysis: AnalysisRecord, filter: AnalysisFilter): boolean {
    if (filter.url && !analysis.url.toLowerCase().includes(filter.url.toLowerCase())) {
      return false;
    }

    if (filter.scoreRange) {
      const { min, max } = filter.scoreRange;
      if (analysis.overallScore < min || analysis.overallScore > max) {
        return false;
      }
    }

    if (filter.dateRange) {
      const analysisDate = new Date(analysis.timestamp);
      const fromDate = new Date(filter.dateRange.from);
      const toDate = new Date(filter.dateRange.to);
      
      if (analysisDate < fromDate || analysisDate > toDate) {
        return false;
      }
    }

    if (filter.tags && filter.tags.length > 0) {
      const hasMatchingTag = filter.tags.some(tag => 
        analysis.tags.includes(tag)
      );
      if (!hasMatchingTag) {
        return false;
      }
    }

    if (filter.favorite !== undefined && analysis.favorite !== filter.favorite) {
      return false;
    }

    return true;
  }

  // Helper method to sort analyses
  private sortAnalyses(analyses: AnalysisRecord[], sort?: AnalysisSortOptions): void {
    if (!sort) return;

    analyses.sort((a, b) => {
      let aValue: any = a[sort.field];
      let bValue: any = b[sort.field];

      // Handle string comparison for URL
      if (sort.field === 'url') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle date comparison
      if (sort.field === 'timestamp') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) {
        return sort.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }
}

export const analysisStore = new AnalysisStore();