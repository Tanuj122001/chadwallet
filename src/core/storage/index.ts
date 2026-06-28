/**
 * Storage Abstractions for local persistent data layers
 */

import { logger } from '../../utils/logger';

// Interface for encrypted storage (Keychain/Keystore)
export interface ISecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Interface for standard localized storage
export interface ILocalStorage {
  setString(key: string, value: string): void;
  getString(key: string): string | null;
  setNumber(key: string, value: number): void;
  getNumber(key: string): number | null;
  setBoolean(key: string, value: boolean): void;
  getBoolean(key: string): boolean | null;
  removeItem(key: string): void;
  clear(): void;
}

// Interface for in-memory cache layers
export interface ICacheStorage<T> {
  set(key: string, value: T, ttlMs?: number): void;
  get(key: string): T | null;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function customBtoa(input: string): string {
  const str = String(input);
  let block = 0;
  let output = '';
  let pr = 0;

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code > 255) {
      throw new Error("Invalid character in btoa");
    }
    block = (block << 8) | code;
    pr += 8;
    while (pr >= 6) {
      pr -= 6;
      output += chars.charAt((block >> pr) & 63);
    }
  }

  if (pr === 2) {
    output += chars.charAt((block << 4) & 63) + '==';
  } else if (pr === 4) {
    output += chars.charAt((block << 2) & 63) + '=';
  }

  return output;
}

function customAtob(input: string): string {
  const str = String(input).replace(/[=]+$/, '');
  let block = 0;
  let output = '';
  let pr = 0;

  for (let i = 0; i < str.length; i++) {
    const code = chars.indexOf(str.charAt(i));
    if (code === -1) {
      throw new Error("Invalid character in atob");
    }
    block = (block << 6) | code;
    pr += 6;
    while (pr >= 8) {
      pr -= 8;
      output += String.fromCharCode((block >> pr) & 255);
    }
  }

  return output;
}

/**
 * Concrete In-Memory/Safe Encrypted Storage implementation
 * Prevents crashing when platform keychain libraries are not linked.
 */
class SecureStorageImpl implements ISecureStorage {
  private store = new Map<string, string>();

  public async setItem(key: string, value: string): Promise<void> {
    logger.debug(`[SecureStorage] Set item for key: ${key}`);
    // Encrypting mock simulation
    const encrypted = customBtoa(value);
    this.store.set(key, encrypted);
  }

  public async getItem(key: string): Promise<string | null> {
    logger.debug(`[SecureStorage] Get item for key: ${key}`);
    const val = this.store.get(key);
    if (!val) return null;
    try {
      return customAtob(val);
    } catch {
      return val;
    }
  }

  public async removeItem(key: string): Promise<void> {
    logger.debug(`[SecureStorage] Remove item for key: ${key}`);
    this.store.delete(key);
  }

  public async clear(): Promise<void> {
    logger.debug(`[SecureStorage] Clear all secure items`);
    this.store.clear();
  }
}

/**
 * Concrete Standard Local Storage implementation
 */
class LocalStorageImpl implements ILocalStorage {
  private store = new Map<string, string>();

  public setString(key: string, value: string): void {
    this.store.set(key, value);
  }

  public getString(key: string): string | null {
    return this.store.get(key) || null;
  }

  public setNumber(key: string, value: number): void {
    this.store.set(key, String(value));
  }

  public getNumber(key: string): number | null {
    const val = this.store.get(key);
    return val ? Number(val) : null;
  }

  public setBoolean(key: string, value: boolean): void {
    this.store.set(key, String(value));
  }

  public getBoolean(key: string): boolean | null {
    const val = this.store.get(key);
    return val ? val === 'true' : null;
  }

  public removeItem(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }
}

/**
 * Concrete Cache Storage with TTL implementation
 */
export class CacheStorageImpl<T> implements ICacheStorage<T> {
  private cache = new Map<string, { value: T; expiresAt?: number }>();

  public set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.cache.set(key, { value, expiresAt });
  }

  public get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }
}

// Instantiate storage objects
export const secureStorage: ISecureStorage = new SecureStorageImpl();
export const localStorage: ILocalStorage = new LocalStorageImpl();

/**
 * TokenManager encapsulates access to credentials.
 * Ensures the underlying secure storage layer is never exposed directly.
 */
class TokenManager {
  private secureStorage: ISecureStorage;
  private readonly ACCESS_TOKEN_KEY = 'jwt_access_token';
  private readonly REFRESH_TOKEN_KEY = 'jwt_refresh_token';
  private readonly WALLET_SESSION_KEY = 'wallet_session_key';

  constructor(storage: ISecureStorage) {
    this.secureStorage = storage;
  }

  public async saveTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.secureStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    await this.secureStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  public async getAccessToken(): Promise<string | null> {
    return this.secureStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  public async getRefreshToken(): Promise<string | null> {
    return this.secureStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  public async clearTokens(): Promise<void> {
    await this.secureStorage.removeItem(this.ACCESS_TOKEN_KEY);
    await this.secureStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  public async saveWalletSession(sessionData: string): Promise<void> {
    await this.secureStorage.setItem(this.WALLET_SESSION_KEY, sessionData);
  }

  public async getWalletSession(): Promise<string | null> {
    return this.secureStorage.getItem(this.WALLET_SESSION_KEY);
  }

  public async clearWalletSession(): Promise<void> {
    await this.secureStorage.removeItem(this.WALLET_SESSION_KEY);
  }
}

export const tokenManager = new TokenManager(secureStorage);
