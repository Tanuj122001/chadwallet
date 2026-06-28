import React, { createContext, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { useAuthStore } from '../../features/auth/authStore';
import { sessionManager } from '../../services/SessionManager';
import { logger } from '../../utils/logger';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, signInWithEmail, logout: storeLogout, restoreSession } = useAuthStore();
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    // 1. Auto Restore Session on startup
    logger.info('[AuthProvider] App mounted. Restore session check initiated.');
    restoreSession();
  }, [restoreSession]);

  const login = async () => {
    logger.info('[AuthProvider] Simulated Login trigger');
    try {
      await signInWithEmail('chad@chadwallet.xyz', 'password');
    } catch (err) {
      logger.error('[AuthProvider] Simulated Login failed', err);
    }
  };

  const logout = async () => {
    logger.info('[AuthProvider] Logout trigger');
    await storeLogout();
  };

  // Reset Idle Timer on user action
  const handleUserActivity = () => {
    sessionManager.resetIdleTimer();
    return false; // Do not consume or block touch propagation
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      <View 
        style={{ flex: 1 }} 
        onStartShouldSetResponderCapture={handleUserActivity}
      >
        {children}
      </View>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
