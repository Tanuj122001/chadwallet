/**
 * Service Layer & Dependency Injection Registry for ChadWallet Architecture
 */

import { RemoteDataSourceImpl } from './datasources/RemoteDataSource';
import { LocalDataSourceImpl } from './datasources/LocalDataSource';
import { AuthRemoteDataSourceImpl } from './datasources/AuthRemoteDataSource';
import { AuthLocalDataSourceImpl } from './datasources/AuthLocalDataSource';
import { WalletRemoteDataSourceImpl } from './datasources/WalletRemoteDataSource';
import { WalletLocalDataSourceImpl } from './datasources/WalletLocalDataSource';
import { IAuthRepository } from './repositories/IAuthRepository';
import { AuthRepository } from './repositories/AuthRepository';
import { IWalletRepository } from './repositories/IWalletRepository';
import { WalletRepository } from './repositories/WalletRepository';
import { IMarketRepository } from './repositories/IMarketRepository';
import { MarketRepository } from './repositories/MarketRepository';
import { MarketRemoteDataSourceImpl } from './datasources/MarketRemoteDataSource';
import { MarketLocalDataSourceImpl } from './datasources/MarketLocalDataSource';
import { IPortfolioRepository } from './repositories/IPortfolioRepository';
import { PortfolioRepository } from './repositories/PortfolioRepository';
import { ISettingsRepository } from './repositories/ISettingsRepository';
import { SettingsRepository } from './repositories/SettingsRepository';
import { ISolanaRepository } from './repositories/ISolanaRepository';
import { SolanaRepository } from './repositories/SolanaRepository';
import { SolanaRemoteDataSourceImpl } from './datasources/SolanaRemoteDataSource';
import { IQuoteRepository } from './repositories/IQuoteRepository';
import { QuoteRepository } from './repositories/QuoteRepository';
import { QuoteRemoteDataSourceImpl } from './datasources/QuoteRemoteDataSource';
import { ISwapRepository } from './repositories/ISwapRepository';
import { SwapRepository } from './repositories/SwapRepository';
import { SwapRemoteDataSourceImpl } from './datasources/SwapRemoteDataSource';
import { ITransactionRepository } from './repositories/ITransactionRepository';
import { TransactionRepository } from './repositories/TransactionRepository';
import { TransactionRemoteDataSourceImpl } from './datasources/TransactionRemoteDataSource';
import { IExecutionRepository } from './repositories/IExecutionRepository';
import { ExecutionRepository } from './repositories/ExecutionRepository';
import { ExecutionRemoteDataSourceImpl } from './datasources/ExecutionRemoteDataSource';
import { ISimulationRepository } from './repositories/ISimulationRepository';
import { SimulationRepository } from './repositories/SimulationRepository';
import { SimulationRemoteDataSourceImpl } from './datasources/SimulationRemoteDataSource';
import { IPortfolioAnalyticsRepository } from './repositories/IPortfolioAnalyticsRepository';
import { PortfolioAnalyticsRepository } from './repositories/PortfolioAnalyticsRepository';
import { PortfolioAnalyticsRemoteDataSourceImpl } from './datasources/PortfolioAnalyticsRemoteDataSource';
import { PortfolioAnalyticsLocalDataSourceImpl } from './datasources/PortfolioAnalyticsLocalDataSource';

export * from './repositories/IAuthRepository';
export * from './repositories/IWalletRepository';
export * from './repositories/IMarketRepository';
export * from './repositories/IPortfolioRepository';
export * from './repositories/ISettingsRepository';
export * from './repositories/ISolanaRepository';
export * from './repositories/IQuoteRepository';
export * from './repositories/ISwapRepository';
export * from './repositories/ITransactionRepository';
export * from './repositories/IExecutionRepository';
export * from './repositories/ISimulationRepository';
export * from './repositories/IPortfolioAnalyticsRepository';

class ServiceLocator {
  private authRepository: IAuthRepository;
  private walletRepository: IWalletRepository;
  private marketRepository: IMarketRepository;
  private portfolioRepository: IPortfolioRepository;
  private settingsRepository: ISettingsRepository;
  private solanaRepository: ISolanaRepository;
  private quoteRepository: IQuoteRepository;
  private swapRepository: ISwapRepository;
  private transactionRepository: ITransactionRepository;
  private executionRepository: IExecutionRepository;
  private simulationRepository: ISimulationRepository;
  private portfolioAnalyticsRepository: IPortfolioAnalyticsRepository;

  constructor() {
    const remoteDS = new RemoteDataSourceImpl();
    const localDS = new LocalDataSourceImpl();
    const authRemoteDS = new AuthRemoteDataSourceImpl();
    const authLocalDS = new AuthLocalDataSourceImpl();
    const walletRemoteDS = new WalletRemoteDataSourceImpl();
    const walletLocalDS = new WalletLocalDataSourceImpl();
    const solanaRemoteDS = new SolanaRemoteDataSourceImpl();
    const marketRemoteDS = new MarketRemoteDataSourceImpl();
    const marketLocalDS = new MarketLocalDataSourceImpl();

    this.authRepository = new AuthRepository(authRemoteDS, authLocalDS);
    this.walletRepository = new WalletRepository(walletRemoteDS, walletLocalDS);
    this.marketRepository = new MarketRepository(marketRemoteDS, marketLocalDS);
    this.portfolioRepository = new PortfolioRepository(remoteDS);
    this.settingsRepository = new SettingsRepository(localDS);
    this.solanaRepository = new SolanaRepository(solanaRemoteDS);
    
    const quoteRemoteDS = new QuoteRemoteDataSourceImpl();
    this.quoteRepository = new QuoteRepository(quoteRemoteDS);

    const swapRemoteDS = new SwapRemoteDataSourceImpl();
    this.swapRepository = new SwapRepository(swapRemoteDS);

    const transactionRemoteDS = new TransactionRemoteDataSourceImpl();
    this.transactionRepository = new TransactionRepository(transactionRemoteDS);

    const executionRemoteDS = new ExecutionRemoteDataSourceImpl();
    this.executionRepository = new ExecutionRepository(executionRemoteDS);

    const simulationRemoteDS = new SimulationRemoteDataSourceImpl();
    this.simulationRepository = new SimulationRepository(simulationRemoteDS);

    const portfolioAnalyticsRemoteDS = new PortfolioAnalyticsRemoteDataSourceImpl();
    const portfolioAnalyticsLocalDS = new PortfolioAnalyticsLocalDataSourceImpl();
    this.portfolioAnalyticsRepository = new PortfolioAnalyticsRepository(portfolioAnalyticsRemoteDS, portfolioAnalyticsLocalDS);
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

  public getSolanaRepository(): ISolanaRepository {
    return this.solanaRepository;
  }

  public getQuoteRepository(): IQuoteRepository {
    return this.quoteRepository;
  }

  public getSwapRepository(): ISwapRepository {
    return this.swapRepository;
  }

  public getTransactionRepository(): ITransactionRepository {
    return this.transactionRepository;
  }

  public getExecutionRepository(): IExecutionRepository {
    return this.executionRepository;
  }

  public getSimulationRepository(): ISimulationRepository {
    return this.simulationRepository;
  }

  public getPortfolioAnalyticsRepository(): IPortfolioAnalyticsRepository {
    return this.portfolioAnalyticsRepository;
  }
}

export const serviceLocator = new ServiceLocator();
export default serviceLocator;
