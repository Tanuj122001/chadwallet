export interface InstructionDTO {
  program_id: string;
  accounts: Array<{
    pubkey: string;
    is_signer: boolean;
    is_writable: boolean;
  }>;
  data: string; // hex or base64 data payload
}

export interface BlockhashDTO {
  blockhash: string;
  last_valid_block_height: number;
  timestamp: number;
}

export interface LookupTableDTO {
  address: string;
  addresses: string[];
}

export interface TransactionSummaryDTO {
  instruction_count: number;
  account_count: number;
  estimated_size_bytes: number;
  network_fee_lamports: number;
  priority_fee_lamports: number;
  compute_units_limit: number;
  fee_payer: string;
  risk_score: number; // 0 to 100
  warnings: string[];
}

export interface TransactionDTO {
  transaction_id: string;
  serialized_transaction: string; // base64 encoded
  version: 'legacy' | '0';
  fee_payer: string;
  recent_blockhash: string;
  instructions: InstructionDTO[];
  address_lookup_tables: LookupTableDTO[];
  summary: TransactionSummaryDTO;
  is_valid: boolean;
  timestamp: number;
}
