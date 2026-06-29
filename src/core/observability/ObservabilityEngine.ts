

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';
import {
  TelemetrySpanDTO,
  CorrelationContextDTO,
  RPCHealthStatusDTO,
  APIHealthStatusDTO,
  MemorySnapshotDTO,
  FPSSnapshotDTO,
  NetworkQualityDTO,
  StorageHealthDTO,
  BatteryImpactDTO,
  PerformanceProfileDTO,
  CrashReportDTO,
  BreadcrumbDTO,
  AggregatedErrorDTO,
  TimelineEventDTO,
} from '../api/ObservabilityDTOs';


export class CorrelationIDGenerator {
  private static counter = 0;

  public static generate(): string {
    this.counter++;
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `corr_${timestamp}_${random}_${this.counter}`;
  }

  public static generateTraceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 14);
    return `trace_${timestamp}_${random}`;
  }

  public static generateSpanId(): string {
    return `span_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
}


export class StructuredTelemetry {
  private static spans: TelemetrySpanDTO[] = [];
  private static readonly MAX_SPANS = 5000;

  public static startSpan(operationName: string, serviceName: string, parentSpanId: string | null = null): TelemetrySpanDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_STRUCTURED_TELEMETRY')) {
      return this.createNoopSpan(operationName, serviceName);
    }

    const span: TelemetrySpanDTO = {
      trace_id: CorrelationIDGenerator.generateTraceId(),
      span_id: CorrelationIDGenerator.generateSpanId(),
      parent_span_id: parentSpanId,
      operation_name: operationName,
      service_name: serviceName,
      start_time: Date.now(),
      end_time: 0,
      duration_ms: 0,
      status: 'ok',
      attributes: {},
      events: [],
    };

    return span;
  }

  public static endSpan(span: TelemetrySpanDTO, status: TelemetrySpanDTO['status'] = 'ok'): TelemetrySpanDTO {
    span.end_time = Date.now();
    span.duration_ms = span.end_time - span.start_time;
    span.status = status;

    this.spans.push(span);

    if (this.spans.length > this.MAX_SPANS) {
      this.spans = this.spans.slice(-Math.floor(this.MAX_SPANS / 2));
    }

    return span;
  }

  public static addEvent(span: TelemetrySpanDTO, name: string, attributes: Record<string, string | number | boolean> = {}): void {
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  public static getSpans(limit: number = 100): TelemetrySpanDTO[] {
    return this.spans.slice(-limit);
  }

  public static clearSpans(): void {
    this.spans = [];
  }

  private static createNoopSpan(operationName: string, serviceName: string): TelemetrySpanDTO {
    return {
      trace_id: 'noop',
      span_id: 'noop',
      parent_span_id: null,
      operation_name: operationName,
      service_name: serviceName,
      start_time: Date.now(),
      end_time: Date.now(),
      duration_ms: 0,
      status: 'ok',
      attributes: {},
      events: [],
    };
  }
}

// ---------------------------------------------------------
// 3. Distributed Trace Manager
// ---------------------------------------------------------
export class DistributedTraceManager {
  private static contexts: Map<string, CorrelationContextDTO> = new Map();

  public static createContext(sessionId: string, userId: string, deviceId: string): CorrelationContextDTO {
    const context: CorrelationContextDTO = {
      correlation_id: CorrelationIDGenerator.generate(),
      trace_id: CorrelationIDGenerator.generateTraceId(),
      session_id: sessionId,
      user_id: userId,
      device_id: deviceId,
      created_at: Date.now(),
    };

    this.contexts.set(context.correlation_id, context);
    return context;
  }

  public static getContext(correlationId: string): CorrelationContextDTO | null {
    return this.contexts.get(correlationId) || null;
  }

  public static clearContexts(): void {
    this.contexts.clear();
  }
}


export class PerformanceProfiler {
  private static profiles: PerformanceProfileDTO[] = [];
  private static readonly MAX_PROFILES = 2000;

  public static measure(operation: string, phase: PerformanceProfileDTO['phase'], fn: () => void): PerformanceProfileDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_PERFORMANCE_MONITORING')) {
      fn();
      return {
        profile_id: `prof_noop_${Date.now()}`,
        operation,
        phase,
        duration_ms: 0,
        memory_delta_mb: 0,
        cpu_usage_percent: 0,
        timestamp: Date.now(),
      };
    }

    const startTime = Date.now();
    fn();
    const duration = Date.now() - startTime;

    const profile: PerformanceProfileDTO = {
      profile_id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      operation,
      phase,
      duration_ms: duration,
      memory_delta_mb: 0, // Architecture-ready: would use performance.measureMemory()
      cpu_usage_percent: 0,
      timestamp: Date.now(),
    };

    this.profiles.push(profile);

    if (this.profiles.length > this.MAX_PROFILES) {
      this.profiles = this.profiles.slice(-Math.floor(this.MAX_PROFILES / 2));
    }

    return profile;
  }

  public static async measureAsync(operation: string, phase: PerformanceProfileDTO['phase'], fn: () => Promise<void>): Promise<PerformanceProfileDTO> {
    if (!featureFlagsManager.isEnabled('ENABLE_PERFORMANCE_MONITORING')) {
      await fn();
      return {
        profile_id: `prof_noop_${Date.now()}`,
        operation,
        phase,
        duration_ms: 0,
        memory_delta_mb: 0,
        cpu_usage_percent: 0,
        timestamp: Date.now(),
      };
    }

    const startTime = Date.now();
    await fn();
    const duration = Date.now() - startTime;

    const profile: PerformanceProfileDTO = {
      profile_id: `prof_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      operation,
      phase,
      duration_ms: duration,
      memory_delta_mb: 0,
      cpu_usage_percent: 0,
      timestamp: Date.now(),
    };

    this.profiles.push(profile);

    if (this.profiles.length > this.MAX_PROFILES) {
      this.profiles = this.profiles.slice(-Math.floor(this.MAX_PROFILES / 2));
    }

    return profile;
  }

  public static getProfiles(limit: number = 50): PerformanceProfileDTO[] {
    return this.profiles.slice(-limit);
  }

  public static getAverageDuration(operation: string): number {
    const matching = this.profiles.filter(p => p.operation === operation);
    if (matching.length === 0) { return 0; }
    return matching.reduce((sum, p) => sum + p.duration_ms, 0) / matching.length;
  }

  public static clearProfiles(): void {
    this.profiles = [];
  }
}


