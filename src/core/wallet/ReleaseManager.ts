/**
 * ReleaseManager — Minimum version checks, force updates, maintenance modes, remote configs, kill switches, and rollout buckets
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';

export interface RemoteConfig {
  minimumVersion: string;
  isMaintenanceMode: boolean;
  isKillSwitchActive: boolean;
  featureRollouts: Record<string, number>; // Rollout percentages 0 to 100
  abBucketMap: Record<string, string>; // user to bucket configuration mapping
}

export class VersionChecker {
  public static isOutdated(current: string, minimum: string): boolean {
    const parse = (v: string) => v.split('.').map(Number);
    const curr = parse(current);
    const min = parse(minimum);

    for (let i = 0; i < Math.max(curr.length, min.length); i++) {
      const c = curr[i] || 0;
      const m = min[i] || 0;
      if (c < m) return true;
      if (c > m) return false;
    }
    return false;
  }
}

export class ReleaseManager {
  private config: RemoteConfig = {
    minimumVersion: '1.0.0',
    isMaintenanceMode: false,
    isKillSwitchActive: false,
    featureRollouts: {
      'swap_flow_v2': 50,
      'ai_insights': 100,
    },
    abBucketMap: {
      'user_abc': 'bucket_a',
      'user_xyz': 'bucket_b',
    },
  };

  private currentAppVersion = '1.0.0';

  public setAppVersion(version: string): void {
    this.currentAppVersion = version;
  }

  public updateConfig(newConfig: Partial<RemoteConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[ReleaseManager] Remote config updated', this.config);
  }

  public checkUpdateStatus(): { forceUpdateRequired: boolean; latestMinVersion: string } {
    if (!featureFlagsManager.isEnabled('ENABLE_RELEASE_MANAGER')) {
      return { forceUpdateRequired: false, latestMinVersion: this.config.minimumVersion };
    }
    const forceUpdateRequired = VersionChecker.isOutdated(this.currentAppVersion, this.config.minimumVersion);
    if (forceUpdateRequired) {
      logger.warn(`[ReleaseManager] Update forced! Current: ${this.currentAppVersion}, Required: ${this.config.minimumVersion}`);
    }
    return { forceUpdateRequired, latestMinVersion: this.config.minimumVersion };
  }

  public isMaintenanceActive(): boolean {
    if (!featureFlagsManager.isEnabled('ENABLE_RELEASE_MANAGER')) return false;
    return this.config.isMaintenanceMode;
  }

  public isKillSwitchActive(): boolean {
    // If remote kill switch is active (flag override or direct state check)
    if (featureFlagsManager.isEnabled('ENABLE_REMOTE_KILL_SWITCH')) return true;
    return this.config.isKillSwitchActive;
  }

  public isFeatureEnabledForUser(featureKey: string, userId: string): boolean {
    const rolloutPercentage = this.config.featureRollouts[featureKey] || 0;
    if (rolloutPercentage >= 100) return true;
    if (rolloutPercentage <= 0) return false;

    // Simple deterministic user hashing for rollout buckets
    let hash = 0;
    const combined = `${userId}:${featureKey}`;
    for (let i = 0; i < combined.length; i++) {
      hash = combined.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = Math.abs(hash) % 100;
    return score < rolloutPercentage;
  }

  public getAbBucket(userId: string): string {
    return this.config.abBucketMap[userId] || 'default_bucket';
  }

  public getConfig(): RemoteConfig {
    return this.config;
  }
}

export const releaseManager = new ReleaseManager();
export default releaseManager;
