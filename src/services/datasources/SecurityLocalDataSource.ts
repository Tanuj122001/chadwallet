/**
 * Security Local Data Source — Encrypted local persistence for security audit logs, fraud analyses, and telemetry
 */

import { localStorage } from '../../core/storage';
import { logger } from '../../utils/logger';
import { SecurityAuditResultDTO, SecurityTelemetryEventDTO, SessionIntegrityDTO } from '../../core/api/SecurityDTOs';
import { FraudRiskScoreDTO, TransactionFraudAnalysisDTO } from '../../core/api/FraudDTOs';
import { CircuitBreakerStatusDTO, CrashReportDTO, RPCHealthStatusDTO } from '../../core/api/ObservabilityDTOs';

const KEYS = {
  AUDITS: 'security_audit_history',
  FRAUD_ANALYSES: 'fraud_analysis_history',
  RISK_SCORES: 'fraud_risk_scores',
  TELEMETRY: 'security_telemetry_events',
  SESSIONS: 'security_sessions',
  CRASH_REPORTS: 'crash_reports',
  RPC_HEALTH: 'rpc_health_statuses',
  CIRCUIT_BREAKERS: 'circuit_breaker_statuses',
};

export class SecurityLocalDataSourceImpl {
  private getList<T>(key: string): T[] {
    try {
      const raw = localStorage.getString(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveList<T>(key: string, list: T[], maxItems: number = 200): void {
    const trimmed = list.length > maxItems ? list.slice(-maxItems) : list;
    localStorage.setString(key, JSON.stringify(trimmed));
  }

  // Audits
  public saveAuditResult(result: SecurityAuditResultDTO): void {
    const list = this.getList<SecurityAuditResultDTO>(KEYS.AUDITS);
    list.push(result);
    this.saveList(KEYS.AUDITS, list);
    logger.debug(`[SecurityLocalDS] Saved audit: ${result.audit_id}`);
  }

  public getLatestAudit(): SecurityAuditResultDTO | null {
    const list = this.getList<SecurityAuditResultDTO>(KEYS.AUDITS);
    return list.length > 0 ? list[list.length - 1] : null;
  }

  public getAuditHistory(limit: number = 50): SecurityAuditResultDTO[] {
    return this.getList<SecurityAuditResultDTO>(KEYS.AUDITS).slice(-limit);
  }

  // Fraud Analyses
  public saveFraudAnalysis(analysis: TransactionFraudAnalysisDTO): void {
    const list = this.getList<TransactionFraudAnalysisDTO>(KEYS.FRAUD_ANALYSES);
    list.push(analysis);
    this.saveList(KEYS.FRAUD_ANALYSES, list);
    logger.debug(`[SecurityLocalDS] Saved fraud analysis: ${analysis.analysis_id}`);
  }

  public getFraudHistory(walletAddress: string, limit: number = 50): TransactionFraudAnalysisDTO[] {
    return this.getList<TransactionFraudAnalysisDTO>(KEYS.FRAUD_ANALYSES)
      .filter(a => a.wallet_address === walletAddress)
      .slice(-limit);
  }

  // Risk Scores
  public saveRiskScore(score: FraudRiskScoreDTO): void {
    const list = this.getList<FraudRiskScoreDTO>(KEYS.RISK_SCORES);
    list.push(score);
    this.saveList(KEYS.RISK_SCORES, list, 100);
  }

  public getLatestRiskScore(walletAddress: string): FraudRiskScoreDTO | null {
    const scores = this.getList<FraudRiskScoreDTO>(KEYS.RISK_SCORES)
      .filter(s => s.wallet_address === walletAddress);
    return scores.length > 0 ? scores[scores.length - 1] : null;
  }

  // Telemetry Events
  public saveTelemetryEvent(event: SecurityTelemetryEventDTO): void {
    const list = this.getList<SecurityTelemetryEventDTO>(KEYS.TELEMETRY);
    list.push(event);
    this.saveList(KEYS.TELEMETRY, list, 500);
  }

  public getTelemetryEvents(limit: number = 100): SecurityTelemetryEventDTO[] {
    return this.getList<SecurityTelemetryEventDTO>(KEYS.TELEMETRY).slice(-limit);
  }

  // Sessions
  public saveSession(session: SessionIntegrityDTO): void {
    const list = this.getList<SessionIntegrityDTO>(KEYS.SESSIONS);
    const idx = list.findIndex(s => s.session_id === session.session_id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.push(session);
    }
    this.saveList(KEYS.SESSIONS, list, 50);
  }

  public getSession(sessionId: string): SessionIntegrityDTO | null {
    const list = this.getList<SessionIntegrityDTO>(KEYS.SESSIONS);
    return list.find(s => s.session_id === sessionId) || null;
  }

  // Crash Reports
  public saveCrashReport(report: CrashReportDTO): void {
    const list = this.getList<CrashReportDTO>(KEYS.CRASH_REPORTS);
    list.push(report);
    this.saveList(KEYS.CRASH_REPORTS, list, 100);
    logger.debug(`[SecurityLocalDS] Saved crash report: ${report.crash_id}`);
  }

  public getCrashReports(limit: number = 50): CrashReportDTO[] {
    return this.getList<CrashReportDTO>(KEYS.CRASH_REPORTS).slice(-limit);
  }

  // RPC Health
  public saveRpcHealthStatus(status: RPCHealthStatusDTO): void {
    const list = this.getList<RPCHealthStatusDTO>(KEYS.RPC_HEALTH);
    const idx = list.findIndex(s => s.endpoint === status.endpoint);
    if (idx >= 0) {
      list[idx] = status;
    } else {
      list.push(status);
    }
    this.saveList(KEYS.RPC_HEALTH, list, 20);
  }

  public getRpcHealthStatuses(): RPCHealthStatusDTO[] {
    return this.getList<RPCHealthStatusDTO>(KEYS.RPC_HEALTH);
  }

  // Circuit Breakers
  public saveCircuitBreakerStatus(status: CircuitBreakerStatusDTO): void {
    const list = this.getList<CircuitBreakerStatusDTO>(KEYS.CIRCUIT_BREAKERS);
    const idx = list.findIndex(s => s.circuit_id === status.circuit_id);
    if (idx >= 0) {
      list[idx] = status;
    } else {
      list.push(status);
    }
    this.saveList(KEYS.CIRCUIT_BREAKERS, list, 20);
  }

  public getCircuitBreakerStatuses(): CircuitBreakerStatusDTO[] {
    return this.getList<CircuitBreakerStatusDTO>(KEYS.CIRCUIT_BREAKERS);
  }
}
