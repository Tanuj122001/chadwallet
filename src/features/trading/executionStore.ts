import { create } from 'zustand';
import { ExecutionDTO, ReceiptDTO } from '../../core/api/ExecutionDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

export interface ExecutionStoreState {
  activeExecution: ExecutionDTO | null;
  history: ReceiptDTO[];
  queued: ExecutionDTO[];
  loading: boolean;
  error: string | null;

  executeTx: (tx: TransactionDTO, pin: string) => Promise<ReceiptDTO>;
  loadQueuedTxs: () => Promise<void>;
  resetExecution: () => void;
}

export const useExecutionStore = create<ExecutionStoreState>((set, _get) => ({
  activeExecution: null,
  history: [],
  queued: [],
  loading: false,
  error: null,

  executeTx: async (tx, pin) => {
    set({ loading: true, error: null });
    try {
      const execRepo = serviceLocator.getExecutionRepository();
      
      // Update state queue
      const currentQueue = await execRepo.getQueuedTransactions();
      const pendingItem = currentQueue.find(item => item.transaction_id === tx.transaction_id) || null;
      
      set({ activeExecution: pendingItem, queued: currentQueue });
      
      const receipt = await execRepo.executeTransaction(tx, pin);
      
      const updatedQueue = await execRepo.getQueuedTransactions();
      set(state => ({
        activeExecution: null,
        queued: updatedQueue,
        history: [receipt, ...state.history],
        loading: false,
      }));
      
      logger.info(`[ExecutionStore] Execution successfully finalized for sig: ${receipt.signature}`);
      return receipt;
    } catch (err: any) {
      const execRepo = serviceLocator.getExecutionRepository();
      const updatedQueue = await execRepo.getQueuedTransactions();
      
      set({
        activeExecution: null,
        queued: updatedQueue,
        loading: false,
        error: err.message,
      });
      logger.error('[ExecutionStore] Execution workflow failed', err);
      throw err;
    }
  },

  loadQueuedTxs: async () => {
    try {
      const execRepo = serviceLocator.getExecutionRepository();
      const queued = await execRepo.getQueuedTransactions();
      set({ queued });
    } catch {}
  },

  resetExecution: () => {
    set({ activeExecution: null, loading: false, error: null });
  },
}));

export default useExecutionStore;
