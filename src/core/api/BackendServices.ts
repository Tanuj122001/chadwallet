import {
  Token,
  Wallet,
  Portfolio,
  SwapQuote,
  SwapTransaction,
  MarketStats,
  OHLC,
  Notification,
  User,
  TradeSettings,
} from '../models';
import { TokenSymbol, WalletAddress } from '../types';
import { ApiResponse, PaginatedResponse } from './contracts';

export interface WalletService {
  getWallet(address: WalletAddress): Promise<ApiResponse<Wallet>>;
  createWallet(label?: string): Promise<ApiResponse<Wallet>>;
  importWallet(mnemonic: string, label?: string): Promise<ApiResponse<Wallet>>;
  getActiveWallet(): Promise<ApiResponse<Wallet | null>>;
  setActiveWallet(address: WalletAddress): Promise<ApiResponse<void>>;
}

export interface MarketService {
  getMarketStats(symbol: TokenSymbol): Promise<ApiResponse<MarketStats>>;
  getPriceHistory(symbol: TokenSymbol, range: string): Promise<ApiResponse<OHLC[]>>;
  getTrendingTokens(limit: number): Promise<ApiResponse<Token[]>>;
}

export interface SwapService {
  getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
  }): Promise<ApiResponse<SwapQuote>>;
  prepareSwapTransaction(quote: SwapQuote, userPublicKey: string): Promise<ApiResponse<SwapTransaction>>;
}

export interface PortfolioService {
  getPortfolio(address: WalletAddress): Promise<ApiResponse<Portfolio>>;
  getUSDBalance(address: WalletAddress): Promise<ApiResponse<number>>;
}

export interface NotificationService {
  getNotifications(limit: number, offset: number): Promise<ApiResponse<PaginatedResponse<Notification>>>;
  markAsRead(notificationId: string): Promise<ApiResponse<void>>;
  markAllAsRead(): Promise<ApiResponse<void>>;
}

export interface AnalyticsService {
  trackEvent(event: string, properties?: Record<string, unknown>): Promise<ApiResponse<void>>;
  trackScreen(screenName: string): Promise<ApiResponse<void>>;
}

export interface UserService {
  getUserProfile(userId: string): Promise<ApiResponse<User>>;
  updateUserProfile(userId: string, profile: Partial<User>): Promise<ApiResponse<User>>;
}

export interface TransactionService {
  sendTransaction(rawTxBase64: string): Promise<ApiResponse<string>>;
  getTransactionReceipt(signature: string): Promise<ApiResponse<{ confirmations: number; slot: number }>>;
}

export interface SettingsService {
  getSettings(): Promise<ApiResponse<TradeSettings>>;
  updateSettings(settings: Partial<TradeSettings>): Promise<ApiResponse<TradeSettings>>;
}
