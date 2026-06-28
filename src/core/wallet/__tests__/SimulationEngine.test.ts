import { SimulationEngineHelper, MEVProtectionEngine, SmartExecutionEngine, SecurityRiskEngine } from '../SimulationEngine';
import { SimulationRepository } from '../../../services/repositories/SimulationRepository';
import { featureFlagsManager } from '../../api/FeatureFlags';
import { TransactionDTO } from '../../api/TransactionDTOs';

// Mock remote simulation data source
const mockRemoteDS = {
  simulateTransactionPayload: jest.fn(),
};

describe('Simulation & MEV Protection Engine Test Suite', () => {
  let repository: SimulationRepository;
  let mockTx: TransactionDTO;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new SimulationRepository(mockRemoteDS);
    
    mockTx = {
      transaction_id: 'tx_simulation_123',
      serialized_transaction: 'mockBase64TransactionEnvelopeString',
      version: '0',
      fee_payer: 'composedFeePayerPublicKey',
      recent_blockhash: 'composedRecentSolanaBlockhash',
      instructions: [
        { program_id: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', accounts: [], data: '' }
      ],
      address_lookup_tables: [],
      summary: {
        instruction_count: 1,
        account_count: 0,
        estimated_size_bytes: 50,
        network_fee_lamports: 5000,
        priority_fee_lamports: 10000,
        compute_units_limit: 200000,
        fee_payer: 'composedFeePayerPublicKey',
        risk_score: 0,
        warnings: [],
      },
      is_valid: true,
      timestamp: Date.now(),
    };
  });

  // 1. Logs parsing error audits
  it('should parse logs correctly and identify custom program errors', () => {
    const errorLogs = [
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program log: Custom error: Insufficient funds',
      'Program 11111111111111111111111111111111 failed: custom program error: 0x1'
    ];
    const errors = SimulationEngineHelper.parseLogsForErrors(errorLogs);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('failed: custom program error: 0x1');

    const cleanLogs = [
      'Program 11111111111111111111111111111111 invoke [1]',
      'Program log: Transfer success',
      'Program 11111111111111111111111111111111 success'
    ];
    expect(SimulationEngineHelper.parseLogsForErrors(cleanLogs).length).toBe(0);
  });

  // 2. MEV Risk parameters calculations
  it('should scale MEV risk scores based on price impacts and slippage parameters', () => {
    // High slippage (3%) + High price impact (4%)
    const highRisk = MEVProtectionEngine.analyzeMevRisk(3.0, 4.0, true);
    expect(highRisk.risk_score).toBe(95); // 40 + 30 + 25 = 95
    expect(highRisk.frontrun_risk).toBe('high');
    expect(highRisk.sandwich_risk).toBe('high');
    expect(highRisk.jito_bundle_recommended).toBe(true);

    // Low slippage (0.5%) + Low price impact (0.1%)
    const lowRisk = MEVProtectionEngine.analyzeMevRisk(0.5, 0.1, false);
    expect(lowRisk.risk_score).toBe(0);
    expect(lowRisk.frontrun_risk).toBe('low');
    expect(lowRisk.sandwich_risk).toBe('low');
    expect(lowRisk.jito_bundle_recommended).toBe(false);
  });

  // 3. Smart Execution compute budget buffer recommendation
  it('should advise correct settings and scale compute budget units safely', () => {
    const mockSimulationResult = {
      err: null,
      logs: [],
      units_consumed: 200000,
      post_balances_sol: {},
      post_balances_token: {},
      expected_output_amount: 100,
      expected_fees_sol: 0.000005,
      inner_instructions_count: 2,
    };

    const advice = SmartExecutionEngine.recommendExecutionSettings(mockSimulationResult, 'high');
    expect(advice.recommendedPriorityFeeLamports).toBe(50000);
    expect(advice.optimizedComputeUnits).toBe(230000); // 200,000 + 15% buffer
    expect(advice.expectedSpeedSeconds).toBe(8);
  });

  // 4. Security Risk Warnings
  it('should flag upgradeable program contracts and holder concentration whale warnings', () => {
    const risk = SecurityRiskEngine.evaluateRisk('mintAddressHash', true, 65);
    expect(risk.risk_score).toBe(60); // 2 warnings * 30 = 60
    expect(risk.warnings.length).toBe(2);
    expect(risk.warnings[0]).toContain('Upgradeable token program');
    expect(risk.warnings[1]).toContain('concentration');
  });

  // 5. Skipping simulation check when feature flag is disabled
  it('should return mock simulation results immediately if ENABLE_SIMULATION flag is disabled', async () => {
    jest.spyOn(featureFlagsManager, 'isEnabled').mockReturnValue(false);

    const result = await repository.simulateAndValidate(mockTx);
    expect(result.simulation_id).toContain('sim_fallback');
    expect(result.is_valid).toBe(true);
    expect(mockRemoteDS.simulateTransactionPayload).not.toHaveBeenCalled();
  });

  // 6. Complete preflight validation happy path
  it('should successfully run remote simulation preflight checks', async () => {
    jest.spyOn(featureFlagsManager, 'isEnabled').mockReturnValue(true);
    mockRemoteDS.simulateTransactionPayload.mockResolvedValue({
      err: null,
      logs: ['Program success log snippet'],
      units_consumed: 80000,
      post_balances_sol: {},
      post_balances_token: {},
      expected_output_amount: 500,
      expected_fees_sol: 0.000005,
      inner_instructions_count: 1,
    });

    const result = await repository.simulateAndValidate(mockTx);
    expect(result.is_valid).toBe(true);
    expect(result.result.units_consumed).toBe(80000);
    expect(mockRemoteDS.simulateTransactionPayload).toHaveBeenCalledTimes(1);
  });
});
