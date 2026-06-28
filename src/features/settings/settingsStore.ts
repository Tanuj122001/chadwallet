import { create } from 'zustand';
import { TradeSettings } from '../../core/models';
import { serviceLocator } from '../../services';

export interface SettingsState {
  settings: TradeSettings;
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<TradeSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    slippageBps: 50,
    priorityFeeLevel: 'medium',
    useMevProtection: false,
  },
  fetchSettings: async () => {
    try {
      const settingsRepo = serviceLocator.getSettingsRepository();
      const settings = await settingsRepo.getSettings();
      set({ settings });
    } catch {}
  },
  updateSettings: async (newSettings) => {
    const updated = { ...get().settings, ...newSettings };
    set({ settings: updated });
    try {
      const settingsRepo = serviceLocator.getSettingsRepository();
      await settingsRepo.saveSettings(updated);
    } catch {}
  },
}));
export default useSettingsStore;
