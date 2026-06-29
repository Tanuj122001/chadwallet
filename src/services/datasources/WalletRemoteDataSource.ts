import { logger } from '../../utils/logger';

export interface IWalletRemoteDataSource {
  fetchWalletBalances(addresses: string[]): Promise<Record<string, { balanceSol: number; balanceUsd: number }>>;
}

export class WalletRemoteDataSourceImpl implements IWalletRemoteDataSource {
  public async fetchWalletBalances(addresses: string[]): Promise<Record<string, { balanceSol: number; balanceUsd: number }>> {
    logger.debug(`[WalletRemoteDataSource] Querying balances for ${addresses.length} addresses`);
    
    // Simulate API query returns satisfying future RPC fetchers
    const result: Record<string, { balanceSol: number; balanceUsd: number }> = {};
    addresses.forEach(address => {
      result[address] = {
        balanceSol: 5.75,
        balanceUsd: 862.50,
      };
    });

    return result;
  }
}
