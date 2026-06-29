/**
 * Fraud Detection DTOs — Transaction Fraud Analysis, Risk Scoring & Pattern Detection
 */

// ---------------------------------------------------------
// Fraud Risk Score
// ---------------------------------------------------------
export interface FraudRiskScoreDTO {
  score_id: string;
  wallet_address: string;
  risk_score: number; // 0-100, 100 = maximum fraud risk
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  contributing_factors: FraudFactorDTO[];
  timestamp: number;
}

export interface FraudFactorDTO {
  factor_type: FraudPatternType;
  weight: number; // contribution to overall score (0.0-1.0)
  evidence: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type FraudPatternType =
  | 'wallet_draining'
  | 'rapid_transfers'
  | 'repeated_failed_signing'
  | 'suspicious_approvals'
  | 'unknown_programs'
  | 'fake_token_metadata'
  | 'liquidity_rug'
  | 'upgradeable_contract'
  | 'blacklisted_address'
  | 'known_scam_contract'
  | 'abnormal_velocity'
  | 'wash_trading'
  | 'volume_manipulation'
  | 'spoofing'
  | 'front_running'
  | 'sandwich_attack'
  | 'replay_attempt'
  | 'duplicate_transaction'
  | 'signature_anomaly';

// ---------------------------------------------------------
// Transaction Fraud Analysis
// ---------------------------------------------------------
export interface TransactionFraudAnalysisDTO {
  analysis_id: string;
  transaction_signature: string;
  wallet_address: string;
  program_id: string;
  patterns_detected: DetectedPatternDTO[];
  overall_risk: 'safe' | 'suspicious' | 'dangerous' | 'blocked';
  recommended_action: 'allow' | 'warn' | 'require_confirmation' | 'block';
  timestamp: number;
}

export interface DetectedPatternDTO {
  pattern_type: FraudPatternType;
  confidence: number; // 0-1
  description: string;
  evidence_data: Record<string, unknown>;
}

// ---------------------------------------------------------
// Blacklist & Scam Registry
// ---------------------------------------------------------
export interface BlacklistEntryDTO {
  address: string;
  entry_type: 'wallet' | 'program' | 'token_mint' | 'creator';
  reason: string;
  source: 'community' | 'internal' | 'solana_fm' | 'rugcheck' | 'manual';
  added_at: number;
  is_active: boolean;
}

// ---------------------------------------------------------
// Velocity Tracking
// ---------------------------------------------------------
export interface VelocityMetricDTO {
  wallet_address: string;
  window_minutes: number;
  transaction_count: number;
  total_value_usd: number;
  unique_recipients: number;
  unique_programs: number;
  failed_count: number;
  is_anomalous: boolean;
  threshold_breached: string | null;
  timestamp: number;
}
