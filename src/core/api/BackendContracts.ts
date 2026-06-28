import { UserDTO, SessionDTO, TokenDTO, WalletDTO, PortfolioDTO, SwapQuoteDTO, SwapTransactionDTO, MarketStatsDTO, OHLCDTO, NotificationDTO } from './dtos';
import { ApiResponse, PaginatedResponse } from './contracts';

export interface IAuthenticationBackend {
  signUpWithEmail(email: string, passwordHash: string): Promise<ApiResponse<{ user: UserDTO; session: SessionDTO }>>;
  signInWithEmail(email: string, passwordHash: string): Promise<ApiResponse<{ user: UserDTO; session: SessionDTO }>>;
  forgotPassword(email: string): Promise<ApiResponse<void>>;
  signInWithGoogle(idToken: string): Promise<ApiResponse<{ user: UserDTO; session: SessionDTO }>>;
  signInWithPhone(phoneNumber: string): Promise<ApiResponse<{ confirmationId: string }>>;
  confirmPhoneOTP(confirmationId: string, otpCode: string): Promise<ApiResponse<{ user: UserDTO; session: SessionDTO }>>;
  refreshSession(refreshToken: string): Promise<ApiResponse<SessionDTO>>;
  signOut(accessToken: string): Promise<ApiResponse<void>>;
}

export interface IWalletBackend {
  getWallets(userId: string): Promise<ApiResponse<WalletDTO[]>>;
  saveWallet(userId: string, wallet: WalletDTO): Promise<ApiResponse<WalletDTO>>;
  deleteWallet(userId: string, address: string): Promise<ApiResponse<void>>;
}

export interface IMarketBackend {
  getMarketStats(symbol: string): Promise<ApiResponse<MarketStatsDTO>>;
  getPriceHistory(symbol: string, interval: string, limit: number): Promise<ApiResponse<OHLCDTO[]>>;
  getTrendingTokens(limit: number): Promise<ApiResponse<TokenDTO[]>>;
}

export interface ISwapBackend {
  getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number): Promise<ApiResponse<SwapQuoteDTO>>;
  prepareSwap(quote: SwapQuoteDTO, publicKey: string): Promise<ApiResponse<SwapTransactionDTO>>;
}

export interface IPortfolioBackend {
  getPortfolio(address: string): Promise<ApiResponse<PortfolioDTO>>;
  getUSDBalance(address: string): Promise<ApiResponse<number>>;
}

export interface INotificationsBackend {
  getNotifications(userId: string, limit: number, offset: number): Promise<ApiResponse<PaginatedResponse<NotificationDTO>>>;
  markAsRead(userId: string, notificationId: string): Promise<ApiResponse<void>>;
  markAllAsRead(userId: string): Promise<ApiResponse<void>>;
}

export interface IAnalyticsBackend {
  logEvent(userId: string | null, event: string, params?: Record<string, unknown>): Promise<ApiResponse<void>>;
  logScreen(userId: string | null, screenName: string): Promise<ApiResponse<void>>;
}

export interface IRemoteConfigBackend {
  fetchRemoteConfig(): Promise<ApiResponse<Record<string, unknown>>>;
}

export interface IFeatureFlagsBackend {
  fetchFeatureFlags(userId: string | null): Promise<ApiResponse<Record<string, boolean>>>;
}
