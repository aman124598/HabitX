import React from 'react';
import { Modal, View, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import HabitForm, { HabitFormProps } from './HabitForm';
import { ThemedText } from '../Themed';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';

type FullScreenHabitFormProps = HabitFormProps & {
  visible: boolean;
};

export default function FullScreenHabitForm({ visible, onCancel, onSubmit }: FullScreenHabitFormProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onCancel}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          <View style={[
            styles.card, 
            { 
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}>
            {/* Header */}
            <View style={[styles.headerRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.brand.primary}15` }]}>
                  <Ionicons name="add-circle" size={24} color={colors.brand.primary} />
                </View>
                <View>
                  <ThemedText variant="primary" size="xl" weight="bold">New Habit</ThemedText>
                  <ThemedText variant="secondary" size="sm">Build a new positive routine</ThemedText>
                </View>
              </View>
              <Pressable 
                onPress={onCancel} 
                style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Ionicons name="close" size={20} color={colors.text.secondary} />
              </Pressable>
            </View>

            {/* Form Content */}
            <View style={styles.formContainer}>
              <HabitForm onCancel={onCancel} onSubmit={onSubmit} inline hideTitle />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: Theme.borderRadius.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContainer: {
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
  },
});
