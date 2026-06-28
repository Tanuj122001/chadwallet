import { create } from 'zustand';
import { MarketStats, OHLC, Token } from '../../core/models';
import { LoadingState, TokenSymbol } from '../../core/types';
import { serviceLocator } from '../../services';

export interface MarketState {
  stats: Record<string, MarketStats>;
  history: Record<string, OHLC[]>;
  trending: Token[];
  loadingState: LoadingState;
  fetchStats: (symbol: TokenSymbol) => Promise<void>;
  fetchHistory: (symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL') => Promise<void>;
  fetchTrending: () => Promise<void>;
}

export const useMarketStore = create<MarketState>((set) => ({
  stats: {},
  history: {},
  trending: [],
  loadingState: 'idle',
  fetchStats: async (symbol) => {
    set({ loadingState: 'loading' });
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const stats = await marketRepo.getMarketStats(symbol);
      set(state => ({
        stats: { ...state.stats, [symbol]: stats },
        loadingState: 'success',
      }));
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  fetchHistory: async (symbol, range) => {
    set({ loadingState: 'loading' });
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const ohlc = await marketRepo.getPriceHistory(symbol, range);
      set(state => ({
        history: { ...state.history, [`${symbol}_${range}`]: ohlc },
        loadingState: 'success',
      }));
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  fetchTrending: async () => {
    set({ loadingState: 'loading' });
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const trending = await marketRepo.getTrendingTokens();
      set({ trending, loadingState: 'success' });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
}));
export default useMarketStore;
