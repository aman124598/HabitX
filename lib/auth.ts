import { getApiUrl } from './config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface User {
  id: string;
  username: string;
  email: string;
  totalXP?: number;
  level?: number;
  bio?: string;
  avatar?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

export interface UpdateProfileCredentials {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  isPublic?: boolean;
}

// ---------------------------------------------------------------------------
// Global Clerk token provider
//
// Because this file is not a React component we cannot call Clerk hooks here.
// Instead the _layout.tsx / authContext registers a getter so any service can
// obtain the current Clerk session token without importing React hooks.
// ---------------------------------------------------------------------------
let _clerkTokenGetter: (() => Promise<string | null>) | null = null;

export function registerClerkTokenGetter(fn: () => Promise<string | null>) {
  _clerkTokenGetter = fn;
}

export async function getClerkToken(): Promise<string | null> {
  if (!_clerkTokenGetter) return null;
  try {
    return await _clerkTokenGetter();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core helper - all API calls funnel through here
// ---------------------------------------------------------------------------
export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getClerkToken();

  if (!token) {
    throw new Error('Not authenticated – no Clerk token available');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}

// ---------------------------------------------------------------------------
// Profile API helpers (called by authContext)
// ---------------------------------------------------------------------------
export async function fetchMe(): Promise<User> {
  const response = await makeAuthenticatedRequest(getApiUrl('/auth/me'));
  if (!response.ok) {
    const err = await response.text();
    throw Object.assign(new Error(err || 'Failed to fetch user'), {
      status: response.status,
    });
  }
  const data = await response.json();
  return data.data as User;
}

export async function updateProfileApi(
  credentials: UpdateProfileCredentials
): Promise<User> {
  const response = await makeAuthenticatedRequest(getApiUrl('/auth/profile'), {
    method: 'PUT',
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 400) throw new Error('Username or email already taken');
    throw new Error(`HTTP ${response.status}: ${errText}`);
  }
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'Profile update failed');
  return data.data as User;
}

// ---------------------------------------------------------------------------
// Backward-compat shim – kept so habitsApi / userGamificationApi that call
// authService.makeAuthenticatedRequest() keep working with zero changes.
// ---------------------------------------------------------------------------
const authService = {
  makeAuthenticatedRequest,
  getMe: fetchMe,
  updateProfile: updateProfileApi,
};

export { authService };
export default authService;
