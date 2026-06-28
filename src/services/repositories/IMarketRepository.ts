import { MarketStats, OHLC, Token } from '../../core/models';
import { TokenSymbol } from '../../core/types';
import { PriceDTO, WatchlistDTO, TokenMetadataDTO } from '../../core/api/MarketDTOs';

export interface IMarketRepository {
  getMarketStats(symbol: TokenSymbol): Promise<MarketStats>;
  getPriceHistory(symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'): Promise<OHLC[]>;
  getTrendingTokens(): Promise<Token[]>;
  
  // Market Engine additions
  getPrices(mints: string[]): Promise<Record<string, PriceDTO>>;
  getWatchlists(): Promise<WatchlistDTO[]>;
  saveWatchlists(watchlists: WatchlistDTO[]): Promise<void>;
  getSearchHistory(): Promise<string[]>;
  saveSearchHistory(history: string[]): Promise<void>;
  getTokenMetadata(mint: string): Promise<TokenMetadataDTO>;
}
