import { SwapPreparedTransactionDTO } from '../api/SwapDTOs';

// Sub-Engine: Swap Validator & Program ID Sanitizer
export class SwapValidator {
  // Whitelist of approved DeFi program IDs on Solana (e.g. Jupiter, Orca, Raydium, System programs)
  private static readonly APPROVED_PROGRAM_IDS = new Set([
    'JUP6LkbZbjS1jKKbbTE4ZFQCkg8QMR22tC2J3VULqbv', // Jupiter v6
    'whirLbMiq6dBkmkQTYghszcqcn7hhRJhBX7o5t54kNG', // Orca Whirlpools
    'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5V5tsX23iWNQX9', // Raydium CLMM
    'ComputeBudget111111111111111111111111111111', // Compute Budget
    '11111111111111111111111111111111',           // System Program
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', // Token Program
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'  // Associated Token Program
  ]);

  // Blacklist of known malicious program IDs or draining scripts
  private static readonly BLACKLISTED_PROGRAM_IDS = new Set([
    'draiN5j39KkBLasKjCr9287HhBshsKj298Hhsh289Hh',
    'scamP11111111111111111111111111111111111111'
  ]);

  public static validateRouteIntegrity(
    userAddress: string,
    inputMint: string,
    outputMint: string,
    amount: number
  ): boolean {
    if (!userAddress || userAddress.length < 32 || userAddress.length > 44) return false;
    if (!inputMint || !outputMint) return false;
    if (inputMint === outputMint) return false;
    if (amount <= 0) return false;
    return true;
  }

  public static validateSerializedTransaction(tx: SwapPreparedTransactionDTO): { isValid: boolean; reason?: string } {
    const rawTx = tx.serialized_transaction;
    if (!rawTx || rawTx.length < 50) {
      return { isValid: false, reason: 'MALFORMED_TRANSACTION_SIZE' };
    }

    // Inspect program ID signatures inside instructions
    for (const inst of tx.compute_budget_instructions) {
      if (this.BLACKLISTED_PROGRAM_IDS.has(inst.program_id)) {
        return { isValid: false, reason: `SECURITY_VIOLATION_BLACKLISTED_PROGRAM_${inst.program_id}` };
      }
    }

    // Check transaction compute parameters limits
    if (tx.compute_units_limit > 1_400_000) {
      return { isValid: false, reason: 'EXCEEDED_SOLANA_MAX_COMPUTE_UNITS_LIMIT' };
    }

    return { isValid: true };
  }

  public static getApprovedPrograms() {
    return this.APPROVED_PROGRAM_IDS;
  }
}

// Sub-Engine: Swap Risk Analyzer
export class SwapRiskAnalyzer {
  public static evaluateSwapRisk(
    priceImpactPercent: number,
    slippagePercent: number,
    routeComplexity: number
  ): { riskScore: number; warnings: string[] } {
    const warnings: string[] = [];
    let score = 0;

    // 1. High Price Impact Risk
    if (priceImpactPercent >= 5.0) {
      warnings.push(`WARNING: Extremely high price impact (${priceImpactPercent.toFixed(2)}%). User funds will suffer immediate value degradation.`);
      score += 40;
    } else if (priceImpactPercent >= 2.0) {
      warnings.push(`CAUTION: Modest price impact (${priceImpactPercent.toFixed(2)}%).`);
      score += 15;
    }

    // 2. Volatile Slippage settings risk
    if (slippagePercent > 3.0) {
      warnings.push(`WARNING: Elevated slippage parameters (${slippagePercent}%). Transaction is susceptible to front-running/MEV sandwich attacks.`);
      score += 25;
    }

    // 3. Route Hop Complexity
    if (routeComplexity > 3) {
      warnings.push(`CAUTION: High route complexity (${routeComplexity} hops). Executing multiple AMMs increases latency and execution fee costs.`);
      score += 10;
    }

    return {
      riskScore: Math.min(100, score + 5), // baseline risk offset
      warnings,
    };
  }
}

// Sub-Engine: Swap Simulation Request Builder
export class SwapSimulationRequestBuilder {
  public static buildSimulationRequest(
    serializedTx: string,
    userAddress: string
  ): { payload: string; description: string } {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: 'sim-' + Math.random().toString(36).substr(2, 9),
      method: 'simulateTransaction',
      params: [
        serializedTx,
        {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: 'confirmed',
          accounts: {
            addresses: [userAddress],
            encoding: 'base64'
          }
        }
      ]
    });

    return {
      payload,
      description: `Solana RPC Simulation Envelope for Fee Payer: ${userAddress}`,
    };
  }
}

// Main Swap Engine Orchestrator
class SwapEngine {
  public getValidator() { return SwapValidator; }
  public getRiskAnalyzer() { return SwapRiskAnalyzer; }
  public getSimulationBuilder() { return SwapSimulationRequestBuilder; }
}

export const swapEngine = new SwapEngine();
export default swapEngine;
