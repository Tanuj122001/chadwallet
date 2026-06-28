import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { envLoader } from '../../config/envLoader';
import { logger } from '../../utils/logger';
import { ApiResponse } from './contracts';
import { requestPipelineManager } from './RequestPipeline';
import { responsePipelineManager } from './ResponsePipeline';
import { observabilityTracker } from './Observability';

// Config structure for API requests including custom retry params
export interface ApiRequestConfig extends AxiosRequestConfig {
  _retryCount?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  idempotency?: boolean;
  cancelDuplicate?: boolean;
  correlationId?: string;
}

export class ApiClient {
  private instance: AxiosInstance;
  private defaultMaxRetries = 3;
  private defaultRetryDelayMs = 1000;

  constructor(baseURL: string, timeoutMs: number = 10000) {
    this.instance = axios.create({
      baseURL,
      timeout: timeoutMs,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        logger.debug(`[ApiClient] Request Interceptor: ${config.method?.toUpperCase()} ${config.url}`);
        return requestPipelineManager.processRequest(config as any) as any;
      },
      (error) => {
        logger.error('[ApiClient] Request Interceptor Error', error);
        return Promise.reject(responsePipelineManager.parseError(error));
      }
    );

    // Response Interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug(`[ApiClient] Response Interceptor: Status ${response.status}`);
        requestPipelineManager.clearInFlight(response.config);
        
        const normalized = responsePipelineManager.normalizeResponse(response);
        const duration = normalized.metadata?.durationMs || 0;
        const method = response.config.method || 'GET';
        
        // Log telemetry
        observabilityTracker.logApiRequest(method, response.config.url || '', response.status, duration);
        return normalized as any;
      },
      async (error) => {
        logger.error('[ApiClient] Response Interceptor Error', error);
        if (error.config) {
          requestPipelineManager.clearInFlight(error.config);
        }
        
        const config = error.config as ApiRequestConfig;
        
        // Handle Automatic Retry
        if (config && this.isRetryable(error)) {
          config._retryCount = config._retryCount ?? 0;
          const maxRetries = config.maxRetries ?? this.defaultMaxRetries;
          
          if (config._retryCount < maxRetries) {
            config._retryCount += 1;
            const delay = (config.retryDelayMs ?? this.defaultRetryDelayMs) * Math.pow(2, config._retryCount - 1);
            
            logger.warn(`[ApiClient] Retrying request in ${delay}ms (${config._retryCount}/${maxRetries}): ${config.url}`);
            await new Promise<void>((resolve) => setTimeout(() => resolve(), delay));
            return this.instance(config as InternalAxiosRequestConfig);
          }
        }

        return Promise.reject(responsePipelineManager.parseError(error));
      }
    );
  }

  // Determine if error is retryable (Network errors or Server/5xx errors)
  private isRetryable(error: any): boolean {
    if (!error.response) {
      // Network failure or timeout
      return true;
    }
    const status = error.response.status;
    // Retry on HTTP 500, 502, 503, 504
    return status >= 500 && status <= 504;
  }

  // Standard REST request helper functions
  public async get<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get<any, ApiResponse<T>>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post<any, ApiResponse<T>>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put<any, ApiResponse<T>>(url, data, config);
  }

  public async delete<T>(url: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete<any, ApiResponse<T>>(url, config);
  }
}

// Global Api Client instances for Birdeye, Jupiter etc.
export const birdeyeApiClient = new ApiClient(envLoader.get('BIRDEYE_API_URL'));
export const jupiterApiClient = new ApiClient(envLoader.get('JUPITER_API_URL'));
export const supabaseApiClient = new ApiClient(envLoader.get('SUPABASE_URL'));
export const solanaRpcApiClient = new ApiClient(envLoader.get('SOLANA_RPC_URL'));
export const authApiClient = new ApiClient(envLoader.get('SUPABASE_URL'));
