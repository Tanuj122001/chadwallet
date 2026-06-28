import { IWalletRepository } from './IWalletRepository';
import { IWalletLocalDataSource } from '../datasources/WalletLocalDataSource';
import { IWalletRemoteDataSource } from '../datasources/WalletRemoteDataSource';
import { Wallet } from '../../core/models';
import { WalletAddress } from '../../core/types';
import { WalletMapper } from '../../core/api/mappers';
import { WalletDTO } from '../../core/api/dtos';
import { walletEngine } from '../../core/wallet/WalletEngine';
import { offlineManager } from '../../core/offline/OfflineManager';
import { logger } from '../../utils/logger';
import { RepositoryError, InvalidCredentialsError } from '../../core/errors';

export class WalletRepository implements IWalletRepository {
  constructor(
    private remoteDataSource: IWalletRemoteDataSource,
    private localDataSource: IWalletLocalDataSource
  ) {}

  public async getWallets(): Promise<Wallet[]> {
    try {
      const cachedDTOs = await this.localDataSource.getWallets();
      
      if (offlineManager.isOffline()) {
        logger.warn('[WalletRepository] Offline mode. Returning locally cached wallets.');
        return cachedDTOs.map(WalletMapper.toDomain);
      }

      // Query fresh balances from RPC remote source in production
      const addresses = cachedDTOs.map(w => w.address);
      if (addresses.length === 0) return [];

      const balanceMap = await this.remoteDataSource.fetchWalletBalances(addresses);
      
      const updatedDTOs = cachedDTOs.map(w => {
        const balances = balanceMap[w.address];
        if (balances) {
          return {
            ...w,
            balance_sol: balances.balanceSol,
            balance_usd: balances.balanceUsd,
          };
        }
        return w;
      });

      // Save refreshed balances back to local storage
      await this.localDataSource.saveWallets(updatedDTOs);
      return updatedDTOs.map(WalletMapper.toDomain);
    } catch (e: any) {
      logger.error('[WalletRepository] Failed to load wallets', e);
      // Fail closed to cache
      const cached = await this.localDataSource.getWallets();
      return cached.map(WalletMapper.toDomain);
    }
  }

  public async createWallet(pin: string, label = 'Chad Wallet'): Promise<{ wallet: Wallet; mnemonic: string }> {
    try {
      const { mnemonic, profile, privateKey } = walletEngine.createWalletProfile(12, label);
      
      // Save secrets encrypted with user PIN code
      await this.localDataSource.saveSecureSecrets(profile.address, mnemonic, privateKey, pin);
      
      const newDTO: WalletDTO = {
        address: profile.address,
        label: profile.label,
        public_key: profile.address,
        balance_sol: 0.0,
        balance_usd: 0.0,
        is_active: true,
        backup_confirmed: false,
      };

      const currentDTOs = await this.localDataSource.getWallets();
      // Deactivate all current active wallets
      const updated = currentDTOs.map(w => ({ ...w, is_active: false }));
      updated.push(newDTO);

      await this.localDataSource.saveWallets(updated);
      
      return {
        wallet: WalletMapper.toDomain(newDTO),
        mnemonic,
      };
    } catch (error: any) {
      logger.error('[WalletRepository] Wallet creation failed', error);
      throw new RepositoryError('WALLET_CREATION_FAILED', 'Failed to generate and store new wallet.', error);
    }
  }

  public async importMnemonic(mnemonic: string, pin: string, label = 'Imported Mnemonic'): Promise<Wallet> {
    try {
      const { profile, privateKey } = walletEngine.importFromMnemonic(mnemonic, label);

      await this.localDataSource.saveSecureSecrets(profile.address, mnemonic, privateKey, pin);

      const newDTO: WalletDTO = {
        address: profile.address,
        label: profile.label,
        public_key: profile.address,
        balance_sol: 0.0,
        balance_usd: 0.0,
        is_active: true,
        backup_confirmed: true, // Imported are assumed backed up
      };

      const currentDTOs = await this.localDataSource.getWallets();
      const updated = currentDTOs.map(w => ({ ...w, is_active: false }));
      updated.push(newDTO);

      await this.localDataSource.saveWallets(updated);
      return WalletMapper.toDomain(newDTO);
    } catch (error: any) {
      logger.error('[WalletRepository] Mnemonic import failed', error);
      throw new RepositoryError('WALLET_IMPORT_FAILED', `Failed to import wallet from phrase: ${error.message}`, error);
    }
  }

  public async importPrivateKey(privateKeyHex: string, pin: string, label = 'Imported Private Key'): Promise<Wallet> {
    try {
      const profile = walletEngine.importFromPrivateKey(privateKeyHex, label);
      
      // Store private key securely. Mnemonic is empty for raw private key imports.
      await this.localDataSource.saveSecureSecrets(profile.address, '', privateKeyHex, pin);

      const newDTO: WalletDTO = {
        address: profile.address,
        label: profile.label,
        public_key: profile.address,
        balance_sol: 0.0,
        balance_usd: 0.0,
        is_active: true,
        backup_confirmed: true,
      };

      const currentDTOs = await this.localDataSource.getWallets();
      const updated = currentDTOs.map(w => ({ ...w, is_active: false }));
      updated.push(newDTO);

      await this.localDataSource.saveWallets(updated);
      return WalletMapper.toDomain(newDTO);
    } catch (error: any) {
      logger.error('[WalletRepository] Private key import failed', error);
      throw new RepositoryError('WALLET_IMPORT_FAILED', `Failed to import private key: ${error.message}`, error);
    }
  }

  public async setActiveWallet(address: WalletAddress): Promise<void> {
    try {
      const wallets = await this.localDataSource.getWallets();
      const updated = wallets.map(w => ({
        ...w,
        is_active: w.address === address,
      }));
      await this.localDataSource.saveWallets(updated);
    } catch (error) {
      logger.error('[WalletRepository] Set active wallet failed', error);
      throw new RepositoryError('WALLET_SET_ACTIVE_FAILED', 'Failed to update active wallet.', error);
    }
  }

  public async signTransaction(address: WalletAddress, message: string, pin: string): Promise<string> {
    const secrets = await this.localDataSource.getSecureSecrets(address, pin);
    if (!secrets) {
      // Register failed attempt in lock manager
      walletEngine.getLockManager().registerFailedAttempt();
      throw new InvalidCredentialsError('Incorrect PIN code. Decryption failed.');
    }

    // Reset attempts on successful PIN authorization
    walletEngine.getLockManager().resetAttempts();
    return walletEngine.signMessage(message, secrets.privateKey);
  }

  public async backupConfirmation(address: WalletAddress): Promise<void> {
    try {
      const wallets = await this.localDataSource.getWallets();
      const updated = wallets.map(w => {
        if (w.address === address) {
          return { ...w, backup_confirmed: true };
        }
        return w;
      });
      await this.localDataSource.saveWallets(updated);
    } catch (error) {
      logger.error('[WalletRepository] Backup confirmation failed', error);
      throw new RepositoryError('WALLET_BACKUP_CONFIRMATION_FAILED', 'Failed to confirm wallet backup.', error);
    }
  }

  public async exportSecrets(address: WalletAddress, pin: string): Promise<{ mnemonic: string; privateKey: string }> {
    const secrets = await this.localDataSource.getSecureSecrets(address, pin);
    if (!secrets) {
      walletEngine.getLockManager().registerFailedAttempt();
      throw new InvalidCredentialsError('Incorrect PIN code. Decryption failed.');
    }

    walletEngine.getLockManager().resetAttempts();
    return secrets;
  }
}
