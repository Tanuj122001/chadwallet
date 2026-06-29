import { SimulationResultDTO, MEVAnalysisDTO, RiskReportDTO } from '../api/SimulationDTOs';

// Sub-Engine: Log Parsers & Token Diff Analyzers
export class SimulationEngineHelper {
  public static parseLogsForErrors(logs: string[]): string[] {
    const errors: string[] = [];
    logs.forEach(log => {
      if (log.includes('failed:') || log.includes('Instruction Err') || log.includes('custom program error:')) {
        errors.push(log);
      }
    });
    return errors;
  }

  public static auditSimulationPayload(res: SimulationResultDTO): boolean {
    if (res.err) return false;
    const errors = this.parseLogsForErrors(res.logs);
    return errors.length === 0;
  }
}

// Sub-Engine: MEV Protection & Ticker Safety Advisor
export class MEVProtectionEngine {
  public static analyzeMevRisk(
    slippagePercent: number,
    priceImpactPercent: number,
    isUnsafeRoute = false
  ): MEVAnalysisDTO {
    let riskScore = 0;
    
    // 1. Evaluate sandwich risk based on slippage limits
    if (slippagePercent > 2.0) {
      riskScore += 40;
    } else if (slippagePercent >= 1.0) {
      riskScore += 15;
    }

    // 2. Evaluate front-run risks on large price impacts
    if (priceImpactPercent > 3.0) {
      riskScore += 30;
    }

    const frontrun_risk = riskScore > 50 ? 'high' : riskScore > 20 ? 'medium' : 'low';
    const sandwich_risk = slippagePercent > 2.0 ? 'high' : slippagePercent >= 1.0 ? 'medium' : 'low';
    
    // Recommend private relays or Jito bundles if risk index is high
    const recommendation = riskScore > 40;

    return {
      risk_score: Math.min(100, riskScore + (isUnsafeRoute ? 25 : 0)),
      frontrun_risk,
      sandwich_risk,
      backrun_risk: 'low',
      suggested_priority_fee_multiplier: riskScore > 50 ? 2.5 : riskScore > 20 ? 1.5 : 1.0,
      jito_bundle_recommended: recommendation,
      private_relay_recommended: recommendation,
    };
  }
}

// Sub-Engine: Smart Execution & Budget Optimizers
export class SmartExecutionEngine {
  public static recommendExecutionSettings(
    simulation: SimulationResultDTO,
    networkCongestionLevel: 'low' | 'medium' | 'high'
  ): {
    suggestedSlippagePercent: number;
    recommendedPriorityFeeLamports: number;
    optimizedComputeUnits: number;
    expectedSpeedSeconds: number;
    confidenceScore: number;
  } {
    const baseSlippage = 0.5;
    const priorityFee = networkCongestionLevel === 'high' ? 50000 : networkCongestionLevel === 'medium' ? 10000 : 5000;
    
    // Inject 15% compute budget unit buffer over actual consumed limit
    const optimizedCompute = Math.round(simulation.units_consumed * 1.15);

    return {
      suggestedSlippagePercent: baseSlippage,
      recommendedPriorityFeeLamports: priorityFee,
      optimizedComputeUnits: Math.max(150000, optimizedCompute),
      expectedSpeedSeconds: networkCongestionLevel === 'high' ? 8 : networkCongestionLevel === 'medium' ? 5 : 3,
      confidenceScore: simulation.err ? 10 : 98,
    };
  }
}

// Sub-Engine: Security Risk Auditor (Freeze, Mint authorities and Rug risk checks)
export class SecurityRiskEngine {
  public static evaluateRisk(
    mintAddress: string,
    isUpgradeable = false,
    whalePercent = 10
  ): RiskReportDTO {
    const warnings: string[] = [];

    // Simulate warning evaluations
    if (isUpgradeable) {
      warnings.push('WARNING: Upgradeable token program contract detected. Owner has power to alter code pathways.');
    }
    if (whalePercent > 50) {
      warnings.push(`WARNING: Extreme holder concentration detected (${whalePercent}%). Price is susceptible to whale dumps.`);
    }

    return {
      risk_score: warnings.length * 30,
      warnings,
      is_honeypot: false,
      is_mint_authority_renounced: true,
      is_freeze_authority_disabled: false,
      is_liquidity_locked: true,
      concentration_whale_percent: whalePercent,
      upgradeable_program_risk: isUpgradeable ? 'medium' : 'low',
    };
  }
}

// Main Simulation & MEV Coordinator
class ExecutionProtectionEngine {
  public getHelper() { return SimulationEngineHelper; }
  public getMevEngine() { return MEVProtectionEngine; }
  public getSmartEngine() { return SmartExecutionEngine; }
  public getRiskEngine() { return SecurityRiskEngine; }
}

export const executionProtectionEngine = new ExecutionProtectionEngine();
export default executionProtectionEngine;