export class CrashReporter {
  private static reports: CrashReportDTO[] = [];
  private static breadcrumbs: BreadcrumbDTO[] = [];
  private static readonly MAX_BREADCRUMBS = 200;
  private static readonly MAX_REPORTS = 500;

  public static addBreadcrumb(category: string, message: string, level: BreadcrumbDTO['level'] = 'info', data?: Record<string, unknown>): void {
    if (!featureFlagsManager.isEnabled('ENABLE_CRASH_REPORTING')) { return; }

    this.breadcrumbs.push({
      category,
      message,
      level,
      timestamp: Date.now(),
      data,
    });

    if (this.breadcrumbs.length > this.MAX_BREADCRUMBS) {
      this.breadcrumbs = this.breadcrumbs.slice(-Math.floor(this.MAX_BREADCRUMBS / 2));
    }
  }

  public static captureError(error: Error, fatal: boolean = false, appState: Record<string, unknown> = {}): CrashReportDTO {
    const report: CrashReportDTO = {
      crash_id: `crash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      error_name: error.name,
      error_message: error.message,
      stack_trace: error.stack || 'No stack trace available',
      fatal,
      breadcrumbs: [...this.breadcrumbs],
      device_info: {
        platform: 'android',
        os_version: 'API 33',
        device_model: 'Production Device',
        app_version: '1.0.0',
        build_number: '1',
        memory_available_mb: 2048,
        storage_available_mb: 8192,
      },
      app_state: appState,
      timestamp: Date.now(),
    };

    this.reports.push(report);

    if (this.reports.length > this.MAX_REPORTS) {
      this.reports = this.reports.slice(-Math.floor(this.MAX_REPORTS / 2));
    }

    if (fatal) {
      logger.error(`[CrashReporter] FATAL: ${error.name}: ${error.message}`, error);
    } else {
      logger.warn(`[CrashReporter] Error captured: ${error.name}: ${error.message}`);
    }

    return report;
  }

  public static getReports(limit: number = 50): CrashReportDTO[] {
    return this.reports.slice(-limit);
  }

  public static clearReports(): void {
    this.reports = [];
    this.breadcrumbs = [];
  }
}


export class ErrorAggregator {
  private static groups: Map<string, AggregatedErrorDTO> = new Map();

  public static aggregate(error: Error): AggregatedErrorDTO {
    const fingerprint = `${error.name}:${error.message}`;
    const existing = this.groups.get(fingerprint);

    if (existing) {
      existing.last_seen = Date.now();
      existing.occurrence_count++;
      return existing;
    }

    const group: AggregatedErrorDTO = {
      error_group_id: `errgrp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      error_name: error.name,
      error_message: error.message,
      first_seen: Date.now(),
      last_seen: Date.now(),
      occurrence_count: 1,
      affected_users: 1,
      sample_stack: error.stack || '',
      is_resolved: false,
    };

    this.groups.set(fingerprint, group);
    return group;
  }

