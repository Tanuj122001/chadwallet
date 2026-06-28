import { Wallet } from '../../core/models';
import { WalletAddress } from '../../core/types';

export interface IWalletRepository {
  getWallets(): Promise<Wallet[]>;
  createWallet(): Promise<Wallet>;
  importWallet(mnemonic: string): Promise<Wallet>;
  setActiveWallet(address: WalletAddress): Promise<void>;
}
