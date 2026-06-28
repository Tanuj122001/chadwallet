import { AxiosResponse } from 'axios';
import { ApiResponse, ApiError, MetadataResponse } from './contracts';
import { ValidationError, ApiError as CustomApiError } from '../errors';
import { logger } from '../../utils/logger';

class ResponsePipelineManager {

  // Global Response Normalizer: Wraps Axios success payloads with request meta
  public normalizeResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    const durationMsStr = response.headers['x-response-time'];
    const durationMs = durationMsStr ? Number(durationMsStr) : undefined;
    
    const metadata: MetadataResponse = {
      apiVersion: response.headers['x-api-version'] || '1.0.0',
      timestamp: Date.now(),
      requestId: response.headers['x-request-id'] || 'req-unknown',
      durationMs,
    };

    return {
      data: response.data,
      status: response.status,
      message: response.statusText,
      metadata,
    };
  }

  // Parse success response payloads
  public parseSuccess<T>(response: ApiResponse<T>): T {
    return response.data;
  }

  // Parser to extract field constraints during HTTP 422 or validation failures
  public parseValidationError(errorResponse: any): ValidationError {
    const errorDetails = errorResponse?.data?.errors || {};
    const fields: Record<string, string> = {};

    Object.entries(errorDetails).forEach(([key, value]) => {
      fields[key] = typeof value === 'string' ? value : JSON.stringify(value);
    });

    logger.warn('[ResponsePipeline] Parsed validation error details', fields);
    return new ValidationError('VALIDATION_FAILED', 'Input validation constraints failed.', fields);
  }

  // Maps Axios error objects to typed Custom Errors
  public parseError(error: any): Error {
    if (!error.response) {
      // Server is unreachable, trigger standard network fallback
      return error;
    }

    const response = error.response;
    const status = response.status;
    const data = response.data;

    // Handle HTTP 422 Validation
    if (status === 422) {
      return this.parseValidationError(response);
    }

    const msg = data?.error?.message || data?.message || 'API Request failed';
    const code = data?.error?.code || `API_ERROR_${status}`;

    return new CustomApiError(code, msg, status, data);
  }

  // Unknown Response Handler: Safe fallback parser for unexpected layouts (e.g. HTML 502 Nginx errors)
  public handleUnknownResponse(payload: unknown): unknown {
    if (typeof payload === 'string' && payload.trim().startsWith('<!DOCTYPE html>')) {
      logger.error('[ResponsePipeline] HTML error page returned instead of JSON JSON-RPC payload.');
      return {
        code: 'BAD_GATEWAY',
        message: 'The server returned an invalid HTML gateway response.',
      };
    }
    return payload;
  }
}

export const responsePipelineManager = new ResponsePipelineManager();
export default responsePipelineManager;
