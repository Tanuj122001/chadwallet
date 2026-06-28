import { logger } from '../../utils/logger';
import { AppConfig } from '../../config';

export interface RemoteConfigPayload {
  maintenanceMode: boolean;
  minVersion: string;
  latestVersion: string;
  emergencyShutdown: boolean;
  rpcEndpoints: string[];
}

class RemoteConfigManager {
  private config: RemoteConfigPayload = {
    maintenanceMode: false,
    minVersion: '1.0.0',
    latestVersion: '1.0.0',
    emergencyShutdown: false,
    rpcEndpoints: [],
  };

  public updateConfig(newConfig: Partial<RemoteConfigPayload>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('[RemoteConfig] Remote config payload updated.', this.config);
  }

  public isMaintenanceModeActive(): boolean {
    return this.config.maintenanceMode;
  }

  public isEmergencyShutdownActive(): boolean {
    return this.config.emergencyShutdown;
  }

  // Version Comparison: checks if client local version falls below required minimum version
  public isUpdateRequired(currentVersionStr: string = AppConfig.version): boolean {
    return this.compareVersions(currentVersionStr, this.config.minVersion) < 0;
  }

  public isNewerVersionAvailable(currentVersionStr: string = AppConfig.version): boolean {
    return this.compareVersions(currentVersionStr, this.config.latestVersion) < 0;
  }

  public getRpcEndpoints(): string[] {
    return this.config.rpcEndpoints;
  }

  /**
   * Helper function to compare semver versions (major.minor.patch)
   * Returns:
   *   1 if v1 > v2
   *  -1 if v1 < v2
   *   0 if equal
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    const maxLen = Math.max(parts1.length, parts2.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}

export const remoteConfigManager = new RemoteConfigManager();
export default remoteConfigManager;
