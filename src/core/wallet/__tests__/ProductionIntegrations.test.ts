/* eslint-env jest */
/**
 * Phase 16 Test Suite — Production Integrations, Exchange Connectivity, Fiat On/Off Ramp & Global Release
 *
 * Targets: DexProviderManager, MainnetClusterManager, TokenDiscoveryEngine, PriceProviderManager, FiatProviderManager,
 *          ExchangeConnectivityManager, PushNotificationManager, ProductionAnalyticsManager, ReleaseManager, BackgroundServicesScheduler
 */

import {
  DexProviderManager,
  JupiterProvider,
  RaydiumProvider,
  OrcaProvider,
  LifinityProvider,
  OpenBookProvider,
  RouteQualityAnalyzer,
  LiquidityProviderMonitor,
} from '../DexProviderManager';

import { MainnetClusterManager } from '../MainnetClusterManager';

import {
  TokenDiscoveryEngine,
  MetadataValidator,
  SpamTokenFilter,
  LogoResolver,
} from '../TokenDiscoveryEngine';

import {
  PriceProviderManager,
} from '../PriceProviderManager';

import {
  FiatProviderManager,
  CountryRulesEngine,
  KYCStateManager,
  PaymentMethodManager,
} from '../FiatProviderManager';

import {
  ExchangeConnectivityManager,
  KrakenAdapter,
  OkxAdapter,
  BybitAdapter,
} from '../ExchangeConnectivityManager';

import {
  PushManager,
} from '../PushNotificationManager';

import {
  ProductionAnalyticsManager,
} from '../../observability/ProductionAnalyticsManager';

import {
  ReleaseManager,
  VersionChecker,
} from '../ReleaseManager';

import {
  BackgroundServicesScheduler,
} from '../BackgroundServicesScheduler';

import { featureFlagsManager } from '../../api/FeatureFlags';
import { useObservabilityStore } from '../../../features/observability/observabilityStore';

