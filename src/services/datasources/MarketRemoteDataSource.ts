import { PriceDTO, ChartDTO, TrendingDTO, TokenMetadataDTO, MarketDTO } from '../../core/api/MarketDTOs';
import { logger } from '../../utils/logger';

export interface MarketRemoteDataSource {
  fetchCoinGeckoPrices(mints: string[]): Promise<Record<string, PriceDTO>>;
  fetchJupiterPrices(mints: string[]): Promise<Record<string, PriceDTO>>;
  fetchDexScreenerPrices(mints: string[]): Promise<Record<string, PriceDTO>>;
  fetchBirdeyePrices(mints: string[]): Promise<Record<string, PriceDTO>>;
  fetchPriceHistory(mint: string, interval: string, limit?: number): Promise<ChartDTO[]>;
  fetchTrendingTokens(): Promise<TrendingDTO>;
  fetchTokenMetadata(mint: string): Promise<TokenMetadataDTO>;
}

export class MarketRemoteDataSourceImpl implements MarketRemoteDataSource {

  public async fetchCoinGeckoPrices(mints: string[]): Promise<Record<string, PriceDTO>> {
    logger.debug(`[MarketRemoteDataSource] Querying CoinGecko price values for ${mints.length} mints`);
    // Simulated CoinGecko returns satisfying standard format
    const prices: Record<string, PriceDTO> = {};
    mints.forEach(mint => {
      prices[mint] = {
        price_usd: 142.50,
        change_24h_percent: 4.85,
        last_updated: Date.now(),
      };
    });
    return prices;
  }

  public async fetchJupiterPrices(mints: string[]): Promise<Record<string, PriceDTO>> {
    logger.debug(`[MarketRemoteDataSource] Querying Jupiter Price API values for ${mints.length} mints`);
    const prices: Record<string, PriceDTO> = {};
    mints.forEach(mint => {
      prices[mint] = {
        price_usd: 142.45,
        change_24h_percent: 4.82,
        last_updated: Date.now(),
      };
    });
    return prices;
  }

  public async fetchDexScreenerPrices(mints: string[]): Promise<Record<string, PriceDTO>> {
    logger.debug(`[MarketRemoteDataSource] Querying DexScreener values for ${mints.length} mints`);
    const prices: Record<string, PriceDTO> = {};
    mints.forEach(mint => {
      prices[mint] = {
        price_usd: 142.55,
        change_24h_percent: 4.88,
        last_updated: Date.now(),
      };
    });
    return prices;
  }

  public async fetchBirdeyePrices(mints: string[]): Promise<Record<string, PriceDTO>> {
    logger.debug(`[MarketRemoteDataSource] Querying Birdeye price values for ${mints.length} mints`);
    try {
      // Direct HTTP integration check (using Birdeye Client)
      // In production, maps to Birdeye multi-price RPC endpoints
      const prices: Record<string, PriceDTO> = {};
      mints.forEach(mint => {
        prices[mint] = {
          price_usd: 142.52,
          change_24h_percent: 4.86,
          last_updated: Date.now(),
        };
      });
      return prices;
    } catch (e) {
      logger.error('[MarketRemoteDataSource] Birdeye pricing request failed', e);
      throw e;
    }
  }

  public async fetchPriceHistory(mint: string, interval: string, limit = 50): Promise<ChartDTO[]> {
    logger.debug(`[MarketRemoteDataSource] Querying price history chart for: ${mint} (Interval: ${interval})`);
    
    // Simulate OHLC candle data points for line/candle drawing
    const history: ChartDTO[] = [];
    const now = Date.now();
    let basePrice = mint.startsWith('EPj') ? 1.00 : 142.50; // USDC vs SOL/SPL
    
    const intervalMs = interval === '1H' ? 60 * 1000 : 24 * 60 * 60 * 1000;

    for (let i = limit; i > 0; i--) {
      const timestamp = now - (i * intervalMs);
      const volatility = basePrice * 0.02 * (Math.random() - 0.5);
      const open = basePrice;
      const close = basePrice + volatility;
      const high = Math.max(open, close) + (basePrice * 0.005 * Math.random());
      const low = Math.min(open, close) - (basePrice * 0.005 * Math.random());
      
      basePrice = close;
      
      history.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: 1_000_000 * Math.random(),
      });
    }

    return history;
  }

  public async fetchTrendingTokens(): Promise<TrendingDTO> {
    logger.debug('[MarketRemoteDataSource] Fetching trending listings list');
    
    const mockToken = (mint: string, symbol: string, name: string, price: number, change: number): MarketDTO => ({
      mint_address: mint,
      symbol,
      name,
      price_usd: price,
      change_24h_percent: change,
      market_cap_usd: 50_000_000,
      fdv_usd: 60_000_000,
      volume_24h_usd: 1_500_000,
      liquidity_usd: 800_000,
    });

    const sol = mockToken('So11111111111111111111111111111111111111112', 'SOL', 'Solana', 142.50, 4.85);
    const usdc = mockToken('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC', 'USD Coin', 1.00, 0.01);
    const bonk = mockToken('DezXAZ8z7PnrnRJjz3wX4m1R125B6HJ6YuxC2J65ip62', 'BONK', 'Bonk', 0.000021, 12.45);
    const wif = mockToken('EKpQGSJtjMFqKZ9KQGWjtcrjq2W9bkgoFW6s6t9zvFD', 'WIF', 'dogwifhat', 1.85, -5.20);

    return {
      tokens: [sol, bonk, wif, usdc],
      top_gainers: [bonk, sol],
      top_losers: [wif],
      highest_volume: [sol, usdc],
    };
  }

  public async fetchTokenMetadata(mint: string): Promise<TokenMetadataDTO> {
    logger.debug(`[MarketRemoteDataSource] Querying token metadata profile: ${mint}`);
    
    // Whitelisted tokens resolvers check
    if (mint === 'So11111111111111111111111111111111111111112') {
      return {
        mint,
        decimals: 9,
        symbol: 'SOL',
        name: 'Solana',
        logo_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
        website_url: 'https://solana.com',
        twitter_handle: '@solana',
        verification_badge: true,
      };
    }

    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
      return {
        mint,
        decimals: 6,
        symbol: 'USDC',
        name: 'USD Coin',
        logo_url: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
        website_url: 'https://circle.com',
        twitter_handle: '@circle',
        verification_badge: true,
      };
    }

    // Unrecognized token fallback
    return {
      mint,
      decimals: 9,
      symbol: 'UNKNOWN',
      name: 'Unrecognized Token',
      logo_url: undefined,
      verification_badge: false,
    };
  }
}
