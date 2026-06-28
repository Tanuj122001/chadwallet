import { localStorage } from '../../core/storage';
import { WatchlistDTO, MarketDTO } from '../../core/api/MarketDTOs';
import { logger } from '../../utils/logger';

export interface MarketLocalDataSource {
  getWatchlists(): Promise<WatchlistDTO[]>;
  saveWatchlists(watchlists: WatchlistDTO[]): Promise<void>;
  getSearchHistory(): Promise<string[]>;
  saveSearchHistory(history: string[]): Promise<void>;
  getCachedPrices(): Promise<Record<string, MarketDTO>>;
  saveCachedPrices(prices: Record<string, MarketDTO>): Promise<void>;
}

export class MarketLocalDataSourceImpl implements MarketLocalDataSource {
  private readonly WATCHLISTS_KEY = 'chad_watchlists_v1';
  private readonly SEARCH_HISTORY_KEY = 'chad_search_history_v1';
  private readonly PRICES_CACHE_KEY = 'chad_prices_cache_v1';

  public async getWatchlists(): Promise<WatchlistDTO[]> {
    logger.debug('[MarketLocalDataSource] Loading watchlists');
    const data = localStorage.getString(this.WATCHLISTS_KEY);
    if (!data) {
      // Return a default watchlist containing SOL and USDC
      const defaultWatchlist: WatchlistDTO = {
        id: 'wl_default',
        name: 'My Favorites',
        mint_addresses: [
          'So11111111111111111111111111111111111111112',
          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
        ],
        pinned: true,
        created_at: Date.now(),
      };
      return [defaultWatchlist];
    }
    try {
      return JSON.parse(data) as WatchlistDTO[];
    } catch {
      return [];
    }
  }

  public async saveWatchlists(watchlists: WatchlistDTO[]): Promise<void> {
    logger.debug(`[MarketLocalDataSource] Saving ${watchlists.length} watchlists`);
    localStorage.setString(this.WATCHLISTS_KEY, JSON.stringify(watchlists));
  }

  public async getSearchHistory(): Promise<string[]> {
    const data = localStorage.getString(this.SEARCH_HISTORY_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as string[];
    } catch {
      return [];
    }
  }

  public async saveSearchHistory(history: string[]): Promise<void> {
    localStorage.setString(this.SEARCH_HISTORY_KEY, JSON.stringify(history));
  }

  public async getCachedPrices(): Promise<Record<string, MarketDTO>> {
    const data = localStorage.getString(this.PRICES_CACHE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data) as Record<string, MarketDTO>;
    } catch {
      return {};
    }
  }

  public async saveCachedPrices(prices: Record<string, MarketDTO>): Promise<void> {
    localStorage.setString(this.PRICES_CACHE_KEY, JSON.stringify(prices));
  }
}
