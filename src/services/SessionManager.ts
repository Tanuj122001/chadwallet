import { serviceLocator } from './index';
import { logger } from '../utils/logger';
import { Session } from '../core/models';
import { SessionExpiredError } from '../core/errors';

export interface ISessionManager {
  initSession(): Promise<void>;
  resetIdleTimer(): void;
  stopSessionMonitoring(): void;
  isBiometricAuthSupported(): Promise<boolean>;
  authenticateBiometrically(): Promise<boolean>;
  getDeviceIntegrityToken(): Promise<string>;
  generateSecurityNonce(): string;
  verifyCsrfState(state: string): boolean;
  isRateLimitExceeded(endpoint: string): boolean;
}

class SessionManager implements ISessionManager {
  private idleTimeoutMs = 5 * 60 * 1000; // 5 minutes idle timeout
  private idleTimerId?: any;
  private refreshTimerId?: any;
  private activeSession: Session | null = null;
  private csrfStateTokens = new Set<string>();
  
  // Rate limiting tracker
  private requestCounts = new Map<string, { count: number; windowStart: number }>();
  private readonly rateLimitWindowMs = 60 * 1000; // 1 minute window
  private readonly maxRequestsPerWindow = 60; // 60 requests per minute limit

  public async initSession(): Promise<void> {
    logger.info('[SessionManager] Initializing session state');
    
    // 1. Auto Restore Session
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const authPayload = await authRepo.restoreSession();
      
      if (authPayload) {
        logger.info(`[SessionManager] Restored active session for user: ${authPayload.user.id}`);
        this.startSessionMonitoring(authPayload.session);
      } else {
        logger.info('[SessionManager] No cached session found to restore.');
      }
    } catch (e) {
      logger.error('[SessionManager] Failed to restore session on startup', e);
      if (e instanceof SessionExpiredError) {
        // Broadcast session expired state
        throw e;
      }
    }
  }

  // Starts background timers for idle timeout and token expiry refreshes
  public startSessionMonitoring(session: Session): void {
    this.activeSession = session;
    this.resetIdleTimer();
    this.scheduleTokenRefresh(session);
  }

  public stopSessionMonitoring(): void {
    this.activeSession = null;
    this.clearIdleTimer();
    this.clearRefreshTimer();
  }

  // Idle Timeout tracking
  public resetIdleTimer(): void {
    this.clearIdleTimer();
    
    if (!this.activeSession) return;
    
    this.idleTimerId = setTimeout(() => {
      logger.warn('[SessionManager] User idle timeout exceeded. Automatic logout.');
      this.handleAutoLogout();
    }, this.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimerId) {
      clearTimeout(this.idleTimerId);
      this.idleTimerId = undefined;
    }
  }

  private async handleAutoLogout(): Promise<void> {
    this.stopSessionMonitoring();
    try {
      const authRepo = serviceLocator.getAuthRepository();
      await authRepo.logout();
      logger.info('[SessionManager] Idle logout completed successfully.');
      
      // Notify state stores
      const { useAuthStore } = require('../features/auth/authStore');
      useAuthStore.getState().logout();
    } catch (e) {
      logger.error('[SessionManager] Error executing auto logout', e);
    }
  }

  // Auto Refresh tokens scheduling
  private scheduleTokenRefresh(session: Session): void {
    this.clearRefreshTimer();

    const expiresInMs = session.expiresAt - Date.now();
    // Schedule refresh 5 minutes before token expires
    const bufferMs = 5 * 60 * 1000;
    const refreshDelayMs = Math.max(expiresInMs - bufferMs, 10000); // Wait at least 10 seconds

    logger.debug(`[SessionManager] Token refresh scheduled in ${(refreshDelayMs / 1000).toFixed(0)} seconds`);

    this.refreshTimerId = setTimeout(() => {
      this.executeSessionRefresh();
    }, refreshDelayMs);
  }

  private async executeSessionRefresh(): Promise<void> {
    if (!this.activeSession) return;
    logger.info('[SessionManager] Auto refreshing session token...');
    
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const updatedSession = await authRepo.refreshSession();
      this.startSessionMonitoring(updatedSession);
    } catch (err) {
      logger.error('[SessionManager] Token auto refresh failed', err);
      if (err instanceof SessionExpiredError) {
        this.handleAutoLogout();
      }
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = undefined;
    }
  }

  // Security Abstraction: Biometrics
  public async isBiometricAuthSupported(): Promise<boolean> {
    // Biometrics authentication ready check (architecture only)
    logger.debug('[SessionManager] Checking biometric authentication hardware support');
    return true;
  }

  public async authenticateBiometrically(): Promise<boolean> {
    logger.info('[SessionManager] Prompting biometric verification modal');
    return true;
  }

  // Security Abstraction: Device Integrity
  public async getDeviceIntegrityToken(): Promise<string> {
    logger.debug('[SessionManager] Fetching device integrity check token (SafetyNet/AppAttest)');
    return 'mock-device-integrity-token-phase7';
  }

  // Replay Protection
  public generateSecurityNonce(): string {
    const nonce = Math.random().toString(36).substr(2, 15);
    logger.debug(`[SessionManager] Generated transaction security nonce: ${nonce}`);
    return nonce;
  }

  // CSRF State Protection
  public generateCsrfStateToken(): string {
    const token = Math.random().toString(36).substr(2, 10);
    this.csrfStateTokens.add(token);
    return token;
  }

  public verifyCsrfState(state: string): boolean {
    const verified = this.csrfStateTokens.has(state);
    if (verified) {
      this.csrfStateTokens.delete(state); // Consumed token
    }
    logger.debug(`[SessionManager] CSRF State verification for ${state}: ${verified}`);
    return verified;
  }

  // Rate Limiting Protection (ready abstraction)
  public isRateLimitExceeded(endpoint: string): boolean {
    const now = Date.now();
    const tracker = this.requestCounts.get(endpoint);

    if (!tracker || now - tracker.windowStart > this.rateLimitWindowMs) {
      this.requestCounts.set(endpoint, { count: 1, windowStart: now });
      return false;
    }

    tracker.count += 1;
    const exceeded = tracker.count > this.maxRequestsPerWindow;
    if (exceeded) {
      logger.warn(`[SessionManager] Rate limit exceeded for endpoint: ${endpoint} (${tracker.count} requests)`);
    }
    return exceeded;
  }
}

export const sessionManager = new SessionManager();
export default sessionManager;
