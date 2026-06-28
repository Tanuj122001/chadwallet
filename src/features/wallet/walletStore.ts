import { create } from 'zustand';
import { Wallet } from '../../core/models';
import { LoadingState, WalletAddress } from '../../core/types';
import { serviceLocator } from '../../services';

export interface WalletState {
  activeWallet: Wallet | null;
  wallets: Wallet[];
  loadingState: LoadingState;
  createWallet: () => Promise<void>;
  importWallet: (mnemonic: string) => Promise<void>;
  setActiveWallet: (address: WalletAddress) => Promise<void>;
  fetchWallets: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  activeWallet: null,
  wallets: [],
  loadingState: 'idle',
  createWallet: async () => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const newWallet = await walletRepo.createWallet();
      const allWallets = await walletRepo.getWallets();
      set({
        wallets: allWallets,
        activeWallet: newWallet,
        loadingState: 'success',
      });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  importWallet: async (mnemonic) => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const importedWallet = await walletRepo.importWallet(mnemonic);
      const allWallets = await walletRepo.getWallets();
      set({
        wallets: allWallets,
        activeWallet: importedWallet,
        loadingState: 'success',
      });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  setActiveWallet: async (address) => {
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      await walletRepo.setActiveWallet(address);
      const allWallets = await walletRepo.getWallets();
      const active = allWallets.find(w => w.address === address) || null;
      set({ wallets: allWallets, activeWallet: active });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
  fetchWallets: async () => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const allWallets = await walletRepo.getWallets();
      const active = allWallets.find(w => w.isActive) || allWallets[0] || null;
      set({ wallets: allWallets, activeWallet: active, loadingState: 'success' });
    } catch (error) {
      set({ loadingState: 'error' });
    }
  },
}));
export default useWalletStore;
