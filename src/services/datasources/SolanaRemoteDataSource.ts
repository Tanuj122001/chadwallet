import { rpcConnectionManager } from '../../core/wallet/RpcConnectionManager';
import { balanceEngine } from '../../core/wallet/BalanceEngine';
import { logger } from '../../utils/logger';

export interface SolanaHoldingDTO {
  mint: string;
  balance: number;
  symbol: string;
  name: string;
  decimals: number;
  logoUrl?: string;
}

export interface SolanaRemoteDataSource {
  getNativeBalance(address: string): Promise<number>;
  getTokenHoldings(address: string): Promise<SolanaHoldingDTO[]>;
  getTransactionHistory(address: string, limit?: number): Promise<any[]>;
  getTransactionDetails(signature: string): Promise<any>;
}

export class SolanaRemoteDataSourceImpl implements SolanaRemoteDataSource {

  public async getNativeBalance(address: string): Promise<number> {
    logger.debug(`[SolanaRemoteDataSource] Querying native balance for address: ${address}`);
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      const lamports = await client.getBalance(address);
      return balanceEngine.lamportsToSol(lamports);
    });
  }

  public async getTokenHoldings(address: string): Promise<SolanaHoldingDTO[]> {
    logger.debug(`[SolanaRemoteDataSource] Discovering token accounts for address: ${address}`);
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      const tokenAccounts = await client.getTokenAccountsByOwner(address);
      const parsedAccounts = balanceEngine.parseTokenAccounts(tokenAccounts);
      
      return parsedAccounts.map(acc => ({
        mint: acc.mint,
        balance: acc.balance,
        symbol: acc.metadata.symbol,
        name: acc.metadata.name,
        decimals: acc.metadata.decimals,
        logoUrl: acc.metadata.logoUrl,
      }));
    });
  }

  public async getTransactionHistory(address: string, limit = 20): Promise<any[]> {
    logger.debug(`[SolanaRemoteDataSource] Fetching signature history for address: ${address}`);
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      return client.getSignaturesForAddress(address, limit);
    });
  }

  public async getTransactionDetails(signature: string): Promise<any> {
    logger.debug(`[SolanaRemoteDataSource] Fetching details for tx signature: ${signature}`);
    return rpcConnectionManager.executeRpcRequest(async (client) => {
      return client.getTransaction(signature);
    });
  }
}
