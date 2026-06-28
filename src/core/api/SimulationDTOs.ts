export interface SimulationResultDTO {
  err: any | null;
  logs: string[];
  units_consumed: number;
  post_balances_sol: Record<string, number>;
  post_balances_token: Record<string, { mint: string; amount: number; symbol: string; decimals: number }>;
  expected_output_amount: number;
  expected_fees_sol: number;
  inner_instructions_count: number;
}

export interface MEVAnalysisDTO {
  risk_score: number; // 0 to 100
  frontrun_risk: 'low' | 'medium' | 'high';
  sandwich_risk: 'low' | 'medium' | 'high';
  backrun_risk: 'low' | 'medium' | 'high';
  suggested_priority_fee_multiplier: number;
  jito_bundle_recommended: boolean;
  private_relay_recommended: boolean;
}

export interface RiskReportDTO {
  risk_score: number; // 0 to 100
  warnings: string[];
  is_honeypot: boolean;
  is_mint_authority_renounced: boolean;
  is_freeze_authority_disabled: boolean;
  is_liquidity_locked: boolean;
  concentration_whale_percent: number;
  upgradeable_program_risk: 'low' | 'medium' | 'high';
}

export interface TransactionSimulationDTO {
  simulation_id: string;
  transaction_id: string;
  result: SimulationResultDTO;
  mev_analysis: MEVAnalysisDTO;
  risk_report: RiskReportDTO;
  is_valid: boolean;
  timestamp: number;
}
