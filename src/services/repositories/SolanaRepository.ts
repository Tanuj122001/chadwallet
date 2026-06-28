import { ISolanaRepository } from './ISolanaRepository';
import { SolanaRemoteDataSource, SolanaHoldingDTO } from '../datasources/SolanaRemoteDataSource';
import { DecodedTransaction, transactionDecoder } from '../../core/wallet/TransactionDecoder';
import { logger } from '../../utils/logger';
import { RpcError } from '../../core/errors';

export class SolanaRepository implements ISolanaRepository {
  constructor(private remoteDS: SolanaRemoteDataSource) {}

  public async getNativeBalance(address: string): Promise<number> {
    try {
      return await this.remoteDS.getNativeBalance(address);
    } catch (e: any) {
      logger.error('[SolanaRepository] Failed to get SOL balance', e);
      throw e;
    }
  }

  public async getTokenHoldings(address: string): Promise<SolanaHoldingDTO[]> {
    try {
      return await this.remoteDS.getTokenHoldings(address);
    } catch (e: any) {
      logger.error('[SolanaRepository] Failed to load token accounts list', e);
      throw e;
    }
  }

  public async getTransactionHistory(address: string, limit = 20): Promise<Array<Partial<DecodedTransaction>>> {
    try {
      const signaturesList = await this.remoteDS.getTransactionHistory(address, limit);
      return transactionDecoder.parseSignaturesList(signaturesList);
    } catch (e: any) {
      logger.error('[SolanaRepository] Failed to get transaction signatures list', e);
      throw e;
    }
  }

  public async getTransactionDetails(signature: string, userAddress: string): Promise<DecodedTransaction> {
    try {
      const payload = await this.remoteDS.getTransactionDetails(signature);
      return transactionDecoder.decodeTransaction(payload, userAddress);
    } catch (e: any) {
      logger.error(`[SolanaRepository] Failed to get details for tx: ${signature}`, e);
      throw e;
    }
  }
}
