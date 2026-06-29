import { 
  PortfolioCalculator, 
  CostBasisCalculator, 
  PortfolioPerformanceEngine, 
  PortfolioInsightsEngine,
  AssetAllocationEngine,
  ProfitLossCalculator,
  PortfolioHistoryEngine,
  PortfolioSnapshotManager,
  PortfolioCache,
  PortfolioSerializer
} from '../PortfolioAnalyticsEngine';
import { PortfolioAnalyticsMapper } from '../../api/PortfolioAnalyticsMapper';
import { PortfolioAnalyticsRepository } from '../../../services/repositories/PortfolioAnalyticsRepository';
import { featureFlagsManager } from '../../api/FeatureFlags';
import { ValidationError, RepositoryError } from '../../errors';
import { serviceLocator } from '../../../services';
import { PortfolioSnapshotDTO } from '../../api/PortfolioAnalyticsDTOs';

// Mock remote and local data sources
const mockRemoteDS = {
  fetchPortfolioAnalytics: jest.fn(),
  fetchHistoricalSnapshots: jest.fn(),
};

const mockLocalDS = {
  getCachedAnalytics: jest.fn(),
  saveAnalytics: jest.fn(),
  getCachedSnapshots: jest.fn(),
  saveSnapshots: jest.fn(),
  clearCache: jest.fn(),
};

