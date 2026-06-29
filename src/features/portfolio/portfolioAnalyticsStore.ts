import { create } from 'zustand';
import { 
  PortfolioAnalyticsDTO, 
  PortfolioSnapshotDTO, 
  PerformanceMetricsDTO
} from '../../core/api/PortfolioAnalyticsDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

// 1. Current Portfolio Stats Store
export interface PortfolioAnalyticsStoreState {
  analytics: PortfolioAnalyticsDTO | null;
  loading: boolean;
  error: string | null;
  cacheStatus: 'none' | 'hit' | 'stale';

  loadAnalytics: (address: string, forceRefresh?: boolean) => Promise<void>;
  resetAnalytics: () => void;
}

export const usePortfolioAnalyticsStore = create<PortfolioAnalyticsStoreState>((set) => ({
  analytics: null,
  loading: false,
  error: null,
  cacheStatus: 'none',

  loadAnalytics: async (address, forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      const stats = await repo.getPortfolioAnalytics(address, forceRefresh);
      set({ 
        analytics: stats, 
        loading: false,
        cacheStatus: forceRefresh ? 'none' : 'hit'
      });
      logger.info(`[PortfolioAnalyticsStore] Loaded current holdings stats for: ${address}`);
    } catch (err: any) {
      set({ loading: false, error: err.message, cacheStatus: 'none' });
      logger.error('[PortfolioAnalyticsStore] Failed to query current holdings stats', err);
    }
  },

  resetAnalytics: () => {
    set({ analytics: null, loading: false, error: null, cacheStatus: 'none' });
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

export const usePortfolioHistoryStore = create<PortfolioHistoryStoreState>((set) => ({
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
  loading: boolean;
  error: string | null;
  
  loadInsightsFromAnalytics: (data: PortfolioAnalyticsDTO) => void;
  fetchInsights: (address: string, forceRefresh?: boolean) => Promise<void>;
}

export const usePortfolioInsightsStore = create<PortfolioInsightsStoreState>((set) => ({
  diversificationScore: 100,
  healthScore: 100,
  warnings: [],
  loading: false,
  error: null,

  loadInsightsFromAnalytics: (data) => {
    set({
      diversificationScore: data.insights.diversification_score,
      healthScore: data.insights.portfolio_health_score,
      warnings: data.insights.warnings,
    });
  },

  fetchInsights: async (address, forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      const stats = await repo.getPortfolioAnalytics(address, forceRefresh);
      set({
        diversificationScore: stats.insights.diversification_score,
        healthScore: stats.insights.portfolio_health_score,
        warnings: stats.insights.warnings,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },
}));

// 4. Portfolio Performance Store
export interface PortfolioPerformanceStoreState {
  performance: PerformanceMetricsDTO | null;
  loading: boolean;
  error: string | null;

  loadPerformance: (address: string, forceRefresh?: boolean) => Promise<void>;
  resetPerformance: () => void;
}

export const usePortfolioPerformanceStore = create<PortfolioPerformanceStoreState>((set) => ({
  performance: null,
  loading: false,
  error: null,

  loadPerformance: async (address, forceRefresh = false) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getPortfolioAnalyticsRepository();
      const stats = await repo.getPortfolioAnalytics(address, forceRefresh);
      set({ performance: stats.performance, loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.message });
    }
  },

  resetPerformance: () => {
    set({ performance: null, loading: false, error: null });
  },
}));
