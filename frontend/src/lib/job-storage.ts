// In-memory job storage for when KV is not available
interface JobData {
  jobId: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  data: any;
  createdAt: string;
  updatedAt: string;
  expiresAt: number; // timestamp
}

class InMemoryJobStorage {
  private jobs = new Map<string, JobData>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup process
    this.startCleanup();
  }

  private startCleanup() {
    // Clean up expired jobs every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [jobId, job] of this.jobs.entries()) {
        if (job.expiresAt < now) {
          this.jobs.delete(jobId);
          console.log(`🗑️ Cleaned up expired job: ${jobId}`);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  set(jobId: string, data: Partial<JobData>): void {
    const existing = this.jobs.get(jobId);
    const now = new Date().toISOString();
    
    const jobData: JobData = {
      jobId,
      url: data.url || existing?.url || 'unknown',
      status: data.status || existing?.status || 'pending',
      data: data.data || existing?.data || null,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
    };

    this.jobs.set(jobId, jobData);
    console.log(`💾 Stored job ${jobId} in memory (status: ${jobData.status}, url: ${jobData.url})`);
  }

  get(jobId: string): JobData | null {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return null;
    }

    // Check if expired
    if (job.expiresAt < Date.now()) {
      this.jobs.delete(jobId);
      console.log(`⏰ Job ${jobId} expired and removed`);
      return null;
    }

    return job;
  }

  delete(jobId: string): boolean {
    const deleted = this.jobs.delete(jobId);
    if (deleted) {
      console.log(`🗑️ Deleted job: ${jobId}`);
    }
    return deleted;
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.jobs.clear();
    console.log('🧹 Job storage cleaned up');
  }

  // Get storage stats for debugging
  getStats() {
    return {
      totalJobs: this.jobs.size,
      jobs: Array.from(this.jobs.values()).map(job => ({
        jobId: job.jobId,
        url: job.url,
        status: job.status,
        createdAt: job.createdAt,
        expiresIn: Math.max(0, job.expiresAt - Date.now())
      }))
    };
  }
}

// Global instance - persists across API calls in the same process
const globalJobStorage = new InMemoryJobStorage();

export { globalJobStorage as jobStorage };
export type { JobData };