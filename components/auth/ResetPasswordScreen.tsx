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
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../lib/themeContext';
import { getShadow } from '../../lib/theme';
import authService from '../../lib/auth';

interface ResetPasswordScreenProps {
  onBackToLogin: () => void;
  email?: string;
  resetToken?: string;
}

export default function ResetPasswordScreen({ onBackToLogin, email: propEmail, resetToken: propResetToken }: ResetPasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const { colors } = useTheme();
  const route = useRoute();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { useSafeAreaInsets } = require('react-native-safe-area-context');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e: any) => {
      setKeyboardVisible(true);
      if (e?.endCoordinates?.height) setKeyboardHeight(e.endCoordinates.height);
      console.log('Reset keyboard did show, height:', e?.endCoordinates?.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
      console.log('Reset keyboard did hide');
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

  // Get token and email from props first, then fallback to route params
  const token = propResetToken || (route.params as any)?.token || '';
  const email = propEmail || (route.params as any)?.email || '';

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔐 Starting password reset');
      if (!token) {
        throw new Error('Missing reset code. Please use the link from your email again.');
      }
      // Firebase-based reset only needs the oobCode (token) and new password
      const result = await authService.resetPassword(token, newPassword);
      
      console.log('✅ Password reset result:', result);
      setIsReset(true);
      Alert.alert('Success', result.message || 'Password reset successfully! You can now login with your new password.');
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      Alert.alert('Error', error.message || 'Failed to reset password');
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
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>Create New Password</Text>
        </View>

        {/* Main Card */}
        <View style={[styles.card, getShadow('lg')]}>
          {isReset ? (
            // Success State
            <View style={styles.content}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={80} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>Password Reset!</Text>
              <Text style={styles.successMessage}>
                Your password has been reset successfully. You can now login with your new password.
              </Text>

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
                  <Text style={styles.buttonText}>Back to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // Reset Form
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Create New Password</Text>
                <Text style={styles.subtitle}>
                  Enter your new password below. Make sure it's at least 6 characters long.
                </Text>
              </View>

              <View style={styles.form}>
                {/* New Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Create a new password"
                      placeholderTextColor="#6B7280"
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#6B7280"
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Requirements */}
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirement}>
                    <Ionicons
                      name={newPassword.length >= 6 ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={newPassword.length >= 6 ? '#10B981' : '#6B7280'}
                    />
                    <Text style={[styles.requirementText, { color: newPassword.length >= 6 ? '#10B981' : '#9CA3AF' }]}>
                      At least 6 characters
                    </Text>
                  </View>
                  <View style={styles.requirement}>
                    <Ionicons
                      name={newPassword === confirmPassword && newPassword.length > 0 ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={newPassword === confirmPassword && newPassword.length > 0 ? '#10B981' : '#6B7280'}
                    />
                    <Text style={[styles.requirementText, { color: newPassword === confirmPassword && newPassword.length > 0 ? '#10B981' : '#9CA3AF' }]}>
                      Passwords match
                    </Text>
                  </View>
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={
                      isLoading || newPassword.length < 6 || newPassword !== confirmPassword
                        ? ['#6B7280', '#4B5563']
                        : ['#4F46E5', '#7C3AED']
                    }
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Reset Password</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={onBackToLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
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
    gap: 8,
  },
  inputIcon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#F9FAFB',
    paddingVertical: 16,
  },
  requirementsContainer: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '500',
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
  disabledButton: {
    opacity: 0.6,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4B5563',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D1D5DB',
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
  bottomSpacing: {
    height: 40,
  },
});
