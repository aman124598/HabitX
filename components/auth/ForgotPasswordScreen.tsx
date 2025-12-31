import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { getShadow } from '../../lib/theme';
import authService from '../../lib/auth';

interface ForgotPasswordScreenProps {
  onBackToLogin: () => void;
  onSwitchToResetPassword?: (email: string, token: string) => void;
}

export default function ForgotPasswordScreen({ onBackToLogin, onSwitchToResetPassword }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const { colors } = useTheme();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardVisible(true);
      if (e?.endCoordinates?.height) setKeyboardHeight(e.endCoordinates.height);
      console.log('Forgot keyboard did show, height:', e?.endCoordinates?.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      console.log('Forgot keyboard did hide');
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const contentBottomPadding = useMemo(() => {
    const base = 40;
    if (Platform.OS === 'android') {
      const extra = Math.max(0, keyboardHeight - insets.bottom);
      return base + extra;
    }
    return base;
  }, [keyboardHeight, insets?.bottom]);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      console.log('📧 Starting forgot password process for:', email);
      
      const result = await authService.forgotPassword(email.trim());
      
      console.log('✅ Forgot password result:', result);
      setIsEmailSent(true);
      Alert.alert('Success', result.message || 'Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      console.error('❌ Forgot password error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.top + 20) : 0}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isKeyboardVisible && styles.scrollContentKeyboard,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
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

        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Reset Password</Text>
        </View>

        {/* Main Card */}
        <View style={[styles.card, getShadow('lg')]}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-open-outline" size={64} color="#8B5CF6" />
            </View>

            {!isEmailSent ? (
              <>
                <Text style={styles.title}>Forgot Your Password?</Text>
                <Text style={styles.subtitle}>
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </Text>

                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor="#6B7280"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                      />
                    </View>
                  </View>

                  {/* Send Button */}
                  <TouchableOpacity
                    style={[styles.sendButton, isLoading && styles.disabledButton]}
                    onPress={handleForgotPassword}
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
                          <Text style={styles.sendButtonText}>Send Reset Link</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.successContainer}>
                  <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                </View>
                <Text style={styles.successTitle}>Check Your Email!</Text>
                <Text style={styles.successMessage}>
                  We've sent a password reset link to {email}. Please check your email and follow the instructions to reset your password.
                </Text>
                <Text style={styles.expiryText}>
                  The reset link will expire in 1 hour.
                </Text>

                {!showTokenInput ? (
                  <>
                    <TouchableOpacity
                      style={[styles.sendButton, { marginTop: 24 }]}
                      onPress={() => setShowTokenInput(true)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.sendButtonText}>Have a Reset Token?</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.sendButton, { marginTop: 12 }]}
                      onPress={onBackToLogin}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#6B7280', '#4B5563']}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text style={styles.sendButtonText}>Back to Login</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.form}>
                      {/* Reset Token Input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                          <Ionicons name="key-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                          <TextInput
                            style={styles.input}
                            value={resetToken}
                            onChangeText={setResetToken}
                            placeholder="Enter reset token from email"
                            placeholderTextColor="#6B7280"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                          />
                        </View>
                      </View>

                      {/* Proceed Button */}
                      <TouchableOpacity
                        style={[styles.sendButton, (isLoading || !resetToken.trim()) && styles.disabledButton]}
                        onPress={() => {
                          if (onSwitchToResetPassword && resetToken.trim()) {
                            onSwitchToResetPassword(email, resetToken.trim());
                          }
                        }}
                        disabled={isLoading || !resetToken.trim()}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={(isLoading || !resetToken.trim()) ? ['#6B7280', '#4B5563'] : ['#4F46E5', '#7C3AED']}
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.sendButtonText}>Continue to Reset Password</Text>
                          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.sendButton, { marginTop: 12 }]}
                        onPress={() => setShowTokenInput(false)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#6B7280', '#4B5563']}
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <Text style={styles.sendButtonText}>Back</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>

        {/* Bottom spacing handled via dynamic padding */}
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
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
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
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderWidth: 1.5,
    borderColor: '#4B5563',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F9FAFB',
    paddingVertical: 16,
  },
  sendButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  successContainer: {
    marginBottom: 24,
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
    marginBottom: 16,
  },
  expiryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 40,
  },
});
