import { EventDTO } from './EventDTOs';
import { AlertDTO } from './AlertDTOs';

export interface AIPortfolioContextDTO {
  wallet_address: string;
  total_value_usd: number;
  assets: Array<{
    mint: string;
    symbol: string;
    balance: number;
    price_usd: number;
    value_usd: number;
    percentage: number;
  }>;
  recent_pnl_24h: number;
  recent_roi: number;
  sector_allocations: Record<string, number>;
}

export interface AIMarketContextDTO {
  price_ticks: Record<string, {
    price: number;
    volume_24h?: number;
    mcap?: number;
    previous_price?: number;
  }>;
  trending_tokens: string[];
}

export interface AISecurityContextDTO {
  is_locked: boolean;
  failed_attempts: number;
  recent_threats: AlertDTO[];
}

export interface AIContextSnapshotDTO {
  snapshot_id: string;
  timestamp: number;
  portfolio: AIPortfolioContextDTO;
  market: AIMarketContextDTO;
  security: AISecurityContextDTO;
  recent_events: EventDTO[];
}
