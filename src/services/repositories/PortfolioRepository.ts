import { IPortfolioRepository } from './IPortfolioRepository';
import { IRemoteDataSource } from '../datasources/RemoteDataSource';
import { Portfolio } from '../../core/models';
import { WalletAddress, USDValue, Percentage, TokenSymbol, PublicKey } from '../../core/types';
import { PortfolioMapper } from '../../core/api/mappers';
import { offlineManager } from '../../core/offline/OfflineManager';
import { logger } from '../../utils/logger';

export class PortfolioRepository implements IPortfolioRepository {
  constructor(private remoteDataSource: IRemoteDataSource) {}

  public async getPortfolio(address: WalletAddress): Promise<Portfolio> {
    const cacheKey = `portfolio_${address}`;
    try {
      if (offlineManager.isOffline()) {
        const cached = offlineManager.getCache<Portfolio>(cacheKey);
        if (cached) return cached;
        return this.getDefaultPortfolio();
      }

      // Mock remote portfolio data payload satisfying future Supabase integrations
      const mockPortfolioDTO = {
        id: 'port_123',
        total_balance_usd: 1240.50,
        change_24h: 8.42,
        holdings: [
          {
            token: {
              id: 'solana',
              symbol: 'SOL',
              name: 'Solana',
              decimals: 9,
              contract_address: 'So11111111111111111111111111111111111111112',
            },
            amount: 4.2,
            balance_usd: 620.00,
            change_24h: 5.84,
          },
          {
            token: {
              id: 'gigachad',
              symbol: 'CHAD',
              name: 'GigaChad Token',
              decimals: 9,
              contract_address: 'ChadW11111111111111111111111111111111111111',
            },
            amount: 25000,
            balance_usd: 620.50,
            change_24h: 22.45,
          }
        ],
      };

      const domainPortfolio = PortfolioMapper.toDomain(mockPortfolioDTO);
      offlineManager.setCache(cacheKey, domainPortfolio);
      return domainPortfolio;
    } catch (e) {
      logger.error(`[PortfolioRepository] Failed getting portfolio for ${address}`, e);
      const cached = offlineManager.getCache<Portfolio>(cacheKey);
      if (cached) return cached;
      return this.getDefaultPortfolio();
    }
  }

  private getDefaultPortfolio(): Portfolio {
    return {
      id: 'port_default',
      totalBalanceUsd: 0.00 as USDValue,
      change24h: 0.00 as Percentage,
      holdings: [],
    };
  }
}
