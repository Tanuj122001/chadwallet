import { TradeSettings } from '../../core/models';

export interface ISettingsRepository {
  getSettings(): Promise<TradeSettings>;
  saveSettings(settings: TradeSettings): Promise<void>;
}
