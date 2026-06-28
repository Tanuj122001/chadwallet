import { logger } from '../../utils/logger';

export interface PerformanceMetric {
  operationName: string;
  durationMs: number;
  timestamp: number;
}

export interface CrashContext {
  userId?: string;
  lastAction?: string;
  activeScreen?: string;
  osVersion: string;
  appVersion: string;
  networkType?: string;
  metadata?: Record<string, unknown>;
}

class ObservabilityTracker {
  private metrics: PerformanceMetric[] = [];
  private currentContext: CrashContext = {
    osVersion: 'Android API Ready',
    appVersion: '1.0.0',
  };

  // 1. Latency Monitor / Performance Tracker
  public startTimer(operationName: string): () => void {
    const startTime = Date.now();
    logger.debug(`[Observability] Started performance timer: ${operationName}`);
    
    return () => {
      const durationMs = Date.now() - startTime;
      const metric: PerformanceMetric = {
        operationName,
        durationMs,
        timestamp: Date.now(),
      };
      
      this.metrics.push(metric);
      logger.info(`[Observability] Timer [${operationName}] completed in ${durationMs}ms`);
      
      // Prune metrics cache if exceeds 1000 items
      if (this.metrics.length > 1000) {
        this.metrics.shift();
      }
    };
  }

  // 2. Request Logger
  public logApiRequest(method: string, url: string, status: number, durationMs: number): void {
    logger.info(`[Observability] HTTP Request: ${method.toUpperCase()} ${url} | Status: ${status} | Latency: ${durationMs}ms`);
  }

  // 3. Crash Context Provider
  public setContext(context: Partial<CrashContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
    logger.debug('[Observability] Crash context updated.', this.currentContext);
  }

  public getCrashContext(error: Error): string {
    const errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
    
    return JSON.stringify({
      error: errorDetails,
      context: this.currentContext,
      timestamp: Date.now(),
    });
  }

  // 4. API Metrics aggregator
  public getAverageLatency(operationName: string): number {
    const filtered = this.metrics.filter(m => m.operationName === operationName);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.durationMs, 0);
    return sum / filtered.length;
  }

  public getMetricsSummary(): Record<string, { count: number; avgDurationMs: number }> {
    const summary: Record<string, { count: number; sumDurationMs: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.operationName]) {
        summary[metric.operationName] = { count: 0, sumDurationMs: 0 };
      }
      summary[metric.operationName].count += 1;
      summary[metric.operationName].sumDurationMs += metric.durationMs;
    });

    const result: Record<string, { count: number; avgDurationMs: number }> = {};
    Object.entries(summary).forEach(([name, val]) => {
      result[name] = {
        count: val.count,
        avgDurationMs: val.sumDurationMs / val.count,
      };
    });

    return result;
  }
}

export const observabilityTracker = new ObservabilityTracker();
export default observabilityTracker;
