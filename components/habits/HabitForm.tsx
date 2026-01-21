import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { ThemedCard, ThemedText, ThemedButton } from '../Themed';
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
const customFrequencyTypes = CUSTOM_FREQUENCY_TYPES;

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

  const inputStyle = {
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    color: colors.text.primary,
    fontSize: 16,
  };

  const labelStyle = {
    marginBottom: 8,
    color: colors.text.secondary,
  };

  const content = (
    <>
      {!hideTitle && (
        <ThemedText variant="primary" size="xl" weight="bold" style={{ marginBottom: 20 }}>
          Create New Habit
        </ThemedText>
      )}
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={{ maxHeight: 400 }}
        contentContainerStyle={{ paddingBottom: 8 }}
      >
        {/* Habit Name */}
        <View style={styles.field}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={labelStyle}>
            Habit Name
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="What habit do you want to build?"
            placeholderTextColor={colors.text.tertiary}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            autoFocus
            returnKeyType="next"
          />
        </View>

        {/* Category - Visual Grid */}
        <View style={styles.field}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={labelStyle}>
            Category
          </ThemedText>
          <View style={styles.categoryGrid}>
            {categoryOptions.map((opt) => {
              const isSelected = formData.category === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  style={[
                    styles.categoryChip,
                    { 
                      backgroundColor: isSelected 
                        ? colors.brand.primary 
                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      borderColor: isSelected 
                        ? colors.brand.primary 
                        : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    }
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: opt.value }))}
                >
                  <Ionicons 
                    name={opt.icon as any} 
                    size={18} 
                    color={isSelected ? '#FFFFFF' : opt.color} 
                  />
                  <ThemedText
                    size="sm"
                    weight="medium"
                    style={{ color: isSelected ? '#FFFFFF' : colors.text.primary, marginLeft: 6 }}
                  >
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Frequency - Clean Segmented */}
        <View style={styles.field}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={labelStyle}>
            How often?
          </ThemedText>
          <View style={[
            styles.frequencyContainer, 
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            }
          ]}>
            {frequencies.map((freq) => {
              const isSelected = formData.frequency === freq.value;
              return (
                <Pressable
                  key={freq.value}
                  style={[
                    styles.frequencyButton,
                    isSelected && { backgroundColor: colors.brand.primary },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                >
                  <ThemedText 
                    size="sm" 
                    weight={isSelected ? 'semibold' : 'medium'}
                    style={{ color: isSelected ? '#FFFFFF' : colors.text.primary }}
                  >
                    {freq.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {/* Custom Frequency Options */}
          {formData.frequency === 'custom' && (
            <View style={styles.customFrequencyRow}>
              <TextInput
                style={[inputStyle, { width: 70, textAlign: 'center' }]}
                value={String(customFrequency.value)}
                onChangeText={(text) => {
                  const v = parseInt(text) || 1;
                  setCustomFrequency(prev => ({ ...prev, value: Math.max(1, Math.min(365, v)) }));
                }}
                keyboardType="numeric"
              />
              <View style={styles.customTypeRow}>
                {customFrequencyTypes.map((t) => {
                  const isSelected = customFrequency.type === t.value;
                  return (
                    <Pressable
                      key={t.value}
                      style={[
                        styles.customTypeButton,
                        { 
                          backgroundColor: isSelected 
                            ? colors.brand.primary 
                            : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                          borderColor: isSelected 
                            ? colors.brand.primary 
                            : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        }
                      ]}
                      onPress={() => setCustomFrequency(prev => ({ ...prev, type: t.value as any }))}
                    >
                      <ThemedText 
                        size="xs" 
                        weight="medium"
                        style={{ color: isSelected ? '#FFFFFF' : colors.text.primary }}
                      >
                        {t.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Goal (Optional) */}
        <View style={styles.field}>
          <ThemedText variant="secondary" size="sm" weight="semibold" style={labelStyle}>
            Goal <ThemedText variant="tertiary" size="xs">(optional)</ThemedText>
          </ThemedText>
          <TextInput
            style={inputStyle}
            placeholder="e.g. 10 minutes, 20 pages..."
            placeholderTextColor={colors.text.tertiary}
            value={formData.goal}
            onChangeText={(text) => setFormData(prev => ({ ...prev, goal: text }))}
            returnKeyType="done"
          />
        </View>
      </ScrollView>
      
      {/* Actions */}
      <View style={styles.actions}>
        <Pressable 
          onPress={onCancel} 
          style={[
            styles.cancelButton, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }
          ]}
        >
          <ThemedText variant="secondary" size="base" weight="medium">Cancel</ThemedText>
        </Pressable>
        <Pressable 
          onPress={handleSubmit} 
          disabled={!isFormValid}
          style={[
            styles.submitButton, 
            { 
              backgroundColor: isFormValid ? colors.brand.primary : colors.brand.primary + '40',
            }
          ]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <ThemedText style={{ color: '#FFFFFF', marginLeft: 6 }} size="base" weight="semibold">
            Create Habit
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  if (inline) {
    return <View>{content}</View>;
  }

  return (
    <ThemedCard variant="elevated" style={styles.container}>
      {content}
    </ThemedCard>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: Theme.spacing.lg,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
  },
  field: {
    marginBottom: 20,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  frequencyContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  customFrequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  customTypeRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 16,
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
