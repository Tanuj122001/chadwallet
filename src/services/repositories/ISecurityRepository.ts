/**
 * Security Repository Interface — Contracts for security data persistence and telemetry
 */

import { SecurityAuditResultDTO, SecurityTelemetryEventDTO, SessionIntegrityDTO } from '../../core/api/SecurityDTOs';
import { FraudRiskScoreDTO, TransactionFraudAnalysisDTO } from '../../core/api/FraudDTOs';
import { CircuitBreakerStatusDTO, CrashReportDTO, RPCHealthStatusDTO } from '../../core/api/ObservabilityDTOs';

export interface ISecurityRepository {
  // Security Audits
  saveAuditResult(result: SecurityAuditResultDTO): Promise<void>;
  getLatestAudit(): Promise<SecurityAuditResultDTO | null>;
  getAuditHistory(limit?: number): Promise<SecurityAuditResultDTO[]>;

  // Fraud Analysis
  saveFraudAnalysis(analysis: TransactionFraudAnalysisDTO): Promise<void>;
  getFraudHistory(walletAddress: string, limit?: number): Promise<TransactionFraudAnalysisDTO[]>;
  saveRiskScore(score: FraudRiskScoreDTO): Promise<void>;
  getLatestRiskScore(walletAddress: string): Promise<FraudRiskScoreDTO | null>;

  // Security Telemetry
  saveTelemetryEvent(event: SecurityTelemetryEventDTO): Promise<void>;
  getTelemetryEvents(limit?: number): Promise<SecurityTelemetryEventDTO[]>;

  // Sessions
  saveSession(session: SessionIntegrityDTO): Promise<void>;
  getSession(sessionId: string): Promise<SessionIntegrityDTO | null>;

  // Crash Reports
  saveCrashReport(report: CrashReportDTO): Promise<void>;
  getCrashReports(limit?: number): Promise<CrashReportDTO[]>;

  // RPC Health
  saveRpcHealthStatus(status: RPCHealthStatusDTO): Promise<void>;
  getRpcHealthStatuses(): Promise<RPCHealthStatusDTO[]>;

  // Circuit Breakers
  saveCircuitBreakerStatus(status: CircuitBreakerStatusDTO): Promise<void>;
  getCircuitBreakerStatuses(): Promise<CircuitBreakerStatusDTO[]>;
}
