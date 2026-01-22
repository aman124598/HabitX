import { useState, useEffect, useCallback } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { signInWithGoogle, getCurrentIdToken } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl } from './config';

// Complete any pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
// Web client ID from Firebase Console (OAuth 2.0 Client IDs)
const WEB_CLIENT_ID = '1011701747502-9nod5hmp6dfutjnvra948ts928nml8ct.apps.googleusercontent.com';

// Android client ID with SHA-1 fingerprint from Google Cloud Console
const ANDROID_CLIENT_ID = '1011701747502-e09epg5833vd2vckcog3vktqrfo3a4ei.apps.googleusercontent.com';

// For iOS, create an iOS OAuth client in Google Cloud Console
const IOS_CLIENT_ID = WEB_CLIENT_ID;

export interface GoogleAuthResult {
  user: {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    totalXP?: number;
    level?: number;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<GoogleAuthResult | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  const handleGoogleSignIn = useCallback(async (idToken: string | undefined) => {
    if (!idToken) {
      setError('No ID token received from Google');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sign in to Firebase with Google credential
      const userCredential = await signInWithGoogle(idToken);
      const firebaseUser = userCredential.user;
      
      console.log('✅ Firebase Google sign-in successful');
      console.log('   - Email:', firebaseUser.email);
      console.log('   - Email verified:', firebaseUser.emailVerified);
      console.log('   - UID:', firebaseUser.uid);

      // Get Firebase ID token
      const firebaseIdToken = await getCurrentIdToken(true);

      if (!firebaseIdToken) {
        throw new Error('Failed to get Firebase token');
      }

      // Call backend to sync/create user
      const url = getApiUrl('/auth/google-login');
      console.log('🚀 Calling backend Google login:', url);

      const backendResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseIdToken}`,
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          firebaseUid: firebaseUser.uid,
        }),
      });

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('❌ Backend Google login failed:', errorText);
        throw new Error(errorText || 'Failed to sync with backend');
      }

      const data = await backendResponse.json();

      if (!data.success) {
        throw new Error(data.message || 'Google login failed');
      }

      // Store auth data
      await AsyncStorage.setItem('auth_token', data.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.data.user));

      console.log('✅ Google login complete:', data.data.user.username);

      setAuthResult(data.data);
      return data.data as GoogleAuthResult;
    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication?.idToken);
    } else if (response?.type === 'error') {
      const errorMsg = response.error?.message || '';
      // Check for OAuth compliance error (common in Expo Go)
      if (errorMsg.includes('OAuth') || errorMsg.includes('comply') || errorMsg.includes('disallowed_useragent')) {
        setError('Google Sign-In is not available in Expo Go. Please use a development build or sign in with email/password.');
      } else {
        setError('Google sign-in failed. Please try again.');
      }
      console.error('Google auth error:', response.error);
    } else if (response?.type === 'cancel') {
      setError(null); // User cancelled, not an error
      console.log('Google auth cancelled by user');
    } else if (response?.type === 'dismiss') {
      setError(null); // Dismissed, not an error
      console.log('Google auth dismissed');
    }
  }, [response, handleGoogleSignIn]);

  const signInWithGoogleAsync = useCallback(async () => {
    if (!request) {
      setError('Google auth not ready. Please try again.');
      return null;
    }

    setError(null);
    setAuthResult(null);
    
    try {
      console.log('🔐 Starting Google sign-in...');
      const result = await promptAsync();
      console.log('🔐 Google prompt result:', result?.type);
      // The response will be handled by useEffect
      return result;
    } catch (err: any) {
      console.error('🔐 Google sign-in prompt error:', err);
      setError(err.message || 'Failed to start Google sign-in');
      return null;
    }
  }, [request, promptAsync]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    isReady: !!request,
    authResult,
    signInWithGoogle: signInWithGoogleAsync,
    clearError,
  };
}
