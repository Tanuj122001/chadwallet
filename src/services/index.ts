/**
 * Service Layer & Dependency Injection Registry for ChadWallet Architecture
 */

import { RemoteDataSourceImpl } from './datasources/RemoteDataSource';
import { LocalDataSourceImpl } from './datasources/LocalDataSource';
import { AuthRemoteDataSourceImpl } from './datasources/AuthRemoteDataSource';
import { AuthLocalDataSourceImpl } from './datasources/AuthLocalDataSource';
import { IAuthRepository } from './repositories/IAuthRepository';
import { AuthRepository } from './repositories/AuthRepository';
import { IWalletRepository } from './repositories/IWalletRepository';
import { WalletRepository } from './repositories/WalletRepository';
import { IMarketRepository } from './repositories/IMarketRepository';
import { MarketRepository } from './repositories/MarketRepository';
import { IPortfolioRepository } from './repositories/IPortfolioRepository';
import { PortfolioRepository } from './repositories/PortfolioRepository';
import { ISettingsRepository } from './repositories/ISettingsRepository';
import { SettingsRepository } from './repositories/SettingsRepository';

export * from './repositories/IAuthRepository';
export * from './repositories/IWalletRepository';
export * from './repositories/IMarketRepository';
export * from './repositories/IPortfolioRepository';
export * from './repositories/ISettingsRepository';

class ServiceLocator {
  private authRepository: IAuthRepository;
  private walletRepository: IWalletRepository;
  private marketRepository: IMarketRepository;
  private portfolioRepository: IPortfolioRepository;
  private settingsRepository: ISettingsRepository;

  constructor() {
    const remoteDS = new RemoteDataSourceImpl();
    const localDS = new LocalDataSourceImpl();
    const authRemoteDS = new AuthRemoteDataSourceImpl();
    const authLocalDS = new AuthLocalDataSourceImpl();

    this.authRepository = new AuthRepository(authRemoteDS, authLocalDS);
    this.walletRepository = new WalletRepository(remoteDS, localDS);
    this.marketRepository = new MarketRepository(remoteDS);
    this.portfolioRepository = new PortfolioRepository(remoteDS);
    this.settingsRepository = new SettingsRepository(localDS);
  }

  public getAuthRepository(): IAuthRepository {
    return this.authRepository;
  }

  public getWalletRepository(): IWalletRepository {
    return this.walletRepository;
  }

  public getMarketRepository(): IMarketRepository {
    return this.marketRepository;
  }

  public getPortfolioRepository(): IPortfolioRepository {
    return this.portfolioRepository;
  }

  public getSettingsRepository(): ISettingsRepository {
    return this.settingsRepository;
  }
}

export const serviceLocator = new ServiceLocator();
export default serviceLocator;
