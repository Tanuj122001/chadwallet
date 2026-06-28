/**
 * Strongly Typed API Contracts for ChadWallet Enterprise Communication
 */

export interface ApiRequest<T = unknown> {
  payload: T;
  headers: Record<string, string>;
  timestamp: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
  metadata?: MetadataResponse;
}

export interface ApiSuccess<T = unknown> extends ApiResponse<T> {
  status: number; // 2xx HTTP status
}

export interface ApiError {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
  correlationId?: string;
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
  nextCursor?: string;
}

export interface ErrorResponse {
  error: ApiError;
  timestamp: number;
  path: string;
}

export interface MetadataResponse {
  apiVersion: string;
  timestamp: number;
  requestId: string;
  durationMs?: number;
}

export interface VersionedResponse<T = unknown> {
  version: string;
  data: T;
}
