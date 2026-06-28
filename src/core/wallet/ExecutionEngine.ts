import { ExecutionDTO, ReceiptDTO, ConfirmationDTO } from '../api/ExecutionDTOs';
import { TransactionDTO } from '../api/TransactionDTOs';
import { walletEngine, WalletEncryptionManager } from './WalletEngine';
import { localStorage } from '../storage';
import { logger } from '../../utils/logger';

// Sub-Engine: Retry Policy Coordinator
export class RetryPolicy {
  public static getBackoffDelayMs(retryCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, capped at 10s max
    const base = 1000;
    const delay = base * Math.pow(2, retryCount);
    return Math.min(10000, delay);
  }
}

// Sub-Engine: Execution Queue Persister
export class ExecutionQueuePersistence {
  private static readonly QUEUE_KEY = 'chad_execution_queue_v1';

  public static loadQueue(): ExecutionDTO[] {
    const data = localStorage.getString(this.QUEUE_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as ExecutionDTO[];
    } catch {
      return [];
    }
  }

  public static saveQueue(queue: ExecutionDTO[]): void {
    localStorage.setString(this.QUEUE_KEY, JSON.stringify(queue));
  }
}

// Main Execution Engine
class ExecutionEngine {
  private activeQueue: ExecutionDTO[] = [];
  
  constructor() {
    // Restore persistent queue state on bootup
    this.activeQueue = ExecutionQueuePersistence.loadQueue();
  }

  // Integrates signing with secure verification limits
  public async signTransactionPayload(
    tx: TransactionDTO,
    pin: string
  ): Promise<string> {
    logger.debug(`[ExecutionEngine] Prompting signer signature for tx: ${tx.transaction_id}`);
    
    // Validate PIN cipher unlock conditions before signing
    const lockManager = walletEngine.getLockManager();
    if (lockManager.isLockedOut()) {
      throw new Error(`SIGNING_REJECTED: Wallet is locked. Time remaining: ${lockManager.getLockoutTimeRemaining()}s`);
    }

    // Direct delegation to pure JS nacl detached signer without exposing keys in logs
    const decryptedKeys = WalletEncryptionManager.decrypt(
      'mockMnemonicSecretHexSafe', // mock secure storage hex
      pin
    );
    
    if (!decryptedKeys) {
      lockManager.registerFailedAttempt();
      throw new Error('SIGNING_FAILED: Invalid PIN verification password.');
    }

    // Reset lock attempts on success
    lockManager.resetAttempts();
    
    // Simulate raw base64 signed output serialization
    const mockSignedTxBase64 = tx.serialized_transaction + '_signed';
    logger.info(`[ExecutionEngine] Signing verified for fee payer: ${tx.fee_payer}`);
    return mockSignedTxBase64;
  }

  // Appends transaction metadata to persistent queue
  public enqueue(tx: TransactionDTO): ExecutionDTO {
    const execDto: ExecutionDTO = {
      execution_id: 'exec_' + Math.random().toString(36).substr(2, 9),
      transaction_id: tx.transaction_id,
      signature: '',
      status: 'queued',
      retry_count: 0,
      max_retries: 3,
      timestamp: Date.now(),
    };

    this.activeQueue.push(execDto);
    ExecutionQueuePersistence.saveQueue(this.activeQueue);
    logger.info(`[ExecutionEngine] Enqueued transaction: ${tx.transaction_id} -> ExecID: ${execDto.execution_id}`);
    return execDto;
  }

  public getQueue(): ExecutionDTO[] {
    return this.activeQueue;
  }

  public updateStatus(execId: string, status: ExecutionDTO['status'], updates: Partial<ExecutionDTO> = {}): void {
    this.activeQueue = this.activeQueue.map(item => {
      if (item.execution_id === execId) {
        return { ...item, status, ...updates };
      }
      return item;
    });
    ExecutionQueuePersistence.saveQueue(this.activeQueue);
  }

  public clearFinalized(execId: string): void {
    this.activeQueue = this.activeQueue.filter(item => item.execution_id !== execId);
    ExecutionQueuePersistence.saveQueue(this.activeQueue);
  }
}

export const executionEngine = new ExecutionEngine();
export default executionEngine;
