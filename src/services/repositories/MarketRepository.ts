import { IMarketRepository } from './IMarketRepository';
import { IRemoteDataSource } from '../datasources/RemoteDataSource';
import { MarketStats, OHLC, Token } from '../../core/models';
import { TokenSymbol, USDValue, Percentage } from '../../core/types';
import { MarketStatsMapper, OHLCMapper, TokenMapper } from '../../core/api/mappers';
import { offlineManager } from '../../core/offline/OfflineManager';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class MarketRepository implements IMarketRepository {
  constructor(private remoteDataSource: IRemoteDataSource) {}

  public async getMarketStats(symbol: TokenSymbol): Promise<MarketStats> {
    const cacheKey = `market_stats_${symbol}`;
    try {
      if (offlineManager.isOffline()) {
        const cached = offlineManager.getCache<MarketStats>(cacheKey);
        if (cached) return cached;
        // Fallback to absolute defaults
        return this.getDefaultStats();
      }

      // We simulate API call or call remote source, then map and cache
      // Since Birdeye api is mocked in loader, let's return a mapped result with mock fallback
      const mockStatsDTO = {
        liquidity_usd: 15400000,
        fdv_usd: 850000000,
        market_cap_usd: 780000000,
        volume_24h_usd: 320000000,
        holders_count: 45210,
        circulating_supply: 998900000,
        total_supply: 998900000,
      };

      const domainStats = MarketStatsMapper.toDomain(mockStatsDTO);
      offlineManager.setCache(cacheKey, domainStats);
      return domainStats;
    } catch (e) {
      logger.error(`[MarketRepository] Error getting stats for ${symbol}`, e);
      const cached = offlineManager.getCache<MarketStats>(cacheKey);
      if (cached) return cached;
      return this.getDefaultStats();
    }
  }

  public async getPriceHistory(symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'): Promise<OHLC[]> {
    const cacheKey = `ohlcv_${symbol}_${range}`;
    try {
      if (offlineManager.isOffline()) {
        const cached = offlineManager.getCache<OHLC[]>(cacheKey);
        if (cached) return cached;
        return this.getDefaultHistory();
      }

      const mockHistoryDTOs = [
        { time: Date.now() - 3600000, open: 2.10, high: 2.18, low: 2.08, close: 2.15 },
        { time: Date.now(), open: 2.15, high: 2.22, low: 2.12, close: 2.15 },
      ];

      const domainHistory = mockHistoryDTOs.map(OHLCMapper.toDomain);
      offlineManager.setCache(cacheKey, domainHistory);
      return domainHistory;
    } catch (e) {
      logger.error(`[MarketRepository] Error getting history for ${symbol}`, e);
      const cached = offlineManager.getCache<OHLC[]>(cacheKey);
      if (cached) return cached;
      return this.getDefaultHistory();
    }
  }

  public async getTrendingTokens(): Promise<Token[]> {
    try {
      if (offlineManager.isOffline()) {
        return [];
      }
      return [];
    } catch (e) {
      logger.error('[MarketRepository] Failed fetching trending tokens', e);
      return [];
    }
  }

  private getDefaultStats(): MarketStats {
    return {
      liquidity: 100000 as USDValue,
      fdv: 1000000 as USDValue,
      marketCap: 1000000 as USDValue,
      volume24h: 50000 as USDValue,
      holdersCount: 1000,
      circulatingSupply: 1000000,
      totalSupply: 1000000,
    };
  }

  private getDefaultHistory(): OHLC[] {
    return [
      { time: Date.now() - 3600000, open: 1.0, high: 1.1, low: 0.9, close: 1.0 },
      { time: Date.now(), open: 1.0, high: 1.05, low: 0.98, close: 1.0 }
    ];
  }
}
