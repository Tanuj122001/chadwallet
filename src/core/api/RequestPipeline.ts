import { InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios';
import { tokenManager } from '../storage';
import { logger } from '../../utils/logger';

// Extends Axios Config to support in-flight cancel controls
export interface PipelineConfig extends InternalAxiosRequestConfig {
  idempotency?: boolean;
  cancelDuplicate?: boolean;
  requestId?: string;
  correlationId?: string;
}

class RequestPipelineManager {
  private inFlightRequests = new Map<string, AbortController>();

  // Generates unique request correlation identifiers
  public generateUUID(): string {
    return Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  }

  // 1. Correlation ID generation & Request tracing middleware
  public applyTracing(config: PipelineConfig): void {
    const requestId = this.generateUUID();
    const correlationId = config.correlationId || this.generateUUID();
    
    config.requestId = requestId;
    config.correlationId = correlationId;

    config.headers.set('x-request-id', requestId);
    config.headers.set('x-correlation-id', correlationId);
  }

  // 2. Idempotency Key injection middleware for writes (POST, PUT, DELETE)
  public applyIdempotency(config: PipelineConfig): void {
    const isWriteMethod = ['post', 'put', 'delete'].includes(config.method?.toLowerCase() || '');
    if (isWriteMethod && config.idempotency !== false) {
      const idempotencyKey = 'idem-' + this.generateUUID();
      config.headers.set('x-idempotency-key', idempotencyKey);
      logger.debug(`[RequestPipeline] Attached Idempotency Key: ${idempotencyKey}`);
    }
  }

  // 3. Duplicate Request Prevention & Automatic Cancellation middleware
  public applyDuplicatePrevention(config: PipelineConfig): void {
    if (config.cancelDuplicate === false) return;

    // Create unique signature hash of request
    const requestKey = `${config.method?.toUpperCase()}:${config.url}:${JSON.stringify(config.data || '')}`;
    
    // If a duplicate is already in flight, abort it and start the new one
    const activeController = this.inFlightRequests.get(requestKey);
    if (activeController) {
      logger.warn(`[RequestPipeline] Duplicate request detected. Aborting previous in-flight call: ${config.url}`);
      activeController.abort();
      this.inFlightRequests.delete(requestKey);
    }

    // Set new abort controller
    const controller = new AbortController();
    config.signal = controller.signal;
    this.inFlightRequests.set(requestKey, controller);
  }

  // Clears the request key from tracking map once resolved
  public clearInFlight(config: AxiosRequestConfig): void {
    const requestKey = `${config.method?.toUpperCase()}:${config.url}:${JSON.stringify(config.data || '')}`;
    this.inFlightRequests.delete(requestKey);
  }

  // 4. Authentication Middleware: injects bearer JWT tokens
  public async applyAuthentication(config: PipelineConfig): Promise<void> {
    const token = await tokenManager.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Combines all request middleware pipelines sequentially
  public async processRequest(config: PipelineConfig): Promise<InternalAxiosRequestConfig> {
    this.applyTracing(config);
    this.applyIdempotency(config);
    this.applyDuplicatePrevention(config);
    await this.applyAuthentication(config);
    return config;
  }
}

export const requestPipelineManager = new RequestPipelineManager();
export default requestPipelineManager;
