import React from 'react';
import { Modal, View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import HabitForm, { HabitFormProps } from './HabitForm';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';

type FullScreenHabitFormProps = HabitFormProps & {
  visible: boolean;
};

export default function FullScreenHabitForm({ visible, onCancel, onSubmit }: FullScreenHabitFormProps) {
  const { isDark } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          {/* Close on background tap */}
          <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

          <View style={[
            styles.card,
            { backgroundColor: isDark ? '#121212' : '#FFFFFF' }
          ]}>
            {/* Minimal drag handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
            </View>

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
    justifyContent: 'flex-end',
  },
  card: {
    width: '100%',
    height: '80%', // Bottom sheet style instead of floating card
    borderTopLeftRadius: Theme.borderRadius.xxl,
    borderTopRightRadius: Theme.borderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  formContainer: {
    flex: 1,
  },
});
