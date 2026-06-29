import { create } from 'zustand';
import { QuoteDTO } from '../../core/api/QuoteDTOs';
import { serviceLocator } from '../../services';
// ---------------------------------------------------------
// 1. Quote Store (Refreshes, selected routes, errors)
// ---------------------------------------------------------

export interface QuoteState {
  activeQuote: QuoteDTO | null;
  selectedRouteIndex: number;
  countdown: number;
  loading: boolean;
  error: string | null;
  providerHealth: Record<string, 'healthy' | 'unhealthy'>;

  fetchQuote: (params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps: number;
    provider?: 'jupiter' | 'orca' | 'raydium';
  }) => Promise<void>;
  
  selectRoute: (index: number) => void;
  updateHealthStatus: () => Promise<void>;
  resetQuote: () => void;
  decrementCountdown: () => void;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  activeQuote: null,
  selectedRouteIndex: 0,
  countdown: 10, // 10 seconds refresh TTL countdown
  loading: false,
  error: null,
  providerHealth: { jupiter: 'healthy', orca: 'healthy', raydium: 'healthy' },

  fetchQuote: async (params) => {
    set({ loading: true, error: null });
    try {
      const quoteRepo = serviceLocator.getQuoteRepository();
      const quote = await quoteRepo.fetchQuotes(params);
      
      set({
        activeQuote: quote,
        selectedRouteIndex: quote.selected_route_index,
        countdown: 10,
        loading: false,
      });
      await get().updateHealthStatus();
    } catch (err: any) {
      set({ loading: false, error: err.message });
      await get().updateHealthStatus();
    }
  },

  selectRoute: (index) => {
    const quote = get().activeQuote;
    if (quote && index >= 0 && index < quote.routes.length) {
      set({
        selectedRouteIndex: index,
        activeQuote: {
          ...quote,
          selected_route_index: index,
          expected_output_amount: quote.routes[index]!.out_amount,
          price_impact_percent: quote.routes[index]!.price_impact_percent,
        },
      });
    }
  },

  updateHealthStatus: async () => {
    try {
      const quoteRepo = serviceLocator.getQuoteRepository();
      const health = await quoteRepo.getHealthStatus();
      set({ providerHealth: health });
    } catch {}
  },

  resetQuote: () => {
    set({ activeQuote: null, selectedRouteIndex: 0, countdown: 10, error: null });
  },

  decrementCountdown: () => {
    const current = get().countdown;
    if (current > 0) {
      set({ countdown: current - 1 });
    }
  },
}));

// ---------------------------------------------------------
// 2. Trading Settings Store (Auto-slippage, priority fees)
// ---------------------------------------------------------

export interface TradingSettingsState {
  slippageBps: number; // 100 bps = 1%
  isAutoSlippage: boolean;
  priorityFeeLevel: 'low' | 'medium' | 'high';
  
  setSlippageBps: (bps: number) => void;
  setAutoSlippage: (auto: boolean) => void;
  setPriorityFeeLevel: (level: 'low' | 'medium' | 'high') => void;
}

export const useTradingSettingsStore = create<TradingSettingsState>((set) => ({
  slippageBps: 50, // default 0.5%
  isAutoSlippage: true,
  priorityFeeLevel: 'medium',

  setSlippageBps: (slippageBps) => set({ slippageBps, isAutoSlippage: false }),
  setAutoSlippage: (isAutoSlippage) => set({ isAutoSlippage }),
  setPriorityFeeLevel: (priorityFeeLevel) => set({ priorityFeeLevel }),
}));
