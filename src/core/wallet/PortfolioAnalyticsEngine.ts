import { SimulationResultDTO } from '../api/SimulationDTOs';
import { logger } from '../../utils/logger';

// 1. Sector Definitions & Asset Classifications
export type SectorName = 'DeFi' | 'Meme' | 'Stablecoins' | 'Infrastructure' | 'NFT' | 'AI' | 'Gaming' | 'Unknown';

// Sub-Engine: Sector Allocations & Weight Calculators
export class PortfolioCalculator {
  
  public static resolveSector(mint: string): SectorName {
    const mintLower = mint.toLowerCase();
    // Solana token classification mappings
    if (mintLower.includes('usdc') || mintLower.includes('usdt') || mintLower.includes('so11111111111111111111111111111111111111112')) {
      return 'Stablecoins';
    }
    if (mintLower.includes('jup') || mintLower.includes('orca') || mintLower.includes('ray')) {
      return 'DeFi';
    }
    if (mintLower.includes('bonk') || mintLower.includes('doge') || mintLower.includes('pepe') || mintLower.includes('wif')) {
      return 'Meme';
    }
    if (mintLower.includes('render') || mintLower.includes('nos')) {
      return 'AI';
    }
    return 'Unknown';
  }

  public static calculateAllocations(tokens: Record<string, number>): Record<SectorName, number> {
    const sectorTotals: Record<SectorName, number> = {
      DeFi: 0,
      Meme: 0,
      Stablecoins: 0,
      Infrastructure: 0,
      NFT: 0,
      AI: 0,
      Gaming: 0,
      Unknown: 0
    };

    let grandTotal = 0;
    Object.entries(tokens).forEach(([mint, val]) => {
      grandTotal += val;
      const sector = this.resolveSector(mint);
      sectorTotals[sector] += val;
    });

    if (grandTotal === 0) return sectorTotals;

    // Convert weights to percentage scales
    Object.keys(sectorTotals).forEach(key => {
      const k = key as SectorName;
      sectorTotals[k] = parseFloat((sectorTotals[k] / grandTotal).toFixed(4));
    });

    return sectorTotals;
  }
}

// Sub-Engine: Cost Basis & ROI Math
export class CostBasisCalculator {
  
  public static calculatePnL(params: {
    averageBuyPriceUsd: number;
    currentPriceUsd: number;
    holdAmount: number;
    realizedFeesUsd: number;
  }): {
    unrealizedPnLUsd: number;
    costBasisUsd: number;
    roiPercent: number;
    breakEvenPrice: number;
  } {
    const { averageBuyPriceUsd, currentPriceUsd, holdAmount, realizedFeesUsd } = params;
    
    const costBasisUsd = holdAmount * averageBuyPriceUsd;
    const currentVal = holdAmount * currentPriceUsd;
    const unrealizedPnLUsd = currentVal - costBasisUsd - realizedFeesUsd;
    
    const roiPercent = costBasisUsd === 0 ? 0 : (unrealizedPnLUsd / costBasisUsd) * 100;
    const breakEvenPrice = holdAmount === 0 ? 0 : (costBasisUsd + realizedFeesUsd) / holdAmount;

    return {
      unrealizedPnLUsd,
      costBasisUsd,
      roiPercent: parseFloat(roiPercent.toFixed(2)),
      breakEvenPrice: parseFloat(breakEvenPrice.toFixed(4)),
    };
  }
}

// Sub-Engine: Time Weighted Return & Volatility Indices
export class PortfolioPerformanceEngine {
  
  // Sharpe Ratio = (Portfolio Return - Risk Free Rate) / Portfolio Volatility
  public static calculateSharpeRatio(
    returns: number[],
    riskFreeRate = 0.02 // 2% risk free rate
  ): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Compute sample standard deviation (volatility)
    const variance = returns.reduce((acc, val) => acc + Math.pow(val - avgReturn, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance);

    if (volatility === 0) return 0;
    return parseFloat(((avgReturn - riskFreeRate) / volatility).toFixed(3));
  }

  // Sortino Ratio = (Portfolio Return - Risk Free Rate) / Downside Deviation
  public static calculateSortinoRatio(
    returns: number[],
    riskFreeRate = 0.02
  ): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Downside deviation measures only negative returns standard deviation
    const negativeReturns = returns.filter(val => val < riskFreeRate);
    if (negativeReturns.length === 0) return 10.0; // risk free target achieved without downside

    const downsideVariance = negativeReturns.reduce((acc, val) => acc + Math.pow(val - riskFreeRate, 2), 0) / returns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);

    if (downsideDeviation === 0) return 0;
    return parseFloat(((avgReturn - riskFreeRate) / downsideDeviation).toFixed(3));
  }

  // Time Weighted Return (TWR) compound growth over sub-periods
  public static calculateTWR(subPeriodReturns: number[]): number {
    let compoundFactor = 1.0;
    subPeriodReturns.forEach(ret => {
      compoundFactor *= (1.0 + ret);
    });
    return parseFloat(((compoundFactor - 1.0) * 100).toFixed(2));
  }
}

// Sub-Engine: Asset Diversification & Concentration Alerts
export class PortfolioInsightsEngine {
  public static checkInsights(
    sectorAllocation: Record<SectorName, number>,
    spamCount = 0
  ): {
    diversificationScore: number;
    healthScore: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let healthScore = 100;
    
    // Count active sectors
    const activeSectors = Object.values(sectorAllocation).filter(val => val > 0).length;
    const diversificationScore = Math.min(100, activeSectors * 20);

    // Flag over concentration risk if a single sector exceeds 50%
    Object.entries(sectorAllocation).forEach(([sector, weight]) => {
      if (weight > 0.5 && sector !== 'Stablecoins') {
        warnings.push(`Concentration Alert: ${sector} exceeds 50% of portfolio weights.`);
        healthScore -= 15;
      }
    });

    if (spamCount > 0) {
      warnings.push(`Security Alert: ${spamCount} potential spam token contracts identified.`);
      healthScore -= 10;
    }

    return {
      diversificationScore,
      healthScore: Math.max(10, healthScore),
      warnings,
    };
  }
}

// Main Portfolio Analytics Coordinator
class PortfolioAnalyticsEngine {
  public getCalculator() { return PortfolioCalculator; }
  public getCostBasis() { return CostBasisCalculator; }
  public getPerformance() { return PortfolioPerformanceEngine; }
  public getInsights() { return PortfolioInsightsEngine; }
}

export const portfolioAnalyticsEngine = new PortfolioAnalyticsEngine();
export default portfolioAnalyticsEngine;
