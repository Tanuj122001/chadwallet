import { WalletAddress, PublicKey, TokenSymbol, USDValue, Percentage } from '../types';

export interface Token {
  id: string;
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  contractAddress: PublicKey;
  logoUrl?: string;
}

export interface Wallet {
  address: WalletAddress;
  label?: string;
  publicKey: PublicKey;
  balanceSol: number;
  balanceUsd: USDValue;
  isActive: boolean;
}

export interface Holding {
  token: Token;
  amount: number;
  balanceUsd: USDValue;
  change24h: Percentage;
}

export interface Portfolio {
  id: string;
  totalBalanceUsd: USDValue;
  holdings: Holding[];
  change24h: Percentage;
}

export interface SwapQuote {
  quoteId: string;
  inputTokenSymbol: TokenSymbol;
  outputTokenSymbol: TokenSymbol;
  inputAmount: number;
  outputAmount: number;
  priceImpact: Percentage;
  slippageBps: number;
  routePlan: unknown[];
}

export interface SwapTransaction {
  swapTransactionBase64: string;
  quote: SwapQuote;
}

export interface MarketStats {
  liquidity: USDValue;
  fdv: USDValue;
  marketCap: USDValue;
  volume24h: USDValue;
  holdersCount: number;
  circulatingSupply: number;
  totalSupply: number;
}

export interface OHLC {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  type: 'price_alert' | 'transaction' | 'security' | 'general';
}

export interface User {
  id: string;
  email?: string;
  walletAddress?: WalletAddress;
  createdAt: number;
}

export interface Watchlist {
  userId: string;
  tokenSymbols: TokenSymbol[];
}

export interface TradeSettings {
  slippageBps: number;
  priorityFeeLevel: 'low' | 'medium' | 'high' | 'ultra';
  useMevProtection: boolean;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

