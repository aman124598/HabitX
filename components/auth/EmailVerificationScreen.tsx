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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../lib/themeContext';
import authService from '../../lib/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      const user = await authService.verifyEmail(email, token);
      setIsVerified(true);
      if (onVerified) {
        setTimeout(() => onVerified(), 2000);
      }
    } catch (error: any) {
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
      const user = await authService.verifyEmail(email, verificationCode.trim());
      setIsVerified(true);
      Alert.alert('Success', 'Email verified successfully!');
      if (onVerified) {
        setTimeout(() => onVerified(), 1000);
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.message || 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      setIsLoading(true);
      const result = await authService.resendVerificationEmail(email);
      setResendDisabled(true);
      setResendCountdown(60);
      Alert.alert('Success', result.message || 'Verification email sent! Check your inbox.');
    } catch (error: any) {
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

  const getInputStyle = () => [
    styles.inputWrapper,
    focusedInput === 'token' && styles.inputWrapperFocused,
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Dark Background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.background} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        {onBackToLogin && !isVerified && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onBackToLogin}
            disabled={isLoading}
          >
            <Ionicons name="arrow-back" size={24} color="#DC2626" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}

        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Main Card */}
        <View style={styles.card}>
          {isVerified ? (
            // Success State
            <View style={styles.content}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Email Verified!</Text>
              <Text style={styles.successMessage}>
                Your email has been verified successfully. You can now enjoy all features of HabitX!
              </Text>
              {onBackToLogin && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onBackToLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Verification Form
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="mail-outline" size={48} color="#DC2626" />
              </View>

              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We've sent a verification link to{'\n'}
                <Text style={styles.email}>{email}</Text>
              </Text>

              <View style={styles.form}>
                {/* Token Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Verification Token</Text>
                  <View style={getInputStyle()}>
                    <View style={styles.inputIconContainer}>
                      <Ionicons 
                        name="key" 
                        size={18} 
                        color={focusedInput === 'token' ? '#DC2626' : '#6B7280'} 
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      placeholder="Enter verification token"
                      placeholderTextColor="#6B7280"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      onFocus={() => setFocusedInput('token')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleVerifyEmail}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.primaryButtonText}>Verify Email</Text>
                      <View style={styles.buttonArrow}>
                        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      </View>
                    </>
                  )}
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
                  <Ionicons name="mail-outline" size={16} color="#DC2626" />
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 64,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: 24,
    padding: 28,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  email: {
    fontWeight: '700',
    color: '#DC2626',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  inputWrapperFocused: {
    borderColor: '#DC2626',
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
  },
  inputIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    width: '100%',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#DC2626',
    marginBottom: 16,
    gap: 8,
    backgroundColor: 'transparent',
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  disabledResendButton: {
    opacity: 0.5,
    borderColor: '#6B7280',
  },
  disabledButton: {
    opacity: 0.6,
  },
  timeRemaining: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
});
