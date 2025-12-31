import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../lib/themeContext';
import { getShadow } from '../../lib/theme';
import authService from '../../lib/auth';

interface EmailVerificationScreenProps {
  userEmail?: string;
  onBackToLogin?: () => void;
  onVerified?: () => void;
}

export default function EmailVerificationScreen({
  userEmail = '',
  onBackToLogin,
  onVerified,
}: EmailVerificationScreenProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { colors } = useTheme();
  const route = useRoute();

  // Get email from route params if not passed as prop
  const email = userEmail || (route.params as any)?.email || '';
  const token = (route.params as any)?.token || '';

  useEffect(() => {
    // If we have a token in route params, auto-verify
    if (token && email) {
      handleAutoVerify();
    }
  }, [token, email]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const resendTimer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(resendTimer);
  }, []);

  const handleAutoVerify = async () => {
    try {
      setIsLoading(true);
      console.log('📧 Auto-verifying email with token:', email);
      
      const user = await authService.verifyEmail(email, token);
      
      console.log('✅ Email verified successfully:', user.email);
      setIsVerified(true);
      if (onVerified) {
        setTimeout(() => onVerified(), 2000);
      }
    } catch (error: any) {
      console.error('❌ Auto-verification error:', error);
      Alert.alert('Verification Error', error.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Error', 'Please enter your verification token');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Verifying email with token:', verificationCode);
      
      const user = await authService.verifyEmail(email, verificationCode.trim());
      
      console.log('✅ Email verified successfully:', user.email);
      setIsVerified(true);
      Alert.alert('Success', 'Email verified successfully!');
      if (onVerified) {
        setTimeout(() => onVerified(), 1000);
      }
    } catch (error: any) {
      console.error('❌ Email verification error:', error);
      Alert.alert('Verification Error', error.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      console.log('📧 Resending verification email to:', email);
      
      const result = await authService.resendVerificationEmail(email);
      
      console.log('✅ Verification email resent:', result.message);
      setResendDisabled(true);
      setResendCountdown(60);
      Alert.alert('Success', result.message || 'Verification email sent! Check your inbox.');
    } catch (error: any) {
      console.error('❌ Resend email error:', error);
      Alert.alert('Error', error.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        {onBackToLogin && !isVerified && (
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onBackToLogin}
              disabled={isLoading}
            >
              <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Verify Email</Text>
        </View>

        {/* Main Card */}
        <View style={[styles.card, getShadow('lg')]}>
          {isVerified ? (
            // Success State
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Email Verified!</Text>
              <Text style={styles.successMessage}>
                Your email has been verified successfully. You can now enjoy all features of Habit X!
              </Text>
              {onBackToLogin && (
                <TouchableOpacity
                  style={styles.button}
                  onPress={onBackToLogin}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4F46E5', '#7C3AED']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonText}>Continue to Home</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Verification Form
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={64} color="#8B5CF6" />
              </View>

              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a verification link to{'\n'}
                <Text style={styles.email}>{email}</Text>
              </Text>

              <View style={styles.form}>
                {/* Token Input */}
                <Text style={styles.label}>Verification Token</Text>
                <TextInput
                  style={styles.input}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="Enter verification token from email"
                  placeholderTextColor="#6B7280"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleVerifyEmail}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isLoading ? ['#6B7280', '#4B5563'] : ['#4F46E5', '#7C3AED']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify Email</Text>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend Button */}
                <TouchableOpacity
                  style={[
                    styles.resendButton,
                    (resendDisabled || isLoading) && styles.disabledResendButton,
                  ]}
                  onPress={handleResendEmail}
                  disabled={resendDisabled || isLoading}
                  activeOpacity={0.7}
                >
                  <Ionicons name="mail-outline" size={16} color="#8B5CF6" />
                  <Text style={styles.resendButtonText}>
                    {resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend Email'}
                  </Text>
                </TouchableOpacity>

                {/* Time Remaining */}
                <Text style={styles.timeRemaining}>
                  Link expires in {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
    paddingBottom: 40,
    minHeight: '100%',
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 32,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: '#374151',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  email: {
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 20,
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
    marginBottom: 12,
    gap: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  disabledResendButton: {
    opacity: 0.5,
    borderColor: '#6B7280',
  },
  disabledButton: {
    opacity: 0.6,
  },
  timeRemaining: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 40,
  },
});
