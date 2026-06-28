import { MarketStats, OHLC, Token } from '../../core/models';
import { TokenSymbol } from '../../core/types';

export interface IMarketRepository {
  getMarketStats(symbol: TokenSymbol): Promise<MarketStats>;
  getPriceHistory(symbol: TokenSymbol, range: '1H' | '4H' | '1D' | '1W' | '1M' | '1Y' | 'ALL'): Promise<OHLC[]>;
  getTrendingTokens(): Promise<Token[]>;
}
