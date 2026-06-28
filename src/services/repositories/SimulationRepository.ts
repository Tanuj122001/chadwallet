import { ISimulationRepository } from './ISimulationRepository';
import { SimulationRemoteDataSource } from '../datasources/SimulationRemoteDataSource';
import { TransactionSimulationDTO, SimulationResultDTO } from '../../core/api/SimulationDTOs';
import { TransactionDTO } from '../../core/api/TransactionDTOs';
import { executionProtectionEngine } from '../../core/wallet/SimulationEngine';
import { featureFlagsManager } from '../../core/api/FeatureFlags';
import { logger } from '../../utils/logger';
import { RepositoryError } from '../../core/errors';

export class SimulationRepository implements ISimulationRepository {
  private cache = new Map<string, TransactionSimulationDTO>();

  constructor(private remoteDS: SimulationRemoteDataSource) {}

  public async simulateAndValidate(tx: TransactionDTO): Promise<TransactionSimulationDTO> {
    const txId = tx.transaction_id;

    // 1. Check feature flag toggle first
    if (!featureFlagsManager.isEnabled('ENABLE_SIMULATION')) {
      logger.info('[SimulationRepository] Simulation feature flag disabled. Skipping RPC preflight.');
      const fallbackResult: TransactionSimulationDTO = {
        simulation_id: 'sim_fallback_' + Math.random().toString(36).substr(2, 9),
        transaction_id: txId,
        result: {
          err: null,
          logs: ['Fallback simulation bypass'],
          units_consumed: 150000,
          post_balances_sol: {},
          post_balances_token: {},
          expected_output_amount: 0,
          expected_fees_sol: 0.000005,
          inner_instructions_count: 0,
        },
        mev_analysis: {
          risk_score: 0,
          frontrun_risk: 'low',
          sandwich_risk: 'low',
          backrun_risk: 'low',
          suggested_priority_fee_multiplier: 1.0,
          jito_bundle_recommended: false,
          private_relay_recommended: false,
        },
        risk_report: {
          risk_score: 0,
          warnings: [],
          is_honeypot: false,
          is_mint_authority_renounced: true,
          is_freeze_authority_disabled: false,
          is_liquidity_locked: true,
          concentration_whale_percent: 0,
          upgradeable_program_risk: 'low',
        },
        is_valid: true,
        timestamp: Date.now(),
      };
      this.cache.set(txId, fallbackResult);
      return fallbackResult;
    }

    try {
      // 2. Fetch remote RPC preflight simulations
      const simResult: SimulationResultDTO = await this.remoteDS.simulateTransactionPayload(tx.serialized_transaction);

      // 3. Delegate to MEV & Security Analyzers
      const isValid = executionProtectionEngine.getHelper().auditSimulationPayload(simResult);
      
      const mevAnalysis = executionProtectionEngine.getMevEngine().analyzeMevRisk(
        0.5, // slippage
        0.1, // price impact
        false
      );

      const riskReport = executionProtectionEngine.getRiskEngine().evaluateRisk(
        tx.instructions[0]?.program_id || 'unknown',
        false,
        15 // holder concentration
      );

      const simDto: TransactionSimulationDTO = {
        simulation_id: 'sim_' + Math.random().toString(36).substr(2, 9),
        transaction_id: txId,
        result: simResult,
        mev_analysis: mevAnalysis,
        risk_report: riskReport,
        is_valid: isValid,
        timestamp: Date.now(),
      };

      this.cache.set(txId, simDto);
      logger.info(`[SimulationRepository] Simulated transaction successfully: ${txId} -> isValid: ${isValid}`);
      return simDto;
    } catch (e: any) {
      logger.error(`[SimulationRepository] Simulation failed for: ${txId}`, e);
      throw new RepositoryError('TRANSACTION_SIMULATION_FAILED', `RPC preflight check failed: ${e.message}`, e);
    }
  }

  public async getCachedSimulation(txId: string): Promise<TransactionSimulationDTO | null> {
    return this.cache.get(txId) || null;
  }
}
