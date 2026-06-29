/**
 * Observability DTOs — Telemetry, Performance, Health Monitoring & Distributed Tracing
 */

// ---------------------------------------------------------
// Structured Telemetry
// ---------------------------------------------------------
export interface TelemetrySpanDTO {
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  operation_name: string;
  service_name: string;
  start_time: number;
  end_time: number;
  duration_ms: number;
  status: 'ok' | 'error' | 'timeout';
  attributes: Record<string, string | number | boolean>;
  events: TelemetryEventDTO[];
}

export interface TelemetryEventDTO {
  name: string;
  timestamp: number;
  attributes: Record<string, string | number | boolean>;
}

export interface CorrelationContextDTO {
  correlation_id: string;
  trace_id: string;
  session_id: string;
  user_id: string;
  device_id: string;
  created_at: number;
}

// ---------------------------------------------------------
// RPC & API Health
// ---------------------------------------------------------
export interface RPCHealthStatusDTO {
  endpoint: string;
  is_healthy: boolean;
  latency_ms: number;
  last_check_at: number;
  consecutive_failures: number;
  error_rate_percent: number;
  slot_height: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
}

export interface APIHealthStatusDTO {
  service_name: string;
  endpoint: string;
  is_healthy: boolean;
  latency_ms: number;
  last_check_at: number;
  status_code: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
}

// ---------------------------------------------------------
// System Resource Monitors
// ---------------------------------------------------------
export interface MemorySnapshotDTO {
  used_mb: number;
  total_mb: number;
  usage_percent: number;
  js_heap_used_mb: number;
  js_heap_total_mb: number;
  native_heap_mb: number;
  warning_threshold_percent: number;
  is_warning: boolean;
  timestamp: number;
}

export interface FPSSnapshotDTO {
  current_fps: number;
  average_fps: number;
  dropped_frames: number;
  jank_count: number;
  is_janky: boolean;
  timestamp: number;
}

export interface NetworkQualityDTO {
  connection_type: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown';
  effective_type: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  downlink_mbps: number;
  rtt_ms: number;
  is_connected: boolean;
  is_metered: boolean;
  timestamp: number;
}

export interface StorageHealthDTO {
  available_mb: number;
  total_mb: number;
  usage_percent: number;
  cache_size_mb: number;
  database_size_mb: number;
  is_low_storage: boolean;
  timestamp: number;
}

export interface BatteryImpactDTO {
  level_percent: number;
  is_charging: boolean;
  temperature_celsius: number;
  drain_rate_percent_per_hour: number;
  is_high_impact: boolean;
  timestamp: number;
}

// ---------------------------------------------------------
// Performance Profiling
// ---------------------------------------------------------
export interface PerformanceProfileDTO {
  profile_id: string;
  operation: string;
  phase: 'cold_start' | 'navigation' | 'rpc_call' | 'render' | 'computation' | 'io' | 'network';
  duration_ms: number;
  memory_delta_mb: number;
  cpu_usage_percent: number;
  timestamp: number;
}

// ---------------------------------------------------------
// Crash Reporting
// ---------------------------------------------------------
export interface CrashReportDTO {
  crash_id: string;
  error_name: string;
  error_message: string;
  stack_trace: string;
  fatal: boolean;
  breadcrumbs: BreadcrumbDTO[];
  device_info: DeviceInfoDTO;
  app_state: Record<string, unknown>;
  timestamp: number;
}

export interface BreadcrumbDTO {
  category: string;
  message: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface DeviceInfoDTO {
  platform: string;
  os_version: string;
  device_model: string;
  app_version: string;
  build_number: string;
  memory_available_mb: number;
  storage_available_mb: number;
}

// ---------------------------------------------------------
// Error Aggregation
// ---------------------------------------------------------
export interface AggregatedErrorDTO {
  error_group_id: string;
  error_name: string;
  error_message: string;
  first_seen: number;
  last_seen: number;
  occurrence_count: number;
  affected_users: number;
  sample_stack: string;
  is_resolved: boolean;
}

// ---------------------------------------------------------
// Event Timeline
// ---------------------------------------------------------
export interface TimelineEventDTO {
  event_id: string;
  event_type: string;
  category: 'user_action' | 'system' | 'network' | 'security' | 'performance' | 'error';
  description: string;
  correlation_id: string;
  metadata: Record<string, unknown>;
  timestamp: number;
}

// ---------------------------------------------------------
// Circuit Breaker State
// ---------------------------------------------------------
export type CircuitState = 'closed' | 'open' | 'half_open';

export interface CircuitBreakerStatusDTO {
  circuit_id: string;
  service_name: string;
  state: CircuitState;
  failure_count: number;
  success_count: number;
  failure_threshold: number;
  recovery_timeout_ms: number;
  last_failure_at: number;
  last_state_change_at: number;
  next_retry_at: number;
}
