import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  applyActionCode,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  User as FirebaseUser,
} from 'firebase/auth';

// Initialize Firebase client SDK
let firebaseApp: FirebaseApp | null = null;

function initFirebase() {
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  // Read config from environment variables. These should be set in your Expo/React Native env.
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  };

  try {
    firebaseApp = initializeApp(firebaseConfig as any);
    console.log('✅ Firebase client initialized');
  } catch (error) {
    console.warn('⚠️ Firebase client initialization failed or already initialized', error);
  }

  return firebaseApp;
}

initFirebase();

export const auth = getAuth();

export async function createFirebaseUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function sendVerificationToUser(user: FirebaseUser, continueUrl?: string) {
  try {
    const actionCodeSettings = {
      url: continueUrl || (process.env.EXPO_PUBLIC_APP_URL || process.env.APP_URL || 'https://habit-tracker-backend-2.onrender.com') + '/verify-email',
      handleCodeInApp: true,
    } as any;

    return sendEmailVerification(user, actionCodeSettings as any);
  } catch (error) {
    console.error('Error sending Firebase verification email:', error);
    throw error;
  }
}

export async function applyFirebaseAction(oobCode: string) {
  return applyActionCode(auth, oobCode);
}

export async function getCurrentIdToken(forceRefresh: boolean = false): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken(forceRefresh);
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

export async function signInWithPassword(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

/**
 * Send password reset email via Firebase
 */
export async function sendPasswordReset(email: string) {
  try {
    const actionCodeSettings = {
      url: (process.env.EXPO_PUBLIC_APP_URL || process.env.APP_URL || 'https://habit-tracker-backend-2.onrender.com') + '/reset-password',
      handleCodeInApp: true,
    } as any;

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('✅ Password reset email sent via Firebase');
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Verify password reset code
 */
export async function verifyPasswordReset(oobCode: string): Promise<string> {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    console.log('✅ Password reset code verified for:', email);
    return email;
  } catch (error) {
    console.error('❌ Error verifying password reset code:', error);
    throw error;
  }
}

/**
 * Confirm password reset with new password
 */
export async function confirmPasswordResetWithCode(oobCode: string, newPassword: string) {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    console.log('✅ Password reset successfully');
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    throw error;
  }
}
