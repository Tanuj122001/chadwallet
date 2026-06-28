import { create } from 'zustand';
import { PortfolioAnalyticsDTO, PortfolioSnapshotDTO } from '../../core/api/PortfolioAnalyticsDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

// 1. Current Portfolio Stats Store
export interface PortfolioAnalyticsStoreState {
  analytics: PortfolioAnalyticsDTO | null;
  loading: boolean;
  error: string | null;

  loadAnalytics: (address: string, forceRefresh?: boolean) => Promise<void>;
  resetAnalytics: () => void;
}

export const usePortfolioAnalyticsStore = create<PortfolioAnalyticsStoreState>((set) => ({
  analytics: null,
  loading: false,
  error: null,

  loadAnalytics: async (address, forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      const stats = await repo.getPortfolioAnalytics(address, forceRefresh);
      set({ analytics: stats, loading: false });
      logger.info(`[PortfolioAnalyticsStore] Loaded current holdings stats for: ${address}`);
    } catch (err: any) {
      set({ loading: false, error: err.message });
      logger.error('[PortfolioAnalyticsStore] Failed to query current holdings stats', err);
    }
  },

  resetAnalytics: () => {
    set({ analytics: null, loading: false, error: null });
  },
}));

// 2. Portfolio Snapshot History Store
export interface PortfolioHistoryStoreState {
  historySnapshots: PortfolioSnapshotDTO[];
  loading: boolean;
  error: string | null;

  loadHistory: (address: string, forceRefresh?: boolean) => Promise<void>;
  addSnap: (address: string, snapshot: PortfolioSnapshotDTO) => Promise<void>;
}

export const usePortfolioHistoryStore = create<PortfolioHistoryStoreState>((set, get) => ({
  historySnapshots: [],
  loading: false,
  error: null,

  loadHistory: async (address, forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      const list = await repo.getHistoricalSnapshots(address, forceRefresh);
      set({ historySnapshots: list, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  addSnap: async (address, snapshot) => {
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      await repo.addSnapshot(address, snapshot);
      set(state => ({
        historySnapshots: [...state.historySnapshots, snapshot]
      }));
    } catch (err: any) {
      logger.error('[PortfolioHistoryStore] Failed adding new historical snapshot', err);
    }
  },
}));

// 3. Portfolio Risk Insights Store
export interface PortfolioInsightsStoreState {
  diversificationScore: number;
  healthScore: number;
  warnings: string[];
  
  loadInsightsFromAnalytics: (data: PortfolioAnalyticsDTO) => void;
}

export const usePortfolioInsightsStore = create<PortfolioInsightsStoreState>((set) => ({
  diversificationScore: 100,
  healthScore: 100,
  warnings: [],

  loadInsightsFromAnalytics: (data) => {
    set({
      diversificationScore: data.insights.diversification_score,
      healthScore: data.insights.portfolio_health_score,
      warnings: data.insights.warnings,
    });
  },
}));
