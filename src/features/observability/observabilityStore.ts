/**
 * Observability Store — Zustand state management for security, observability, and hardening status
 */

import { create } from 'zustand';
import { serviceLocator } from '../../services';
import { SecurityAuditResultDTO, SecurityTelemetryEventDTO } from '../../core/api/SecurityDTOs';
import { FraudRiskScoreDTO, TransactionFraudAnalysisDTO } from '../../core/api/FraudDTOs';
import { RPCHealthStatusDTO, CircuitBreakerStatusDTO, CrashReportDTO } from '../../core/api/ObservabilityDTOs';

interface ObservabilityState {
  // Security
  latestAudit: SecurityAuditResultDTO | null;
  auditHistory: SecurityAuditResultDTO[];

  // Fraud
  latestRiskScore: FraudRiskScoreDTO | null;
  fraudHistory: TransactionFraudAnalysisDTO[];

  // Telemetry
  telemetryEvents: SecurityTelemetryEventDTO[];

  // RPC Health
  rpcStatuses: RPCHealthStatusDTO[];

  // Circuit Breakers
  circuitBreakers: CircuitBreakerStatusDTO[];

  // Crash Reports
  crashReports: CrashReportDTO[];

  // State
  loading: boolean;
  error: string | null;

  // Actions
  runSecurityAudit: () => Promise<void>;
  fetchFraudHistory: (walletAddress: string) => Promise<void>;
  fetchRiskScore: (walletAddress: string) => Promise<void>;
  fetchTelemetryEvents: () => Promise<void>;
  fetchRpcStatuses: () => Promise<void>;
  fetchCircuitBreakers: () => Promise<void>;
  fetchCrashReports: () => Promise<void>;
  saveFraudAnalysis: (analysis: TransactionFraudAnalysisDTO) => Promise<void>;
}

export const useObservabilityStore = create<ObservabilityState>((set) => ({
  latestAudit: null,
  auditHistory: [],
  latestRiskScore: null,
  fraudHistory: [],
  telemetryEvents: [],
  rpcStatuses: [],
  circuitBreakers: [],
  crashReports: [],
  loading: false,
  error: null,

  runSecurityAudit: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getSecurityRepository();
      // Import dynamically to avoid circular deps at module level
      const { SecurityAuditEngine } = require('../../core/security/SecurityEngine');
      const result = SecurityAuditEngine.runFullAudit();
      await repo.saveAuditResult(result);
      const history = await repo.getAuditHistory();
      set({ latestAudit: result, auditHistory: history, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchFraudHistory: async (walletAddress: string) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getSecurityRepository();
      const history = await repo.getFraudHistory(walletAddress);
      set({ fraudHistory: history, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRiskScore: async (walletAddress: string) => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getSecurityRepository();
      const score = await repo.getLatestRiskScore(walletAddress);
      set({ latestRiskScore: score, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchTelemetryEvents: async () => {
    set({ loading: true, error: null });
    try {
      const repo = serviceLocator.getSecurityRepository();
      const events = await repo.getTelemetryEvents();
      set({ telemetryEvents: events, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRpcStatuses: async () => {
    try {
      const repo = serviceLocator.getSecurityRepository();
      const statuses = await repo.getRpcHealthStatuses();
      set({ rpcStatuses: statuses });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchCircuitBreakers: async () => {
    try {
      const repo = serviceLocator.getSecurityRepository();
      const breakers = await repo.getCircuitBreakerStatuses();
      set({ circuitBreakers: breakers });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchCrashReports: async () => {
    try {
      const repo = serviceLocator.getSecurityRepository();
      const reports = await repo.getCrashReports();
      set({ crashReports: reports });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  saveFraudAnalysis: async (analysis: TransactionFraudAnalysisDTO) => {
    try {
      const repo = serviceLocator.getSecurityRepository();
      await repo.saveFraudAnalysis(analysis);
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
