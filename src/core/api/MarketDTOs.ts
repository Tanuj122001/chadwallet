export interface PriceDTO {
  price_usd: number;
  change_24h_percent: number;
  last_updated: number;
}

export interface MarketDTO {
  mint_address: string;
  symbol: string;
  name: string;
  price_usd: number;
  change_24h_percent: number;
  market_cap_usd: number;
  fdv_usd: number;
  volume_24h_usd: number;
  liquidity_usd: number;
  ath_usd?: number;
  atl_usd?: number;
  circulating_supply?: number;
  max_supply?: number;
}

export interface ChartDTO {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TrendingDTO {
  tokens: MarketDTO[];
  top_gainers: MarketDTO[];
  top_losers: MarketDTO[];
  highest_volume: MarketDTO[];
}

export interface TokenMetadataDTO {
  mint: string;
  decimals: number;
  symbol: string;
  name: string;
  logo_url?: string;
  description?: string;
  website_url?: string;
  twitter_handle?: string;
  telegram_handle?: string;
  discord_url?: string;
  verification_badge?: boolean;
}

export interface WatchlistDTO {
  id: string;
  name: string;
  mint_addresses: string[];
  pinned: boolean;
  created_at: number;
}
