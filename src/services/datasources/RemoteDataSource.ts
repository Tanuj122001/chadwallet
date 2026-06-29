import { birdeyeApiClient, jupiterApiClient, supabaseApiClient, authApiClient } from '../../core/api/ApiClient';
import { UserDTO, TokenDTO, PortfolioDTO, SwapQuoteDTO, MarketStatsDTO, OHLCDTO } from '../../core/api/dtos';
import { TokenSymbol, WalletAddress } from '../../core/types';

export interface IRemoteDataSource {
  login(provider: string): Promise<UserDTO>;
  getPortfolio(address: WalletAddress): Promise<PortfolioDTO>;
  getWalletBalance(address: WalletAddress): Promise<number>;
  getMarketStats(symbol: TokenSymbol): Promise<MarketStatsDTO>;
  getPriceHistory(symbol: TokenSymbol, interval: string, limit: number): Promise<OHLCDTO[]>;
  getTrending(): Promise<TokenDTO[]>;
  getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number): Promise<SwapQuoteDTO>;
}

export class RemoteDataSourceImpl implements IRemoteDataSource {
  
  public async login(provider: string): Promise<UserDTO> {
    const response = await authApiClient.post<UserDTO>('/auth/login', { provider });
    return response.data;
  }

  public async getPortfolio(address: WalletAddress): Promise<PortfolioDTO> {
    const response = await supabaseApiClient.get<PortfolioDTO>(`/portfolio/${address}`);
    return response.data;
  }

  public async getWalletBalance(address: WalletAddress): Promise<number> {
    const response = await supabaseApiClient.get<{ balance: number }>(`/wallet/${address}/balance`);
    return response.data.balance;
  }

  public async getMarketStats(symbol: TokenSymbol): Promise<MarketStatsDTO> {
    const response = await birdeyeApiClient.get<MarketStatsDTO>(`/stats?symbol=${symbol}`);
    return response.data;
  }

  public async getPriceHistory(symbol: TokenSymbol, interval: string, limit: number): Promise<OHLCDTO[]> {
    const response = await birdeyeApiClient.get<OHLCDTO[]>(`/ohlc?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    return response.data;
  }

  public async getTrending(): Promise<TokenDTO[]> {
    const response = await birdeyeApiClient.get<TokenDTO[]>('/trending');
    return response.data;
  }

  public async getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number): Promise<SwapQuoteDTO> {
    const response = await jupiterApiClient.get<SwapQuoteDTO>(
      `/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
    );
    return response.data;
  }
}
