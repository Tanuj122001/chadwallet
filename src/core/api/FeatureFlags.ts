import { logger } from '../../utils/logger';
import { localStorage } from '../storage';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number; // 0 to 100
  abVariants?: string[]; // e.g. ['control', 'variant_a']
}

class FeatureFlagsManager {
  private remoteFlags = new Map<string, FeatureFlag>();
  private localOverrides = new Map<string, boolean>();
  private readonly LOCAL_OVERRIDES_STORAGE_KEY = 'local_feature_flag_overrides';

  constructor() {
    this.loadLocalOverrides();
    this.initializeDefaultFlags();
  }

  private initializeDefaultFlags(): void {
    const defaults: FeatureFlag[] = [
      { key: 'ENABLE_REAL_TRADING', enabled: false },
      { key: 'ENABLE_TRANSACTION_BROADCAST', enabled: false },
      { key: 'ENABLE_MAINNET', enabled: false },
      { key: 'ENABLE_SIMULATION', enabled: true },
      { key: 'ENABLE_MEV_PROTECTION', enabled: true },
      { key: 'ENABLE_SMART_EXECUTION', enabled: true },
    ];
    defaults.forEach(flag => {
      this.remoteFlags.set(flag.key, flag);
    });
  }

  private loadLocalOverrides(): void {
    try {
      const saved = localStorage.getString(this.LOCAL_OVERRIDES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, value]) => {
          this.localOverrides.set(key, value as boolean);
        });
      }
    } catch (e) {
      logger.error('[FeatureFlags] Failed to parse local overrides cache', e);
    }
  }

  private saveLocalOverrides(): void {
    try {
      const obj: Record<string, boolean> = {};
      this.localOverrides.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setString(this.LOCAL_OVERRIDES_STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      logger.error('[FeatureFlags] Failed to save local overrides', e);
    }
  }

  // Set remote flags fetched from backend config
  public setRemoteFlags(flags: FeatureFlag[]): void {
    flags.forEach(flag => {
      this.remoteFlags.set(flag.key, flag);
    });
    logger.info(`[FeatureFlags] Loaded ${flags.length} remote flags.`);
  }

  // Check if feature flag is active - supports Kill Switches, Local Overrides, and Gradual Rollout
  public isEnabled(flagKey: string, userId?: string): boolean {
    // 1. Check Local Override first (takes priority for development/testing)
    if (this.localOverrides.has(flagKey)) {
      const override = this.localOverrides.get(flagKey)!;
      logger.debug(`[FeatureFlags] Override active for flag ${flagKey}: ${override}`);
      return override;
    }

    const flag = this.remoteFlags.get(flagKey);
    if (!flag) {
      // Return false if flag doesn't exist (fail closed)
      return false;
    }

    // 2. Kill Switch check
    if (!flag.enabled) {
      return false;
    }

    // 3. Gradual Rollout evaluation
    if (flag.rolloutPercentage !== undefined && userId) {
      const userHash = this.hashUserId(userId);
      const isIncluded = userHash < flag.rolloutPercentage;
      logger.debug(`[FeatureFlags] Gradual Rollout eval for user ${userId} on ${flagKey}: ${isIncluded} (UserHash: ${userHash}, Rollout: ${flag.rolloutPercentage}%)`);
      return isIncluded;
    }

    return flag.enabled;
  }

  // A/B Testing Bucket Allocator: allocates variant based on stable hashing
  public getVariant(flagKey: string, userId: string): string | null {
    const flag = this.remoteFlags.get(flagKey);
    if (!flag || !flag.enabled || !flag.abVariants || flag.abVariants.length === 0) {
      return null;
    }

    const userHash = this.hashUserId(userId);
    const index = userHash % flag.abVariants.length;
    return flag.abVariants[index] || null;
  }

  // Toggle flags locally for testing (local overrides)
  public setLocalOverride(flagKey: string, enabled: boolean): void {
    this.localOverrides.set(flagKey, enabled);
    this.saveLocalOverrides();
    logger.info(`[FeatureFlags] Local override set: ${flagKey} -> ${enabled}`);
  }

  public clearLocalOverride(flagKey: string): void {
    this.localOverrides.delete(flagKey);
    this.saveLocalOverrides();
  }

  // Basic string stable hashing algorithm returning value 0-99
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 100;
  }
}

export const featureFlagsManager = new FeatureFlagsManager();
export default featureFlagsManager;
