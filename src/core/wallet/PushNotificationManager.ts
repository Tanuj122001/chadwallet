/**
 * Push Notification Manager — Preferences, Notification adaptors (Price, Portfolio, Execution, Security, AI, Fraud alerts), local buffers, queue depth, and retry pipelines
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export type AlertType = 'price' | 'portfolio' | 'execution' | 'security' | 'ai' | 'fraud';

export interface PushNotificationPayload {
  id: string;
  type: AlertType;
  title: string;
  body: string;
  data: Record<string, string>;
  timestamp: number;
}

export interface NotificationPreferences {
  enablePriceAlerts: boolean;
  enablePortfolioAlerts: boolean;
  enableExecutionAlerts: boolean;
  enableSecurityAlerts: boolean;
  enableAiAlerts: boolean;
  enableFraudAlerts: boolean;
}

export interface INotificationProvider {
  name: string;
  sendNotification(payload: PushNotificationPayload): Promise<{ delivered: boolean; messageId: string }>;
}

export class MockFirebasePushProvider implements INotificationProvider {
  public name = 'firebase_fcm';

  public async sendNotification(payload: PushNotificationPayload): Promise<{ delivered: boolean; messageId: string }> {
    logger.info(`[FCMProvider] Forwarding message ${payload.id} of type ${payload.type} with title "${payload.title}"`);
    return { delivered: true, messageId: `fcm_msg_${payload.id}` };
  }
}

// ---------------------------------------------------------
// PushManager Orchestrator & Local Queues
// ---------------------------------------------------------

export class PushManager {
  private providers: INotificationProvider[] = [];
  private preferences: NotificationPreferences = {
    enablePriceAlerts: true,
    enablePortfolioAlerts: true,
    enableExecutionAlerts: true,
    enableSecurityAlerts: true,
    enableAiAlerts: true,
    enableFraudAlerts: true,
  };

  private pendingQueue: PushNotificationPayload[] = [];
  private retryQueue: { payload: PushNotificationPayload; attempts: number }[] = [];
  private readonly MAX_RETRY_ATTEMPTS = 3;

  constructor() {
    this.providers.push(new MockFirebasePushProvider());
  }

  public registerProvider(provider: INotificationProvider): void {
    this.providers.push(provider);
  }

  public updatePreferences(prefs: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...prefs };
    logger.info('[PushManager] Notification preferences updated', this.preferences);
  }

  public getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  public isAlertAllowed(type: AlertType): boolean {
    switch (type) {
      case 'price': return this.preferences.enablePriceAlerts;
      case 'portfolio': return this.preferences.enablePortfolioAlerts;
      case 'execution': return this.preferences.enableExecutionAlerts;
      case 'security': return this.preferences.enableSecurityAlerts;
      case 'ai': return this.preferences.enableAiAlerts;
      case 'fraud': return this.preferences.enableFraudAlerts;
      default: return false;
    }
  }

  public async enqueueNotification(payload: PushNotificationPayload): Promise<void> {
    if (!featureFlagsManager.isEnabled('ENABLE_PUSH_NOTIFICATIONS')) {
      logger.warn('[PushManager] Push notifications disabled by feature flag');
      return;
    }

    if (!this.isAlertAllowed(payload.type)) {
      logger.debug(`[PushManager] Dropped notification ${payload.id} of type ${payload.type} based on preferences`);
      return;
    }

    this.pendingQueue.push(payload);
    logger.debug(`[PushManager] Enqueued notification: ${payload.id} (Queue depth = ${this.pendingQueue.length})`);
    
    // Auto-process queue
    await this.processQueue();
  }

  public async processQueue(): Promise<void> {
    if (this.pendingQueue.length === 0) return;

    const batch = [...this.pendingQueue];
    this.pendingQueue = [];

    for (const payload of batch) {
      let sent = false;
      for (const provider of this.providers) {
        try {
          const res = await provider.sendNotification(payload);
          if (res.delivered) {
            sent = true;
            logger.info(`[PushManager] Successfully delivered push notification ${payload.id} via ${provider.name}`);
            break;
          }
        } catch (err) {
          logger.warn(`[PushManager] Provider ${provider.name} failed to deliver notification ${payload.id}`, err);
        }
      }

      if (!sent) {
        this.enqueueForRetry(payload);
      }
    }
  }

  private enqueueForRetry(payload: PushNotificationPayload): void {
    const existing = this.retryQueue.find(r => r.payload.id === payload.id);
    if (existing) {
      existing.attempts++;
      if (existing.attempts > this.MAX_RETRY_ATTEMPTS) {
        logger.error(`[PushManager] Failed to deliver notification ${payload.id} after maximum retry attempts. Dropping payload.`);
        this.retryQueue = this.retryQueue.filter(r => r.payload.id !== payload.id);
      }
    } else {
      this.retryQueue.push({ payload, attempts: 1 });
      logger.warn(`[PushManager] Notification ${payload.id} added to offline retry pipeline (Attempts = 1)`);
    }
  }

  public async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const list = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of list) {
      let sent = false;
      for (const provider of this.providers) {
        try {
          const res = await provider.sendNotification(item.payload);
          if (res.delivered) {
            sent = true;
            logger.info(`[PushManager] Successfully delivered push notification ${item.payload.id} via ${provider.name}`);
            break;
          }
        } catch (err) {
          logger.warn(`[PushManager] Provider ${provider.name} failed to deliver notification ${item.payload.id}`, err);
        }
      }

      if (!sent) {
        item.attempts++;
        if (item.attempts > this.MAX_RETRY_ATTEMPTS) {
          logger.error(`[PushManager] Failed to deliver notification ${item.payload.id} after maximum retry attempts. Dropping payload.`);
        } else {
          this.retryQueue.push(item);
        }
      }
    }
  }

  public getPendingQueueSize(): number {
    return this.pendingQueue.length;
  }

  public getRetryQueueSize(): number {
    return this.retryQueue.length;
  }

  public clearQueues(): void {
    this.pendingQueue = [];
    this.retryQueue = [];
  }
}

export const pushNotificationManager = new PushManager();
export default pushNotificationManager;
