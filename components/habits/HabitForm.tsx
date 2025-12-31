import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView, Text } from 'react-native';
import { ThemedCard, ThemedText, ThemedButton } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import Theme, { getShadow } from '../../lib/theme';
import { CreateHabitData, Category, Frequency, CustomFrequency } from '../../lib/habitsApi';
import { CATEGORIES, FREQUENCIES, CUSTOM_FREQUENCY_TYPES } from '../../lib/habitUtils';
import { Ionicons } from '@expo/vector-icons';

export type HabitFormProps = {
  onCancel: () => void;
  onSubmit: (habitData: CreateHabitData) => void;
  // Render the form inline without the outer card container. When true the
  // caller is responsible for providing the card/modal wrapper.
  inline?: boolean;
  // Hide the built-in title (useful when the parent provides its own header)
  hideTitle?: boolean;
};

const categoryOptions = CATEGORIES; // [{ value, label, icon, color }]
const frequencies = FREQUENCIES; // [{ value, label }]
const customFrequencyTypes = CUSTOM_FREQUENCY_TYPES; // [{ value, label }]

export default function HabitForm({ onCancel, onSubmit, inline = false, hideTitle = false }: HabitFormProps) {
  const { colors } = useTheme();
  const [formData, setFormData] = useState<CreateHabitData>({
    name: '',
    description: '',
    goal: '',
    frequency: 'daily',
  category: 'Health',
    startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  });
  const [customFrequency, setCustomFrequency] = useState<CustomFrequency>({
    type: 'times_per_week',
    value: 3,
  });
  
  const handleSubmit = () => {
    if (formData.name.trim()) {
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        goal: formData.goal?.trim() || '',
      };

      if (formData.frequency === 'custom') {
        submitData.customFrequency = customFrequency;
      }

      onSubmit(submitData);
    }
  };

  const isFormValid = formData.name.trim() && formData.category && formData.startDate;

  const styles = StyleSheet.create({
    container: {
      margin: Theme.spacing.lg,
      padding: Theme.spacing.lg,
      borderRadius: Theme.borderRadius.xl,
    },

    title: {
      marginBottom: Theme.spacing.lg,
      textAlign: 'left',
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    field: {
      marginBottom: Theme.spacing.lg,
    },

    label: {
      marginBottom: Theme.spacing.sm,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: Theme.borderRadius.md,
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: Theme.spacing.sm,
      backgroundColor: colors.background.secondary,
      color: colors.text.primary,
      ...getShadow('sm'),
    },

    chipsRow: {
      flexDirection: 'row',
      gap: Theme.spacing.sm,
      // allow scrolling when many categories
    },

    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.sm,
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.secondary,
      marginRight: Theme.spacing.sm,
    },

    chipSelected: {
      borderColor: colors.brand.primary,
      backgroundColor: colors.brand.primary,
    },

    chipText: {
      marginLeft: Theme.spacing.sm,
      color: colors.text.primary,
    },

    segmented: {
      flexDirection: 'row',
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.light,
      overflow: 'hidden',
      backgroundColor: colors.background.secondary,
    },

    segButton: {
      flex: 1,
      paddingVertical: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },

    segButtonSelected: {
      backgroundColor: colors.brand.primary,
    },

    smallControls: {
      flexDirection: 'row',
      gap: Theme.spacing.sm,
      alignItems: 'center',
    },

    smallButton: {
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.background.secondary,
    },

    smallButtonSelected: {
      backgroundColor: colors.brand.primary,
      borderColor: colors.brand.primary,
    },

    actions: {
      marginTop: Theme.spacing.md,
    },

    buttonRow: {
      flexDirection: 'row',
      gap: Theme.spacing.md,
      justifyContent: 'flex-end',
    },
  });

  const [showCustomFrequencyDropdown, setShowCustomFrequencyDropdown] = useState(false);

  const content = (
    <>
      {!hideTitle && (
        <ThemedText 
          variant="primary" 
          size="xl" 
          weight="bold"
          style={styles.title}
        >
          Create New Habit
        </ThemedText>
      )}
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Habit Name */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="base" weight="semibold" style={styles.label}>
            Habit Name *
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Morning meditation, Drink water..."
            placeholderTextColor={colors.text.tertiary}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Description */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="sm" weight="medium" style={styles.label}>
            Description
          </ThemedText>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Optional description of your habit..."
            placeholderTextColor={colors.text.tertiary}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            returnKeyType="next"
          />
        </View>

        {/* Goal */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="sm" weight="medium" style={styles.label}>
            Goal
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g. Meditate for 10 minutes, Read 20 pages..."
            placeholderTextColor={colors.text.tertiary}
            value={formData.goal}
            onChangeText={(text) => setFormData(prev => ({ ...prev, goal: text }))}
            returnKeyType="next"
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="sm" weight="medium" style={styles.label}>
            Category *
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            <View style={styles.chipsRow}>
              {categoryOptions.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.chip,
                    formData.category === opt.value && styles.chipSelected,
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: opt.value }))}
                >
                  <Ionicons name={opt.icon as any} size={16} color={formData.category === opt.value ? 'white' : opt.color} />
                  <ThemedText
                    style={formData.category === opt.value ? { ...styles.chipText, color: 'white' } : styles.chipText}
                    size="sm"
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Frequency */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="sm" weight="medium" style={styles.label}>
            Frequency *
          </ThemedText>
          <View style={[styles.segmented, { marginTop: Theme.spacing.sm }]} accessibilityRole="tablist">
            {frequencies.map((freq, idx) => (
              <Pressable
                key={freq.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: formData.frequency === freq.value }}
                accessibilityLabel={`Set frequency to ${freq.label}`}
                style={[
                  styles.segButton,
                  formData.frequency === freq.value && styles.segButtonSelected,
                  // add separator except for first
                  idx > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border.light }
                ]}
                onPress={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
              >
                <ThemedText variant={formData.frequency === freq.value ? 'inverse' : 'primary'} size="sm">
                  {freq.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {/* Custom Frequency Inline Controls */}
          {formData.frequency === 'custom' && (
            <View style={[styles.field, { marginTop: Theme.spacing.sm }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm }}>
                <TextInput
                  style={[styles.input, { width: 84 }]}
                  value={String(customFrequency.value)}
                  onChangeText={(text) => {
                    const v = parseInt(text) || 1;
                    setCustomFrequency(prev => ({ ...prev, value: Math.max(1, Math.min(365, v)) }));
                  }}
                  keyboardType="numeric"
                  accessibilityLabel="Custom frequency value"
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Theme.spacing.sm }}>
                    {customFrequencyTypes.map((t) => (
                      <Pressable
                        key={t.value}
                        style={[styles.smallButton, customFrequency.type === t.value && styles.smallButtonSelected]}
                        onPress={() => setCustomFrequency(prev => ({ ...prev, type: t.value as any }))}
                      >
                        <ThemedText variant={customFrequency.type === t.value ? 'inverse' : 'primary'} size="xs">
                          {t.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.field}>
          <ThemedText variant="primary" size="sm" weight="medium" style={styles.label}>
            Start Date *
          </ThemedText>
          <TextInput
            style={styles.input}
            value={formData.startDate}
            onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.text.tertiary}
          />
        </View>
      </ScrollView>
      
      <View style={styles.actions}>
        <View style={styles.buttonRow}>
          <ThemedButton variant="ghost" size="md" onPress={onCancel} style={{ flex: 1 }}>
            Cancel
          </ThemedButton>
          <ThemedButton variant="primary" size="md" onPress={handleSubmit} style={{ flex: 1 }} disabled={!isFormValid}>
            Create Habit
          </ThemedButton>
        </View>
      </View>
    </>
  );

  if (inline) {
    // Render raw content so the caller can provide the surrounding card/modal
    return (
      <View style={{ padding: 0 }}>
        {content}
      </View>
    );
  }

  return (
    <ThemedCard variant="elevated" style={styles.container}>
      {content}
    </ThemedCard>
  );
}
