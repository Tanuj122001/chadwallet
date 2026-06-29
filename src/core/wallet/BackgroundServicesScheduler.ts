/**
 * Background Services Scheduler — Battery-aware sync periods, market rates trackers, portfolio refresh runs, AI cache updates, and scheduler triggers
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export interface SchedulerMetrics {
  lastPortfolioSync: number;
  lastMarketSync: number;
  lastNotificationSync: number;
  lastAiCacheSync: number;
  syncCount: number;
  batteryAlertCount: number;
}

export class BackgroundServicesScheduler {
  private lastPortfolioSync = 0;
  private lastMarketSync = 0;
  private lastNotificationSync = 0;
  private lastAiCacheSync = 0;
  private syncCount = 0;
  private batteryAlertCount = 0;

  // Sync intervals in milliseconds
  private PORTFOLIO_INTERVAL_NORMAL = 5 * 60 * 1000;      // 5 min
  private PORTFOLIO_INTERVAL_BATTERY_SAVER = 15 * 60 * 1000; // 15 min

  private MARKET_INTERVAL_NORMAL = 2 * 60 * 1000;         // 2 min
  private MARKET_INTERVAL_BATTERY_SAVER = 10 * 60 * 1000;   // 10 min

  private NOTIFICATION_INTERVAL = 1 * 60 * 1000;          // 1 min
  private AI_CACHE_INTERVAL = 30 * 60 * 1000;             // 30 min

  public async runSyncCycle(batteryLevelPercent: number, isBatterySaverActive: boolean): Promise<Record<string, boolean>> {
    if (!featureFlagsManager.isEnabled('ENABLE_BACKGROUND_REFRESH')) {
      logger.warn('[BackgroundScheduler] Background refresh disabled by feature flag.');
      return {};
    }

    const now = Date.now();
    const results: Record<string, boolean> = {
      portfolioSynced: false,
      marketSynced: false,
      notificationSynced: false,
      aiCacheSynced: false,
    };

    // Determine current intervals based on battery saver status
    const isLowBattery = batteryLevelPercent < 20 || isBatterySaverActive;
    const portfolioInterval = isLowBattery ? this.PORTFOLIO_INTERVAL_BATTERY_SAVER : this.PORTFOLIO_INTERVAL_NORMAL;
    const marketInterval = isLowBattery ? this.MARKET_INTERVAL_BATTERY_SAVER : this.MARKET_INTERVAL_NORMAL;

    if (isLowBattery) {
      this.batteryAlertCount++;
      logger.debug(`[BackgroundScheduler] Low battery state detected (${batteryLevelPercent}%). Using battery saver intervals.`);
    }

    // 1. Sync Portfolio
    if (now - this.lastPortfolioSync >= portfolioInterval) {
      logger.debug('[BackgroundScheduler] Refreshing portfolio data...');
      this.lastPortfolioSync = now;
      results.portfolioSynced = true;
    }

    // 2. Sync Market
    if (now - this.lastMarketSync >= marketInterval) {
      logger.debug('[BackgroundScheduler] Refreshing market prices...');
      this.lastMarketSync = now;
      results.marketSynced = true;
    }

    // 3. Sync Notification Queue
    if (now - this.lastNotificationSync >= this.NOTIFICATION_INTERVAL) {
      logger.debug('[BackgroundScheduler] Synchronizing pending notifications queue...');
      this.lastNotificationSync = now;
      results.notificationSynced = true;
    }

    // 4. Sync AI Cache
    if (now - this.lastAiCacheSync >= this.AI_CACHE_INTERVAL) {
      logger.debug('[BackgroundScheduler] Syncing AI predictive recommendations cache...');
      this.lastAiCacheSync = now;
      results.aiCacheSynced = true;
    }

    this.syncCount++;
    return results;
  }

  public getMetrics(): SchedulerMetrics {
    return {
      lastPortfolioSync: this.lastPortfolioSync,
      lastMarketSync: this.lastMarketSync,
      lastNotificationSync: this.lastNotificationSync,
      lastAiCacheSync: this.lastAiCacheSync,
      syncCount: this.syncCount,
      batteryAlertCount: this.batteryAlertCount,
    };
  }

  public resetSyncTimes(): void {
    this.lastPortfolioSync = 0;
    this.lastMarketSync = 0;
    this.lastNotificationSync = 0;
    this.lastAiCacheSync = 0;
    this.syncCount = 0;
    this.batteryAlertCount = 0;
  }
}

export const backgroundServicesScheduler = new BackgroundServicesScheduler();
export default backgroundServicesScheduler;
