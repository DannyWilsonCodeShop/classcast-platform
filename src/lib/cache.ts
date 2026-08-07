/**
 * Simple in-memory server-side cache for API responses.
 * Reduces DynamoDB calls for data that doesn't change frequently.
 * Cache entries auto-expire after TTL (default 60 seconds).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ServerCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 500; // Max entries to prevent memory leaks

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  invalidate(keyPattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}

// Singleton instance shared across all API routes in the same Lambda invocation
export const serverCache = new ServerCache();

// Cache TTL constants
export const CACHE_TTL = {
  COURSE_DATA: 120_000,       // 2 minutes — course info rarely changes
  ASSIGNMENT_LIST: 60_000,    // 1 minute — assignments change occasionally
  INSTRUCTOR_INFO: 300_000,   // 5 minutes — instructor names never change
  STUDENT_SUBMISSIONS: 30_000, // 30 seconds — submissions change when students submit
  ENROLLMENT: 60_000,         // 1 minute — enrollment changes on join
};
