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

type ClerkUserLike = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null } | null> | null;
  createdAt?: number | Date | null;
  updatedAt?: number | Date | null;
};

function getClerkEmail(clerkUser: ClerkUserLike | null | undefined): string {
  return (
    clerkUser?.primaryEmailAddress?.emailAddress ||
    clerkUser?.emailAddresses?.find((address) => !!address?.emailAddress)?.emailAddress ||
    ''
  );
}

function buildClerkFallbackUser(clerkUser: ClerkUserLike | null | undefined): User | null {
  if (!clerkUser) return null;

  const email = getClerkEmail(clerkUser);
  const username = clerkUser.username || clerkUser.firstName || email.split('@')[0] || 'user';
  const nowIso = new Date().toISOString();

  return {
    id: clerkUser.id,
    username,
    email,
    createdAt: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : nowIso,
    updatedAt: clerkUser.updatedAt ? new Date(clerkUser.updatedAt).toISOString() : nowIso,
  };
}

function mergeUserProfiles(base: User | null, overlay: User | null): User | null {
  if (!base) return overlay;
  if (!overlay) return base;

  return {
    ...overlay,
    ...base,
    username: base.username || overlay.username,
    email: base.email || overlay.email,
    bio: base.bio ?? overlay.bio,
    avatar: base.avatar ?? overlay.avatar,
    isPublic: base.isPublic ?? overlay.isPublic,
    totalXP: base.totalXP ?? overlay.totalXP,
    level: base.level ?? overlay.level,
    createdAt: base.createdAt || overlay.createdAt,
    updatedAt: base.updatedAt || overlay.updatedAt,
  };
}

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

    const clerkFallbackUser = buildClerkFallbackUser(clerkUser);
    if (clerkFallbackUser) {
      setUser((current) => mergeUserProfiles(current, clerkFallbackUser));
    }

    setIsLoading(true);
    fetchMe()
      .then((userData) => {
        setUser((current) => mergeUserProfiles(userData, current));
      })
      .catch((err) => {
        console.warn('Could not fetch user profile from DB:', err.message);
        if (clerkFallbackUser) {
          setUser((current) => mergeUserProfiles(current, clerkFallbackUser));
        }
      })
      .finally(() => setIsLoading(false));
  }, [isLoaded, isSignedIn, clerkUser]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await fetchMe();
      setUser((current) => mergeUserProfiles(userData, current));
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, []);

  const updateProfile = useCallback(
    async (credentials: UpdateProfileCredentials) => {
      setIsLoading(true);
      try {
        const userData = await updateProfileApi(credentials);
        setUser((current) => mergeUserProfiles(userData, current));
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
