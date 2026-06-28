import { QuoteDTO } from '../../core/api/QuoteDTOs';

export interface IQuoteRepository {
  fetchQuotes(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
    provider?: 'jupiter' | 'orca' | 'raydium';
  }): Promise<QuoteDTO>;
  
  getHealthStatus(): Promise<Record<string, 'healthy' | 'unhealthy'>>;
}
