import { create } from 'zustand';
import { SwapQuote, Token } from '../../core/models';
import { LoadingState, Percentage } from '../../core/types';

export interface TradeState {
  quote: SwapQuote | null;
  loadingState: LoadingState;
  getQuote: (params: {
    inputToken: Token;
    outputToken: Token;
    amount: number;
    slippageBps: number;
  }) => Promise<void>;
  executeSwap: () => Promise<string>;
}

export const useTradeStore = create<TradeState>((set, get) => ({
  quote: null,
  loadingState: 'idle',
  getQuote: async (params) => {
    set({ loadingState: 'loading' });
    try {
      const mockQuote: SwapQuote = {
        quoteId: 'quote_jup_992x',
        inputTokenSymbol: params.inputToken.symbol,
        outputTokenSymbol: params.outputToken.symbol,
        inputAmount: params.amount,
        outputAmount: params.amount * 42,
        priceImpact: 0.12 as Percentage,
        slippageBps: params.slippageBps,
        routePlan: [],
      };
      set({ quote: mockQuote, loadingState: 'success' });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  executeSwap: async () => {
    const activeQuote = get().quote;
    if (!activeQuote) {
      throw new Error('No active quote exists for swap execution.');
    }
    set({ loadingState: 'loading' });
    try {
      const mockSignature = '5sgwH9kE3Fw8sUXyR8N7W3T4m4qY6d... (SOL Signature)';
      set({ quote: null, loadingState: 'success' });
      return mockSignature;
    } catch (error) {
      set({ loadingState: 'error' });
      throw error;
    }
  },
}));
export default useTradeStore;
