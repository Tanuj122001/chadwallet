import { AuthDTO, SessionDTO } from './dtos';
import { logger } from '../../utils/logger';
import { ApiError } from '../errors';

export interface IFirebaseAuthClient {
  signUpWithEmail(email: string, password: string): Promise<AuthDTO>;
  signInWithEmail(email: string, password: string): Promise<AuthDTO>;
  forgotPassword(email: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<AuthDTO>;
  signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }>;
  confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthDTO>;
  refreshSession(refreshToken: string): Promise<SessionDTO>;
  signOut(): Promise<void>;
}

class FirebaseAuthClient implements IFirebaseAuthClient {
  
  public async signUpWithEmail(email: string, _password: string): Promise<AuthDTO> {
    logger.info(`[FirebaseAuthClient] Registering user with email: ${email}`);
    
    // Simulate network latency
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));

    if (email.includes('error')) {
      throw new ApiError('AUTH_EMAIL_TAKEN', 'The email address is already in use by another account.', 400);
    }

    const userId = 'usr_' + Math.random().toString(36).substr(2, 9);
    return this.createMockAuthPayload(userId, email);
  }

  public async signInWithEmail(email: string, password: string): Promise<AuthDTO> {
    logger.info(`[FirebaseAuthClient] Sign in user with email: ${email}`);
    
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));

    if (password === 'wrong') {
      throw new ApiError('AUTH_WRONG_PASSWORD', 'Invalid password provided.', 401);
    }
    if (email.includes('unknown')) {
      throw new ApiError('AUTH_USER_NOT_FOUND', 'There is no user record corresponding to this identifier.', 404);
    }

    const userId = 'usr_chad_1337';
    return this.createMockAuthPayload(userId, email);
  }

  public async forgotPassword(email: string): Promise<void> {
    logger.info(`[FirebaseAuthClient] Trigger password reset for: ${email}`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
    if (email.includes('invalid')) {
      throw new ApiError('AUTH_INVALID_EMAIL', 'The email address is badly formatted.', 400);
    }
  }

  public async signInWithGoogle(idToken: string): Promise<AuthDTO> {
    logger.info(`[FirebaseAuthClient] Sign in with Google token: ${idToken.substring(0, 10)}...`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    return this.createMockAuthPayload('usr_google_chad', 'google-chad@chadwallet.xyz');
  }

  public async signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }> {
    logger.info(`[FirebaseAuthClient] Request phone verification OTP for: ${phoneNumber}`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));
    if (phoneNumber.includes('12345')) {
      throw new ApiError('AUTH_INVALID_PHONE_NUMBER', 'The phone number provided is invalid.', 400);
    }
    return { confirmationId: 'conf_' + Math.random().toString(36).substr(2, 9) };
  }

  public async confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthDTO> {
    logger.info(`[FirebaseAuthClient] Confirming OTP code ${code} for confirmationId: ${confirmationId}`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
    
    if (code === '000000') {
      throw new ApiError('AUTH_INVALID_VERIFICATION_CODE', 'The verification code provided is invalid.', 401);
    }

    return this.createMockAuthPayload('usr_phone_chad', 'phone-chad@chadwallet.xyz');
  }

  public async refreshSession(refreshToken: string): Promise<SessionDTO> {
    logger.info(`[FirebaseAuthClient] Refresh session using token: ${refreshToken.substring(0, 10)}...`);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 600));

    if (refreshToken.includes('expired')) {
      throw new ApiError('AUTH_REFRESH_TOKEN_EXPIRED', 'The user session token has expired.', 401);
    }

    return {
      access_token: 'access_tok_' + Math.random().toString(36).substr(2, 12),
      refresh_token: refreshToken,
      user_id: 'usr_chad_1337',
      expires_at: Date.now() + 3600 * 1000, // 1 hour validity
    };
  }

  public async signOut(): Promise<void> {
    logger.info('[FirebaseAuthClient] Logging out user from Firebase session.');
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
  }

  private createMockAuthPayload(userId: string, email: string): AuthDTO {
    return {
      user: {
        id: userId,
        email,
        wallet_address: 'Chad11111111111111111111111111111111111111112',
        created_at: Date.now() - 24 * 3600 * 1000,
      },
      session: {
        access_token: 'access_tok_' + Math.random().toString(36).substr(2, 12),
        refresh_token: 'refresh_tok_' + Math.random().toString(36).substr(2, 12),
        user_id: userId,
        expires_at: Date.now() + 3600 * 1000, // 1 hour expiry
        metadata: {
          device: 'React Native Client',
          platform: 'OS_API_READY',
        },
      },
    };
  }
}

export const firebaseAuthClient: IFirebaseAuthClient = new FirebaseAuthClient();
export default firebaseAuthClient;
