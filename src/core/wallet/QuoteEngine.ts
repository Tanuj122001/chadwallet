import { QuoteDTO, RouteDTO, FeeDTO, SlippageDTO } from '../api/QuoteDTOs';
import { logger } from '../../utils/logger';

// Sub-Engine: Route Optimizer
export class RouteOptimizer {
  public static selectBestRoute(routes: RouteDTO[]): number {
    if (routes.length === 0) return -1;
    
    // Ranks routes based on output size, execution confidence score, and time
    let bestIndex = 0;
    let highestRank = -99999;

    routes.forEach((route, index) => {
      // Metric rank: output amount (primary weight) + confidence multiplier - latency weight
      const rank = route.out_amount + (route.confidence_score * 100) - (route.execution_time_ms * 2);
      
      if (rank > highestRank) {
        highestRank = rank;
        bestIndex = index;
      }
    });

    return bestIndex;
  }
}

// Sub-Engine: Slippage Calculator
export class SlippageCalculator {
  public static calculateDynamicSlippage(amount: number, priceImpactPercent: number): number {
    // Dynamic slippage scaling: baseline 0.5% + half of the price impact
    const baseline = 0.5;
    const impactBuffer = priceImpactPercent * 0.5;
    const resolved = Math.min(15.0, baseline + impactBuffer); // Cap max dynamic slippage at 15%
    
    logger.debug(`[SlippageCalculator] Dynamic slippage computed for impact ${priceImpactPercent}%: ${resolved.toFixed(2)}%`);
    return resolved;
  }
}

// Sub-Engine: Fee Estimator
export class FeeEstimator {
  public static estimatePriorityFee(computeUnits = 200_000, microLamportsPerUnit = 50_000): number {
    // Priority fee (lamports) = (Compute Units * Price in micro-lamports) / 1,000,000
    const feeLamports = Math.floor((computeUnits * microLamportsPerUnit) / 1_000_000);
    return Math.max(5000, feeLamports); // Min Priority fee of 5000 lamports (0.000005 SOL)
  }

  public static calculateTotalFeesUsd(fees: FeeDTO, solPriceUsd: number): number {
    const networkSol = fees.network_fee_lamports / 1_000_000_000;
    const prioritySol = fees.priority_fee_lamports / 1_000_000_000;
    const solFeesUsd = (networkSol + prioritySol) * solPriceUsd;

    return solFeesUsd + fees.total_fee_usd;
  }
}

// Sub-Engine: Risk Engine (Audits price impacts and suspicious tokens)
export class RiskEngine {
  private blacklistedMints = new Set([
    'maliciousTokenMint1111111111111111111111111',
    'scamTokenMint2222222222222222222222222222'
  ]);

  public evaluateRisk(
    inputMint: string,
    outputMint: string,
    priceImpactPercent: number,
    liquidityUsd: number
  ): string[] {
    const warnings: string[] = [];

    // 1. Blacklist Check
    if (this.blacklistedMints.has(inputMint) || this.blacklistedMints.has(outputMint)) {
      warnings.push('CRITICAL: Warning! This token mint address is blacklisted for security reasons.');
    }

    // 2. High Price Impact Check
    if (priceImpactPercent >= 5.0) {
      warnings.push(`WARNING: High Price Impact detected (${priceImpactPercent.toFixed(2)}%). Selling this size will significantly degrade your return.`);
    }

    // 3. Low Liquidity Check
    if (liquidityUsd > 0 && liquidityUsd < 10000) {
      warnings.push(`CAUTION: Extremely low liquidity pool detected ($${liquidityUsd.toLocaleString()}). Slippage and failed swap risks are highly elevated.`);
    }

    return warnings;
  }
}

// Sub-Engine: Quote Validator
export class QuoteValidator {
  public static validateQuote(quote: QuoteDTO): boolean {
    if (!quote.quote_id || !quote.input_mint || !quote.output_mint) return false;
    if (quote.input_amount <= 0 || quote.expected_output_amount <= 0) return false;
    if (quote.routes.length === 0) return false;
    return true;
  }
}

// Main Quote Engine Orchestrator
class QuoteEngine {
  private riskEngine = new RiskEngine();

  public getRouteOptimizer() { return RouteOptimizer; }
  public getSlippageCalculator() { return SlippageCalculator; }
  public getFeeEstimator() { return FeeEstimator; }
  public getRiskEngine() { return this.riskEngine; }
  public getQuoteValidator() { return QuoteValidator; }
}

export const quoteEngine = new QuoteEngine();
export default quoteEngine;
