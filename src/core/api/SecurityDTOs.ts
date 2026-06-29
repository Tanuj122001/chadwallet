/**
 * Security Domain DTOs — Enterprise Security, Runtime Protection & Data Safety
 */

// ---------------------------------------------------------
// Runtime Environment Verification
// ---------------------------------------------------------
export interface RuntimeSecurityCheckDTO {
  check_id: string;
  check_type: 'root' | 'emulator' | 'debugger' | 'overlay' | 'frida' | 'magisk' | 'usb_debug' | 'dev_mode' | 'screen_capture' | 'tamper' | 'integrity' | 'certificate' | 'jailbreak';
  is_compromised: boolean;
  severity: 'info' | 'warning' | 'critical';
  details: string;
  remediation: string;
  timestamp: number;
}

export interface SecurityAuditResultDTO {
  audit_id: string;
  checks: RuntimeSecurityCheckDTO[];
  overall_risk_level: 'safe' | 'warning' | 'critical' | 'blocked';
  risk_score: number; // 0-100, 0 = safe
  environment: EnvironmentFingerprintDTO;
  timestamp: number;
}

export interface EnvironmentFingerprintDTO {
  platform: 'android' | 'ios' | 'unknown';
  os_version: string;
  device_model: string;
  is_physical_device: boolean;
  app_version: string;
  build_number: string;
  bundle_id: string;
  binary_checksum: string;
  expected_checksum: string;
  signature_hash: string;
  expected_signature: string;
}

// ---------------------------------------------------------
// Certificate & TLS Validation
// ---------------------------------------------------------
export interface CertificatePinDTO {
  domain: string;
  sha256_pins: string[];
  backup_pins: string[];
  max_age_seconds: number;
  include_subdomains: boolean;
  enforce: boolean;
  last_rotated_at: number;
}

export interface CertificateValidationResultDTO {
  domain: string;
  is_valid: boolean;
  pin_matched: boolean;
  certificate_expiry: number;
  failure_reason?: string;
  timestamp: number;
}

// ---------------------------------------------------------
// Session & Biometric Security
// ---------------------------------------------------------
export interface SessionIntegrityDTO {
  session_id: string;
  user_id: string;
  created_at: number;
  last_active_at: number;
  expires_at: number;
  ip_fingerprint: string;
  device_fingerprint: string;
  is_valid: boolean;
  invalidation_reason?: string;
}

export interface BiometricAuthResultDTO {
  success: boolean;
  auth_type: 'fingerprint' | 'face_id' | 'iris' | 'pin' | 'none';
  error_code?: string;
  error_message?: string;
  timestamp: number;
}

// ---------------------------------------------------------
// Secure Clipboard & Data Protection
// ---------------------------------------------------------
export interface ClipboardEntryDTO {
  entry_id: string;
  content_hash: string;
  data_type: 'address' | 'amount' | 'seed_phrase' | 'private_key' | 'generic';
  created_at: number;
  expires_at: number;
  is_cleared: boolean;
}

// ---------------------------------------------------------
// Network Security
// ---------------------------------------------------------
export interface RequestSignatureDTO {
  nonce: string;
  timestamp: number;
  hmac_signature: string;
  payload_hash: string;
  request_id: string;
}

export interface ReplayProtectionDTO {
  nonce: string;
  timestamp: number;
  window_ms: number;
  is_replay: boolean;
}

// ---------------------------------------------------------
// Security Telemetry
// ---------------------------------------------------------
export interface SecurityTelemetryEventDTO {
  event_id: string;
  event_type: 'audit_complete' | 'threat_detected' | 'certificate_failure' | 'session_invalidated' | 'biometric_failure' | 'clipboard_expired' | 'tamper_detected' | 'fraud_alert';
  severity: 'info' | 'warning' | 'critical';
  details: Record<string, unknown>;
  correlation_id: string;
  timestamp: number;
}

// ---------------------------------------------------------
// AI Security
// ---------------------------------------------------------
export interface AISanitizationResultDTO {
  original_length: number;
  sanitized_length: number;
  threats_detected: AISecurityThreatDTO[];
  is_safe: boolean;
  sanitized_content: string;
}

export interface AISecurityThreatDTO {
  threat_type: 'prompt_injection' | 'data_leakage' | 'prompt_poisoning' | 'conversation_hijack' | 'tool_misuse' | 'token_overflow' | 'conversation_abuse';
  confidence: number; // 0-1
  matched_pattern: string;
  description: string;
}

// ---------------------------------------------------------
// Encrypted Storage
// ---------------------------------------------------------
export interface EncryptedEntryDTO {
  key: string;
  encrypted_value: string;
  iv: string;
  tag: string;
  algorithm: 'aes-256-gcm';
  created_at: number;
}
