import { IQuoteRepository } from './IQuoteRepository';
import { QuoteRemoteDataSource } from '../datasources/QuoteRemoteDataSource';
import { QuoteDTO } from '../../core/api/QuoteDTOs';
import { quoteEngine } from '../../core/wallet/QuoteEngine';
import { cacheEngine } from '../../core/api/CacheEngine';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class QuoteRepository implements IQuoteRepository {
  private providerHealth: Record<string, 'healthy' | 'unhealthy'> = {
    jupiter: 'healthy',
    orca: 'healthy',
    raydium: 'healthy',
  };

  constructor(private remoteDS: QuoteRemoteDataSource) {}

  public async fetchQuotes(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
    provider?: 'jupiter' | 'orca' | 'raydium';
  }): Promise<QuoteDTO> {
    const { inputMint, outputMint, amount, slippageBps, provider = 'jupiter' } = params;

    const cacheKey = `quote_${inputMint}_${outputMint}_${amount}_${slippageBps}_${provider}`;
    
    // Serve quote from cache if hit (TTL 10 seconds to ensure freshness of pricing quotes)
    return cacheEngine.staleWhileRevalidate(cacheKey, async () => {
      try {
        let quote: QuoteDTO;

        if (provider === 'orca') {
          quote = await this.remoteDS.fetchOrcaQuote(inputMint, outputMint, amount, slippageBps);
        } else if (provider === 'raydium') {
          quote = await this.remoteDS.fetchRaydiumQuote(inputMint, outputMint, amount, slippageBps);
        } else {
          quote = await this.remoteDS.fetchJupiterQuote(inputMint, outputMint, amount, slippageBps);
        }

        // Enrich quote payload with risk checks from RiskEngine
        const riskWarnings = quoteEngine.getRiskEngine().evaluateRisk(
          inputMint,
          outputMint,
          quote.price_impact_percent,
          15000 // mock liquidity metrics (e.g. $15k)
        );

        const enrichedQuote = {
          ...quote,
          risk_warnings: riskWarnings,
        };

        this.providerHealth[provider] = 'healthy';
        return enrichedQuote;
      } catch (err: any) {
        this.providerHealth[provider] = 'unhealthy';
        logger.error(`[QuoteRepository] Failed to fetch quote for ${provider}`, err);
        throw new RepositoryError('QUOTE_FETCH_FAILED', `Failed to retrieve quote details: ${err.message}`, err);
      }
    }, 10000);
  }

  public async getHealthStatus(): Promise<Record<string, 'healthy' | 'unhealthy'>> {
    return { ...this.providerHealth };
  }
}
