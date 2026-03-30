import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clerk handles email verification inline via OTP in the RegisterScreen.
    // This route exists for backward-compatibility (Firebase deep links).
    // We simply inform the user and redirect them to log in.
    const oobCode = (params as any)?.oobCode || (params as any)?.token;
    if (!oobCode) {
      setMessage('Invalid verification link. Please return to the app and sign in or register again.');
      setStatus('error');
      return;
    }
    setStatus('success');
    setMessage('Your email was verified. Please open the app and sign in.');
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
