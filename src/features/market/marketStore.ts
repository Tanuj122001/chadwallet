import { create } from 'zustand';
import { MarketStats, OHLC, Token } from '../../core/models';
import { LoadingState, TokenSymbol } from '../../core/types';
import { serviceLocator } from '../../services';
import { PriceDTO, WatchlistDTO, MarketDTO } from '../../core/api/MarketDTOs';
import { SearchEngine } from '../../core/wallet/MarketEngine';
import { logger } from '../../utils/logger';

// ---------------------------------------------------------
// 1. Market Store (Price feeds and provider routing status)
// ---------------------------------------------------------

export interface MarketState {
  stats: Record<string, MarketStats>;
  history: Record<string, OHLC[]>;
  trending: Token[];
  prices: Record<string, PriceDTO>;
  loadingState: LoadingState;
  
  fetchStats: (symbol: TokenSymbol) => Promise<void>;
  fetchHistory: (symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL') => Promise<void>;
  fetchTrending: () => Promise<void>;
  fetchPrices: (mints: string[]) => Promise<void>;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stats: {},
  history: {},
  trending: [],
  prices: {},
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

  fetchPrices: async (mints) => {
    if (mints.length === 0) return;
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const priceMap = await marketRepo.getPrices(mints);
      
      set(state => ({
        prices: { ...state.prices, ...priceMap },
      }));
    } catch (err) {
      logger.error('[MarketStore] Price fetch failed', err);
    }
  },
}));

// ---------------------------------------------------------
// 2. Watchlist Store (Offline persistence & pinned assets)
// ---------------------------------------------------------

export interface WatchlistState {
  watchlists: WatchlistDTO[];
  loading: boolean;
  
  loadWatchlists: () => Promise<void>;
  createWatchlist: (name: string) => Promise<void>;
  addToWatchlist: (watchlistId: string, mint: string) => Promise<void>;
  removeFromWatchlist: (watchlistId: string, mint: string) => Promise<void>;
  togglePinWatchlist: (watchlistId: string) => Promise<void>;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlists: [],
  loading: false,

  loadWatchlists: async () => {
    set({ loading: true });
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const watchlists = await marketRepo.getWatchlists();
      set({ watchlists, loading: false });
    } catch (e) {
      set({ loading: false });
    }
  },

  createWatchlist: async (name) => {
    try {
      const newWatchlist: WatchlistDTO = {
        id: 'wl_' + Math.random().toString(36).substr(2, 9),
        name,
        mint_addresses: [],
        pinned: false,
        created_at: Date.now(),
      };
      
      const updated = [...get().watchlists, newWatchlist];
      set({ watchlists: updated });
      
      const marketRepo = serviceLocator.getMarketRepository();
      await marketRepo.saveWatchlists(updated);
    } catch (e) {
      logger.error('[WatchlistStore] Failed to create watchlist', e);
    }
  },

  addToWatchlist: async (watchlistId, mint) => {
    const updated = get().watchlists.map(wl => {
      if (wl.id === watchlistId && !wl.mint_addresses.includes(mint)) {
        return { ...wl, mint_addresses: [...wl.mint_addresses, mint] };
      }
      return wl;
    });

    set({ watchlists: updated });
    const marketRepo = serviceLocator.getMarketRepository();
    await marketRepo.saveWatchlists(updated);
  },

  removeFromWatchlist: async (watchlistId, mint) => {
    const updated = get().watchlists.map(wl => {
      if (wl.id === watchlistId) {
        return { ...wl, mint_addresses: wl.mint_addresses.filter(m => m !== mint) };
      }
      return wl;
    });

    set({ watchlists: updated });
    const marketRepo = serviceLocator.getMarketRepository();
    await marketRepo.saveWatchlists(updated);
  },

  togglePinWatchlist: async (watchlistId) => {
    const updated = get().watchlists.map(wl => {
      if (wl.id === watchlistId) {
        return { ...wl, pinned: !wl.pinned };
      }
      return wl;
    });

    set({ watchlists: updated });
    const marketRepo = serviceLocator.getMarketRepository();
    await marketRepo.saveWatchlists(updated);
  },
}));

// ---------------------------------------------------------
// 3. Search Store (Fuzzy match caching & recent history)
// ---------------------------------------------------------

export interface SearchState {
  query: string;
  searchResults: MarketDTO[];
  searchHistory: string[];
  loading: boolean;
  
  setQuery: (query: string) => void;
  loadHistory: () => Promise<void>;
  executeSearch: (availableTokens: MarketDTO[]) => void;
  addSearchToHistory: (term: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  searchResults: [],
  searchHistory: [],
  loading: false,

  setQuery: (query) => set({ query }),

  loadHistory: async () => {
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const searchHistory = await marketRepo.getSearchHistory();
      set({ searchHistory });
    } catch {}
  },

  executeSearch: (availableTokens) => {
    const query = get().query;
    if (!query) {
      set({ searchResults: [] });
      return;
    }

    set({ loading: true });
    const results = SearchEngine.fuzzySearch(query, availableTokens);
    set({ searchResults: results, loading: false });
  },

  addSearchToHistory: async (term) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    
    let history = get().searchHistory.filter(h => h !== cleaned);
    history = [cleaned, ...history].slice(0, 10); // Keep top 10 queries

    set({ searchHistory: history });
    const marketRepo = serviceLocator.getMarketRepository();
    await marketRepo.saveSearchHistory(history);
  },

  clearHistory: async () => {
    set({ searchHistory: [] });
    const marketRepo = serviceLocator.getMarketRepository();
    await marketRepo.saveSearchHistory([]);
  },
}));

// ---------------------------------------------------------
// 4. Chart Store (OHLC intervals & TradingView hooks)
// ---------------------------------------------------------

export interface ChartState {
  chartData: Record<string, OHLC[]>;
  activeInterval: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL';
  loading: boolean;

  fetchChartData: (symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL') => Promise<void>;
  setInterval: (range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL') => void;
}

export const useChartStore = create<ChartState>((set, get) => ({
  chartData: {},
  activeInterval: '1D',
  loading: false,

  fetchChartData: async (symbol, range) => {
    set({ loading: true });
    try {
      const marketRepo = serviceLocator.getMarketRepository();
      const ohlc = await marketRepo.getPriceHistory(symbol, range);
      set(state => ({
        chartData: { ...state.chartData, [`${symbol}_${range}`]: ohlc },
        loading: false,
      }));
    } catch (e) {
      set({ loading: false });
    }
  },

  setInterval: (activeInterval) => set({ activeInterval }),
}));

export default useMarketStore;
