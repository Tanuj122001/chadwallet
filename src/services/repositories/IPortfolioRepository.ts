import { Portfolio } from '../../core/models';
import { WalletAddress } from '../../core/types';

export interface IPortfolioRepository {
  getPortfolio(address: WalletAddress): Promise<Portfolio>;
}
