import { IAuthRepository, AuthPayload } from './IAuthRepository';
import { IAuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { IAuthLocalDataSource } from '../datasources/AuthLocalDataSource';
import { User, Session } from '../../core/models';
import { UserMapper, SessionMapper } from '../../core/api/mappers';
import { offlineManager } from '../../core/offline/OfflineManager';
import { logger } from '../../utils/logger';
import {
  AuthenticationError,
  SessionExpiredError,
  InvalidCredentialsError,
  NetworkAuthenticationError,
  UnknownAuthenticationError,
  ApiError,
  NetworkError,
} from '../../core/errors';

export class AuthRepository implements IAuthRepository {
  constructor(
    private remoteDataSource: IAuthRemoteDataSource,
    private localDataSource: IAuthLocalDataSource
  ) {}

  public async getCurrentUser(): Promise<User | null> {
    try {
      const cached = await this.localDataSource.getUser();
      return cached ? UserMapper.toDomain(cached) : null;
    } catch (e) {
      logger.error('[AuthRepository] Failed to get current user from storage', e);
      return null;
    }
  }

  public async signUpWithEmail(email: string, password: string): Promise<AuthPayload> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot register email while offline.');
      }
      const authDTO = await this.remoteDataSource.signUpWithEmail(email, password);
      
      // Persist locally
      await this.localDataSource.saveSession(authDTO.session);
      await this.localDataSource.saveUser(authDTO.user);

      return {
        user: UserMapper.toDomain(authDTO.user),
        session: SessionMapper.toDomain(authDTO.session),
      };
    } catch (error) {
      throw this.handleError(error, 'Sign up failed');
    }
  }

  public async signInWithEmail(email: string, password: string): Promise<AuthPayload> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot sign in while offline.');
      }
      const authDTO = await this.remoteDataSource.signInWithEmail(email, password);
      
      // Persist locally
      await this.localDataSource.saveSession(authDTO.session);
      await this.localDataSource.saveUser(authDTO.user);

      return {
        user: UserMapper.toDomain(authDTO.user),
        session: SessionMapper.toDomain(authDTO.session),
      };
    } catch (error) {
      throw this.handleError(error, 'Sign in failed');
    }
  }

  public async forgotPassword(email: string): Promise<void> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot request password reset while offline.');
      }
      await this.remoteDataSource.forgotPassword(email);
    } catch (error) {
      throw this.handleError(error, 'Password reset request failed');
    }
  }

  public async signInWithGoogle(idToken: string): Promise<AuthPayload> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot authenticate with Google while offline.');
      }
      const authDTO = await this.remoteDataSource.signInWithGoogle(idToken);
      
      await this.localDataSource.saveSession(authDTO.session);
      await this.localDataSource.saveUser(authDTO.user);

      return {
        user: UserMapper.toDomain(authDTO.user),
        session: SessionMapper.toDomain(authDTO.session),
      };
    } catch (error) {
      throw this.handleError(error, 'Google authentication failed');
    }
  }

  public async signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot authenticate phone while offline.');
      }
      return await this.remoteDataSource.signInWithPhone(phoneNumber);
    } catch (error) {
      throw this.handleError(error, 'Phone verification failed');
    }
  }

  public async confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthPayload> {
    try {
      if (offlineManager.isOffline()) {
        throw new NetworkAuthenticationError('Cannot confirm OTP while offline.');
      }
      const authDTO = await this.remoteDataSource.confirmPhoneOTP(confirmationId, code);
      
      await this.localDataSource.saveSession(authDTO.session);
      await this.localDataSource.saveUser(authDTO.user);

      return {
        user: UserMapper.toDomain(authDTO.user),
        session: SessionMapper.toDomain(authDTO.session),
      };
    } catch (error) {
      throw this.handleError(error, 'OTP confirmation failed');
    }
  }

  public async refreshSession(): Promise<Session> {
    try {
      const currentSession = await this.localDataSource.getSession();
      if (!currentSession) {
        throw new SessionExpiredError('No active local session found for refresh.');
      }

      if (offlineManager.isOffline()) {
        logger.warn('[AuthRepository] Offline. Serving active local session cache.');
        return SessionMapper.toDomain(currentSession);
      }

      const refreshedSessionDTO = await this.remoteDataSource.refreshSession(currentSession.refresh_token);
      
      // Update session local persistence
      const updatedSession = {
        ...currentSession,
        access_token: refreshedSessionDTO.access_token,
        refresh_token: refreshedSessionDTO.refresh_token,
        expires_at: refreshedSessionDTO.expires_at,
      };

      await this.localDataSource.saveSession(updatedSession);
      return SessionMapper.toDomain(updatedSession);
    } catch (error) {
      // If refresh token expires or is rejected, clear local session
      if (error instanceof ApiError && (error.code === 'AUTH_REFRESH_TOKEN_EXPIRED' || error.statusCode === 401)) {
        await this.logout();
        throw new SessionExpiredError('Session token expired. Please log in again.', error);
      }
      throw this.handleError(error, 'Session refresh failed');
    }
  }

  public async restoreSession(): Promise<AuthPayload | null> {
    try {
      const sessionDTO = await this.localDataSource.getSession();
      const userDTO = await this.localDataSource.getUser();
      
      if (!sessionDTO || !userDTO) {
        return null;
      }

      const session = SessionMapper.toDomain(sessionDTO);
      const user = UserMapper.toDomain(userDTO);

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        logger.warn('[AuthRepository] Restored session has expired. Attempting refresh...');
        try {
          const refreshedSession = await this.refreshSession();
          return { user, session: refreshedSession };
        } catch (refreshErr) {
          logger.error('[AuthRepository] Auto refresh failed during restore', refreshErr);
          await this.logout();
          throw new SessionExpiredError('Restored session expired.', refreshErr);
        }
      }

      return { user, session };
    } catch (e) {
      logger.error('[AuthRepository] Failed to restore session', e);
      if (e instanceof SessionExpiredError) {
        throw e;
      }
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      if (!offlineManager.isOffline()) {
        try {
          await this.remoteDataSource.signOut();
        } catch (err) {
          logger.warn('[AuthRepository] Failed remote signOut during logout', err);
        }
      }
    } finally {
      // Always guarantee clearing local storage session
      await this.localDataSource.clearSession();
      await this.localDataSource.clearUser();
    }
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    logger.error(`[AuthRepository] Error occurred: ${defaultMessage}`, error);
    
    if (error instanceof ApiError) {
      if (error.code === 'AUTH_WRONG_PASSWORD' || error.code === 'AUTH_USER_NOT_FOUND' || error.code === 'AUTH_INVALID_CREDENTIALS') {
        return new InvalidCredentialsError(error.message, error);
      }
      if (error.code === 'AUTH_EMAIL_TAKEN') {
        return new AuthenticationError('EMAIL_TAKEN', error.message, error);
      }
      return new AuthenticationError(error.code, error.message, error);
    }

    if (error instanceof NetworkError) {
      return new NetworkAuthenticationError('Network connection failed. Please try again.', error);
    }

    if (error instanceof AuthenticationError) {
      return error;
    }

    return new UnknownAuthenticationError(`${defaultMessage}. Please try again later.`, error);
  }
}