describe('ChadWallet Portfolio Intelligence Detailed Test Suite', () => {
  let repository: PortfolioAnalyticsRepository;
  const mockSolana = serviceLocator.getSolanaRepository() as any;
  const mockMarket = serviceLocator.getMarketRepository() as any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PortfolioAnalyticsRepository(mockRemoteDS as any, mockLocalDS as any);
    PortfolioCache.clear();
    
    // Set default mock resolves
    mockSolana.getNativeBalance.mockResolvedValue(1.5);
    mockSolana.getTokenHoldings.mockResolvedValue([]);
    mockSolana.getTransactionHistory.mockResolvedValue([]);
    mockMarket.getPrices.mockResolvedValue({});
    mockLocalDS.getCachedAnalytics.mockResolvedValue(null);
    mockLocalDS.getCachedSnapshots.mockResolvedValue([]);
    
    // Default config features
    jest.spyOn(featureFlagsManager, 'isEnabled').mockImplementation((key) => {
      if (key === 'ENABLE_PORTFOLIO_ANALYTICS') return true;
      if (key === 'ENABLE_HISTORICAL_SNAPSHOTS') return true;
      return false;
    });
  });

  // 1. PortfolioCalculator Tests
  describe('PortfolioCalculator', () => {
    it('should categorize mint addresses into correct Sector mappings', () => {
      expect(PortfolioCalculator.resolveSector('sol_mint_address_USDC')).toBe('Stablecoins');
      expect(PortfolioCalculator.resolveSector('sol_mint_address_JUP')).toBe('DeFi');
      expect(PortfolioCalculator.resolveSector('sol_mint_address_BONK')).toBe('Meme');
      expect(PortfolioCalculator.resolveSector('sol_mint_address_RENDER')).toBe('AI');
      expect(PortfolioCalculator.resolveSector('sol_gaming_token_atlas')).toBe('Gaming');
      expect(PortfolioCalculator.resolveSector('sol_card_nft')).toBe('NFT');
      expect(PortfolioCalculator.resolveSector('sol_mint_address_pyth')).toBe('Infrastructure');
      expect(PortfolioCalculator.resolveSector('unknown_mint')).toBe('Unknown');
    });

    it('should calculate allocation weights including edge cases', () => {
      const tokens = {
        sol_mint_address_USDC: 500,
        sol_mint_address_JUP: 500,
      };
      const sectors = PortfolioCalculator.calculateAllocations(tokens);
      expect(sectors.Stablecoins).toBe(0.5);
      expect(sectors.DeFi).toBe(0.5);
      expect(sectors.Meme).toBe(0);

      const emptySectors = PortfolioCalculator.calculateAllocations({});
      expect(emptySectors.Stablecoins).toBe(0);
    });
  });

  // 2. CostBasisCalculator Tests
  describe('CostBasisCalculator', () => {
    it('should compute unrealized PnL, break-even and ROI % correctly', () => {
      const pnl = CostBasisCalculator.calculatePnL({
        averageBuyPriceUsd: 10,
        currentPriceUsd: 12,
        holdAmount: 50,
        realizedFeesUsd: 20,
      });

      expect(pnl.costBasisUsd).toBe(500);
      expect(pnl.unrealizedPnLUsd).toBe(80);
      expect(pnl.roiPercent).toBe(16.0);
      expect(pnl.breakEvenPrice).toBe(10.4);
    });

    it('should handle zero amounts without crashing', () => {
      const pnl = CostBasisCalculator.calculatePnL({
        averageBuyPriceUsd: 0,
        currentPriceUsd: 10,
        holdAmount: 0,
        realizedFeesUsd: 0,
      });
      expect(pnl.roiPercent).toBe(0);
      expect(pnl.breakEvenPrice).toBe(0);
    });
  });

  // 3. PortfolioPerformanceEngine Tests
  describe('PortfolioPerformanceEngine', () => {
    it('should compute Sharpe Ratio index metrics', () => {
      const returns = [0.08, 0.12, 0.04, 0.16, 0.10];
      const sharpe = PortfolioPerformanceEngine.calculateSharpeRatio(returns, 0.02);
      expect(sharpe).toBe(1.789);
    });

    it('should compute Sortino Ratio downside deviations', () => {
      const returns = [0.06, 0.08, 0.01, 0.09, 0.05];
      const sortino = PortfolioPerformanceEngine.calculateSortinoRatio(returns, 0.02);
      expect(sortino).toBe(8.497);
    });

    it('should return default values for Sharpe/Sortino with insufficient data', () => {
      expect(PortfolioPerformanceEngine.calculateSharpeRatio([0.1])).toBe(0);
      expect(PortfolioPerformanceEngine.calculateSortinoRatio([0.1])).toBe(0);
    });

    it('should compute Time Weighted Return (TWR)', () => {
      const returns = [0.10, -0.05, 0.15];
      const twr = PortfolioPerformanceEngine.calculateTWR(returns);
      expect(twr).toBe(20.18);
    });

    it('should compute Money Weighted Return (MWR) using Modified Dietz', () => {
      const cashFlows = [
        { amount: 1000, timestamp: 10 },
        { amount: -500, timestamp: 20 },
      ];
      const mwr = PortfolioPerformanceEngine.calculateMWR(1000, 2000, cashFlows, 30);
      expect(mwr).toBe(33.33);
    });
  });

  // 4. PortfolioInsightsEngine Tests
  describe('PortfolioInsightsEngine', () => {
    it('should evaluate diversification scoring and concentration warnings', () => {
      const sectorWeights = {
        DeFi: 0.6,
        Meme: 0.1,
        Stablecoins: 0.3,
        Infrastructure: 0,
        NFT: 0,
        AI: 0,
        Gaming: 0,
        Unknown: 0
      };

      const check = PortfolioInsightsEngine.checkInsights(sectorWeights, 1);
      expect(check.diversificationScore).toBe(60);
      expect(check.healthScore).toBe(75);
      expect(check.warnings[0]).toContain('Concentration Alert: DeFi');
      expect(check.warnings[1]).toContain('spam token');
    });
  });

  // 5. AssetAllocationEngine Tests
  describe('AssetAllocationEngine', () => {
    it('should correctly calculate detailed allocations and list dust/spam assets', () => {
      const holdings = [
        { mint: 'solana_mint', balance: 10, name: 'Solana', symbol: 'SOL' },
        { mint: 'bonk_mint', balance: 100, name: 'BONK Free Claim', symbol: 'CLAIM_BONK' },
        { mint: 'dust_mint', balance: 0.01, name: 'Dusty', symbol: 'DST' },
      ];
      const prices = {
        solana_mint: { price_usd: 15 },
        bonk_mint: { price_usd: 0.1 },
        dust_mint: { price_usd: 0.1 },
      };

      const allocation = AssetAllocationEngine.calculateAllocation(holdings, prices);
      expect(allocation.largest_holding_mint).toBe('solana_mint');
      expect(allocation.smallest_holding_mint).toBe('dust_mint');
      expect(allocation.dust_mints).toContain('dust_mint');
      expect(allocation.spam_mints).toContain('bonk_mint');
    });
  });

  // 6. ProfitLossCalculator Tests
  describe('ProfitLossCalculator', () => {
    it('should compute complete P&L metrics with mock fallback', () => {
      const holdings = [
        { mint: 'sol_mint', balance: 2, name: 'Solana', symbol: 'SOL' },
      ];
      const prices = {
        sol_mint: { price_usd: 100 },
      };
      const pnl = ProfitLossCalculator.calculatePnLMetrics(holdings, prices, []);
      expect(pnl.cost_basis_usd).toBe(160);
      expect(pnl.unrealized_pnl_usd).toBe(40);
      expect(pnl.roi_percent).toBe(181.25);
    });

    it('should compute win rate from transactions', () => {
      const transactions = [
        { type: 'swap', amount: 1.0 },
        { type: 'swap', amount: 0.2 },
      ];
      const pnl = ProfitLossCalculator.calculatePnLMetrics([], {}, transactions);
      expect(pnl.win_rate).toBe(0.5);
      expect(pnl.loss_rate).toBe(0.5);
    });
  });

  // 7. PortfolioHistoryEngine Tests
  describe('PortfolioHistoryEngine', () => {
    const snapshots: PortfolioSnapshotDTO[] = [
      {
        snapshot_id: '1',
        timestamp: 1000,
        net_worth_usd: 100,
        change_24h_usd: 10,
        change_24h_percent: 10,
        allocation: { sectors: { Stablecoins: 1 }, tokens: {}, largest_holding_mint: 'none', smallest_holding_mint: 'none', dust_mints: [], spam_mints: [] }
      },
      {
        snapshot_id: '2',
        timestamp: 2000,
        net_worth_usd: 150,
        change_24h_usd: 50,
        change_24h_percent: 50,
        allocation: { sectors: { Stablecoins: 0.5, DeFi: 0.5 }, tokens: {}, largest_holding_mint: 'none', smallest_holding_mint: 'none', dust_mints: [], spam_mints: [] }
      }
    ];

    it('should compile timelines, growth curves, and historical allocation streams', () => {
      const timeline = PortfolioHistoryEngine.generateHistoryTimeline(snapshots);
      expect(timeline[0].netWorthUsd).toBe(100);
      
      const growth = PortfolioHistoryEngine.calculateGrowthCurve(snapshots);
      expect(growth).toEqual([100, 150]);

      const historicalAllocations = PortfolioHistoryEngine.calculateHistoricalAllocation(snapshots);
      expect(historicalAllocations[0].Stablecoins).toBe(1);
      expect(historicalAllocations[1].DeFi).toBe(0.5);
    });
  });

  // 8. PortfolioSnapshotManager Tests
  describe('PortfolioSnapshotManager', () => {
    it('should capture snapshots and calculate diff reports', () => {
      const allocA = { sectors: { Stablecoins: 1 }, tokens: {}, largest_holding_mint: 'none', smallest_holding_mint: 'none', dust_mints: [], spam_mints: [] };
      const allocB = { sectors: { Stablecoins: 0.7, DeFi: 0.3 }, tokens: {}, largest_holding_mint: 'none', smallest_holding_mint: 'none', dust_mints: [], spam_mints: [] };

      const snapA = PortfolioSnapshotManager.captureSnapshot('addr', 1000, allocA);
      const snapB = PortfolioSnapshotManager.captureSnapshot('addr', 1200, allocB);

      expect(snapA.net_worth_usd).toBe(1000);
      const diff = PortfolioSnapshotManager.diffSnapshots(snapA, snapB);
      expect(diff.netWorthChangeUsd).toBe(200);
      expect(diff.netWorthChangePercent).toBe(20.0);
    });
  });

  // 9. PortfolioCache Tests
  describe('PortfolioCache', () => {
    it('should cache, retrieve, and evict metrics using SWR TTL checks', () => {
      PortfolioCache.set('test_key', { data: 1 }, 1000);
      expect(PortfolioCache.get<{ data: number }>('test_key')?.data).toBe(1);

      PortfolioCache.delete('test_key');
      expect(PortfolioCache.get('test_key')).toBeNull();
    });
  });

  // 10. PortfolioSerializer Tests
  describe('PortfolioSerializer', () => {
    it('should serialize and deserialize structures safely', () => {
      const rawObj = { a: 1, b: 'test' };
      const rawJson = PortfolioSerializer.serialize(rawObj);
      const output = PortfolioSerializer.deserialize<{ a: number }>(rawJson);
      expect(output.a).toBe(1);
    });

    it('should throw ValidationError on sensitive credentials leak', () => {
      const credentialsObj = { 
        publicKey: 'xyz',
        privateKey: 'SECRET_KEY_DO_NOT_LEAK',
      };
      expect(() => {
        PortfolioSerializer.serialize(credentialsObj);
      }).toThrow(ValidationError);
    });

    it('should throw ValidationError on malformed deserialization payloads', () => {
      expect(() => {
        PortfolioSerializer.deserialize('invalid-json');
      }).toThrow(ValidationError);
    });
  });

  // 11. PortfolioAnalyticsMapper Tests
  describe('PortfolioAnalyticsMapper', () => {
    it('should assemble a complete PortfolioAnalyticsDTO dataset', () => {
      const holdings = [
        { mint: 'SOL_MINT', balance: 5, name: 'Solana', symbol: 'SOL' },
      ];
      const prices = {
        SOL_MINT: { price_usd: 100, change_24h_percent: 10.0 },
      };
      const transactions = [
        { type: 'swap', fee: 0.005 },
      ];

      const dto = PortfolioAnalyticsMapper.mapToDTO({
        address: 'wallet_address',
        holdings,
        prices,
        transactions,
      });

      expect(dto.address).toBe('wallet_address');
      expect(dto.net_worth_usd).toBe(500);
    });
  });

  // 12. PortfolioAnalyticsRepository Tests
  describe('PortfolioAnalyticsRepository Layer', () => {
    it('should dynamically calculate and map portfolio stats on cache miss', async () => {
      mockSolana.getNativeBalance.mockResolvedValue(10.0);
      mockSolana.getTokenHoldings.mockResolvedValue([
        { mint: 'token_mint_1', balance: 50, name: 'DeFi Token', symbol: 'DEFI1' }
      ]);
      mockMarket.getPrices.mockResolvedValue({
        'So11111111111111111111111111111111111111112': { price_usd: 150 },
        'token_mint_1': { price_usd: 2.0, change_24h_percent: 5 },
      });

      const stats = await repository.getPortfolioAnalytics('test_address', true);

      expect(stats.address).toBe('test_address');
      expect(stats.net_worth_usd).toBe(1600); // 10*150 + 50*2 = 1500 + 100 = 1600
      expect(mockLocalDS.saveAnalytics).toHaveBeenCalledWith('test_address', expect.any(Object));
    });

    it('should return cached analytics if available and not forceRefresh', async () => {
      const mockCached = { address: 'cached_addr', net_worth_usd: 500 } as any;
      mockLocalDS.getCachedAnalytics.mockResolvedValue(mockCached);

      const stats = await repository.getPortfolioAnalytics('cached_addr', false);

      expect(stats).toEqual(mockCached);
      expect(mockSolana.getNativeBalance).not.toHaveBeenCalled();
    });

    it('should fallback to local cache if network/calculation fails', async () => {
      const mockCached = { address: 'fallback_addr', net_worth_usd: 800 } as any;
      mockLocalDS.getCachedAnalytics.mockResolvedValue(mockCached);
      mockSolana.getNativeBalance.mockRejectedValue(new Error('RPC network connection lost'));

      const stats = await repository.getPortfolioAnalytics('fallback_addr', true);

      expect(stats).toEqual(mockCached);
    });

    it('should throw RepositoryError if query fails and no cache exists', async () => {
      mockLocalDS.getCachedAnalytics.mockResolvedValue(null);
      mockSolana.getNativeBalance.mockRejectedValue(new Error('RPC network failure'));

      await expect(repository.getPortfolioAnalytics('error_addr', true)).rejects.toThrow(
        RepositoryError
      );
    });

    it('should throw PORTFOLIO_ANALYTICS_DISABLED if feature flag is off', async () => {
      jest.spyOn(featureFlagsManager, 'isEnabled').mockReturnValue(false);

      await expect(repository.getPortfolioAnalytics('addr')).rejects.toThrow(
        'Portfolio analytics feature is currently disabled.'
      );
    });

    it('should fetch and cache historical snapshots', async () => {
      const mockSnaps = [{ snapshot_id: 'snap1', timestamp: 12345 }] as any;
      mockRemoteDS.fetchHistoricalSnapshots.mockResolvedValue(mockSnaps);

      const snaps = await repository.getHistoricalSnapshots('addr', true);
      expect(snaps).toEqual(mockSnaps);
      expect(mockLocalDS.saveSnapshots).toHaveBeenCalledWith('addr', mockSnaps);
    });
  });
});