  public static getGroups(): AggregatedErrorDTO[] {
    return Array.from(this.groups.values());
  }

  public static resolveGroup(groupId: string): void {
    this.groups.forEach(group => {
      if (group.error_group_id === groupId) {
        group.is_resolved = true;
      }
    });
  }

  public static clearGroups(): void {
    this.groups.clear();
  }
}

// ---------------------------------------------------------
// 7. Latency Tracker
// ---------------------------------------------------------
export class LatencyTracker {
  private static measurements: Map<string, number[]> = new Map();
  private static readonly MAX_PER_ENDPOINT = 500;

  public static record(endpoint: string, latencyMs: number): void {
    if (!this.measurements.has(endpoint)) {
      this.measurements.set(endpoint, []);
    }
    const list = this.measurements.get(endpoint)!;
    list.push(latencyMs);

    if (list.length > this.MAX_PER_ENDPOINT) {
      list.splice(0, Math.floor(this.MAX_PER_ENDPOINT / 2));
    }
  }

  public static getP50(endpoint: string): number {
    return this.getPercentile(endpoint, 50);
  }

  public static getP95(endpoint: string): number {
    return this.getPercentile(endpoint, 95);
  }

  public static getP99(endpoint: string): number {
    return this.getPercentile(endpoint, 99);
  }

  public static getAverage(endpoint: string): number {
    const list = this.measurements.get(endpoint);
    if (!list || list.length === 0) { return 0; }
    return list.reduce((s, v) => s + v, 0) / list.length;
  }

  private static getPercentile(endpoint: string, percentile: number): number {
    const list = this.measurements.get(endpoint);
    if (!list || list.length === 0) { return 0; }
    const sorted = [...list].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  public static clearMeasurements(): void {
    this.measurements.clear();
  }
}

// ---------------------------------------------------------
// 8. RPC Health Monitor
// ---------------------------------------------------------
export class RPCHealthMonitor {
  private static statuses: Map<string, RPCHealthStatusDTO> = new Map();

  public static recordHealthCheck(endpoint: string, latencyMs: number, isHealthy: boolean, slotHeight: number = 0): RPCHealthStatusDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_RPC_HEALTH')) {
      return this.createHealthyStatus(endpoint);
    }

    const existing = this.statuses.get(endpoint);
    const consecutiveFailures = existing && !isHealthy ? existing.consecutive_failures + 1 : isHealthy ? 0 : 1;

    let status: RPCHealthStatusDTO['status'] = 'healthy';
    if (!isHealthy) {
      status = consecutiveFailures >= 5 ? 'offline' : consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';
    } else if (latencyMs > 2000) {
      status = 'degraded';
    }

    const healthStatus: RPCHealthStatusDTO = {
      endpoint,
      is_healthy: isHealthy && latencyMs <= 5000,
      latency_ms: latencyMs,
      last_check_at: Date.now(),
      consecutive_failures: consecutiveFailures,
      error_rate_percent: existing ? (existing.consecutive_failures / Math.max(1, existing.consecutive_failures + 1)) * 100 : 0,
      slot_height: slotHeight,
      status,
    };

    this.statuses.set(endpoint, healthStatus);
    LatencyTracker.record(`rpc:${endpoint}`, latencyMs);

    return healthStatus;
  }

  public static getStatus(endpoint: string): RPCHealthStatusDTO | null {
    return this.statuses.get(endpoint) || null;
  }

  public static getAllStatuses(): RPCHealthStatusDTO[] {
    return Array.from(this.statuses.values());
  }

  public static getHealthiestEndpoint(): string | null {
    const statuses = Array.from(this.statuses.values());
    const healthy = statuses.filter(s => s.is_healthy);
    if (healthy.length === 0) { return null; }
    healthy.sort((a, b) => a.latency_ms - b.latency_ms);
    return healthy[0].endpoint;
  }

  private static createHealthyStatus(endpoint: string): RPCHealthStatusDTO {
    return {
      endpoint,
      is_healthy: true,
      latency_ms: 0,
      last_check_at: Date.now(),
      consecutive_failures: 0,
      error_rate_percent: 0,
      slot_height: 0,
      status: 'healthy',
    };
  }

  public static clearStatuses(): void {
    this.statuses.clear();
  }
}

