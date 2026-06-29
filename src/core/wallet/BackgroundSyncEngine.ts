import { eventEngine } from './EventEngine';
import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export class BackgroundSyncEngine {
  private static instance: BackgroundSyncEngine | null = null;
  private isConnected = true;
  private isLowPowerMode = false;
  private retryQueue: Array<{ id: string; action: () => Promise<boolean>; attempt: number }> = [];
  private syncInterval?: any;
  private syncIntervalMs = 30000; // default 30s sync
  private exponentialBaseMs = 2000;

  private constructor() {
    this.startSyncScheduler();
  }

  public static getInstance(): BackgroundSyncEngine {
    if (!BackgroundSyncEngine.instance) {
      BackgroundSyncEngine.instance = new BackgroundSyncEngine();
    }
    return BackgroundSyncEngine.instance;
  }

  // Network connection observer change hook
  public setConnectionState(connected: boolean): void {
    if (this.isConnected === connected) return;
    this.isConnected = connected;
    logger.info(`[BackgroundSyncEngine] Network connectivity changed. Connected: ${connected}`);

    if (connected) {
      // Re-trigger sync queue on reconnect
      this.flushRetryQueue();
    }
  }

  // Low battery/power throttling hook
  public setPowerMode(lowPower: boolean): void {
    if (this.isLowPowerMode === lowPower) return;
    this.isLowPowerMode = lowPower;
    logger.warn(`[BackgroundSyncEngine] Battery power mode change. LowPowerMode: ${lowPower}`);

    // Throttles interval if power is low to save battery life
    this.syncIntervalMs = lowPower ? 90000 : 30000;
    this.startSyncScheduler();
  }

  // Add action to the retry sync queue
  public enqueueSyncAction(id: string, action: () => Promise<boolean>): void {
    const exists = this.retryQueue.some(item => item.id === id);
    if (exists) return;

    this.retryQueue.push({ id, action, attempt: 0 });
    logger.debug(`[BackgroundSyncEngine] Action ${id} enqueued to retry queue.`);

    if (this.isConnected) {
      this.flushRetryQueue();
    }
  }

  // Process the retry queue with exponential backoff delays
  public async flushRetryQueue(): Promise<void> {
    if (!this.isConnected || this.retryQueue.length === 0) return;
    if (!featureFlagsManager.isEnabled('ENABLE_BACKGROUND_SYNC')) return;

    logger.info(`[BackgroundSyncEngine] Flushing retry queue. Items: ${this.retryQueue.length}`);
    const activeQueue = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of activeQueue) {
      try {
        const success = await item.action();
        if (success) {
          logger.info(`[BackgroundSyncEngine] Action ${item.id} executed successfully.`);
          
          await eventEngine.publish({
            event_id: `evt_sync_ok_${item.id}_${Date.now()}`,
            topic: 'background_sync',
            event_type: 'sync_completed',
            priority: 'low',
            payload: { action_id: item.id },
            timestamp: Date.now(),
          });
        } else {
          throw new Error('Sync action returned false');
        }
      } catch (err: any) {
        item.attempt += 1;
        logger.error(`[BackgroundSyncEngine] Action ${item.id} failed (Attempt ${item.attempt})`, err);

        if (item.attempt < 5) {
          // Re-queue with backoff delay
          const delay = this.exponentialBaseMs * Math.pow(2, item.attempt - 1);
          logger.warn(`[BackgroundSyncEngine] Re-queuing ${item.id} with ${delay}ms delay.`);
          
          setTimeout(() => {
            this.retryQueue.push(item);
            this.flushRetryQueue();
          }, delay);
        } else {
          logger.error(`[BackgroundSyncEngine] Action ${item.id} exceeded maximum retries. Discarding.`);
          
          await eventEngine.publish({
            event_id: `evt_sync_fail_${item.id}_${Date.now()}`,
            topic: 'background_sync',
            event_type: 'sync_failed_max_attempts',
            priority: 'high',
            payload: { action_id: item.id, error: err.message },
            timestamp: Date.now(),
          });
        }
      }
    }
  }

  // Periodic scheduler
  private startSyncScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performIncrementalSync();
    }, this.syncIntervalMs);
  }

  public stopSyncScheduler(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }

  // Simulates background incremental sync fetches
  private async performIncrementalSync(): Promise<void> {
    if (!this.isConnected || !featureFlagsManager.isEnabled('ENABLE_BACKGROUND_SYNC')) return;

    logger.debug('[BackgroundSyncEngine] Performing periodic incremental sync checks...');

    // Publish event trigger for feature stores
    await eventEngine.publish({
      event_id: `evt_inc_sync_${Date.now()}`,
      topic: 'background_sync',
      event_type: 'periodic_sync_check',
      priority: 'low',
      payload: { timestamp: Date.now() },
      timestamp: Date.now(),
    });
  }

  public getRetryQueueLength(): number {
    return this.retryQueue.length;
  }
}

export const backgroundSyncEngine = BackgroundSyncEngine.getInstance();
