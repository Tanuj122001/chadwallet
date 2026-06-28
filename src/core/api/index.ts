import { ApiResponse, WalletAddress, TokenSymbol } from '../types';
import { SwapQuote, SwapTransaction, MarketStats, OHLC, Token } from '../models';


export interface PrivyClient {
  loginWithOAuth(provider: 'google' | 'apple' | 'twitter'): Promise<ApiResponse<{ token: string; userId: string }>>;
  linkWallet(address: WalletAddress): Promise<ApiResponse<{ signature: string }>>;
  logout(): Promise<void>;
}

export interface JupiterClient {
  getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
  }): Promise<ApiResponse<SwapQuote>>;
  
  swap(params: {
    quoteResponse: SwapQuote;
    userPublicKey: string;
    wrapUnwrapSOL?: boolean;
  }): Promise<ApiResponse<SwapTransaction>>;
}

export interface BirdeyeClient {
  getMarketStats(symbol: TokenSymbol): Promise<ApiResponse<MarketStats>>;
  getOHLCV(symbol: TokenSymbol, interval: '1m' | '5m' | '15m' | '1h' | '1d', limit: number): Promise<ApiResponse<OHLC[]>>;
  getTrendingTokens(limit: number): Promise<ApiResponse<Token[]>>;
}

// Alchemy solana JSON-RPC node provider client
export interface AlchemyClient {
  sendTransaction(rawTxBase64: string): Promise<ApiResponse<string>>;
  getTransactionReceipt(signature: string): Promise<ApiResponse<{ confirmations: number; slot: number }>>;
  getBalance(address: WalletAddress): Promise<ApiResponse<number>>;
}

// Supabase cloud database backend client
export interface SupabaseClient {
  saveWatchlist(userId: string, symbols: TokenSymbol[]): Promise<ApiResponse<void>>;
  getWatchlist(userId: string): Promise<ApiResponse<TokenSymbol[]>>;
  saveUserSettings(userId: string, settings: unknown): Promise<ApiResponse<void>>;
}

export * from './ApiClient';
export * from './contracts';
export * from './dtos';
export * from './mappers';
export * from './FirebaseAuthClient';
export * from './BackendServices';
export * from './BackendContracts';
export * from './RequestPipeline';
export * from './ResponsePipeline';
export * from './VersionResolver';
export * from './FeatureFlags';
export * from './RemoteConfig';
export * from './PaginationEngine';
export * from './CacheEngine';
export * from './Observability';
export * from './SecurityPipeline';
export * from './MarketDTOs';
export * from './QuoteDTOs';
export * from './SwapDTOs';
export * from './TransactionDTOs';
export * from './ExecutionDTOs';
export * from './SimulationDTOs';