// ---------------------------------------------------------
// 9. API Health Monitor
// ---------------------------------------------------------
export class APIHealthMonitor {
  private static statuses: Map<string, APIHealthStatusDTO> = new Map();

  public static recordHealthCheck(serviceName: string, endpoint: string, statusCode: number, latencyMs: number): APIHealthStatusDTO {
    const isHealthy = statusCode >= 200 && statusCode < 400;

    let status: APIHealthStatusDTO['status'] = 'healthy';
    if (!isHealthy) { status = 'unhealthy'; }
    else if (latencyMs > 3000) { status = 'degraded'; }

    const healthStatus: APIHealthStatusDTO = {
      service_name: serviceName,
      endpoint,
      is_healthy: isHealthy,
      latency_ms: latencyMs,
      last_check_at: Date.now(),
      status_code: statusCode,
      status,
    };

    this.statuses.set(serviceName, healthStatus);
    LatencyTracker.record(`api:${serviceName}`, latencyMs);

    return healthStatus;
  }

  public static getStatus(serviceName: string): APIHealthStatusDTO | null {
    return this.statuses.get(serviceName) || null;
  }

  public static getAllStatuses(): APIHealthStatusDTO[] {
    return Array.from(this.statuses.values());
  }

  public static clearStatuses(): void {
    this.statuses.clear();
  }
}

// ---------------------------------------------------------
// 10. Memory Monitor
// ---------------------------------------------------------
export class MemoryMonitor {
  private static snapshots: MemorySnapshotDTO[] = [];
  private static readonly WARNING_THRESHOLD = 85; // percent

  public static capture(): MemorySnapshotDTO {
    if (!featureFlagsManager.isEnabled('ENABLE_MEMORY_PROFILER')) {
      return this.createDefaultSnapshot();
    }

    // Architecture-ready: In production would use Performance.memory or NativeModules
    const snapshot: MemorySnapshotDTO = {
      used_mb: 128,
      total_mb: 2048,
      usage_percent: 6.25,
      js_heap_used_mb: 45,
      js_heap_total_mb: 128,
      native_heap_mb: 83,
      warning_threshold_percent: this.WARNING_THRESHOLD,
      is_warning: false,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 500) {
      this.snapshots = this.snapshots.slice(-250);
    }

    return snapshot;
  }

  public static getSnapshots(limit: number = 50): MemorySnapshotDTO[] {
    return this.snapshots.slice(-limit);
  }

  public static getLatest(): MemorySnapshotDTO | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  private static createDefaultSnapshot(): MemorySnapshotDTO {
    return {
      used_mb: 0,
      total_mb: 0,
      usage_percent: 0,
      js_heap_used_mb: 0,
      js_heap_total_mb: 0,
      native_heap_mb: 0,
      warning_threshold_percent: this.WARNING_THRESHOLD,
      is_warning: false,
      timestamp: Date.now(),
    };
  }

  public static clearSnapshots(): void {
    this.snapshots = [];
  }
}

// ---------------------------------------------------------
// 11. FPS Monitor
// ---------------------------------------------------------
export class FPSMonitor {
  private static snapshots: FPSSnapshotDTO[] = [];
  private static readonly JANK_THRESHOLD_FPS = 30;

  public static record(currentFps: number, droppedFrames: number = 0): FPSSnapshotDTO {
    const allFps = this.snapshots.map(s => s.current_fps);
    allFps.push(currentFps);
    const averageFps = allFps.reduce((s, v) => s + v, 0) / allFps.length;
    const jankCount = this.snapshots.filter(s => s.current_fps < this.JANK_THRESHOLD_FPS).length;

    const snapshot: FPSSnapshotDTO = {
      current_fps: currentFps,
      average_fps: Math.round(averageFps * 100) / 100,
      dropped_frames: droppedFrames,
      jank_count: jankCount,
      is_janky: currentFps < this.JANK_THRESHOLD_FPS,
      timestamp: Date.now(),
    };

    this.snapshots.push(snapshot);

    if (this.snapshots.length > 500) {
      this.snapshots = this.snapshots.slice(-250);
    }

    return snapshot;
  }

  public static getLatest(): FPSSnapshotDTO | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  public static clearSnapshots(): void {
    this.snapshots = [];
  }
}

// ---------------------------------------------------------
// 12. Network Quality Monitor
// ---------------------------------------------------------
export class NetworkQualityMonitor {
  private static currentQuality: NetworkQualityDTO = {
    connection_type: 'wifi',
    effective_type: '4g',
    downlink_mbps: 50,
    rtt_ms: 20,
    is_connected: true,
    is_metered: false,
    timestamp: Date.now(),
  };

