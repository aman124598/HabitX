import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { applyFirebaseAction } from '../lib/firebase';
import authService from '../lib/auth';
import { useAuth } from '../lib/authContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const oobCode = (params as any)?.oobCode || (params as any)?.token;
    if (!oobCode) {
      setMessage('Invalid verification link.');
      setStatus('error');
      return;
    }

    (async () => {
      try {
        setStatus('verifying');
        console.log('🔐 Step 1: Applying Firebase email verification code...');
        
        // Step 1: Apply the action code (mark email as verified in Firebase)
        await applyFirebaseAction(oobCode as string);
        console.log('✅ Firebase email verified');

        // Step 2: Complete MongoDB registration (backend will check Firebase emailVerified status)
        console.log('🔐 Step 2: Syncing user to MongoDB...');
        
        try {
          const user = await authService.verifyEmail('', oobCode as string);
          console.log('✅ User synced to MongoDB:', user);
          
          // Refresh auth context
          await refreshUser();
          
          setStatus('success');
          setMessage('Your email has been verified successfully! You can now log in.');
        } catch (syncError: any) {
          console.error('❌ MongoDB sync error:', syncError);
          setStatus('error');
          
          // Check if it's a "no pending registration" error
          if (syncError?.message?.includes('No pending registration')) {
            setMessage('Email verified! Please log in with your credentials to complete setup.');
          } else if (syncError?.message?.includes('No Firebase session')) {
            setMessage('Email verified! Please log in with your credentials to complete setup.');
          } else {
            setMessage(syncError?.message || 'Email verified in Firebase. Please log in to complete registration.');
          }
        }
      } catch (err: any) {
        console.error('❌ Verify link error:', err);
        setStatus('error');
        setMessage(err?.message || 'Verification failed. The link may be invalid or expired.');
      }
    })();
  }, [params]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.content}>
        {status === 'verifying' && (
          <View style={styles.card}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.title}>Verifying your email…</Text>
            <Text style={styles.subtitle}>Please wait a moment</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.successTitle}>Email Verified! ✅</Text>
            <Text style={styles.subtitle}>{message}</Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Go to Home</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: '#7F1D1D' }]}>
              <Ionicons name="close-circle" size={80} color="#EF4444" />
            </View>
            <Text style={styles.errorTitle}>Verification Failed</Text>
            <Text style={styles.subtitle}>{message}</Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.replace('/')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Back to Home</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: '#064E3B',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginTop: 16,
    textAlign: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
