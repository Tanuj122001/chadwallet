import { create } from 'zustand';
import { SwapDTO, SimulationDTO } from '../../core/api/SwapDTOs';
import { serviceLocator } from '../../services';
import { logger } from '../../utils/logger';

export type SwapStateStatus = 'idle' | 'preparing' | 'prepared' | 'error';

export interface SwapState {
  preparedSwap: SwapDTO | null;
  simulation: SimulationDTO | null;
  status: SwapStateStatus;
  loading: boolean;
  error: string | null;

  prepareSwap: (params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    userAddress: string;
    slippageBps: number;
  }) => Promise<void>;

  resetSwap: () => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  preparedSwap: null,
  simulation: null,
  status: 'idle',
  loading: false,
  error: null,

  prepareSwap: async (params) => {
    set({ loading: true, status: 'preparing', error: null });
    try {
      const swapRepo = serviceLocator.getSwapRepository();
      const preparedSwap = await swapRepo.prepareSwapTransaction(params);
      const simulation = await swapRepo.prepareSimulationRequest(preparedSwap);

      set({
        preparedSwap,
        simulation,
        status: 'prepared',
        loading: false,
      });
      logger.info(`[SwapStore] Prepared serialized swap payload for ID: ${preparedSwap.swap_id}`);
    } catch (err: any) {
      set({
        preparedSwap: null,
        simulation: null,
        status: 'error',
        loading: false,
        error: err.message,
      });
      logger.error('[SwapStore] Swap transaction preparation failed', err);
    }
  },

  resetSwap: () => {
    set({
      preparedSwap: null,
      simulation: null,
      status: 'idle',
      loading: false,
      error: null,
    });
  },
}));

export default useSwapStore;
