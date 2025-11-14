// Utility functions for handling large file uploads

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  timeout?: number;
  retries?: number;
  onProgress?: (progress: UploadProgress) => void;
}

/**
 * Upload a large file with retry logic and progress tracking
 */
export async function uploadLargeFile(
  url: string,
  file: Blob,
  contentType: string,
  options: UploadOptions = {}
): Promise<Response> {
  const { timeout = 300000, retries = 3, onProgress } = options; // 5 minute timeout
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📤 Upload attempt ${attempt}/${retries} for ${(file.size / (1024 * 1024)).toFixed(1)}MB file`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`✅ Upload successful on attempt ${attempt}`);
        return response;
      } else {
        throw new Error(`Upload failed with status ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown upload error');
      console.error(`❌ Upload attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Upload failed after all retries');
}