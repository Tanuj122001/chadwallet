import { create } from 'zustand';
import { User, Session } from '../../core/models';
import { serviceLocator } from '../../services';
import { sessionManager } from '../../services/SessionManager';
import { SessionExpiredError } from '../../core/errors';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'refreshing' | 'session_expired' | 'error';

export interface AuthState {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  errorMessage: string | null;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithPhone: (phoneNumber: string) => Promise<string>;
  confirmPhoneOTP: (confirmationId: string, code: string) => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  status: 'idle',
  errorMessage: null,

  signUpWithEmail: async (email, password) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const payload = await authRepo.signUpWithEmail(email, password);
      
      sessionManager.startSessionMonitoring(payload.session);
      set({ user: payload.user, session: payload.session, status: 'authenticated' });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  signInWithEmail: async (email, password) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const payload = await authRepo.signInWithEmail(email, password);
      
      sessionManager.startSessionMonitoring(payload.session);
      set({ user: payload.user, session: payload.session, status: 'authenticated' });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  forgotPassword: async (email) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      await authRepo.forgotPassword(email);
      set({ status: 'idle' });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  signInWithGoogle: async (idToken) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const payload = await authRepo.signInWithGoogle(idToken);
      
      sessionManager.startSessionMonitoring(payload.session);
      set({ user: payload.user, session: payload.session, status: 'authenticated' });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  signInWithPhone: async (phoneNumber) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const res = await authRepo.signInWithPhone(phoneNumber);
      set({ status: 'idle' });
      return res.confirmationId;
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  confirmPhoneOTP: async (confirmationId, code) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const payload = await authRepo.confirmPhoneOTP(confirmationId, code);
      
      sessionManager.startSessionMonitoring(payload.session);
      set({ user: payload.user, session: payload.session, status: 'authenticated' });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
      throw error;
    }
  },

  restoreSession: async () => {
    set({ status: 'loading', errorMessage: null });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const payload = await authRepo.restoreSession();
      
      if (payload) {
        sessionManager.startSessionMonitoring(payload.session);
        set({ user: payload.user, session: payload.session, status: 'authenticated' });
      } else {
        set({ status: 'unauthenticated' });
      }
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        set({ status: 'session_expired', errorMessage: error.message });
      } else {
        set({ status: 'unauthenticated' });
      }
    }
  },

  refreshSession: async () => {
    const currentStatus = get().status;
    if (currentStatus !== 'authenticated') return;

    set({ status: 'refreshing' });
    try {
      const authRepo = serviceLocator.getAuthRepository();
      const refreshedSession = await authRepo.refreshSession();
      
      sessionManager.startSessionMonitoring(refreshedSession);
      set({ session: refreshedSession, status: 'authenticated' });
    } catch (error: any) {
      if (error instanceof SessionExpiredError) {
        sessionManager.stopSessionMonitoring();
        set({ user: null, session: null, status: 'session_expired', errorMessage: error.message });
      } else {
        set({ status: 'authenticated' }); // Keep current session if refresh fails transiently
      }
    }
  },

  logout: async () => {
    set({ status: 'loading' });
    try {
      sessionManager.stopSessionMonitoring();
      const authRepo = serviceLocator.getAuthRepository();
      await authRepo.logout();
      set({ user: null, session: null, status: 'unauthenticated', errorMessage: null });
    } catch (error: any) {
      set({ status: 'error', errorMessage: error.message });
    }
  },

  clearError: () => set({ errorMessage: null }),
}));

export default useAuthStore;
