import React, { useEffect, useMemo, useState, useRef } from 'react';
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
  Animated as RNAnimated,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/authContext';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGoogleAuth } from '../../lib/useGoogleAuth';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword?: () => void;
}

export default function LoginScreen({ onSwitchToRegister, onSwitchToForgotPassword }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const { login, isLoading, loginWithGoogle } = useAuth();
  const { colors } = useTheme();
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const insets = useSafeAreaInsets();
  
  // Google Auth
  const { signInWithGoogle, isLoading: isGoogleLoading, isReady: isGoogleReady, error: googleError, authResult } = useGoogleAuth();
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  // Handle successful Google auth result
  useEffect(() => {
    if (authResult) {
      console.log('✅ Google auth result received, updating context...');
      loginWithGoogle(authResult);
    }
  }, [authResult, loginWithGoogle]);

  // Animations
  const logoScale = useRef(new RNAnimated.Value(0)).current;
  const logoOpacity = useRef(new RNAnimated.Value(0)).current;
  const cardTranslateY = useRef(new RNAnimated.Value(50)).current;
  const cardOpacity = useRef(new RNAnimated.Value(0)).current;
  const orb1Scale = useRef(new RNAnimated.Value(0)).current;
  const orb2Scale = useRef(new RNAnimated.Value(0)).current;
  const orb3Scale = useRef(new RNAnimated.Value(0)).current;
  const buttonPulse = useRef(new RNAnimated.Value(1)).current;
  const googleButtonScale = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    // Entrance animations
    RNAnimated.sequence([
      // Orbs entrance
      RNAnimated.stagger(100, [
        RNAnimated.spring(orb1Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        RNAnimated.spring(orb2Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        RNAnimated.spring(orb3Scale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
      // Logo entrance
      RNAnimated.parallel([
        RNAnimated.spring(logoScale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
        RNAnimated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Card entrance
      RNAnimated.parallel([
        RNAnimated.spring(cardTranslateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        RNAnimated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    ]).start();

    // Button pulse animation
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(buttonPulse, { toValue: 1.02, duration: 1500, useNativeDriver: true }),
        RNAnimated.timing(buttonPulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      if (e?.endCoordinates?.height) {
        setKeyboardHeight(e.endCoordinates.height);
      }
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Show Google auth errors
  useEffect(() => {
    if (googleError) {
      Alert.alert('Google Sign-In Error', googleError);
    }
  }, [googleError]);

  const contentBottomPadding = useMemo(() => {
    const base = 40;
    if (Platform.OS === 'android') {
      const extra = Math.max(0, keyboardHeight - insets.bottom);
      return base + extra;
    }
    return base;
  }, [keyboardHeight, insets.bottom]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await login({ email: email.trim(), password });
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isGoogleReady) {
      Alert.alert('Please Wait', 'Google Sign-In is initializing...');
      return;
    }

    // Check if running in Expo Go (which doesn't support OAuth properly)
    const isExpoGo = !!(global as any).expo?.modules?.ExpoGo || 
                     typeof (global as any).__expo !== 'undefined';

    setIsGoogleSigningIn(true);
    
    // Button press animation
    RNAnimated.sequence([
      RNAnimated.timing(googleButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      RNAnimated.timing(googleButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      const result = await signInWithGoogle();
      if (result) {
        console.log('✅ Google sign-in initiated');
        // The hook handles the rest via useEffect
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Check for OAuth compliance error
      const errorMessage = error?.message || '';
      if (errorMessage.includes('OAuth') || errorMessage.includes('comply')) {
        Alert.alert(
          'Google Sign-In Not Available',
          'Google Sign-In requires a development build. Please use email/password login for now, or build the app with "eas build --profile development".',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', errorMessage || 'Google sign-in failed');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const getInputStyle = (inputName: string) => [
    styles.inputWrapper,
    focusedInput === inputName && styles.inputWrapperFocused,
  ];

  const isAnyLoading = isLoading || isGoogleLoading || isGoogleSigningIn;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.top + 20) : 0}
    >
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0F0F1A', '#1a1a2e', '#16213e']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative orbs */}
      <RNAnimated.View style={[styles.orb, styles.orb1, { transform: [{ scale: orb1Scale }] }]} />
      <RNAnimated.View style={[styles.orb, styles.orb2, { transform: [{ scale: orb2Scale }] }]} />
      <RNAnimated.View style={[styles.orb, styles.orb3, { transform: [{ scale: orb3Scale }] }]} />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent,
          isKeyboardVisible && styles.scrollContentKeyboard,
          { paddingBottom: contentBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Logo Section */}
        <RNAnimated.View style={[
          styles.logoContainer,
          { 
            opacity: logoOpacity,
            transform: [{ scale: logoScale }] 
          }
        ]}>
          <LinearGradient
            colors={['#8B5CF6', '#A78BFA', '#C4B5FD']}
            style={styles.logoGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoInner}>
              <Text style={styles.logoLetter}>H</Text>
            </View>
          </LinearGradient>
          <View style={styles.brandTextContainer}>
            <Text style={styles.brandText}>HABIT</Text>
            <LinearGradient
              colors={['#8B5CF6', '#06B6D4']}
              style={styles.brandXContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.brandX}>X</Text>
            </LinearGradient>
          </View>
        </RNAnimated.View>

        {/* Main Card */}
        <RNAnimated.View style={[
          styles.card,
          getShadow('xl'),
          {
            opacity: cardOpacity,
            transform: [{ translateY: cardTranslateY }]
          }
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back! 👋</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your habit journey
            </Text>
          </View>

          <View style={styles.form}>
            {/* Google Sign-In Button */}
            <RNAnimated.View style={{ transform: [{ scale: googleButtonScale }] }}>
              <TouchableOpacity
                style={[styles.googleButton, isAnyLoading && styles.disabledButton]}
                onPress={handleGoogleSignIn}
                disabled={isAnyLoading}
                activeOpacity={0.8}
              >
                {isGoogleLoading || isGoogleSigningIn ? (
                  <ActivityIndicator color="#4285F4" size="small" />
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Text style={styles.googleIcon}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>
            </RNAnimated.View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerTextContainer}>
                <Text style={styles.dividerText}>or sign in with email</Text>
              </View>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={getInputStyle('email')}>
                <View style={styles.inputIconContainer}>
                  <Ionicons 
                    name="mail" 
                    size={18} 
                    color={focusedInput === 'email' ? '#8B5CF6' : '#6B7280'} 
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAnyLoading}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={getInputStyle('password')}>
                <View style={styles.inputIconContainer}>
                  <Ionicons 
                    name="lock-closed" 
                    size={18} 
                    color={focusedInput === 'password' ? '#8B5CF6' : '#6B7280'} 
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  secureTextEntry={!showPassword}
                  editable={!isAnyLoading}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color="#6B7280" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password Link */}
            {onSwitchToForgotPassword && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={onSwitchToForgotPassword}
                disabled={isAnyLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Login Button */}
            <RNAnimated.View style={{ transform: [{ scale: buttonPulse }] }}>
              <TouchableOpacity
                style={[styles.loginButton, isAnyLoading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={isAnyLoading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isAnyLoading ? ['#6B7280', '#4B5563'] : ['#8B5CF6', '#7C3AED', '#6D28D9']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <View style={styles.buttonArrow}>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </RNAnimated.View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Habit X?</Text>
              <TouchableOpacity 
                onPress={onSwitchToRegister} 
                disabled={isAnyLoading}
                style={styles.linkButton}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={14} color="#8B5CF6" />
              </TouchableOpacity>
            </View>
          </View>
        </RNAnimated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    top: -80,
    right: -100,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    bottom: 150,
    left: -80,
  },
  orb3: {
    width: 150,
    height: 150,
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    bottom: -30,
    right: -30,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  scrollContentKeyboard: {
    justifyContent: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    marginBottom: 16,
  },
  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '800',
    color: '#A78BFA',
  },
  brandTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  brandXContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 4,
  },
  brandX: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: 'rgba(31, 41, 55, 0.95)',
    borderRadius: 28,
    padding: 28,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(55, 65, 81, 0.8)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    backgroundColor: 'rgba(55, 65, 81, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(75, 85, 99, 0.6)',
    borderRadius: 16,
    paddingHorizontal: 4,
  },
  inputWrapperFocused: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
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
    color: '#F9FAFB',
    paddingVertical: 14,
  },
  eyeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#A78BFA',
    fontWeight: '600',
  },
  loginButton: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  buttonArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.6)',
  },
  dividerTextContainer: {
    paddingHorizontal: 16,
  },
  dividerText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A78BFA',
  },
});