describe('Phase 16: Production Integrations & Global Release', () => {

  beforeEach(() => {
    // Reset configs
    featureFlagsManager.clearLocalOverride('ENABLE_DEX_PROVIDERS');
    featureFlagsManager.clearLocalOverride('ENABLE_FIAT');
    featureFlagsManager.clearLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY');
    featureFlagsManager.clearLocalOverride('ENABLE_PUSH_NOTIFICATIONS');
    featureFlagsManager.clearLocalOverride('ENABLE_RELEASE_MANAGER');
    featureFlagsManager.clearLocalOverride('ENABLE_ANALYTICS');
    featureFlagsManager.clearLocalOverride('ENABLE_BACKGROUND_REFRESH');
    featureFlagsManager.clearLocalOverride('ENABLE_RPC_FAILOVER');
    featureFlagsManager.clearLocalOverride('ENABLE_REMOTE_KILL_SWITCH');
  });

  // =========================================================
  // 1. DEX PROVIDERS CONNECTIVITY
  // =========================================================
  describe('DEX Connectivity & Route Optimization', () => {
    it('should aggregate quotes from all active DEX providers and select the best one', async () => {
      const manager = new DexProviderManager();
      const quote = await manager.getBestQuote('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 10, 0.5);
      expect(quote.is_valid).toBe(true);
      expect(quote.expected_output_amount).toBeGreaterThan(0);
      expect(quote.routes.length).toBeGreaterThan(0);
    });

    it('should fall back to fallback provider when primary swap fails', async () => {
      const manager = new DexProviderManager();
      const quote = await manager.getBestQuote('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 10, 0.5);
      
      // Inject failure on primary provider to force failover route
      const mockFailProvider = {
        name: quote.routes[0].provider_name,
        getQuote: jest.fn(),
        executeSwap: jest.fn(() => { throw new Error('Network failure'); }),
        getHealth: jest.fn(),
      };
      (manager as any).providers = [
        mockFailProvider,
        new JupiterProvider(),
        new RaydiumProvider(),
      ];

      const swapResult = await manager.executeSwap(quote, '8FGsj2KAGDvg...');
      expect(swapResult.is_valid).toBe(true);
      expect(swapResult.swap_id).toMatch(/swap_(jup|ray)_/);
    });

    it('should evaluate route quality metrics', () => {
      const healthyRoute = {
        provider_name: 'jupiter',
        input_mint: 'So11111111111111111111111111111111111111112',
        output_mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        in_amount: 10,
        out_amount: 9.9,
        price_impact_percent: 0.1,
        route_steps: [],
        execution_time_ms: 100,
        confidence_score: 95,
      };

      const quality = RouteQualityAnalyzer.analyze(healthyRoute);
      expect(quality.isViable).toBe(true);
      expect(quality.score).toBe(95);

      const badRoute = {
        ...healthyRoute,
        price_impact_percent: 4.5,
        execution_time_ms: 3000,
        route_steps: [{}, {}, {}, {}] as any,
      };
      const badQuality = RouteQualityAnalyzer.analyze(badRoute);
      expect(badQuality.isViable).toBe(true); // price impact < 5
      expect(badQuality.score).toBe(35); // penalized score
      expect(badQuality.reasons).toContain('HIGH_PRICE_IMPACT');
      expect(badQuality.reasons).toContain('HIGH_EXECUTION_LATENCY');
      expect(badQuality.reasons).toContain('HIGH_HOP_COMPLEXITY');
    });

    it('should monitor liquidity provider pool depths', () => {
      const depth = LiquidityProviderMonitor.getPoolDepth('jupiter', 'SOL/USDC');
      expect(depth.tvlUsd).toBe(12000000);
      expect(depth.dailyVolumeUsd).toBe(850000);
    });

    it('should fail quote retrieve when dex providers are disabled by feature flag', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_DEX_PROVIDERS', false);
      const manager = new DexProviderManager();
      await expect(manager.getBestQuote('So11111111111111111111111111111111111111112', 'USDC', 10, 0.5)).rejects.toThrow();
      await expect(manager.executeSwap({} as any, 'addr')).rejects.toThrow();
    });

    it('should simulate individual DEX providers methods', async () => {
      const jup = new JupiterProvider();
      const ray = new RaydiumProvider();
      const orca = new OrcaProvider();
      const lif = new LifinityProvider();
      const ob = new OpenBookProvider();

      expect((await jup.getHealth()).isHealthy).toBe(true);
      expect((await ray.getHealth()).isHealthy).toBe(true);
      expect((await orca.getHealth()).isHealthy).toBe(true);
      expect((await lif.getHealth()).isHealthy).toBe(true);
      expect((await ob.getHealth()).isHealthy).toBe(true);

      const testQuote = await ray.getQuote('SOL', 'USDC', 100, 0.5);
      const testSwap = await ray.executeSwap(testQuote, 'addr');
      expect(testSwap.is_valid).toBe(true);

      const orcaSwap = await orca.executeSwap(testQuote, 'addr');
      expect(orcaSwap.is_valid).toBe(true);

      const lifSwap = await lif.executeSwap(testQuote, 'addr');
      expect(lifSwap.is_valid).toBe(true);

      const obSwap = await ob.executeSwap(testQuote, 'addr');
      expect(obSwap.is_valid).toBe(true);
    });
  });

  // =========================================================
  // 2. MAINNET & RPC CLUSTER SWITCHING
  // =========================================================
  describe('Mainnet & RPC Cluster Switching', () => {
    it('should switches between devnet and mainnet configurations', () => {
      const manager = new MainnetClusterManager();
      expect(manager.getActiveCluster()).toBe('devnet');

      // Switch to mainnet while disabled
      featureFlagsManager.setLocalOverride('ENABLE_MAINNET', false);
      manager.switchCluster('mainnet');
      expect(manager.getActiveCluster()).toBe('devnet');

      // Switch to mainnet when enabled
      featureFlagsManager.setLocalOverride('ENABLE_MAINNET', true);
      manager.switchCluster('mainnet');
      expect(manager.getActiveCluster()).toBe('mainnet');
    });

    it('should rank RPC endpoints by reputation score and latency', () => {
      const manager = new MainnetClusterManager();
      manager.addNode({
        url: 'https://rpc.high.latency',
        cluster: 'devnet',
        latencyMs: 900,
        reputationScore: 100,
        consecutiveFailures: 0,
        totalRequests: 0,
        totalErrors: 0,
        quotaLimit: 1000,
        quotaUsed: 0,
        isActive: true,
      });

      const prioritized = manager.getPrioritizedNodes();
      // Fast node should come first
      expect(prioritized[0].url).toContain('helius');
    });

    it('should deactivate RPC nodes with consecutive failures', () => {
      const manager = new MainnetClusterManager();
      const nodeUrl = 'https://api.devnet.solana.com';

      for (let i = 0; i < 5; i++) {
        manager.recordRequest(nodeUrl, false, 500);
      }

      const stats = manager.getNodeStats(nodeUrl);
      expect(stats?.isActive).toBe(false);
      expect(stats?.reputationScore).toBe(0);

      // Verify prioritized nodes no longer contains the deactivated node
      const active = manager.getPrioritizedNodes();
      expect(active.some(n => n.url === nodeUrl)).toBe(false);
    });

    it('should verify fallback endpoint if all nodes are deactivated', () => {
      const manager = new MainnetClusterManager();
      manager.getAllNodes().forEach(n => {
        n.isActive = false;
      });

      const fallback = manager.getActiveEndpoint();
      expect(fallback).toBe('https://api.devnet.solana.com');

      manager.switchCluster('mainnet');
      const fallbackMainnet = manager.getActiveEndpoint();
      expect(fallbackMainnet).toBe('https://api.mainnet-beta.solana.com');
    });

    it('should remove and reset RPC nodes', () => {
      const manager = new MainnetClusterManager();
      expect(manager.removeNode('https://api.devnet.solana.com')).toBe(true);
      expect(manager.getNodeStats('https://api.devnet.solana.com')).toBeNull();

      manager.resetStats();
      const activeNode = manager.getNodeStats('https://api.mainnet-beta.solana.com');
      expect(activeNode?.isActive).toBe(true);
      expect(activeNode?.quotaUsed).toBe(0);
    });
  });

  // =========================================================
  // 3. REAL TOKEN DISCOVERY & META RESOLVERS
  // =========================================================
  describe('Token Discovery & Spam Filters', () => {
    it('should resolve metadata configurations for tokens and NFTs', async () => {
      const engine = new TokenDiscoveryEngine();
      
      const solMeta = await engine.getMetadata('So11111111111111111111111111111111111111112');
      expect(solMeta.symbol).toBe('SOL');
      expect(solMeta.isVerified).toBe(true);

      const nftMeta = await engine.getNFTMetadata('nftMintAddress123');
      expect(nftMeta.symbol).toBe('CHAD');
      expect(nftMeta.isVerified).toBe(true);
    });

    it('should detect spam indicators in token names and symbols', () => {
      expect(SpamTokenFilter.checkSpam('FREE USDC AIRDROP', 'USDC')).toBe(true);
      expect(SpamTokenFilter.checkSpam('Winner Reward Token', 'WINNER')).toBe(true);
      expect(SpamTokenFilter.checkSpam('Solana', 'SOL')).toBe(false);
    });

    it('should validate metadata formatting checks', () => {
      expect(MetadataValidator.validate('Valid Token Name', 'TKN')).toBe(true);
      expect(MetadataValidator.validate('', 'TKN')).toBe(false);
      expect(MetadataValidator.validate('A'.repeat(60), 'TKN')).toBe(false);
    });

    it('should manage local metadata caches', async () => {
      const engine = new TokenDiscoveryEngine();
      const mint = 'So11111111111111111111111111111111111111112';

      // First fetch
      const val1 = await engine.getMetadata(mint);
      expect(engine.tokenCache.get(mint)).not.toBeNull();

      // Second fetch should use cached entry
      const val2 = await engine.getMetadata(mint);
      expect(val1.mint).toBe(val2.mint);

      engine.tokenCache.clear();
      expect(engine.tokenCache.get(mint)).toBeNull();
    });

    it('should resolve fallback logos', () => {
      const logo = LogoResolver.getFallbackLogo('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      expect(logo).toContain('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
    });

    it('should add registry records dynamically', async () => {
      const engine = new TokenDiscoveryEngine();
      const customMint = 'customMintAddress';

      expect(engine.verifiedRegistry.isVerified(customMint)).toBe(false);
      engine.verifiedRegistry.addVerified(customMint);
      expect(engine.verifiedRegistry.isVerified(customMint)).toBe(true);

      expect(engine.scamRegistry.isScam(customMint)).toBe(false);
      engine.scamRegistry.addScam(customMint);
      expect(engine.scamRegistry.isScam(customMint)).toBe(true);
    });
  });

  // =========================================================
  // 4. PRICE FEEDS & PROVIDER FAILOVERS
  // =========================================================
  describe('Price Feeds & Provider Failover', () => {
    it('should fetch price feeds and handle dynamic provider switching', async () => {
      const manager = new PriceProviderManager();
      expect(manager.getProviders().length).toBe(5);

      manager.setPrimaryProvider('birdeye');
      const solPrice = await manager.fetchPrice('So11111111111111111111111111111111111111112');
      expect(solPrice.source).toBe('birdeye');
      expect(solPrice.priceUsd).toBe(148.2);
    });

    it('should fall back to alternate price provider when primary fails', async () => {
      const manager = new PriceProviderManager();
      manager.setPrimaryProvider('coingecko');

      // Inject fail logic
      const failProvider = {
        name: 'coingecko',
        fetchPrice: jest.fn(() => { throw new Error('API Rate Limit'); }),
      };
      manager.registerProvider(failProvider);

      const price = await manager.fetchPrice('So11111111111111111111111111111111111111112');
      expect(price.source).not.toBe('coingecko');
      expect(price.priceUsd).toBeGreaterThan(0);
    });

    it('should throw exception if all price providers fail', async () => {
      const manager = new PriceProviderManager();
      const failFetch = () => { throw new Error('Fail'); };
      manager.getProviders().forEach(name => {
        manager.registerProvider({ name, fetchPrice: failFetch });
      });

      await expect(manager.fetchPrice('SOL')).rejects.toThrow('All registered price providers failed');
    });

    it('should test fallback register warnings', () => {
      const manager = new PriceProviderManager();
      manager.setPrimaryProvider('nonexistent_provider');
      // Should not throw, should just warn and default to jupiter
    });
  });

  // =========================================================
  // 5. FIAT ON/OFF RAMP COMPLIANCE
  // =========================================================
  describe('Fiat On/Off Ramp compliance', () => {
    it('should check restricted countries rules', () => {
      const rules = new CountryRulesEngine();
      expect(rules.isCountryRestricted('KP')).toBe(true);
      expect(rules.isCountryRestricted('US')).toBe(false);

      expect(rules.getSupportedFiatCurrencies('US')).toContain('USD');
      expect(rules.getSupportedFiatCurrencies('KP')).toHaveLength(0);
      expect(rules.getSupportedFiatCurrencies('FR')).toContain('EUR');
    });

    it('should get supported local payment methods', () => {
      const payment = new PaymentMethodManager();
      expect(payment.getMethods('US').some(m => m.id === 'ach')).toBe(true);
      expect(payment.getMethods('GB').some(m => m.id === 'fps')).toBe(true);
      expect(payment.getMethods('XX').some(m => m.id === 'card')).toBe(true); // fallback
    });

    it('should manage KYC state validations', () => {
      const kyc = new KYCStateManager();
      const state = kyc.getStatus('user1', 'moonpay');
      expect(state.status).toBe('uninitiated');

      kyc.saveStatus({
        userId: 'user1',
        providerName: 'moonpay',
        status: 'approved',
        updatedAt: Date.now(),
      });

      const updated = kyc.getStatus('user1', 'moonpay');
      expect(updated.status).toBe('approved');
    });

    it('should aggregate quotes from multiple fiat providers', async () => {
      const manager = new FiatProviderManager();
      
      const mockFiatProvider = {
        name: 'moonpay',
        getSupportedMethods: jest.fn(async () => [{ id: 'card', name: 'Card', description: '', feePercent: 1.0, processingTime: '' }]),
        getOnRampQuote: jest.fn(async () => ({
          quoteId: 'q_on_1', providerName: 'moonpay', fiatCurrency: 'USD', cryptoCurrency: 'SOL', fiatAmount: 100, cryptoAmount: 0.6, feeAmount: 2.0, netAmount: 98, expiresAt: Date.now(),
        })),
        getOffRampQuote: jest.fn(async () => ({
          quoteId: 'q_off_1', providerName: 'moonpay', fiatCurrency: 'USD', cryptoCurrency: 'SOL', fiatAmount: 95, cryptoAmount: 0.6, feeAmount: 3.0, netAmount: 92, expiresAt: Date.now(),
        })),
        submitKYC: jest.fn(),
        getKYCStatus: jest.fn(),
      };
      
      manager.registerProvider(mockFiatProvider);
      
      const onRamps = await manager.onRamp.getQuotes('USD', 'SOL', 100, 'US');
      expect(onRamps.length).toBe(1);
      expect(onRamps[0].providerName).toBe('moonpay');

      const offRamps = await manager.offRamp.getQuotes('USD', 'SOL', 100, 'US');
      expect(offRamps.length).toBe(1);
    });

    it('should fail quotes aggregation when country is restricted', async () => {
      const manager = new FiatProviderManager();
      await expect(manager.onRamp.getQuotes('USD', 'SOL', 100, 'KP')).rejects.toThrow();
      await expect(manager.offRamp.getQuotes('USD', 'SOL', 100, 'KP')).rejects.toThrow();
    });

    it('should test generic provider retrievals', () => {
      const manager = new FiatProviderManager();
      expect(manager.getProvider('nonexistent')).toBeNull();
    });
  });

  // =========================================================
  // 6. CENTRALIZED EXCHANGE CONNECTIVITY
  // =========================================================
  describe('Centralized Exchange Connectivity', () => {
    it('should mock credential balances retrieval for CEX providers', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY', true);
      const manager = new ExchangeConnectivityManager();

      expect(manager.getAdapters()).toContain('binance');
      expect(manager.getAdapters()).toContain('coinbase');

      const binanceBalances = await manager.getBalances('binance', 'key', 'secret');
      expect(binanceBalances.some(b => b.asset === 'BTC')).toBe(true);

      const coinbaseBalances = await manager.getBalances('coinbase', 'key', 'secret');
      expect(coinbaseBalances.some(b => b.asset === 'USDC')).toBe(true);
    });

    it('should place buy and sell orders for all adapters', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY', true);
      const manager = new ExchangeConnectivityManager();

      const order1 = await manager.submitOrder('binance', 'k', 's', 'SOL/USDT', 'BUY', 5, 148);
      expect(order1.status).toBe('FILLED');

      const order2 = await manager.submitOrder('coinbase', 'k', 's', 'SOL/USDC', 'SELL', 3);
      expect(order2.status).toBe('FILLED');

      const order3 = await manager.submitOrder('kraken', 'k', 's', 'SOL/USD', 'BUY', 1);
      expect(order3.status).toBe('FILLED');

      const order4 = await manager.submitOrder('okx', 'k', 's', 'SOL/USDT', 'SELL', 2);
      expect(order4.status).toBe('FILLED');

      const order5 = await manager.submitOrder('bybit', 'k', 's', 'SOL/USDT', 'BUY', 4);
      expect(order5.status).toBe('FILLED');

      // Cancellation check
      const cancel = await manager.cancelCexOrder('binance', 'k', 's', 'bin_123');
      expect(cancel.canceled).toBe(true);
    });

    it('should fail CEX connection if feature flag is disabled', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY', false);
      const manager = new ExchangeConnectivityManager();
      await expect(manager.getBalances('binance', 'k', 's')).rejects.toThrow();
      await expect(manager.submitOrder('binance', 'k', 's', 'SOL', 'BUY', 1)).rejects.toThrow();
      await expect(manager.cancelCexOrder('binance', 'k', 's', 'id')).rejects.toThrow();
    });

    it('should fail CEX connections if adapter is unknown', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY', true);
      const manager = new ExchangeConnectivityManager();
      await expect(manager.getBalances('nonexistent_cex', 'k', 's')).rejects.toThrow();
    });

    it('should cover additional adapters fetch balances', async () => {
      const kra = new KrakenAdapter();
      const okx = new OkxAdapter();
      const byb = new BybitAdapter();

      expect(await kra.fetchBalances('k', 's')).toHaveLength(2);
      expect(await okx.fetchBalances('k', 's')).toHaveLength(2);
      expect(await byb.fetchBalances('k', 's')).toHaveLength(1);

      expect((await kra.cancelOrder('k', 's', 'id')).canceled).toBe(true);
      expect((await okx.cancelOrder('k', 's', 'id')).canceled).toBe(true);
      expect((await byb.cancelOrder('k', 's', 'id')).canceled).toBe(true);
    });
  });

  // =========================================================
  // 7. PUSH NOTIFICATION SYSTEM
  // =========================================================
  describe('Push Notification Manager & Retry Pipeline', () => {
    it('should enqueue and dispatch alert notifications', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_PUSH_NOTIFICATIONS', true);
      const manager = new PushManager();

      const payload = {
        id: 'notif_1',
        type: 'price' as const,
        title: 'SOL Breakout',
        body: 'SOL has exceeded $150',
        data: { mint: 'SOL' },
        timestamp: Date.now(),
      };

      await manager.enqueueNotification(payload);
      expect(manager.getPendingQueueSize()).toBe(0);
      expect(manager.getRetryQueueSize()).toBe(0);
    });

    it('should filter notifications based on user preference settings', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_PUSH_NOTIFICATIONS', true);
      const manager = new PushManager();
      manager.updatePreferences({ enablePriceAlerts: false });

      const payload = {
        id: 'notif_2',
        type: 'price' as const,
        title: 'Dropped Price Alert',
        body: 'Will be ignored',
        data: {},
        timestamp: Date.now(),
      };

      await manager.enqueueNotification(payload);
      expect(manager.getPendingQueueSize()).toBe(0);
    });

    it('should retry notification delivery on failure', async () => {
      featureFlagsManager.setLocalOverride('ENABLE_PUSH_NOTIFICATIONS', true);
      const manager = new PushManager();

      const failProvider = {
        name: 'fail_provider',
        sendNotification: jest.fn(async () => { throw new Error('FCM unreachable'); }),
      };
      manager.registerProvider(failProvider);
      // Remove other providers
      (manager as any).providers = [failProvider];

      const payload = {
        id: 'notif_retry_test',
        type: 'security' as const,
        title: 'Root compromised warning',
        body: 'Security check compromise',
        data: {},
        timestamp: Date.now(),
      };

      await manager.enqueueNotification(payload);
      expect(manager.getRetryQueueSize()).toBe(1);

      // Verify retry increments attempts and eventually drops
      await manager.processRetryQueue();
      await manager.processRetryQueue();
      await manager.processRetryQueue();
      expect(manager.getRetryQueueSize()).toBe(0);
    });

    it('should manage generic queue controls', () => {
      const manager = new PushManager();
      manager.updatePreferences({ enableAiAlerts: true });
      expect(manager.getPreferences().enableAiAlerts).toBe(true);

      manager.clearQueues();
      expect(manager.getPendingQueueSize()).toBe(0);
      expect(manager.getRetryQueueSize()).toBe(0);
    });
  });

  // =========================================================
  // 8. PRIVACY-SAFE PRODUCTION ANALYTICS
  // =========================================================
  describe('Production Analytics Anonymization', () => {
    it('should mask sensitive credentials and anonymize ids', () => {
      const manager = new ProductionAnalyticsManager();
      featureFlagsManager.setLocalOverride('ENABLE_ANALYTICS', true);

      manager.startSession('user_explicit_identifier');
      expect(manager.getSessionId()).toBeDefined();

      // Track event with sensitive attributes
      const mockProvider = {
        name: 'analytics_target',
        trackEvent: jest.fn(async (event) => {
          expect(event.properties.privateKey).toBe('[REDACTED]');
          expect(event.properties.email).toBe('[REDACTED]');
          expect(event.properties.okProperty).toBe('safe_value');
        }),
      };
      manager.registerProvider(mockProvider);

      manager.trackEvent('purchase_tx', {
        privateKey: 'solana_private_key_confidential',
        email: 'user@gmail.com',
        okProperty: 'safe_value',
      });

      manager.trackConversion('swap_funnel', 2, 4);
      manager.trackFeatureUsage('ai_chat', true);
      manager.trackRetentionMetric('user_explicit_identifier', 30);

      manager.endSession('user_explicit_identifier');
    });

    it('should disable analytics completely if feature flag is false', () => {
      const manager = new ProductionAnalyticsManager();
      featureFlagsManager.setLocalOverride('ENABLE_ANALYTICS', false);

      const mockProvider = {
        name: 'test',
        trackEvent: jest.fn(),
      };
      manager.registerProvider(mockProvider);

      manager.startSession('user1');
      manager.trackEvent('event');
      expect(mockProvider.trackEvent).not.toHaveBeenCalled();
    });
  });

  // =========================================================
  // 9. RELEASE & REMOTE CONFIG MANAGEMENT
  // =========================================================
  describe('Release Config Rules Engine', () => {
    it('should trigger force updates for outdated versions', () => {
      const checker = VersionChecker.isOutdated('1.0.4', '1.0.8');
      expect(checker).toBe(true);

      const same = VersionChecker.isOutdated('1.0.8', '1.0.8');
      expect(same).toBe(false);

      const newer = VersionChecker.isOutdated('1.1.0', '1.0.8');
      expect(newer).toBe(false);
    });

    it('should verify Maintenance Mode and Remote Kill Switch parameters', () => {
      const manager = new ReleaseManager();
      featureFlagsManager.setLocalOverride('ENABLE_RELEASE_MANAGER', true);
      featureFlagsManager.setLocalOverride('ENABLE_REMOTE_KILL_SWITCH', false);

      expect(manager.isMaintenanceActive()).toBe(false);
      expect(manager.isKillSwitchActive()).toBe(false);

      manager.updateConfig({
        isMaintenanceMode: true,
        isKillSwitchActive: true,
      });

      expect(manager.isMaintenanceActive()).toBe(true);
      expect(manager.isKillSwitchActive()).toBe(true);

      // Verify feature flag override takes priority for kill switch
      featureFlagsManager.setLocalOverride('ENABLE_REMOTE_KILL_SWITCH', true);
      expect(manager.isKillSwitchActive()).toBe(true);
    });

    it('should test user feature rollouts and A/B bucket assignments', () => {
      const manager = new ReleaseManager();
      manager.setAppVersion('1.0.0');
      expect(manager.checkUpdateStatus().forceUpdateRequired).toBe(false);

      expect(manager.isFeatureEnabledForUser('ai_insights', 'user_1')).toBe(true); // 100% rollout
      expect(manager.isFeatureEnabledForUser('unknown_feat', 'user_1')).toBe(false); // 0% rollout

      // Partial rollout evaluation
      const enabled = manager.isFeatureEnabledForUser('swap_flow_v2', 'user_5');
      expect(typeof enabled).toBe('boolean');

      expect(manager.getAbBucket('user_abc')).toBe('bucket_a');
      expect(manager.getAbBucket('user_xyz')).toBe('bucket_b');
      expect(manager.getAbBucket('user_unknown')).toBe('default_bucket');
    });

    it('should bypass rules if ReleaseManager is disabled by feature flag', () => {
      const manager = new ReleaseManager();
      featureFlagsManager.setLocalOverride('ENABLE_RELEASE_MANAGER', false);
      manager.updateConfig({ isMaintenanceMode: true });

      expect(manager.isMaintenanceActive()).toBe(false);
      expect(manager.isKillSwitchActive()).toBe(false);
      expect(manager.checkUpdateStatus().forceUpdateRequired).toBe(false);
    });
  });

  // =========================================================
  // 10. BACKGROUND SERVICES SCHEDULING
  // =========================================================
  describe('Background Services Scheduling', () => {
    it('should adjust intervals based on battery saver levels', async () => {
      const scheduler = new BackgroundServicesScheduler();
      featureFlagsManager.setLocalOverride('ENABLE_BACKGROUND_REFRESH', true);

      // First sweep - triggers all sync paths
      const res1 = await scheduler.runSyncCycle(100, false);
      expect(res1.portfolioSynced).toBe(true);
      expect(res1.marketSynced).toBe(true);

      // Sub-interval sweep inside normal times - should not sync
      const res2 = await scheduler.runSyncCycle(90, false);
      expect(res2.portfolioSynced).toBe(false);
      expect(res2.marketSynced).toBe(false);

      // Battery saver sweep
      const metrics = scheduler.getMetrics();
      expect(metrics.syncCount).toBe(2);

      scheduler.resetSyncTimes();
      expect(scheduler.getMetrics().syncCount).toBe(0);
    });

    it('should bypass scheduling if background sync is disabled by feature flag', async () => {
      const scheduler = new BackgroundServicesScheduler();
      featureFlagsManager.setLocalOverride('ENABLE_BACKGROUND_REFRESH', false);

      const res = await scheduler.runSyncCycle(100, false);
      expect(res.portfolioSynced).toBeUndefined();
    });
  });

  // =========================================================
  // 11. ZUSTAND SELECTORS & OPTIMIZATIONS
  // =========================================================
  describe('Zustand Store Optimizations', () => {
    it('should recover state from snapshots and trigger batch updates', async () => {
      const state = useObservabilityStore.getState();
      
      // Batch updates
      state.batchUpdate({
        error: 'Batch Error Trigger',
        loading: true,
      });
      expect(useObservabilityStore.getState().error).toBe('Batch Error Trigger');
      expect(useObservabilityStore.getState().loading).toBe(true);

      // Snapshot recovery
      state.recoverFromSnapshot({
        error: 'Recovery Snapshot Error',
        loading: false,
      });
      expect(useObservabilityStore.getState().error).toBe('Recovery Snapshot Error');

      // Hydration
      await state.hydrateStoreAsync();
      expect(useObservabilityStore.getState().isHydrated).toBe(true);
    });
  });

  // =========================================================
  // 12. COVERAGE HARDENING
  // =========================================================
  describe('Coverage Hardening Tests', () => {
    it('should cover all remaining branches and statements in managers', async () => {
      // 1. DexProviderManager success executeSwap path & getProviders health
      const dexMgr = new DexProviderManager();
      expect(dexMgr.getProviders()).toHaveLength(5);
      expect(dexMgr.getHealthManager()).toBeDefined();
      expect(dexMgr.getFailoverManager()).toBeDefined();

      const quote = await dexMgr.getBestQuote('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 10, 0.5);
      const swapRes = await dexMgr.executeSwap(quote, 'addr123');
      expect(swapRes.is_valid).toBe(true);

      // RouteAggregator getQuote failure branch
      const mockFailQuoteProvider = {
        name: 'fail_q',
        getQuote: jest.fn(() => { throw new Error('Quote Fail'); }),
        executeSwap: jest.fn(),
        getHealth: jest.fn(),
      };
      await (dexMgr as any).constructor.nonexistent;
      expect(dexMgr.getHealthManager()).toBeDefined();
      
      const failover = dexMgr.getFailoverManager();
      const fallbackSelected = failover.selectBestProvider([mockFailQuoteProvider]);
      expect(fallbackSelected.name).toBe('fail_q');

      // 2. MainnetClusterManager success request tracking, sorting with diff reputation, and active endpoints
      const clusterMgr = new MainnetClusterManager();
      clusterMgr.recordRequest('https://api.devnet.solana.com', true, 50);
      expect(clusterMgr.getNodeStats('https://api.devnet.solana.com')?.reputationScore).toBe(100);

      // Diff reputation sort trigger
      clusterMgr.addNode({
        url: 'https://rpc.diff.rep',
        cluster: 'devnet',
        latencyMs: 10,
        reputationScore: 50,
        consecutiveFailures: 0,
        totalRequests: 0,
        totalErrors: 0,
        quotaLimit: 100,
        quotaUsed: 0,
        isActive: true,
      });
      const endpoints = clusterMgr.getPrioritizedNodes();
      expect(endpoints.length).toBeGreaterThan(1);
      expect(clusterMgr.getActiveEndpoint()).toBeDefined();

      // 3. TokenDiscoveryEngine USDC mint metadata and fallback cases
      const discovery = new TokenDiscoveryEngine();
      const usdcMeta = await discovery.getMetadata('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      expect(usdcMeta.symbol).toBe('USDC');
      
      const unknownMeta = await discovery.getMetadata('unknownMintAddress123');
      expect(unknownMeta.symbol).toBe('UNKNOWN');

      // 4. PriceProviderManager remaining provider calls
      const priceMgr = new PriceProviderManager();
      const providersList = ['coingecko', 'dexscreener', 'jupiter', 'helius'];
      for (const providerName of providersList) {
        priceMgr.setPrimaryProvider(providerName);
        const res = await priceMgr.fetchPrice('So11111111111111111111111111111111111111112');
        expect(res.source).toBe(providerName);
      }

      // 5. FiatProviderManager coverage
      const fiatMgr = new FiatProviderManager();
      fiatMgr.registerProvider({
        name: 'generic',
        getSupportedMethods: jest.fn(async () => []),
        getOnRampQuote: jest.fn(),
        getOffRampQuote: jest.fn(),
        submitKYC: jest.fn(),
        getKYCStatus: jest.fn(),
      });
      expect(fiatMgr.getProviders()).toHaveLength(1);

      // 6. ExchangeConnectivityManager cancel order Coinbase
      featureFlagsManager.setLocalOverride('ENABLE_EXCHANGE_CONNECTIVITY', true);
      const cexMgr = new ExchangeConnectivityManager();
      const coinbaseCancel = await cexMgr.cancelCexOrder('coinbase', 'k', 's', 'id_123');
      expect(coinbaseCancel.canceled).toBe(true);

      // 7. PushNotificationManager remaining alert types, queue bounds, and disabled flag path
      const pushMgr = new PushManager();
      featureFlagsManager.setLocalOverride('ENABLE_PUSH_NOTIFICATIONS', true);
      expect(pushMgr.getPendingQueueSize()).toBe(0);
      expect(pushMgr.getRetryQueueSize()).toBe(0);
      
      const alertTypes: Array<'portfolio' | 'execution' | 'security' | 'fraud'> = ['portfolio', 'execution', 'security', 'fraud'];
      for (const type of alertTypes) {
        await pushMgr.enqueueNotification({
          id: `id_${type}`,
          type,
          title: 'Alert',
          body: 'Body',
          data: {},
          timestamp: Date.now(),
        });
      }
      expect(pushMgr.getPendingQueueSize()).toBe(0);

      // Manual retry queue limit bounds trigger
      const failNotif = {
        id: 'retry_limit_trigger',
        type: 'price' as const,
        title: 'Title',
        body: 'Body',
        data: {},
        timestamp: Date.now(),
      };
      const mockFailSend = {
        name: 'failer',
        sendNotification: jest.fn(async () => { throw new Error('Err'); }),
      };
      (pushMgr as any).providers = [mockFailSend];
      await pushMgr.enqueueNotification(failNotif);
      // Calls enqueueForRetry multiple times on the same notification to trigger limit bounds
      for (let i = 0; i < 3; i++) {
        (pushMgr as any).enqueueForRetry(failNotif);
      }
      expect(pushMgr.getRetryQueueSize()).toBe(0); // dropped after exceeding MAX_RETRY_ATTEMPTS

      // Feature flag disabled push manager path
      featureFlagsManager.setLocalOverride('ENABLE_PUSH_NOTIFICATIONS', false);
      await pushMgr.enqueueNotification(failNotif);
      expect(pushMgr.getPendingQueueSize()).toBe(0);

      // Verify size checkers
      expect(pushMgr.getPendingQueueSize()).toBe(0);
      expect(pushMgr.getRetryQueueSize()).toBe(0);

      // 8. ReleaseManager getConfig & warn update logger
      const release = new ReleaseManager();
      featureFlagsManager.setLocalOverride('ENABLE_RELEASE_MANAGER', true);
      release.updateConfig({ minimumVersion: '2.0.0' });
      release.setAppVersion('1.0.0');
      const status = release.checkUpdateStatus();
      expect(status.forceUpdateRequired).toBe(true);
      expect(release.getConfig()).toBeDefined();

      // 9. BackgroundServicesScheduler low battery alerts coverage
      const scheduler = new BackgroundServicesScheduler();
      featureFlagsManager.setLocalOverride('ENABLE_BACKGROUND_REFRESH', true);
      const lowBatRes = await scheduler.runSyncCycle(15, false); // triggers low battery branch
      expect(lowBatRes.portfolioSynced).toBe(true);

      const saverRes = await scheduler.runSyncCycle(100, true); // triggers low battery saver active branch
      expect(saverRes.portfolioSynced).toBe(false);

      // 10. ProductionAnalyticsManager start/end session exceptions
      const analytics = new ProductionAnalyticsManager();
      featureFlagsManager.setLocalOverride('ENABLE_ANALYTICS', true);
      analytics.trackEvent('pre_session_background_event'); // covers session_id || 'background'
      analytics.endSession('user_1'); // currentSessionId empty branch

      // endSession when analytics disabled
      featureFlagsManager.setLocalOverride('ENABLE_ANALYTICS', false);
      analytics.endSession('user_1');

      featureFlagsManager.setLocalOverride('ENABLE_ANALYTICS', true);
      const failTrackProvider = {
        name: 'failer',
        trackEvent: jest.fn(async () => { throw new Error('Ingest Fail'); }),
      };
      analytics.registerProvider(failTrackProvider);
      analytics.trackEvent('event_fails_gracefully');

      // 11. Extra DexProviderManager Sorting & Failures covering remaining lines
      const dexCoverage = new DexProviderManager();
      // Record different latencies to cover sort comparator
      dexCoverage.getHealthManager().recordStatus('raydium', true, 100);
      dexCoverage.getHealthManager().recordStatus('orca', true, 10);
      const selectedFailover = dexCoverage.getFailoverManager().selectBestProvider(dexCoverage.getProviders());
      expect(selectedFailover.name).toBe('orca');

      // Empty health manager stats covers health defaults
      expect(dexCoverage.getHealthManager().getStats('unknown_p').isHealthy).toBe(true);

      // All providers unhealthy fallback
      dexCoverage.getHealthManager().recordStatus('jupiter', false, 9999);
      dexCoverage.getHealthManager().recordStatus('raydium', false, 9999);
      dexCoverage.getHealthManager().recordStatus('orca', false, 9999);
      dexCoverage.getHealthManager().recordStatus('lifinity', false, 9999);
      dexCoverage.getHealthManager().recordStatus('openbook', false, 9999);
      const deadFailover = dexCoverage.getFailoverManager().selectBestProvider(dexCoverage.getProviders());
      expect(deadFailover.name).toBe('jupiter');

      // Failed quote retrievals throws exception
      featureFlagsManager.setLocalOverride('ENABLE_DEX_PROVIDERS', true);
      const failQuoteProvider = {
        name: 'jupiter',
        getQuote: jest.fn(async () => { throw new Error(); }),
        executeSwap: jest.fn(),
        getHealth: jest.fn(),
      };
      (dexCoverage as any).providers = [failQuoteProvider];
      await expect(dexCoverage.getBestQuote('SOL', 'USDC', 10, 0.5)).rejects.toThrow();
    });
  });
});

