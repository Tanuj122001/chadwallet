import { ITransactionRepository } from './ITransactionRepository';
import { TransactionRemoteDataSource } from '../datasources/TransactionRemoteDataSource';
import { TransactionDTO, InstructionDTO, LookupTableDTO } from '../../core/api/TransactionDTOs';
import { transactionBuilder } from '../../core/wallet/TransactionBuilder';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class TransactionRepository implements ITransactionRepository {
  constructor(private remoteDS: TransactionRemoteDataSource) {}

  public async getRecentBlockhash(forceRefresh = false): Promise<string> {
    const manager = transactionBuilder.getBlockhashManager();

    if (!forceRefresh && !manager.isCacheExpired()) {
      const cached = manager.getCachedBlockhash();
      if (cached) {
        logger.debug(`[TransactionRepository] Serving recent blockhash from cache: ${cached}`);
        return cached;
      }
    }

    try {
      const blockhashDto = await this.remoteDS.fetchRecentBlockhash();
      manager.setCache(blockhashDto);
      return blockhashDto.blockhash;
    } catch (e: any) {
      logger.error('[TransactionRepository] Failed to query fresh blockhash', e);
      
      // Attempt cache recovery if RPC is offline
      const cached = manager.getCachedBlockhash();
      if (cached) {
        logger.warn(`[TransactionRepository] RPC offline. Reverting to expired cached blockhash: ${cached}`);
        return cached;
      }
      
      throw new RepositoryError('BLOCKHASH_QUERY_FAILED', 'Failed to retrieve recent blockhash from Solana network.', e);
    }
  }

  public async composeTransaction(params: {
    feePayer: string;
    instructions: InstructionDTO[];
    version?: 'legacy' | '0';
    lookupTableAddresses?: string[];
  }): Promise<TransactionDTO> {
    const { feePayer, instructions, version = '0', lookupTableAddresses = [] } = params;

    try {
      // 1. Fetch fresh blockhash parameter
      const recentBlockhash = await this.getRecentBlockhash();

      // 2. Fetch Address Lookup Tables metadata in parallel
      const lookupTables: LookupTableDTO[] = [];
      if (lookupTableAddresses.length > 0) {
        const results = await Promise.all(
          lookupTableAddresses.map(addr => this.remoteDS.fetchLookupTable(addr).catch(() => null))
        );
        results.forEach(res => {
          if (res) lookupTables.push(res);
        });
      }

      // 3. Delegate transaction construction to TransactionBuilder Orchestrator
      return transactionBuilder.buildTransaction({
        feePayer,
        recentBlockhash,
        instructions,
        version,
        lookupTables,
      });
    } catch (e: any) {
      logger.error('[TransactionRepository] Failed composing transaction', e);
      if (e instanceof RepositoryError) throw e;
      throw new RepositoryError('TRANSACTION_COMPOSITION_FAILED', `Failed to construct transaction: ${e.message}`, e);
    }
  }
}
