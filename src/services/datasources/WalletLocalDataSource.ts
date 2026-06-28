import { secureStorage, tokenManager } from '../../core/storage';
import { WalletDTO } from '../../core/api/dtos';
import { WalletEncryptionManager } from '../../core/wallet/WalletEngine';
import { logger } from '../../utils/logger';

export interface IWalletLocalDataSource {
  getWallets(): Promise<WalletDTO[]>;
  saveWallets(wallets: WalletDTO[]): Promise<void>;
  saveSecureSecrets(address: string, mnemonic: string, privateKey: string, pin: string): Promise<void>;
  getSecureSecrets(address: string, pin: string): Promise<{ mnemonic: string; privateKey: string } | null>;
  clearSecureSecrets(address: string): Promise<void>;
}

export class WalletLocalDataSourceImpl implements IWalletLocalDataSource {
  private readonly WALLETS_LIST_KEY = 'chad_wallets_list_v1';
  private readonly MNEMONIC_PREFIX = 'secure_wallet_mnemonic_';
  private readonly PRIVKEY_PREFIX = 'secure_wallet_privkey_';

  public async getWallets(): Promise<WalletDTO[]> {
    logger.debug('[WalletLocalDataSource] Fetching wallet metadata list');
    const data = await secureStorage.getItem(this.WALLETS_LIST_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data) as WalletDTO[];
    } catch {
      return [];
    }
  }

  public async saveWallets(wallets: WalletDTO[]): Promise<void> {
    logger.debug(`[WalletLocalDataSource] Saving ${wallets.length} wallet metadata profiles`);
    await secureStorage.setItem(this.WALLETS_LIST_KEY, JSON.stringify(wallets));
  }

  public async saveSecureSecrets(address: string, mnemonic: string, privateKey: string, pin: string): Promise<void> {
    logger.debug(`[WalletLocalDataSource] Encrypting and saving secrets for wallet: ${address}`);
    
    // Encrypt secrets using user PIN
    const encryptedMnemonic = WalletEncryptionManager.encrypt(mnemonic, pin);
    const encryptedPrivateKey = WalletEncryptionManager.encrypt(privateKey, pin);

    // Save under address-specific keys inside secure storage
    await secureStorage.setItem(this.MNEMONIC_PREFIX + address, encryptedMnemonic);
    await secureStorage.setItem(this.PRIVKEY_PREFIX + address, encryptedPrivateKey);
  }

  public async getSecureSecrets(address: string, pin: string): Promise<{ mnemonic: string; privateKey: string } | null> {
    logger.debug(`[WalletLocalDataSource] Retrieving and decrypting secrets for wallet: ${address}`);
    
    const encryptedMnemonic = await secureStorage.getItem(this.MNEMONIC_PREFIX + address);
    const encryptedPrivateKey = await secureStorage.getItem(this.PRIVKEY_PREFIX + address);

    if (!encryptedMnemonic || !encryptedPrivateKey) {
      return null;
    }

    try {
      const mnemonic = WalletEncryptionManager.decrypt(encryptedMnemonic, pin);
      const privateKey = WalletEncryptionManager.decrypt(encryptedPrivateKey, pin);
      
      return { mnemonic, privateKey };
    } catch (e) {
      logger.error(`[WalletLocalDataSource] Decryption failed for wallet: ${address}`, e);
      return null;
    }
  }

  public async clearSecureSecrets(address: string): Promise<void> {
    logger.debug(`[WalletLocalDataSource] Wiping secure secrets for wallet: ${address}`);
    await secureStorage.removeItem(this.MNEMONIC_PREFIX + address);
    await secureStorage.removeItem(this.PRIVKEY_PREFIX + address);
  }
}
