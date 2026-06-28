export interface SwapInstructionDTO {
  program_id: string;
  accounts: Array<{
    pubkey: string;
    is_signer: boolean;
    is_writable: boolean;
  }>;
  data: string; // base64 or hex format
}

export interface SwapPreparedTransactionDTO {
  serialized_transaction: string; // base64 encoded
  version: 'legacy' | '0';
  address_lookup_tables: string[];
  compute_budget_instructions: SwapInstructionDTO[];
  priority_fee_lamports: number;
  compute_units_limit: number;
}

export interface SimulationDTO {
  payload_json: string; // serialized JSON request envelope
  expected_output_amount: number;
  minimum_received_amount: number;
  estimated_fees_sol: number;
  compute_units_consumed: number;
  priority_fee_lamports: number;
  route_complexity: number;
  execution_time_estimate_ms: number;
  risk_warnings: string[];
}

export interface SwapDTO {
  swap_id: string;
  user_address: string;
  input_mint: string;
  output_mint: string;
  input_amount: number;
  expected_output_amount: number;
  minimum_received_amount: number;
  price_impact_percent: number;
  transaction: SwapPreparedTransactionDTO;
  simulation: SimulationDTO;
  platform_fee_percent: number;
  affiliate_fee_amount_usd: number;
  risk_score: number; // 0 to 100
  is_valid: boolean;
  timestamp: number;
}
