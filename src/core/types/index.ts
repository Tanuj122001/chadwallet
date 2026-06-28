/**
 * Shared Type Definitions for ChadWallet Core Architecture
 */

// Opaque Branding Helpers to prevent parameter swapping bugs
export type Opaque<K, T> = T & { readonly __brand: K };

export type WalletAddress = Opaque<'WalletAddress', string>;
export type PublicKey = Opaque<'PublicKey', string>;
export type TokenSymbol = Opaque<'TokenSymbol', string>;
export type USDValue = Opaque<'USDValue', number>;
export type Percentage = Opaque<'Percentage', number>;

// Standard API Response Structure
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// Paginated API Response Structure
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
}

// UI State Handling states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Custom Type for Networking Errors
export interface NetworkError {
  code: string;
  message: string;
  statusCode?: number;
  details?: unknown;
}
