import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import EmailVerificationScreen from './EmailVerificationScreen';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ResetPasswordScreen from './ResetPasswordScreen';

export type AuthScreenType = 'login' | 'register' | 'emailVerification' | 'forgotPassword' | 'resetPassword';

export default function AuthScreen() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>('login');
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState<string>('');
  const [resetPasswordToken, setResetPasswordToken] = useState<string>('');

  const handleSwitchToRegister = () => {
    setCurrentScreen('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentScreen('login');
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentScreen('forgotPassword');
  };

  const handleEmailVerificationNeeded = (email: string) => {
    setVerificationEmail(email);
    setCurrentScreen('emailVerification');
  };

  const handleSwitchToResetPassword = (email: string, token: string) => {
    setResetPasswordEmail(email);
    setResetPasswordToken(token);
    setCurrentScreen('resetPassword');
  };

  const handleVerificationComplete = () => {
    // After email verification, go back to login
    setCurrentScreen('login');
    setVerificationEmail('');
  };

  const handlePasswordResetComplete = () => {
    // After password reset, go back to login
    setCurrentScreen('login');
    setResetPasswordEmail('');
    setResetPasswordToken('');
  };

  return (
    <View style={styles.container}>
      {currentScreen === 'login' && (
        <LoginScreen
          onSwitchToRegister={handleSwitchToRegister}
          onSwitchToForgotPassword={handleSwitchToForgotPassword}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen
          onSwitchToLogin={handleSwitchToLogin}
          onEmailVerificationNeeded={handleEmailVerificationNeeded}
        />
      )}

      {currentScreen === 'emailVerification' && (
        <EmailVerificationScreen
          userEmail={verificationEmail}
          onBackToLogin={handleSwitchToLogin}
          onVerified={handleVerificationComplete}
        />
      )}

      {currentScreen === 'forgotPassword' && (
        <ForgotPasswordScreen
          onBackToLogin={handleSwitchToLogin}
          onSwitchToResetPassword={handleSwitchToResetPassword}
        />
      )}

      {currentScreen === 'resetPassword' && (
        <ResetPasswordScreen
          onBackToLogin={handleSwitchToLogin}
          email={resetPasswordEmail}
          resetToken={resetPasswordToken}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
