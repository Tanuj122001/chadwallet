export interface ConfirmationDTO {
  signature: string;
  slot: number;
  err: any | null;
  confirmation_status: 'processed' | 'confirmed' | 'finalized';
  confirmations_count: number;
}

export interface ReceiptDTO {
  signature: string;
  slot: number;
  timestamp: number;
  fee_payer: string;
  fees_paid_lamports: number;
  compute_units_consumed: number;
  status: 'success' | 'failed';
  error_message?: string;
  block_time: number;
}

export interface ExecutionDTO {
  execution_id: string;
  transaction_id: string;
  signature: string;
  status: 'queued' | 'signing' | 'broadcasting' | 'confirming' | 'finalized' | 'failed' | 'cancelled';
  retry_count: number;
  max_retries: number;
  last_error?: string;
  receipt?: ReceiptDTO;
  confirmation?: ConfirmationDTO;
  timestamp: number;
}
