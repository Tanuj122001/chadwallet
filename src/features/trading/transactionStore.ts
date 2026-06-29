import { create } from 'zustand';
import { TransactionDTO, InstructionDTO } from '../../core/api/TransactionDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

export type BuilderState = 'idle' | 'building' | 'built' | 'error';

export interface TransactionStoreState {
  activeTransaction: TransactionDTO | null;
  blockhash: string | null;
  status: BuilderState;
  loading: boolean;
  error: string | null;

  buildTransaction: (params: {
    feePayer: string;
    instructions: InstructionDTO[];
    version?: 'legacy' | '0';
    lookupTableAddresses?: string[];
  }) => Promise<void>;

  refreshBlockhash: (forceRefresh?: boolean) => Promise<void>;
  resetBuilder: () => void;
}

export const useTransactionStore = create<TransactionStoreState>((set, _get) => ({
  activeTransaction: null,
  blockhash: null,
  status: 'idle',
  loading: false,
  error: null,

  buildTransaction: async (params) => {
    set({ loading: true, status: 'building', error: null });
    try {
      const txRepo = serviceLocator.getTransactionRepository();
      const tx = await txRepo.composeTransaction(params);
      
      set({
        activeTransaction: tx,
        blockhash: tx.recent_blockhash,
        status: tx.is_valid ? 'built' : 'error',
        loading: false,
      });
      logger.info(`[TransactionStore] Composed raw transaction template ID: ${tx.transaction_id}`);
    } catch (err: any) {
      set({
        activeTransaction: null,
        status: 'error',
        loading: false,
        error: err.message,
      });
      logger.error('[TransactionStore] Transaction build operation failed', err);
    }
  },

  refreshBlockhash: async (forceRefresh = false) => {
    try {
      const txRepo = serviceLocator.getTransactionRepository();
      const blockhash = await txRepo.getRecentBlockhash(forceRefresh);
      set({ blockhash });
    } catch (err: any) {
      logger.error('[TransactionStore] Failed to refresh recent blockhash cache', err);
    }
  },

  resetBuilder: () => {
    set({
      activeTransaction: null,
      blockhash: null,
      status: 'idle',
      loading: false,
      error: null,
    });
  },
}));

export default useTransactionStore;
