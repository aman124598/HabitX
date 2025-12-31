import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../lib/authContext';
import { useTheme } from '../lib/themeContext';
import Theme from '../lib/theme';

export default function ResetPasswordScreen() {
  const { oobCode } = useLocalSearchParams<{ oobCode: string }>();
  const { resetPassword } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid password reset link');
    }
  }, [oobCode]);

  const handleResetPassword = async () => {
    setError(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!oobCode) {
      setError('Invalid password reset link');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(oobCode, newPassword);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: Theme.fontSize.lg,
            fontWeight: '700' as any,
            color: colors.status.error,
            marginBottom: 8,
          }}
        >
          Invalid Link
        </Text>
        <Text
          style={{
            fontSize: Theme.fontSize.base,
            color: colors.text.secondary,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          This password reset link is invalid or has expired.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/')}
          style={{
            backgroundColor: colors.brand.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
        >
          <Text
            style={{
              color: colors.text.inverse,
              fontWeight: '700' as any,
              fontSize: Theme.fontSize.base,
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (success) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: Theme.fontSize.xl,
            fontWeight: '700' as any,
            color: colors.text.primary,
            marginBottom: 8,
          }}
        >
          ✓ Password Reset!
        </Text>
        <Text
          style={{
            fontSize: Theme.fontSize.base,
            color: colors.text.secondary,
            marginBottom: 16,
          }}
        >
          Your password has been reset successfully.
        </Text>
        <Text
          style={{
            fontSize: Theme.fontSize.sm,
            color: colors.text.tertiary,
          }}
        >
          Redirecting you to login...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          backgroundColor: colors.background.primary,
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
      >
        <Text
          style={{
            fontSize: Theme.fontSize.xxl,
            fontWeight: '700' as any,
            color: colors.text.primary,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Reset Password
        </Text>
        <Text
          style={{
            fontSize: Theme.fontSize.base,
            color: colors.text.secondary,
            marginBottom: 32,
            textAlign: 'center',
          }}
        >
          Enter your new password below
        </Text>

        {error && (
          <View
            style={{
              backgroundColor: colors.status.error,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: colors.text.inverse,
                fontSize: Theme.fontSize.sm,
              }}
            >
              {error}
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: Theme.fontSize.base,
              fontWeight: '500' as any,
              color: colors.text.primary,
              marginBottom: 8,
            }}
          >
            New Password
          </Text>
          <TextInput
            placeholder="Enter new password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: colors.border.light,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: Theme.fontSize.base,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }}
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: Theme.fontSize.base,
              fontWeight: '500' as any,
              color: colors.text.primary,
              marginBottom: 8,
            }}
          >
            Confirm Password
          </Text>
          <TextInput
            placeholder="Confirm new password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!loading}
            style={{
              borderWidth: 1,
              borderColor: colors.border.light,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: Theme.fontSize.base,
              color: colors.text.primary,
              backgroundColor: colors.background.secondary,
            }}
            placeholderTextColor={colors.text.tertiary}
          />
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.text.tertiary : colors.brand.primary,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          {loading ? (
            <>
              <ActivityIndicator color={colors.text.inverse} size="small" style={{ marginRight: 8 }} />
              <Text
                style={{
                  color: colors.text.inverse,
                  fontWeight: '700' as any,
                  fontSize: Theme.fontSize.base,
                }}
              >
                Resetting...
              </Text>
            </>
          ) : (
            <Text
              style={{
                color: colors.text.inverse,
                fontWeight: '700' as any,
                fontSize: Theme.fontSize.base,
              }}
            >
              Reset Password
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
