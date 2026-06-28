import { create } from 'zustand';
import { Wallet } from '../../core/models';
import { LoadingState, WalletAddress } from '../../core/types';
import { serviceLocator } from '../../services';
import { walletEngine } from '../../core/wallet/WalletEngine';
import { logger } from '../../utils/logger';

export interface WalletState {
  activeWallet: Wallet | null;
  wallets: Wallet[];
  loadingState: LoadingState;
  
  // Wallet Lock State
  isLocked: boolean;
  failedAttempts: number;
  lockTimeRemaining: number;
  
  createWallet: (pin: string, label?: string) => Promise<string>;
  importWallet: (mnemonic: string, pin: string, label?: string) => Promise<void>;
  importPrivateKey: (privateKeyHex: string, pin: string, label?: string) => Promise<void>;
  setActiveWallet: (address: WalletAddress) => Promise<void>;
  fetchWallets: () => Promise<void>;
  
  // Detached Signers & Exporters
  signTransaction: (address: WalletAddress, message: string, pin: string) => Promise<string>;
  backupConfirmation: (address: WalletAddress) => Promise<void>;
  exportSecrets: (address: WalletAddress, pin: string) => Promise<{ mnemonic: string; privateKey: string }>;
  
  // Unlock & Lock operations
  unlockWallet: (pin: string) => boolean;
  lockWallet: () => void;
  updateLockStatus: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  activeWallet: null,
  wallets: [],
  loadingState: 'idle',
  isLocked: false,
  failedAttempts: 0,
  lockTimeRemaining: 0,

  createWallet: async (pin: string, label?: string) => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const { wallet, mnemonic } = await walletRepo.createWallet(pin, label);
      const allWallets = await walletRepo.getWallets();
      
      set({
        wallets: allWallets,
        activeWallet: wallet,
        loadingState: 'success',
      });
      return mnemonic;
    } catch (error) {
      set({ loadingState: 'error' });
      throw error;
    }
  },

  importWallet: async (mnemonic: string, pin: string, label?: string) => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const importedWallet = await walletRepo.importMnemonic(mnemonic, pin, label);
      const allWallets = await walletRepo.getWallets();
      
      set({
        wallets: allWallets,
        activeWallet: importedWallet,
        loadingState: 'success',
      });
    } catch (error) {
      set({ loadingState: 'error' });
      throw error;
    }
  },

  importPrivateKey: async (privateKeyHex: string, pin: string, label?: string) => {
    set({ loadingState: 'loading' });
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const importedWallet = await walletRepo.importPrivateKey(privateKeyHex, pin, label);
      const allWallets = await walletRepo.getWallets();
      
      set({
        wallets: allWallets,
        activeWallet: importedWallet,
        loadingState: 'success',
      });
    } catch (error) {
      set({ loadingState: 'error' });
      throw error;
    }
  },

  setActiveWallet: async (address: WalletAddress) => {
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

  signTransaction: async (address: WalletAddress, message: string, pin: string) => {
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const signature = await walletRepo.signTransaction(address, message, pin);
      get().updateLockStatus();
      return signature;
    } catch (error) {
      get().updateLockStatus();
      throw error;
    }
  },

  backupConfirmation: async (address: WalletAddress) => {
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      await walletRepo.backupConfirmation(address);
      const allWallets = await walletRepo.getWallets();
      const active = allWallets.find(w => w.address === address) || get().activeWallet;
      set({ wallets: allWallets, activeWallet: active });
    } catch (error) {
      logger.error('[WalletStore] Backup confirmation failed', error);
    }
  },

  exportSecrets: async (address: WalletAddress, pin: string) => {
    try {
      const walletRepo = serviceLocator.getWalletRepository();
      const secrets = await walletRepo.exportSecrets(address, pin);
      get().updateLockStatus();
      return secrets;
    } catch (error) {
      get().updateLockStatus();
      throw error;
    }
  },

  unlockWallet: (pin: string): boolean => {
    const lockManager = walletEngine.getLockManager();
    if (lockManager.isLockedOut()) {
      get().updateLockStatus();
      return false;
    }

    // In production, we authenticate user PIN hashes matching standard database PIN codes.
    // For architecture mock, we check if PIN length matches 6 digits.
    if (pin.length === 6) {
      lockManager.resetAttempts();
      set({ isLocked: false, failedAttempts: 0, lockTimeRemaining: 0 });
      return true;
    } else {
      lockManager.registerFailedAttempt();
      get().updateLockStatus();
      return false;
    }
  },

  lockWallet: () => {
    set({ isLocked: true });
    logger.info('[WalletStore] Wallet manually locked.');
  },

  updateLockStatus: () => {
    const lockManager = walletEngine.getLockManager();
    set({
      isLocked: lockManager.isLockedOut(),
      failedAttempts: lockManager.getFailedAttempts(),
      lockTimeRemaining: lockManager.getLockoutTimeRemaining(),
    });
  },
}));

export default useWalletStore;
