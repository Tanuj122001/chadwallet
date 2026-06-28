import { ISettingsRepository } from './ISettingsRepository';
import { ILocalDataSource } from '../datasources/LocalDataSource';
import { TradeSettings } from '../../core/models';
import { logger } from '../../utils/logger';

export class SettingsRepository implements ISettingsRepository {
  constructor(private localDataSource: ILocalDataSource) {}

  public async getSettings(): Promise<TradeSettings> {
    try {
      const settings = this.localDataSource.getSettings();
      if (settings) return settings;
      return this.getDefaultSettings();
    } catch (e) {
      logger.error('[SettingsRepository] Error reading settings', e);
      return this.getDefaultSettings();
    }
  }

  public async saveSettings(settings: TradeSettings): Promise<void> {
    try {
      this.localDataSource.saveSettings(settings);
    } catch (e) {
      logger.error('[SettingsRepository] Error saving settings', e);
    }
  }

  private getDefaultSettings(): TradeSettings {
    return {
      slippageBps: 50,
      priorityFeeLevel: 'medium',
      useMevProtection: false,
    };
  }
}
