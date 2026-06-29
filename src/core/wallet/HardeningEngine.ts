/**
 * Production Hardening Engine — RPC Circuit Breakers, Failover, Retry Budgets & Resilience
 *
 * Implements:
 * - RpcCircuitBreaker: Closed/Open/Half-Open state machine for RPC endpoints
 * - RpcFailoverManager: Automatic primary-to-backup host routing
 * - TimeoutPolicy: Configurable request timeout enforcement
 * - RetryBudget: Rate-limited retry management with exponential backoff
 * - RequestBudget: Per-window request count limiting
 * - BackpressureController: Queue depth management
 * - ConnectionPool: Connection reuse management
 * - CacheRecoveryManager: Stale cache eviction and recovery
 * - GracefulDegradation: Offline/degraded mode handling
 */

import { logger } from '../../utils/logger';
import { featureFlagsManager } from '../api/FeatureFlags';
import { CircuitBreakerStatusDTO, CircuitState } from '../api/ObservabilityDTOs';

// ---------------------------------------------------------
// 1. RPC Circuit Breaker
// ---------------------------------------------------------
export class RpcCircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureAt = 0;
  private lastStateChangeAt = Date.now();

  constructor(
    private readonly circuitId: string,
    private readonly serviceName: string,
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeoutMs: number = 30000,
    private readonly halfOpenMaxAttempts: number = 3,
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureAt >= this.recoveryTimeoutMs) {
        this.transitionTo('half_open');
      } else {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}. Retry after ${this.getNextRetryAt() - Date.now()}ms`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    if (this.state === 'half_open') {
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.transitionTo('closed');
      }
    }
    this.failureCount = 0;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureAt = Date.now();
    this.successCount = 0;

    if (this.state === 'half_open') {
      this.transitionTo('open');
    } else if (this.state === 'closed' && this.failureCount >= this.failureThreshold) {
      this.transitionTo('open');
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChangeAt = Date.now();

    if (newState === 'closed') {
      this.failureCount = 0;
      this.successCount = 0;
    }

    logger.info(`[CircuitBreaker] ${this.serviceName}: ${oldState} -> ${newState}`);
  }

  public getStatus(): CircuitBreakerStatusDTO {
    return {
      circuit_id: this.circuitId,
      service_name: this.serviceName,
      state: this.state,
      failure_count: this.failureCount,
      success_count: this.successCount,
      failure_threshold: this.failureThreshold,
      recovery_timeout_ms: this.recoveryTimeoutMs,
      last_failure_at: this.lastFailureAt,
      last_state_change_at: this.lastStateChangeAt,
      next_retry_at: this.getNextRetryAt(),
    };
  }

  public getState(): CircuitState {
    return this.state;
  }

  private getNextRetryAt(): number {
    if (this.state === 'open') {
      return this.lastFailureAt + this.recoveryTimeoutMs;
    }
    return 0;
  }

  public reset(): void {
    this.transitionTo('closed');
  }
}

// ---------------------------------------------------------
// 2. RPC Failover Manager
// ---------------------------------------------------------
export class RpcFailoverManager {
  private endpoints: Array<{ url: string; priority: number; isHealthy: boolean; lastCheckedAt: number }> = [];
  private activeIndex = 0;

  public registerEndpoint(url: string, priority: number): void {
    this.endpoints.push({
      url,
      priority,
      isHealthy: true,
      lastCheckedAt: Date.now(),
    });
    // Sort by priority (lower = higher priority)
    this.endpoints.sort((a, b) => a.priority - b.priority);
    logger.debug(`[RpcFailover] Registered endpoint: ${url} (priority=${priority})`);
  }

  public getActiveEndpoint(): string {
    const healthy = this.endpoints.filter(e => e.isHealthy);
    if (healthy.length === 0) {
      // All unhealthy — return first endpoint as fallback
      logger.warn('[RpcFailover] All endpoints unhealthy, returning primary fallback');
      return this.endpoints.length > 0 ? this.endpoints[0].url : '';
    }
    return healthy[0].url;
  }

  public markUnhealthy(url: string): void {
    const endpoint = this.endpoints.find(e => e.url === url);
    if (endpoint) {
      endpoint.isHealthy = false;
      endpoint.lastCheckedAt = Date.now();
      logger.warn(`[RpcFailover] Endpoint marked unhealthy: ${url}`);
    }
  }

  public markHealthy(url: string): void {
    const endpoint = this.endpoints.find(e => e.url === url);
    if (endpoint) {
      endpoint.isHealthy = true;
      endpoint.lastCheckedAt = Date.now();
    }
  }

  public getEndpoints(): Array<{ url: string; priority: number; isHealthy: boolean }> {
    return this.endpoints.map(e => ({ url: e.url, priority: e.priority, isHealthy: e.isHealthy }));
  }
}

// ---------------------------------------------------------
// 3. Timeout Policy
// ---------------------------------------------------------
export class TimeoutPolicy {
  constructor(
    private readonly defaultTimeoutMs: number = 10000,
  ) {}

  public async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs || this.defaultTimeoutMs;

    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(err => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}

// ---------------------------------------------------------
// 4. Retry Budget
// ---------------------------------------------------------
export class RetryBudget {
  private attempts = 0;
  private lastAttemptAt = 0;

  constructor(
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 1000,
    private readonly maxDelayMs: number = 30000,
  ) {}

  public async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    this.attempts = 0;

    while (true) {
      try {
        this.attempts++;
        this.lastAttemptAt = Date.now();
        return await operation();
      } catch (error) {
        if (this.attempts >= this.maxRetries) {
          throw error;
        }

        const delay = Math.min(
          this.baseDelayMs * Math.pow(2, this.attempts - 1),
          this.maxDelayMs,
        );

        logger.debug(`[RetryBudget] Attempt ${this.attempts}/${this.maxRetries} failed, retrying in ${delay}ms`);
        await new Promise<void>(resolve => setTimeout(() => resolve(), delay));
      }
    }
  }

  public getAttempts(): number {
    return this.attempts;
  }
}


export class RequestBudget {
  private requestTimestamps: number[] = [];

  constructor(
    private readonly maxRequests: number = 100,
    private readonly windowMs: number = 60000,
  ) {}

  public canMakeRequest(): boolean {
    this.pruneOldRequests();
    return this.requestTimestamps.length < this.maxRequests;
  }

  public recordRequest(): boolean {
    this.pruneOldRequests();
    if (this.requestTimestamps.length >= this.maxRequests) {
      logger.warn(`[RequestBudget] Rate limit exceeded: ${this.maxRequests} requests per ${this.windowMs}ms`);
      return false;
    }
    this.requestTimestamps.push(Date.now());
    return true;
  }

  public getRemainingBudget(): number {
    this.pruneOldRequests();
    return Math.max(0, this.maxRequests - this.requestTimestamps.length);
  }

  private pruneOldRequests(): void {
    const cutoff = Date.now() - this.windowMs;
    this.requestTimestamps = this.requestTimestamps.filter(t => t >= cutoff);
  }
}
export class BackpressureController {
  private queueDepth = 0;

  constructor(
    private readonly maxQueueDepth: number = 100,
    private readonly highWaterMark: number = 80,
    private readonly lowWaterMark: number = 20,
  ) {}

  public shouldAccept(): boolean {
    return this.queueDepth < this.maxQueueDepth;
  }

  public isHighPressure(): boolean {
    return this.queueDepth >= this.highWaterMark;
  }

  public isLowPressure(): boolean {
    return this.queueDepth <= this.lowWaterMark;
  }

  public enqueue(): boolean {
    if (this.queueDepth >= this.maxQueueDepth) {
      logger.warn(`[Backpressure] Queue full: ${this.queueDepth}/${this.maxQueueDepth}`);
      return false;
    }
    this.queueDepth++;
    return true;
  }

  public dequeue(): void {
    if (this.queueDepth > 0) {
      this.queueDepth--;
    }
  }

  public getDepth(): number {
    return this.queueDepth;
  }

  public reset(): void {
    this.queueDepth = 0;
  }
}

export class CacheRecoveryManager {
  private static entries: Map<string, { data: unknown; createdAt: number; ttlMs: number }> = new Map();
  private static readonly DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

  public static set(key: string, data: unknown, ttlMs: number = this.DEFAULT_TTL_MS): void {
    this.entries.set(key, {
      data,
      createdAt: Date.now(),
      ttlMs,
    });
  }

  public static get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) { return null; }

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.entries.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public static evictStale(): number {
    let evicted = 0;
    const now = Date.now();

    this.entries.forEach((entry, key) => {
      if (now - entry.createdAt > entry.ttlMs) {
        this.entries.delete(key);
        evicted++;
      }
    });

    if (evicted > 0) {
      logger.debug(`[CacheRecovery] Evicted ${evicted} stale entries`);
    }

    return evicted;
  }

  public static getSize(): number {
    return this.entries.size;
  }

  public static clear(): void {
    this.entries.clear();
  }
}

export class GracefulDegradationManager {
  private static mode: 'normal' | 'degraded' | 'offline' = 'normal';
  private static disabledFeatures: Set<string> = new Set();

  public static setMode(mode: 'normal' | 'degraded' | 'offline'): void {
    const previousMode = this.mode;
    this.mode = mode;

    this.disabledFeatures.clear();

    if (mode === 'offline') {
      this.disabledFeatures.add('real_time_prices');
      this.disabledFeatures.add('swap_execution');
      this.disabledFeatures.add('transaction_broadcast');
      this.disabledFeatures.add('ai_chat');
    } else if (mode === 'degraded') {
      this.disabledFeatures.add('real_time_prices');
      this.disabledFeatures.add('ai_chat');
    }

    if (previousMode !== mode) {
      logger.info(`[GracefulDegradation] Mode changed: ${previousMode} -> ${mode}`);
    }
  }

  public static getMode(): string {
    return this.mode;
  }

  public static isFeatureAvailable(feature: string): boolean {
    return !this.disabledFeatures.has(feature);
  }

  public static getDisabledFeatures(): string[] {
    return Array.from(this.disabledFeatures);
  }
}
export const hardeningEngine = {
  CircuitBreaker: RpcCircuitBreaker,
  Failover: RpcFailoverManager,
  Timeout: TimeoutPolicy,
  Retry: RetryBudget,
  RequestBudget,
  Backpressure: BackpressureController,
  Cache: CacheRecoveryManager,
  Degradation: GracefulDegradationManager,
};
