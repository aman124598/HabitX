import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getApiUrl } from './config';
import {
  createFirebaseUser,
  sendVerificationToUser,
  getCurrentIdToken,
  applyFirebaseAction,
} from './firebase';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
  message?: string;
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

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  async init(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);
      
      console.log('🔐 Auth init - Token found:', !!token);
      console.log('🔐 Auth init - User data found:', !!userData);
      
      if (token && userData) {
        this.token = token;
        try {
          this.user = JSON.parse(userData);
          console.log('🔐 Auth init - Successfully loaded user:', this.user?.username);
          return true;
        } catch (e) {
          console.warn('Invalid user data in storage, ignoring:', e);
          this.user = null;
          // Clear invalid data
          await AsyncStorage.removeItem(USER_KEY);
          await AsyncStorage.removeItem(TOKEN_KEY);
          this.token = null;
        }
      } else {
        console.log('🔐 Auth init - No stored credentials found');
      }
      return false;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      // Try Firebase sign-in first
      let firebaseIdToken: string | null = null;
      let firebaseUser: any = null;
      let firebaseSignInSuccessful = false;
      
      try {
        const { signInWithPassword, getCurrentIdToken, auth } = await import('./firebase');
        await signInWithPassword(credentials.email, credentials.password);
        firebaseIdToken = await getCurrentIdToken(true);
        firebaseUser = auth.currentUser;
        firebaseSignInSuccessful = true;
        console.log('✅ Firebase sign-in successful');
        console.log('   - Email verified:', firebaseUser?.emailVerified);
        console.log('   - Firebase UID:', firebaseUser?.uid);
        console.log('   - ID Token obtained:', !!firebaseIdToken);
      } catch (firebaseErr: any) {
        console.log('⚠️ Firebase sign-in failed:', firebaseErr?.code || firebaseErr?.message || firebaseErr);
        // Fall back to legacy backend-only auth
      }

      const url = getApiUrl('/auth/login');
      console.log('🚀 Calling backend login:', url);
      console.log('   - Firebase token:', firebaseIdToken ? 'present' : 'absent');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          // Send Firebase token in both a custom header and standard Authorization Bearer for robustness
          ...(firebaseIdToken ? { 'X-Firebase-Token': firebaseIdToken, 'Authorization': `Bearer ${firebaseIdToken}` } : {}),
        },
        body: JSON.stringify(credentials),
      });

      // CRITICAL FIX: If user not found in MongoDB but exists in Firebase with verified email,
      // create the MongoDB user automatically
      if (!response.ok && response.status === 401 && firebaseSignInSuccessful && firebaseUser?.emailVerified) {
        console.log('🔄 Firebase auth successful but backend rejected - auto-creating MongoDB user');
        console.log('   - Firebase user verified:', firebaseUser.emailVerified);
        console.log('   - Firebase UID:', firebaseUser.uid);
        
        // Get pending registration data or use Firebase user data
        let username = credentials.email.split('@')[0]; // Default username
        const pendingData = await AsyncStorage.getItem('pending_registration');
        
        if (pendingData) {
          const pending = JSON.parse(pendingData);
          username = pending.username || username;
          console.log('📦 Found pending registration data, username:', username);
        } else {
          console.log('⚠️ No pending registration data, using default username:', username);
        }
        
        // Try to create MongoDB user
        try {
          const registerUrl = getApiUrl('/auth/register');
          console.log('🔐 Auto-registering user in MongoDB:', registerUrl);
          
          const registerResponse = await fetch(registerUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
              'Authorization': `Bearer ${firebaseIdToken}`,
            },
            body: JSON.stringify({ 
              username, 
              email: credentials.email, 
              firebaseUid: firebaseUser.uid,
              // Don't send password - Firebase manages it
            }),
          });

          if (registerResponse.ok) {
            const registerData: AuthResponse = await registerResponse.json();
            
            // Store token and user data
            await AsyncStorage.setItem(TOKEN_KEY, registerData.data.token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(registerData.data.user));
            await AsyncStorage.removeItem('pending_registration');
            
            this.token = registerData.data.token;
            this.user = registerData.data.user;

            console.log('✅ MongoDB user auto-created successfully');
            return registerData.data.user;
          } else {
            const errorText = await registerResponse.text();
            console.error('❌ Failed to auto-create MongoDB user:', registerResponse.status, errorText);
          }
        } catch (createErr) {
          console.error('❌ Exception auto-creating MongoDB user:', createErr);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend login failed');
        console.error('   - Status:', response.status);
        console.error('   - Response:', errorText);

        // Provide helpful error message
        if (firebaseSignInSuccessful && !firebaseUser?.emailVerified) {
          throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
        }
        if (firebaseSignInSuccessful && firebaseUser?.emailVerified && firebaseIdToken) {
          throw new Error('Login failed even though Firebase authenticated you. Please try again in a moment.');
        }

        throw new Error(errorText || `Login failed with status ${response.status}`);
      }

      const data: AuthResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      
      this.token = data.data.token;
      this.user = data.data.user;

      // Clear pending registration if exists
      await AsyncStorage.removeItem('pending_registration');

      return data.data.user;
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        const url = getApiUrl('/auth/login');
        console.error('❌ Network Error Details:', {
          url,
          platform: Platform.OS,
          error: error.message
        });
        
        if (Platform.OS === 'android') {
          throw new Error('Network error: Cannot connect to local server.\n\nFor Android emulator, make sure your backend is running on port 10000.\nFor physical device, try setting EXPO_PUBLIC_USE_REMOTE_BACKEND=true to use the remote server.');
        } else {
          throw new Error('Network error: Unable to connect to server. Please check if the backend is running on port 10000.');
        }
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }
      
      throw error;
    }
  }

  async register(credentials: RegisterCredentials): Promise<User> {
    try {
      // 1) Create Firebase user (this also signs the user in on the client)
      const firebaseResult = await createFirebaseUser(credentials.email, credentials.password);
      const firebaseUser = firebaseResult.user;

      // 2) Send Firebase verification email with continueUrl pointing to our verify page
      try {
        await sendVerificationToUser(firebaseUser);
        console.log('✅ Firebase verification email sent to:', credentials.email);
      } catch (err) {
        console.warn('Failed to send Firebase verification email (client):', err);
        throw new Error('Failed to send verification email. Please try again.');
      }

      // 3) DO NOT create user in MongoDB yet - user must verify email first
      // Store temporary registration data in AsyncStorage so we can complete registration after verification
      await AsyncStorage.setItem('pending_registration', JSON.stringify({
        username: credentials.username,
        email: credentials.email,
        firebaseUid: firebaseUser.uid,
        timestamp: Date.now(),
      }));

      console.log('✅ Firebase user created. Waiting for email verification before MongoDB sync.');
      
      // Return a placeholder user object indicating pending verification
      // The UI will show "verify your email" screen
      return {
        id: '', // Empty until verified
        username: credentials.username,
        email: credentials.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Registration error details:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      this.token = null;
      this.user = null;
      // Also sign out Firebase client if present
      try {
        const { signOut } = await import('./firebase');
        await signOut();
      } catch (e) {
        // ignore if firebase client not available
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async getMe(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await fetch(getApiUrl('/auth/me'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, logout
          await this.logout();
        }
        throw new Error('Failed to get user data');
      }

      const data = await response.json();
      this.user = data.data;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data));
      
      return data.data;
    } catch (error) {
      console.error('Get me error:', error);
      throw error;
    }
  }

  async updateProfile(credentials: UpdateProfileCredentials): Promise<User> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    try {
      const url = getApiUrl('/auth/profile');
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        console.error('Profile update failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        if (response.status === 401) {
          // Token is invalid, logout
          await this.logout();
          throw new Error('Session expired. Please log in again.');
        }
        
        if (response.status === 400) {
          throw new Error('Username or email already taken');
        }
        
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Profile update failed');
      }

      // Update stored user data
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data));
      this.user = data.data;

      console.log('Profile update successful for user:', data.data.username);
      return data.data;
    } catch (error) {
      console.error('Profile update error details:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. Please check if the backend is running.');
      }
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    console.log('🔐 Making authenticated request to:', url);
    console.log('🔐 Token exists:', !!token);
    console.log('🔐 Request method:', options.method || 'GET');
    
    if (!token) {
      console.error('❌ No token available for authenticated request');
      throw new Error('Not authenticated');
    }

    const requestOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    };

    console.log('🔐 Request headers:', requestOptions.headers);
    
    try {
      const response = await fetch(url, requestOptions);
      console.log('🔐 Authenticated request response status:', response.status);
      return response;
    } catch (error) {
      console.error('🔐 Authenticated request failed:', error);
      throw error;
    }
  }

  /**
   * Send password reset email via Firebase
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔐 Sending password reset email via Firebase to:', email);
      
      // Import Firebase helper
      const { sendPasswordReset } = await import('./firebase');
      
      // Send password reset email via Firebase
      await sendPasswordReset(email);

      console.log('✅ Password reset email sent via Firebase');
      return {
        success: true,
        message: 'Password reset email sent. Please check your inbox.',
      };
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if email exists for security
        return {
          success: true,
          message: 'If an account exists with this email, you will receive a password reset email.',
        };
      }
      
      if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }
      
      if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please try again later.');
      }
      
      throw new Error(error.message || 'Failed to send password reset email');
    }
  }

  /**
   * Reset password with Firebase
   * @param oobCode - The password reset code from the email link
   * @param newPassword - The new password
   */
  /**
   * Reset password with Firebase
   * @param oobCode - The password reset code from the email link
   * @param newPassword - The new password
   */
  async resetPassword(oobCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔐 Resetting password with Firebase code');
      
      // Import Firebase helpers
      const { verifyPasswordReset, confirmPasswordResetWithCode } = await import('./firebase');
      
      // First verify the reset code and get the email
      const email = await verifyPasswordReset(oobCode);
      console.log('✅ Password reset code verified for:', email);
      
      // Confirm password reset with new password
      await confirmPasswordResetWithCode(oobCode, newPassword);
      console.log('✅ Password reset successfully');

      return {
        success: true,
        message: 'Password reset successfully. You can now login with your new password.',
      };
    } catch (error: any) {
      console.error('❌ Reset password error:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/expired-action-code') {
        throw new Error('Password reset link has expired. Please request a new one.');
      }
      
      if (error.code === 'auth/invalid-action-code') {
        throw new Error('Invalid password reset link. Please request a new one.');
      }
      
      if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      }
      
      throw new Error(error.message || 'Failed to reset password');
    }
  }

  async verifyEmail(email: string, token: string): Promise<User> {
    try {
      // After user clicks verification link and Firebase marks email as verified,
      // we need to sync the user to MongoDB
      
      // CRITICAL FIX: When user clicks email link, they might not be signed in to Firebase
      // This is especially true on mobile where clicking email opens a new browser/app instance
      
      // Strategy: Try to get pending registration data, but don't fail if it's missing
      // User can complete registration by simply logging in (login will sync to MongoDB)
      
      const pendingData = await AsyncStorage.getItem('pending_registration');
      
      if (!pendingData) {
        // No pending data - user needs to log in to complete registration
        // Firebase email is already verified, so login will work
        throw new Error('No pending registration found. Please log in with your credentials to complete setup.');
      }

      const { username, email: storedEmail, firebaseUid } = JSON.parse(pendingData);

      // Try to get Firebase ID token (user might still be signed in)
      let idToken = await getCurrentIdToken(true);
      
      if (!idToken) {
        // User is not signed in - they need to log in to complete registration
        // Firebase email is verified, so login will work
        throw new Error('No Firebase session. Please log in with your credentials to complete setup.');
      }

      // 3. Call backend to create MongoDB user (backend will verify Firebase email is verified)
      const url = getApiUrl('/auth/register');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          username, 
          email: storedEmail, 
          firebaseUid,
          // No password needed - Firebase already authenticated
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data: AuthResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Failed to complete registration');
      }

      // 4. Store MongoDB user and token
      await AsyncStorage.setItem(TOKEN_KEY, data.data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
      await AsyncStorage.removeItem('pending_registration');

      this.token = data.data.token;
      this.user = data.data.user;

      console.log('✅ Email verified and user synced to MongoDB');
      return data.data.user;
    } catch (error) {
      console.error('Verify email error (frontend):', error);
      throw error;
    }
  }

  async resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Backend will handle sending verification email (it can use Firebase Dynamic Links)
      const url = getApiUrl('/auth/resend-verification');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }

      return {
        success: true,
        message: data.message || 'Verification email sent',
      };
    } catch (error) {
      console.error('Resend verification error (frontend):', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
export default authService;
