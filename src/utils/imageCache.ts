import { secureStorage } from '../core/storage';
import { logger } from './logger';

export interface ImageCacheConfig {
  maxEntries: number;
  ttlMs: number;
}

class ImageCacheManager {
  private config: ImageCacheConfig = {
    maxEntries: 100,
    ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  };

  private memoryCache = new Map<string, { localUri: string; timestamp: number }>();

  constructor() {
    this.loadPersistence();
  }

  private async loadPersistence(): Promise<void> {
    try {
      const saved = await secureStorage.getItem('image_cache_manifest');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, value]) => {
          this.memoryCache.set(key, value as any);
        });
      }
    } catch (e) {
      logger.error('[ImageCacheManager] Failed to load manifest', e);
    }
  }

  private async savePersistence(): Promise<void> {
    try {
      const manifest: Record<string, unknown> = {};
      this.memoryCache.forEach((value, key) => {
        manifest[key] = value;
      });
      await secureStorage.setItem('image_cache_manifest', JSON.stringify(manifest));
    } catch (e) {
      logger.error('[ImageCacheManager] Failed to save manifest', e);
    }
  }

  public async getCachedImageUri(remoteUrl: string): Promise<string> {
    logger.debug(`[ImageCache] Get cached image for: ${remoteUrl}`);
    
    // Check memory cache
    const item = this.memoryCache.get(remoteUrl);
    if (item && Date.now() - item.timestamp < this.config.ttlMs) {
      return item.localUri;
    }

    // Abstraction placeholder: on real hardware we download and write to file system cache directory
    // We will simulate it and returns the remoteUrl as the local fallback uri
    const simulatedLocalUri = remoteUrl;
    
    this.memoryCache.set(remoteUrl, {
      localUri: simulatedLocalUri,
      timestamp: Date.now(),
    });

    // Prune cache if exceeds maximum limit
    if (this.memoryCache.size > this.config.maxEntries) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }

    await this.savePersistence();
    return simulatedLocalUri;
  }

  public async clearCache(): Promise<void> {
    this.memoryCache.clear();
    await secureStorage.removeItem('image_cache_manifest');
  }
}

export const imageCacheManager = new ImageCacheManager();
