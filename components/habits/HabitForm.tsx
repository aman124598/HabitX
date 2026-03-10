import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme from '../../lib/theme';
import { CreateHabitData, CustomFrequency } from '../../lib/habitsApi';
import { CATEGORIES, FREQUENCIES, CUSTOM_FREQUENCY_TYPES } from '../../lib/habitUtils';
import { Ionicons } from '@expo/vector-icons';

export type HabitFormProps = {
  onCancel: () => void;
  onSubmit: (habitData: CreateHabitData) => void;
  inline?: boolean;
  hideTitle?: boolean;
};

const categoryOptions = CATEGORIES;
const frequencies = FREQUENCIES;

export default function HabitForm({ onCancel, onSubmit, inline = false, hideTitle = false }: HabitFormProps) {
  const { colors, isDark } = useTheme();
  const [formData, setFormData] = useState<CreateHabitData>({
    name: '',
    description: '',
    goal: '',
    frequency: 'daily',
    category: 'Health',
    startDate: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = () => {
    if (formData.name.trim()) {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        goal: formData.goal?.trim() || '',
      };
      onSubmit(submitData);
    }
  };

  const isFormValid = formData.name.trim() && formData.category;

  const content = (
    <View style={styles.wrapper}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Habit Name - Large and Clean */}
        <TextInput
          style={[
            styles.titleInput,
            { color: colors.text.primary }
          ]}
          placeholder="Habit Name"
          placeholderTextColor={colors.text.tertiary}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          autoFocus
          returnKeyType="next"
        />

        {/* Goal */}
        <TextInput
          style={[
            styles.goalInput,
            { color: colors.text.secondary }
          ]}
          placeholder="Goal (e.g. 10 mins, 5 pages) - Optional"
          placeholderTextColor={colors.text.tertiary}
          value={formData.goal}
          onChangeText={(text) => setFormData(prev => ({ ...prev, goal: text }))}
          returnKeyType="done"
        />

        {/* Category - Scrolling Pills */}
        <View style={styles.section}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={styles.sectionLabel}>
            Category
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {categoryOptions.map((opt) => {
              const isSelected = formData.category === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected
                        ? colors.brand.primary
                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: opt.value }))}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={isSelected ? '#FFFFFF' : opt.color}
                  />
                  <ThemedText
                    size="sm"
                    weight={isSelected ? 'semibold' : 'medium'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.text.secondary, marginLeft: 6 }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Frequency */}
        <View style={styles.section}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={styles.sectionLabel}>
            Frequency
          </ThemedText>
          <View style={[
            styles.frequencyContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }
          ]}>
            {frequencies.filter(f => f.value !== 'custom').map((freq) => {
              const isSelected = formData.frequency === freq.value;
              return (
                <Pressable
                  key={freq.value}
                  style={[
                    styles.frequencyButton,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#FFFFFF',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                >
                  <ThemedText
                    size="sm"
                    weight={isSelected ? 'semibold' : 'medium'}
                    style={{ color: isSelected ? colors.text.primary : colors.text.tertiary }}
                  >
                    {freq.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.actions, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
        <Pressable
          onPress={onCancel}
          style={styles.cancelButton}
        >
          <ThemedText variant="secondary" size="base" weight="medium">Cancel</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid}
          style={[
            styles.submitButton,
            { backgroundColor: isFormValid ? colors.brand.primary : colors.brand.primary + '40' }
          ]}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <ThemedText style={{ color: '#FFFFFF', marginLeft: 6 }} size="base" weight="semibold">
            Save Habit
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingTop: Theme.spacing.lg,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.sm,
  },
  goalInput: {
    fontSize: 16,
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionLabel: {
    paddingHorizontal: Theme.spacing.xl,
    marginBottom: Theme.spacing.md,
    letterSpacing: 0.5,
  },
  categoryScroll: {
    paddingHorizontal: Theme.spacing.xl,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  frequencyContainer: {
    flexDirection: 'row',
    marginHorizontal: Theme.spacing.xl,
    borderRadius: 12,
    padding: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: Theme.spacing.lg,
    paddingHorizontal: Theme.spacing.xl,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
