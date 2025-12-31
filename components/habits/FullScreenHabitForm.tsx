import React from 'react';
import { Modal, View, StyleSheet, Pressable } from 'react-native';
import HabitForm, { HabitFormProps } from './HabitForm';
import { ThemedCard, ThemedText } from '../Themed';
import { Ionicons } from '@expo/vector-icons';
import Theme from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';

type FullScreenHabitFormProps = HabitFormProps & {
  visible: boolean;
};

export default function FullScreenHabitForm({ visible, onCancel, onSubmit }: FullScreenHabitFormProps) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onCancel}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}> 
  <ThemedCard variant="elevated" style={StyleSheet.flatten([styles.card, { backgroundColor: colors.background.secondary }])}> 
          <View style={styles.headerRow}>
            <ThemedText variant="primary" size="xl" weight="bold">Create Habit</ThemedText>
            <Pressable onPress={onCancel} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text.primary} />
            </Pressable>
          </View>

          <HabitForm onCancel={onCancel} onSubmit={onSubmit} inline hideTitle />
        </ThemedCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '95%',
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: Theme.spacing.sm,
  },
});
