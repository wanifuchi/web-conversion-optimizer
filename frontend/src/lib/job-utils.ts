// Utility functions for job ID management

export function extractUrlFromJobId(jobId: string): string | null {
  try {
    // Parse job ID format: job_timestamp_urlBase64_random
    const parts = jobId.split('_');
    if (parts.length >= 3 && parts[0] === 'job') {
      const urlBase64 = parts[2];
      
      // Try to decode the URL from base64
      try {
        const decodedUrl = Buffer.from(urlBase64, 'base64').toString('utf-8');
        
        // Validate that it looks like a URL
        if (decodedUrl.startsWith('http://') || decodedUrl.startsWith('https://')) {
          return decodedUrl;
        }
      } catch (decodeError) {
        console.log('Failed to decode URL from job ID:', decodeError);
      }
    }
  } catch (error) {
    console.error('Error extracting URL from job ID:', error);
  }
  
  return null;
}

export function createJobIdWithUrl(url: string): string {
  const timestamp = Date.now();
  const urlBase64 = Buffer.from(url).toString('base64').replace(/[^A-Za-z0-9]/g, '');
  const random = Math.random().toString(36).substr(2, 5);
  
  return `job_${timestamp}_${urlBase64.slice(0, 20)}_${random}`;
}

export function getJobTimestamp(jobId: string): number | null {
  try {
    const parts = jobId.split('_');
    if (parts.length >= 2 && parts[0] === 'job') {
      const timestamp = parseInt(parts[1]);
      return isNaN(timestamp) ? null : timestamp;
    }
  } catch (error) {
    console.error('Error extracting timestamp from job ID:', error);
  }
  
  return null;
}