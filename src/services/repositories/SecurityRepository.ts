/**
 * Security Repository — Coordinates local encrypted persistence and remote telemetry ingestion
 */

import { logger } from '../../utils/logger';
import { ISecurityRepository } from './ISecurityRepository';
import { SecurityLocalDataSourceImpl } from '../datasources/SecurityLocalDataSource';
import { SecurityRemoteDataSourceImpl } from '../datasources/SecurityRemoteDataSource';
import { SecurityAuditResultDTO, SecurityTelemetryEventDTO, SessionIntegrityDTO } from '../../core/api/SecurityDTOs';
import { FraudRiskScoreDTO, TransactionFraudAnalysisDTO } from '../../core/api/FraudDTOs';
import { CircuitBreakerStatusDTO, CrashReportDTO, RPCHealthStatusDTO } from '../../core/api/ObservabilityDTOs';

export class SecurityRepository implements ISecurityRepository {
  private localDS: SecurityLocalDataSourceImpl;
  private remoteDS: SecurityRemoteDataSourceImpl;

  constructor() {
    this.localDS = new SecurityLocalDataSourceImpl();
    this.remoteDS = new SecurityRemoteDataSourceImpl();
  }

  // --- Security Audits ---
  public async saveAuditResult(result: SecurityAuditResultDTO): Promise<void> {
    this.localDS.saveAuditResult(result);
  }

  public async getLatestAudit(): Promise<SecurityAuditResultDTO | null> {
    return this.localDS.getLatestAudit();
  }

  public async getAuditHistory(limit: number = 50): Promise<SecurityAuditResultDTO[]> {
    return this.localDS.getAuditHistory(limit);
  }

  // --- Fraud Analysis ---
  public async saveFraudAnalysis(analysis: TransactionFraudAnalysisDTO): Promise<void> {
    this.localDS.saveFraudAnalysis(analysis);
    // Also report to backend threat intelligence
    try {
      await this.remoteDS.reportFraudAnalysis(analysis);
    } catch (err) {
      logger.warn('[SecurityRepository] Failed to report fraud analysis to backend', err);
    }
  }

  public async getFraudHistory(walletAddress: string, limit: number = 50): Promise<TransactionFraudAnalysisDTO[]> {
    return this.localDS.getFraudHistory(walletAddress, limit);
  }

  public async saveRiskScore(score: FraudRiskScoreDTO): Promise<void> {
    this.localDS.saveRiskScore(score);
  }

  public async getLatestRiskScore(walletAddress: string): Promise<FraudRiskScoreDTO | null> {
    return this.localDS.getLatestRiskScore(walletAddress);
  }

  // --- Security Telemetry ---
  public async saveTelemetryEvent(event: SecurityTelemetryEventDTO): Promise<void> {
    this.localDS.saveTelemetryEvent(event);
  }

  public async getTelemetryEvents(limit: number = 100): Promise<SecurityTelemetryEventDTO[]> {
    return this.localDS.getTelemetryEvents(limit);
  }

  public async flushTelemetryToBackend(): Promise<void> {
    const events = this.localDS.getTelemetryEvents(100);
    if (events.length > 0) {
      try {
        const result = await this.remoteDS.submitTelemetryBatch(events);
        logger.info(`[SecurityRepository] Flushed ${result.accepted} telemetry events to backend`);
      } catch (err) {
        logger.warn('[SecurityRepository] Failed to flush telemetry to backend', err);
      }
    }
  }

  // --- Sessions ---
  public async saveSession(session: SessionIntegrityDTO): Promise<void> {
    this.localDS.saveSession(session);
  }

  public async getSession(sessionId: string): Promise<SessionIntegrityDTO | null> {
    return this.localDS.getSession(sessionId);
  }

  // --- Crash Reports ---
  public async saveCrashReport(report: CrashReportDTO): Promise<void> {
    this.localDS.saveCrashReport(report);
    try {
      await this.remoteDS.submitCrashReport(report.crash_id, {
        error: report.error_name,
        message: report.error_message,
        fatal: report.fatal,
      });
    } catch (err) {
      logger.warn('[SecurityRepository] Failed to submit crash report to backend', err);
    }
  }

  public async getCrashReports(limit: number = 50): Promise<CrashReportDTO[]> {
    return this.localDS.getCrashReports(limit);
  }

  // --- RPC Health ---
  public async saveRpcHealthStatus(status: RPCHealthStatusDTO): Promise<void> {
    this.localDS.saveRpcHealthStatus(status);
  }

  public async getRpcHealthStatuses(): Promise<RPCHealthStatusDTO[]> {
    return this.localDS.getRpcHealthStatuses();
  }

  // --- Circuit Breakers ---
  public async saveCircuitBreakerStatus(status: CircuitBreakerStatusDTO): Promise<void> {
    this.localDS.saveCircuitBreakerStatus(status);
  }

  public async getCircuitBreakerStatuses(): Promise<CircuitBreakerStatusDTO[]> {
    return this.localDS.getCircuitBreakerStatuses();
  }

  // --- Threat Intelligence ---
  public async syncThreatIntelligence(): Promise<string[]> {
    try {
      const intel = await this.remoteDS.fetchThreatIntelligence();
      logger.info(`[SecurityRepository] Synced ${intel.blacklisted_addresses.length} blacklisted addresses`);
      return intel.blacklisted_addresses;
    } catch (err) {
      logger.warn('[SecurityRepository] Failed to sync threat intelligence', err);
      return [];
    }
  }
}
