import { logger } from '../../utils/logger';
import { secureStorage } from '../storage';

export interface QueueItem {
  id: string;
  actionName: string;
  payload: unknown;
  execute: () => Promise<unknown>;
  timestamp: number;
}

type OnlineListener = (isOnline: boolean) => void;

class OfflineManager {
  private online = true;
  private listeners = new Set<OnlineListener>();
  private requestQueue: QueueItem[] = [];
  private cache = new Map<string, unknown>();

  constructor() {
    this.loadPersistedQueue();
  }

  // Persists the queue in case of app crashes
  private async loadPersistedQueue(): Promise<void> {
    try {
      const saved = await secureStorage.getItem('offline_request_queue');
      if (saved) {
        // Parse and populate, execution callbacks need to be re-bound by repositories/features
        const items = JSON.parse(saved);
        logger.debug(`[OfflineManager] Loaded ${items.length} pending offline actions.`);
      }
    } catch (e) {
      logger.error('[OfflineManager] Failed to load persisted offline queue', e);
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const simplified = this.requestQueue.map(item => ({
        id: item.id,
        actionName: item.actionName,
        payload: item.payload,
        timestamp: item.timestamp,
      }));
      await secureStorage.setItem('offline_request_queue', JSON.stringify(simplified));
    } catch (e) {
      logger.error('[OfflineManager] Failed to persist offline queue', e);
    }
  }

  public isOffline(): boolean {
    return !this.online;
  }

  public setOnlineStatus(isOnline: boolean): void {
    if (this.online === isOnline) return;
    this.online = isOnline;
    logger.info(`[OfflineManager] Network status changed. Online: ${isOnline}`);
    
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (err) {
        logger.error('[OfflineManager] Error in online status listener', err);
      }
    });

    if (isOnline) {
      this.drainQueue();
    }
  }

  public addListener(listener: OnlineListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Queue a mutation action to be executed when back online
  public enqueue(actionName: string, payload: unknown, execute: () => Promise<unknown>): void {
    const item: QueueItem = {
      id: Math.random().toString(36).substring(7),
      actionName,
      payload,
      execute,
      timestamp: Date.now(),
    };
    this.requestQueue.push(item);
    logger.warn(`[OfflineManager] Device is offline. Enqueued action: ${actionName}`);
    this.saveQueue();
  }

  // Drain the queue sequentially when network is restored
  private async drainQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    logger.info(`[OfflineManager] Reconnected! Restoring ${this.requestQueue.length} queued requests.`);
    
    const queueToProcess = [...this.requestQueue];
    this.requestQueue = [];
    await this.saveQueue();

    for (const item of queueToProcess) {
      try {
        logger.info(`[OfflineManager] Retrying queued request: ${item.actionName}`);
        await item.execute();
      } catch (error) {
        logger.error(`[OfflineManager] Failed to process queued request: ${item.actionName}. Re-enqueuing.`, error);
        // Put back in queue if it fails again
        this.requestQueue.push(item);
        await this.saveQueue();
      }
    }
  }

  // Cache standard request reads
  public setCache(key: string, data: unknown): void {
    this.cache.set(key, data);
  }

  public getCache<T>(key: string): T | null {
    return (this.cache.get(key) as T) || null;
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

export const offlineManager = new OfflineManager();
