import { PortfolioCalculator, CostBasisCalculator, PortfolioPerformanceEngine, PortfolioInsightsEngine } from '../PortfolioAnalyticsEngine';
import { PortfolioAnalyticsRepository } from '../../../services/repositories/PortfolioAnalyticsRepository';
import { featureFlagsManager } from '../../api/FeatureFlags';

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

describe('PortfolioAnalyticsEngine & Repository Test Suite', () => {
  let repository: PortfolioAnalyticsRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PortfolioAnalyticsRepository(mockRemoteDS as any, mockLocalDS as any);
  });

  // 1. Sector classifications tests
  it('should categorize mint addresses into correct Sector mappings', () => {
    expect(PortfolioCalculator.resolveSector('sol_mint_address_USDC')).toBe('Stablecoins');
    expect(PortfolioCalculator.resolveSector('sol_mint_address_JUP')).toBe('DeFi');
    expect(PortfolioCalculator.resolveSector('sol_mint_address_BONK')).toBe('Meme');
    expect(PortfolioCalculator.resolveSector('sol_mint_address_RENDER')).toBe('AI');
    expect(PortfolioCalculator.resolveSector('sol_mint_address_OTHER')).toBe('Unknown');
  });

  it('should compute correct allocation weights for tokens list', () => {
    const tokens = {
      sol_mint_address_USDC: 300,
      sol_mint_address_JUP: 400,
      sol_mint_address_BONK: 300,
    };
    const sectors = PortfolioCalculator.calculateAllocations(tokens);
    expect(sectors.Stablecoins).toBe(0.3);
    expect(sectors.DeFi).toBe(0.4);
    expect(sectors.Meme).toBe(0.3);
  });

  // 2. Cost basis PnL calculations
  it('should compute correct unrealized PnL, break-even prices and ROI %', () => {
    const pnl = CostBasisCalculator.calculatePnL({
      averageBuyPriceUsd: 10,
      currentPriceUsd: 15,
      holdAmount: 100,
      realizedFeesUsd: 50,
    });

    expect(pnl.costBasisUsd).toBe(1000);
    expect(pnl.unrealizedPnLUsd).toBe(450); // 1500 - 1000 - 50 = 450
    expect(pnl.roiPercent).toBe(45.0); // (450 / 1000) * 100 = 45%
    expect(pnl.breakEvenPrice).toBe(10.5); // (1000 + 50) / 100 = 10.5
  });

  // 3. Sharpe & Sortino ratios math
  it('should compute correct Sharpe Ratio index metrics', () => {
    const returns = [0.08, 0.12, 0.04, 0.16, 0.10]; // average return = 0.10
    const sharpe = PortfolioPerformanceEngine.calculateSharpeRatio(returns, 0.02);
    
    // Variance = (0.0004 + 0.0004 + 0.0036 + 0.0036 + 0) / 4 = 0.002
    // StdDev = sqrt(0.002) = 0.044721
    // Sharpe = (0.10 - 0.02) / 0.044721 = 1.7888
    expect(sharpe).toBe(1.789);
  });

  it('should compute correct Sortino Ratio downside deviations', () => {
    const returns = [0.06, 0.08, 0.01, 0.09, 0.05]; // average return = 0.058
    // downside target < 0.02 is 0.01
    const sortino = PortfolioPerformanceEngine.calculateSortinoRatio(returns, 0.02);
    expect(sortino).toBe(8.497);
  });

  // 4. Time Weighted Return (TWR) compounding
  it('should compute correct Time Weighted Returns over sub-periods', () => {
    const subPeriods = [0.10, -0.05, 0.20]; // 1.10 * 0.95 * 1.20 = 1.254
    const twr = PortfolioPerformanceEngine.calculateTWR(subPeriods);
    expect(twr).toBe(25.4); // 25.4% compound growth
  });

  // 5. Portfolio Insights diversification scores
  it('should evaluate diversification scoring and trigger concentration warnings', () => {
    const sectorWeights = {
      DeFi: 0.6,
      Meme: 0,
      Stablecoins: 0.4,
      Infrastructure: 0,
      NFT: 0,
      AI: 0,
      Gaming: 0,
      Unknown: 0
    };

    const check = PortfolioInsightsEngine.checkInsights(sectorWeights, 2);
    expect(check.diversificationScore).toBe(40); // 2 active sectors * 20 = 40
    expect(check.healthScore).toBe(75); // 100 - 15 (DeFi > 50%) - 10 (spamCount) = 75
    expect(check.warnings.length).toBe(2);
    expect(check.warnings[0]).toContain('Concentration Alert: DeFi');
    expect(check.warnings[1]).toContain('spam token');
  });

  // 6. Skipping analytics check when feature flag is disabled
  it('should throw PORTFOLIO_ANALYTICS_DISABLED if feature flag is disabled', async () => {
    jest.spyOn(featureFlagsManager, 'isEnabled').mockReturnValue(false);

    await expect(repository.getPortfolioAnalytics('address')).rejects.toThrow(
      'Portfolio analytics feature is currently disabled.'
    );
  });
});
