/**
 * Network Data Transfer Objects (DTOs) for ChadWallet API client
 */

export interface TokenDTO {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  contract_address: string;
  logo_url?: string;
}

export interface WalletDTO {
  address: string;
  label?: string;
  public_key: string;
  balance_sol: number;
  balance_usd: number;
  is_active: boolean;
  backup_confirmed?: boolean;
}

export interface HoldingDTO {
  token: TokenDTO;
  amount: number;
  balance_usd: number;
  change_24h: number;
}

export interface PortfolioDTO {
  id: string;
  total_balance_usd: number;
  holdings: HoldingDTO[];
  change_24h: number;
}

export interface SwapQuoteDTO {
  quote_id: string;
  input_token_symbol: string;
  output_token_symbol: string;
  input_amount: number;
  output_amount: number;
  price_impact: number;
  slippage_bps: number;
  route_plan: unknown[];
}

export interface SwapTransactionDTO {
  swap_transaction_base64: string;
  quote: SwapQuoteDTO;
}

export interface MarketStatsDTO {
  liquidity_usd: number;
  fdv_usd: number;
  market_cap_usd: number;
  volume_24h_usd: number;
  holders_count: number;
  circulating_supply: number;
  total_supply: number;
}

export interface OHLCDTO {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface NotificationDTO {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  is_read: boolean;
  type: 'price_alert' | 'transaction' | 'security' | 'general';
}

export interface UserDTO {
  id: string;
  email?: string;
  wallet_address?: string;
  created_at: number;
}

export interface SessionDTO {
  access_token: string;
  refresh_token: string;
  user_id: string;
  expires_at: number;
  metadata?: Record<string, unknown>;
}

export interface AuthDTO {
  user: UserDTO;
  session: SessionDTO;
}