  public static update(quality: Partial<NetworkQualityDTO>): NetworkQualityDTO {
    this.currentQuality = { ...this.currentQuality, ...quality, timestamp: Date.now() };
    return this.currentQuality;
  }

  public static getQuality(): NetworkQualityDTO {
    return this.currentQuality;
  }

  public static isOnline(): boolean {
    return this.currentQuality.is_connected;
  }
}

// ---------------------------------------------------------
// 13. Storage Health Monitor
// ---------------------------------------------------------
export class StorageHealthMonitor {
  private static readonly LOW_STORAGE_THRESHOLD_MB = 100;

  public static check(): StorageHealthDTO {
    // Architecture-ready: would use RNFS or native storage APIs
    return {
      available_mb: 4096,
      total_mb: 32768,
      usage_percent: 87.5,
      cache_size_mb: 128,
      database_size_mb: 24,
      is_low_storage: false,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------
// 14. Battery Impact Analyzer
// ---------------------------------------------------------
export class BatteryImpactAnalyzer {
  private static readonly HIGH_IMPACT_THRESHOLD = 10; // percent per hour

  public static analyze(): BatteryImpactDTO {
    // Architecture-ready: would use react-native-battery or native APIs
    return {
      level_percent: 85,
      is_charging: false,
      temperature_celsius: 32,
      drain_rate_percent_per_hour: 5,
      is_high_impact: false,
      timestamp: Date.now(),
    };
  }
}

// ---------------------------------------------------------
// 15. Event Timeline Builder
// ---------------------------------------------------------
export class EventTimelineBuilder {
  private static events: TimelineEventDTO[] = [];
  private static readonly MAX_EVENTS = 3000;

  public static addEvent(
    eventType: string,
    category: TimelineEventDTO['category'],
    description: string,
    metadata: Record<string, unknown> = {},
  ): TimelineEventDTO {
    const event: TimelineEventDTO = {
      event_id: `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      event_type: eventType,
      category,
      description,
      correlation_id: CorrelationIDGenerator.generate(),
      metadata,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-Math.floor(this.MAX_EVENTS / 2));
    }

    return event;
  }

  public static getTimeline(limit: number = 100): TimelineEventDTO[] {
    return this.events.slice(-limit);
  }

  public static getByCategory(category: TimelineEventDTO['category']): TimelineEventDTO[] {
    return this.events.filter(e => e.category === category);
  }

  public static clearTimeline(): void {
    this.events = [];
  }
}

// ---------------------------------------------------------
// 16. Analytics Pipeline
// ---------------------------------------------------------
export class AnalyticsPipeline {
  private static queue: Array<{ event: string; properties: Record<string, unknown>; timestamp: number }> = [];
  private static readonly MAX_QUEUE = 1000;
  private static readonly BATCH_SIZE = 50;

  public static track(event: string, properties: Record<string, unknown> = {}): void {
    if (!featureFlagsManager.isEnabled('ENABLE_OBSERVABILITY')) { return; }

    this.queue.push({
      event,
      properties,
      timestamp: Date.now(),
    });

    if (this.queue.length > this.MAX_QUEUE) {
      this.queue = this.queue.slice(-Math.floor(this.MAX_QUEUE / 2));
    }

    // Auto-flush if batch threshold reached
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  public static flush(): void {
    if (this.queue.length === 0) { return; }

    const batch = this.queue.splice(0, this.BATCH_SIZE);
    logger.debug(`[AnalyticsPipeline] Flushed ${batch.length} events`);
    // Architecture-ready: would send to analytics backend (Mixpanel, Amplitude, etc.)
  }

  public static getQueueSize(): number {
    return this.queue.length;
  }

  public static clearQueue(): void {
    this.queue = [];
  }
}

// ---------------------------------------------------------
// Observability Engine Facade
// ---------------------------------------------------------
export const observabilityEngine = {
  correlationId: CorrelationIDGenerator,
  telemetry: StructuredTelemetry,
  traces: DistributedTraceManager,
  profiler: PerformanceProfiler,
  crash: CrashReporter,
  errors: ErrorAggregator,
  latency: LatencyTracker,
  rpcHealth: RPCHealthMonitor,
  apiHealth: APIHealthMonitor,
  memory: MemoryMonitor,
  fps: FPSMonitor,
  network: NetworkQualityMonitor,
  storage: StorageHealthMonitor,
  battery: BatteryImpactAnalyzer,
  timeline: EventTimelineBuilder,
  analytics: AnalyticsPipeline,
};
