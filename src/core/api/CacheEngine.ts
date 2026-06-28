import { logger } from '../../utils/logger';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  timestamp: number;
}

export interface IDiskCache {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
}

// Future Redis Compatibility interface
export interface IRedisClient {
  setex(key: string, seconds: number, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  del(key: string): Promise<void>;
}

class CacheEngine {
  private memoryStore = new Map<string, CacheEntry<unknown>>();
  private defaultTtlMs = 5 * 60 * 1000; // 5 minutes default TTL

  // 1. Memory Cache with TTL
  public set<T>(key: string, value: T, ttlMs: number = this.defaultTtlMs): void {
    const expiresAt = Date.now() + ttlMs;
    this.memoryStore.set(key, {
      value,
      expiresAt,
      timestamp: Date.now(),
    });
    logger.debug(`[CacheEngine] Cached key: ${key}. Expires in ${ttlMs / 1000} seconds.`);
  }

  public get<T>(key: string): T | null {
    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      logger.debug(`[CacheEngine] Cache expired for key: ${key}`);
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value;
  }

  // 2. Cache Invalidation
  public delete(key: string): void {
    this.memoryStore.delete(key);
    logger.debug(`[CacheEngine] Invalidated cache key: ${key}`);
  }

  public clear(): void {
    this.memoryStore.clear();
    logger.info('[CacheEngine] Memory cache cleared.');
  }

  // 3. Stale-While-Revalidate (SWR) Strategy
  public async staleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTtlMs
  ): Promise<T> {
    const entry = this.memoryStore.get(key) as CacheEntry<T> | undefined;
    const now = Date.now();

    if (entry) {
      const isStale = now > entry.expiresAt;
      
      if (isStale) {
        logger.info(`[CacheEngine] Stale key found for: ${key}. Serving stale and revalidating in background.`);
        // Revalidate asynchronously in background
        fetcher()
          .then((freshValue) => {
            this.set(key, freshValue, ttlMs);
            logger.debug(`[CacheEngine] Cache revalidated in background for key: ${key}`);
          })
          .catch((err) => {
            logger.error(`[CacheEngine] Background SWR revalidation failed for: ${key}`, err);
          });

        return entry.value; // Return stale value instantly
      }

      logger.debug(`[CacheEngine] Fresh cache hit for key: ${key}`);
      return entry.value; // Return fresh cache hit
    }

    // No cache exists - fetch synchronously
    logger.info(`[CacheEngine] Cache miss for: ${key}. Fetching fresh.`);
    const freshValue = await fetcher();
    this.set(key, freshValue, ttlMs);
    return freshValue;
  }
}

export const cacheEngine = new CacheEngine();
export default cacheEngine;
