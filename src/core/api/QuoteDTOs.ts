export interface FeeDTO {
  network_fee_lamports: number;
  priority_fee_lamports: number;
  lp_fee_percent: number;
  protocol_fee_percent: number;
  total_fee_usd: number;
}

export interface RouteDTO {
  provider_name: string; // e.g. 'jupiter', 'orca', 'raydium'
  input_mint: string;
  output_mint: string;
  in_amount: number;
  out_amount: number;
  price_impact_percent: number;
  route_steps: Array<{
    amm_name: string;
    label: string;
    percent: number;
  }>;
  execution_time_ms: number;
  confidence_score: number; // 0 to 100
}

export interface SlippageDTO {
  auto: boolean;
  value_percent: number;
  dynamic_buffer: number;
}

export interface QuoteDTO {
  quote_id: string;
  input_mint: string;
  output_mint: string;
  input_amount: number;
  expected_output_amount: number;
  minimum_received_amount: number;
  price_impact_percent: number;
  slippage: SlippageDTO;
  fees: FeeDTO;
  routes: RouteDTO[];
  selected_route_index: number;
  risk_warnings: string[];
  is_valid: boolean;
  timestamp: number;
}
