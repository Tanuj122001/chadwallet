import { firebaseAuthClient, IFirebaseAuthClient } from '../../core/api/FirebaseAuthClient';
import { AuthDTO, SessionDTO } from '../../core/api/dtos';

export interface IAuthRemoteDataSource {
  signUpWithEmail(email: string, password: string): Promise<AuthDTO>;
  signInWithEmail(email: string, password: string): Promise<AuthDTO>;
  forgotPassword(email: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<AuthDTO>;
  signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }>;
  confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthDTO>;
  refreshSession(refreshToken: string): Promise<SessionDTO>;
  signOut(): Promise<void>;
}

export class AuthRemoteDataSourceImpl implements IAuthRemoteDataSource {
  private client: IFirebaseAuthClient;

  constructor(client: IFirebaseAuthClient = firebaseAuthClient) {
    this.client = client;
  }

  public async signUpWithEmail(email: string, password: string): Promise<AuthDTO> {
    return this.client.signUpWithEmail(email, password);
  }

  public async signInWithEmail(email: string, password: string): Promise<AuthDTO> {
    return this.client.signInWithEmail(email, password);
  }

  public async forgotPassword(email: string): Promise<void> {
    return this.client.forgotPassword(email);
  }

  public async signInWithGoogle(idToken: string): Promise<AuthDTO> {
    return this.client.signInWithGoogle(idToken);
  }

  public async signInWithPhone(phoneNumber: string): Promise<{ confirmationId: string }> {
    return this.client.signInWithPhone(phoneNumber);
  }

  public async confirmPhoneOTP(confirmationId: string, code: string): Promise<AuthDTO> {
    return this.client.confirmPhoneOTP(confirmationId, code);
  }

  public async refreshSession(refreshToken: string): Promise<SessionDTO> {
    return this.client.refreshSession(refreshToken);
  }

  public async signOut(): Promise<void> {
    return this.client.signOut();
  }
}
