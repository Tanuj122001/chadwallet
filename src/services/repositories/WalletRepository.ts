import { IWalletRepository } from './IWalletRepository';
import { ILocalDataSource } from '../datasources/LocalDataSource';
import { IRemoteDataSource } from '../datasources/RemoteDataSource';
import { Wallet } from '../../core/models';
import { WalletAddress, PublicKey, USDValue } from '../../core/types';
import { WalletMapper } from '../../core/api/mappers';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class WalletRepository implements IWalletRepository {
  constructor(
    private remoteDataSource: IRemoteDataSource,
    private localDataSource: ILocalDataSource
  ) {}

  public async getWallets(): Promise<Wallet[]> {
    try {
      const cached = await this.localDataSource.getWallets();
      return cached.map(WalletMapper.toDomain);
    } catch (e) {
      logger.error('[WalletRepository] Failed to get wallets', e);
      return [];
    }
  }

  public async createWallet(): Promise<Wallet> {
    try {
      const mockWalletDTO = {
        address: 'Chad11111111111111111111111111111111111111112',
        public_key: 'Chad11111111111111111111111111111111111111112',
        balance_sol: 4.20,
        balance_usd: 620.00,
        is_active: true,
        label: 'Chad Wallet 1',
      };

      const currentDTOs = await this.localDataSource.getWallets();
      // Set others to inactive
      const updated = currentDTOs.map(w => ({ ...w, is_active: false }));
      updated.push(mockWalletDTO);
      
      await this.localDataSource.saveWallets(updated);
      return WalletMapper.toDomain(mockWalletDTO);
    } catch (error) {
      logger.error('[WalletRepository] Create wallet failed', error);
      throw new RepositoryError('WALLET_CREATE_FAILED', 'Failed to generate new wallet keys.', error);
    }
  }

  public async importWallet(mnemonic: string): Promise<Wallet> {
    try {
      const importedDTO = {
        address: 'ImportedChad111111111111111111111111111111111112',
        public_key: 'ImportedChad111111111111111111111111111111111112',
        balance_sol: 0.00,
        balance_usd: 0.00,
        is_active: true,
        label: 'Imported Wallet',
      };

      const currentDTOs = await this.localDataSource.getWallets();
      const updated = currentDTOs.map(w => ({ ...w, is_active: false }));
      updated.push(importedDTO);

      await this.localDataSource.saveWallets(updated);
      return WalletMapper.toDomain(importedDTO);
    } catch (error) {
      logger.error('[WalletRepository] Import wallet failed', error);
      throw new RepositoryError('WALLET_IMPORT_FAILED', 'Failed to import wallet from phrase.', error);
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
}
