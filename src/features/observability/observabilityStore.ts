/**
 * Observability Store — Zustand state management for security, observability, and hardening status
 * Optimized with:
 * - Selector memoization
 * - Batch updates
 * - Snapshot recovery
 * - Background hydration
 */

import { create } from 'zustand';
import { serviceLocator } from '../../services';
import { SecurityAuditResultDTO, SecurityTelemetryEventDTO } from '../../core/api/SecurityDTOs';
import { FraudRiskScoreDTO, TransactionFraudAnalysisDTO } from '../../core/api/FraudDTOs';
import { RPCHealthStatusDTO, CircuitBreakerStatusDTO, CrashReportDTO } from '../../core/api/ObservabilityDTOs';
import { localStorage } from '../../core/storage';

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
  isHydrated: boolean;

  // Actions
  runSecurityAudit: () => Promise<void>;
  fetchFraudHistory: (walletAddress: string) => Promise<void>;
  fetchRiskScore: (walletAddress: string) => Promise<void>;
  fetchTelemetryEvents: () => Promise<void>;
  fetchRpcStatuses: () => Promise<void>;
  fetchCircuitBreakers: () => Promise<void>;
  fetchCrashReports: () => Promise<void>;
  saveFraudAnalysis: (analysis: TransactionFraudAnalysisDTO) => Promise<void>;

  // Optimizations
  hydrateStoreAsync: () => Promise<void>;
  recoverFromSnapshot: (snapshot: Partial<ObservabilityState>) => void;
  batchUpdate: (updates: Partial<ObservabilityState>) => void;
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
  isHydrated: false,

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

  // Background Async Hydration
  hydrateStoreAsync: async () => {
    try {
      const raw = localStorage.getString('observability_store_snapshot');
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ ...parsed, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  // Snapshot Recovery
  recoverFromSnapshot: (snapshot: Partial<ObservabilityState>) => {
    set((state) => ({ ...state, ...snapshot }));
    try {
      localStorage.setString('observability_store_snapshot', JSON.stringify(snapshot));
    } catch {
      // ignore storage errors
    }
  },

  // Batch updates helper to prevent multiple render sweeps
  batchUpdate: (updates: Partial<ObservabilityState>) => {
    set((state) => ({ ...state, ...updates }));
  },
}));

// Selective subscriptions (Memoized Selector Helpers)
export const selectLatestAudit = (state: ObservabilityState) => state.latestAudit;
export const selectAuditHistory = (state: ObservabilityState) => state.auditHistory;
export const selectLatestRiskScore = (state: ObservabilityState) => state.latestRiskScore;
export const selectFraudHistory = (state: ObservabilityState) => state.fraudHistory;
export const selectTelemetryEvents = (state: ObservabilityState) => state.telemetryEvents;
export const selectRpcStatuses = (state: ObservabilityState) => state.rpcStatuses;
export const selectCircuitBreakers = (state: ObservabilityState) => state.circuitBreakers;
export const selectCrashReports = (state: ObservabilityState) => state.crashReports;
export const selectLoadingState = (state: ObservabilityState) => state.loading;
export const selectErrorState = (state: ObservabilityState) => state.error;
export const selectIsHydrated = (state: ObservabilityState) => state.isHydrated;

