import { IExecutionRepository } from './IExecutionRepository';
import { ExecutionRemoteDataSource } from '../datasources/ExecutionRemoteDataSource';
import { ExecutionDTO, ReceiptDTO, ConfirmationDTO } from '../../core/api/ExecutionDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';
import { executionEngine, RetryPolicy } from '../../core/wallet/ExecutionEngine';
import { serviceLocator } from '../index';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class ExecutionRepository implements IExecutionRepository {
  public confirmationTimeout = 15000;
  public pollInterval = 1000;

  constructor(private remoteDS: ExecutionRemoteDataSource) {}

  public async executeTransaction(tx: TransactionDTO, pin: string): Promise<ReceiptDTO> {
    const queueItem = executionEngine.enqueue(tx);
    const execId = queueItem.execution_id;
    let retryCount = 0;
    const maxRetries = queueItem.max_retries;

    while (retryCount <= maxRetries) {
      try {
        // 1. Sign composed transaction payload
        executionEngine.updateStatus(execId, 'signing', { retry_count: retryCount });
        const signedTxPayload = await executionEngine.signTransactionPayload(tx, pin);

        // 2. Broadcast raw signed payload to network
        executionEngine.updateStatus(execId, 'broadcasting');
        const signature = await this.remoteDS.broadcastTransaction(signedTxPayload);
        executionEngine.updateStatus(execId, 'confirming', { signature });

        // 3. Track confirmations status until finalized (with 15s timeout limit)
        const receipt = await this.pollConfirmation(signature, execId);
        
        executionEngine.updateStatus(execId, 'finalized', { receipt });
        return receipt;
      } catch (err: any) {
        logger.error(`[ExecutionRepository] Try ${retryCount} failed for transaction ${tx.transaction_id}`, err);
        
        // Handle explicit preflight failures immediately
        if (err.message.includes('InsufficientBalance') || err.message.includes('INSUFFICIENT_BALANCE')) {
          executionEngine.updateStatus(execId, 'failed', { last_error: 'INSUFFICIENT_BALANCE' });
          throw new RepositoryError('INSUFFICIENT_BALANCE', 'Solana account balance is insufficient to process gas fees.', err);
        }

        retryCount += 1;
        if (retryCount > maxRetries) {
          executionEngine.updateStatus(execId, 'failed', { last_error: err.message });
          throw new RepositoryError('TRANSACTION_EXECUTION_FAILED', `Execution failed after ${maxRetries} retries: ${err.message}`, err);
        }

        // Apply exponential retry delay backoff
        const delay = RetryPolicy.getBackoffDelayMs(retryCount);
        logger.warn(`[ExecutionRepository] Retrying execution in ${delay}ms...`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), delay));

        // Rebuild recent blockhash to prevent expiration dropped txs
        try {
          const txRepo = serviceLocator.getTransactionRepository();
          const freshBlockhash = await txRepo.getRecentBlockhash(true);
          tx.recent_blockhash = freshBlockhash;
        } catch (rebuildErr) {
          logger.error('[ExecutionRepository] Failed to rebuild recent blockhash during retry lifecycle', rebuildErr);
        }
      }
    }

    throw new RepositoryError('TRANSACTION_FAILED_UNKNOWN', 'Execution stopped due to unknown failure routing.');
  }

  public async getTransactionReceipt(signature: string): Promise<ReceiptDTO | null> {
    try {
      return await this.remoteDS.fetchTransactionReceipt(signature);
    } catch (e: any) {
      logger.error(`[ExecutionRepository] Receipt lookup failed for: ${signature}`, e);
      return null;
    }
  }

  public async getQueuedTransactions(): Promise<ExecutionDTO[]> {
    return executionEngine.getQueue();
  }

  private async pollConfirmation(signature: string, execId: string): Promise<ReceiptDTO> {
    const pollInterval = this.pollInterval;
    const timeoutLimit = this.confirmationTimeout;
    const start = Date.now();

    while (Date.now() - start < timeoutLimit) {
      try {
        const status: ConfirmationDTO | null = await this.remoteDS.querySignatureStatus(signature);
        
        if (status) {
          executionEngine.updateStatus(execId, 'confirming', { confirmation: status });
          
          if (status.confirmation_status === 'finalized' || status.confirmation_status === 'confirmed') {
            if (status.err) {
              throw new Error(`TRANSACTION_REJECTED_ON_CHAIN: ${JSON.stringify(status.err)}`);
            }
            
            // Query detailed execution receipt
            const receipt = await this.getTransactionReceipt(signature);
            if (receipt) return receipt;

            // Fallback mock receipt if RPC getTransaction has block time lag
            return {
              signature,
              slot: status.slot,
              timestamp: Date.now(),
              fee_payer: 'composedFeePayerPublicKey',
              fees_paid_lamports: 5000,
              compute_units_consumed: 150000,
              status: 'success',
              block_time: Math.floor(Date.now() / 1000),
            };
          }
        }
      } catch (pollErr: any) {
        logger.warn(`[ExecutionRepository] Polling signature error: ${pollErr.message}`);
        if (pollErr.message.includes('TRANSACTION_REJECTED_ON_CHAIN')) {
          throw pollErr;
        }
      }

      await new Promise<void>(resolve => setTimeout(() => resolve(), pollInterval));
    }

    throw new Error('CONFIRMATION_TIMEOUT: Solana confirmation threshold exceeded without finalization.');
  }
}
