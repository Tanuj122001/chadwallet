import { secureStorage, tokenManager } from '../../core/storage';
import { UserDTO, SessionDTO } from '../../core/api/dtos';
import { logger } from '../../utils/logger';

export interface IAuthLocalDataSource {
  saveSession(session: SessionDTO): Promise<void>;
  getSession(): Promise<SessionDTO | null>;
  clearSession(): Promise<void>;
  saveUser(user: UserDTO): Promise<void>;
  getUser(): Promise<UserDTO | null>;
  clearUser(): Promise<void>;
}

export class AuthLocalDataSourceImpl implements IAuthLocalDataSource {
  private readonly EXPIRES_AT_KEY = 'auth_session_expires_at';
  private readonly USER_ID_KEY = 'auth_session_user_id';
  private readonly METADATA_KEY = 'auth_session_metadata';
  private readonly CACHED_USER_KEY = 'auth_cached_user';

  public async saveSession(session: SessionDTO): Promise<void> {
    logger.debug('[AuthLocalDataSource] Storing secure session credentials');
    
    // Save raw tokens securely inside TokenManager
    await tokenManager.saveTokens(session.access_token, session.refresh_token);
    
    // Store metadata attributes in secure storage
    await secureStorage.setItem(this.USER_ID_KEY, session.user_id);
    await secureStorage.setItem(this.EXPIRES_AT_KEY, String(session.expires_at));
    if (session.metadata) {
      await secureStorage.setItem(this.METADATA_KEY, JSON.stringify(session.metadata));
    } else {
      await secureStorage.removeItem(this.METADATA_KEY);
    }
  }

  public async getSession(): Promise<SessionDTO | null> {
    logger.debug('[AuthLocalDataSource] Restoring session from secure storage');
    
    const accessToken = await tokenManager.getAccessToken();
    const refreshToken = await tokenManager.getRefreshToken();
    const userId = await secureStorage.getItem(this.USER_ID_KEY);
    const expiresAtStr = await secureStorage.getItem(this.EXPIRES_AT_KEY);
    
    if (!accessToken || !refreshToken || !userId || !expiresAtStr) {
      return null;
    }

    const metadataStr = await secureStorage.getItem(this.METADATA_KEY);
    let metadata: Record<string, unknown> | undefined;
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {}
    }

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user_id: userId,
      expires_at: Number(expiresAtStr),
      metadata,
    };
  }

  public async clearSession(): Promise<void> {
    logger.debug('[AuthLocalDataSource] Clearing secure credentials');
    await tokenManager.clearTokens();
    await secureStorage.removeItem(this.USER_ID_KEY);
    await secureStorage.removeItem(this.EXPIRES_AT_KEY);
    await secureStorage.removeItem(this.METADATA_KEY);
  }

  public async saveUser(user: UserDTO): Promise<void> {
    await secureStorage.setItem(this.CACHED_USER_KEY, JSON.stringify(user));
  }

  public async getUser(): Promise<UserDTO | null> {
    const val = await secureStorage.getItem(this.CACHED_USER_KEY);
    return val ? JSON.parse(val) : null;
  }

  public async clearUser(): Promise<void> {
    await secureStorage.removeItem(this.CACHED_USER_KEY);
  }
}
