import { User, Session } from '../../core/models';

export interface AuthPayload {
  user: User;
  session: Session;
}

export interface IAuthRepository {
  getCurrentUser(): Promise<User | null>;
  signUpWithEmail(email: string, password: string): Promise<AuthPayload>;
  signInWithEmail(email: string, password: string): Promise<AuthPayload>;
  forgotPassword(email: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<AuthPayload>;
  signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }>;
  confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthPayload>;
  refreshSession(): Promise<Session>;
  restoreSession(): Promise<AuthPayload | null>;
  logout(): Promise<void>;
}
