import { create } from 'zustand';
import { Portfolio } from '../../core/models';
import { LoadingState, WalletAddress } from '../../core/types';
import { serviceLocator } from '../../services';

export interface PortfolioState {
  portfolio: Portfolio | null;
  loadingState: LoadingState;
  fetchPortfolio: (address: WalletAddress) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: null,
  loadingState: 'idle',
  fetchPortfolio: async (address) => {
    set({ loadingState: 'loading' });
    try {
      const portfolioRepo = serviceLocator.getPortfolioRepository();
      const portfolio = await portfolioRepo.getPortfolio(address);
      set({ portfolio, loadingState: 'success' });
    } catch {
      set({ loadingState: 'error' });
    }
  },
}));
export default usePortfolioStore;
