export interface AssetAllocationDTO {
  sectors: Record<string, number>; // e.g. { DeFi: 0.4, Memes: 0.3, Stablecoins: 0.3 }
  tokens: Record<string, number>; // e.g. { SOL: 0.5, USDC: 0.3, BONK: 0.2 }
  largest_holding_mint: string;
  smallest_holding_mint: string;
  dust_mints: string[];
  spam_mints: string[];
}

export interface PnLMetricsDTO {
  realized_pnl_usd: number;
  unrealized_pnl_usd: number;
  cost_basis_usd: number;
  roi_percent: number;
  win_rate: number; // 0 to 1
  loss_rate: number; // 0 to 1
  average_holding_time_seconds: number;
  biggest_winner_symbol: string;
  biggest_loser_symbol: string;
  volatility_percent: number;
  sharpe_ratio: number;
  sortino_ratio: number;
}

export interface PerformanceMetricsDTO {
  twr_percent: number; // Time-Weighted Return
  mwr_percent: number; // Money-Weighted Return
  net_deposits_usd: number;
  net_withdrawals_usd: number;
  total_gas_fees_usd: number;
  total_swap_costs_usd: number;
  total_trades_count: number;
  average_trade_size_usd: number;
}

export interface RiskInsightsDTO {
  diversification_score: number; // 0 to 100
  portfolio_health_score: number; // 0 to 100
  risk_score: number; // 0 to 100
  capital_efficiency_score: number; // 0 to 100
  warnings: string[];
}

export interface PortfolioSnapshotDTO {
  snapshot_id: string;
  timestamp: number;
  net_worth_usd: number;
  change_24h_usd: number;
  change_24h_percent: number;
  allocation: AssetAllocationDTO;
}

export interface PortfolioAnalyticsDTO {
  address: string;
  net_worth_usd: number;
  change_24h_usd: number;
  change_24h_percent: number;
  change_7d_percent: number;
  change_30d_percent: number;
  change_90d_percent: number;
  change_1y_percent: number;
  all_time_performance_percent: number;
  pnl: PnLMetricsDTO;
  allocation: AssetAllocationDTO;
  performance: PerformanceMetricsDTO;
  insights: RiskInsightsDTO;
  timestamp: number;
}
