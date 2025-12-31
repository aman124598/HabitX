import React, { useState } from 'react';
import { View, Modal, StyleSheet, TextInput, Alert } from 'react-native';
import { ThemedCard, ThemedText, ThemedButton } from '../Themed';
import Theme from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { habitsService } from '../../lib/habitsApi';

export default function ShareModal({ visible, onClose, habitId }: { visible: boolean; onClose: () => void; habitId: string | null }) {
  const { colors } = useTheme();
  const [input, setInput] = useState('');
  const styles = StyleSheet.create({
    container: {
      margin: Theme.spacing.lg,
      padding: Theme.spacing.lg,
      borderRadius: Theme.borderRadius.xl,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: Theme.borderRadius.md,
      padding: Theme.spacing.md,
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
      marginBottom: Theme.spacing.md,
    }
  });

  const handleShare = async () => {
    if (!habitId) return;
    const ids = input.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length === 0) {
      Alert.alert('Please enter one or more user IDs');
      return;
    }
    try {
      await habitsService.shareHabit(habitId, ids);
      Alert.alert('Shared!', 'Habit shared successfully');
      setInput('');
      onClose();
    } catch (error: any) {
      console.error('Share failed:', error);
      Alert.alert('Share failed', error.message || 'Could not share habit');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ThemedCard style={styles.container} variant="elevated">
          <ThemedText variant="primary" size="lg" weight="bold">Share Habit</ThemedText>
          <ThemedText variant="secondary" size="sm" style={{ marginBottom: Theme.spacing.md }}>
            Enter comma-separated user IDs to share this habit with. (Admin/demo feature)
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="userId1, userId2, ..."
            placeholderTextColor={colors.text.tertiary}
            value={input}
            onChangeText={setInput}
          />
          <View style={{ flexDirection: 'row', gap: Theme.spacing.md }}>
            <ThemedButton variant="ghost" onPress={onClose} style={{ flex: 1 }}>Cancel</ThemedButton>
            <ThemedButton variant="primary" onPress={handleShare} style={{ flex: 1 }}>Share</ThemedButton>
          </View>
        </ThemedCard>
      </View>
    </Modal>
  );
}
