import { Wallet } from '../../core/models';
import { WalletAddress } from '../../core/types';

export interface IWalletRepository {
  getWallets(): Promise<Wallet[]>;
  createWallet(pin: string, label?: string): Promise<{ wallet: Wallet; mnemonic: string }>;
  importMnemonic(mnemonic: string, pin: string, label?: string): Promise<Wallet>;
  importPrivateKey(privateKeyHex: string, pin: string, label?: string): Promise<Wallet>;
  setActiveWallet(address: WalletAddress): Promise<void>;
  signTransaction(address: WalletAddress, message: string, pin: string): Promise<string>;
  backupConfirmation(address: WalletAddress): Promise<void>;
  exportSecrets(address: WalletAddress, pin: string): Promise<{ mnemonic: string; privateKey: string }>;
}
