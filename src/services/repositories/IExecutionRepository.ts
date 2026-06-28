import { ExecutionDTO, ReceiptDTO } from '../../core/api/ExecutionDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';

export interface IExecutionRepository {
  executeTransaction(tx: TransactionDTO, pin: string): Promise<ReceiptDTO>;
  
  getTransactionReceipt(signature: string): Promise<ReceiptDTO | null>;
  
  getQueuedTransactions(): Promise<ExecutionDTO[]>;
}
