/**
 * authContext.tsx
 *
 * Bridges Clerk (the auth provider) with the rest of the app.
 * - Registers a Clerk token getter so all API services can attach tokens.
 * - Keeps a local `User` in state (fetched from MongoDB via /auth/me).
 * - Exposes helpers the UI still needs: updateProfile, forgotPassword, etc.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import {
  registerClerkTokenGetter,
  fetchMe,
  updateProfileApi,
  User,
  UpdateProfileCredentials,
} from './auth';
import { getApiUrl } from './config';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  updateProfile: (credentials: UpdateProfileCredentials) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Register the Clerk token getter so API services can use it globally.
  useEffect(() => {
    registerClerkTokenGetter(() => getToken());
  }, [getToken]);

  // When Clerk finishes loading and user is signed in, fetch MongoDB profile.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchMe()
      .then(setUser)
      .catch((err) => {
        console.warn('Could not fetch user profile from DB:', err.message);
        // Construct a minimal User from Clerk data so the app isn't broken
        // while the backend auto-creates the DB record on next API call.
        if (clerkUser) {
          setUser({
            id: clerkUser.id,
            username:
              clerkUser.username ||
              clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
              'user',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
          });
        }
      })
      .finally(() => setIsLoading(false));
  }, [isLoaded, isSignedIn, clerkUser]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchMe();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  const updateProfile = useCallback(
    async (credentials: UpdateProfileCredentials) => {
      setIsLoading(true);
      try {
        const userData = await updateProfileApi(credentials);
        setUser(userData);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const forgotPassword = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      // Clerk handles password reset via its own email flow.
      // We call the Clerk backend API here directly.
      const response = await fetch(getApiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send password reset email');
      }
      return { success: true, message: 'Password reset email sent. Please check your inbox.' };
    },
    []
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!isSignedIn,
    isLoading: !isLoaded || isLoading,
    refreshUser,
    updateProfile,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
