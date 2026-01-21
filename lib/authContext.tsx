import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, { User, LoginCredentials, RegisterCredentials, UpdateProfileCredentials } from './auth';
import { signOut as firebaseSignOut } from './firebase';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (userData: { user: User; token: string }) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (credentials: UpdateProfileCredentials) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (oobCode: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (email: string, token: string) => Promise<User>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const hasStoredAuth = await authService.init();
      
      if (hasStoredAuth) {
        // Try to refresh user data from server
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          // If token is invalid, clear stored auth
          console.log('Token expired or invalid, clearing auth');
          await authService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const userData = await authService.login(credentials);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      const userData = await authService.register(credentials);
      
      // NEW FLOW: Registration only creates Firebase user and sends verification email
      // User is NOT logged in or added to MongoDB until they verify their email
      // So we do NOT set user here or initialize gamification
      
      console.log('✅ Firebase user created, verification email sent. Waiting for user to verify.');
      
      // Return placeholder user data (registration successful but not yet verified)
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      // Logout on backend/local storage
      await authService.logout();
      // Also sign out from Firebase client to clear session
      try {
        await firebaseSignOut();
      } catch (e) {
        // ignore firebase sign-out errors
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, user might be logged out
      await logout();
    }
  };

  const updateProfile = async (credentials: UpdateProfileCredentials) => {
    try {
      setIsLoading(true);
      const userData = await authService.updateProfile(credentials);
      setUser(userData);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setIsLoading(true);
      const result = await authService.forgotPassword(email);
      return result;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (oobCode: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const result = await authService.resetPassword(oobCode, newPassword);
      return result;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, token: string) => {
    try {
      setIsLoading(true);
      const user = await authService.verifyEmail(email, token);
      
      // After successful verification, user is now synced to MongoDB
      setUser(user);
      
      console.log('✅ User verified and logged in:', user.username);
      return user;
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const result = await authService.resendVerificationEmail(email);
      return result;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (userData: { user: User; token: string }) => {
    try {
      setIsLoading(true);
      setUser(userData.user);
      console.log('✅ Google login complete via context:', userData.user.username);
    } catch (error) {
      console.error('Google login context error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
    updateProfile,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
