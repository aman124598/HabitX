import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { CreateChallengeData } from '../../lib/challengesApi';

interface CreateChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeData) => void;
  loading: boolean;
}

const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading,
}) => {
  const { colors } = useTheme();
  
  const [formData, setFormData] = useState<CreateChallengeData>({
    name: '',
    description: '',
    type: 'streak',
    habitCriteria: {
      anyHabit: true,
    },
    goal: {
      target: 7,
      metric: 'days',
      description: 'Complete for 7 days',
    },
    duration: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
    maxParticipants: 10,
    isPublic: true,
  });

  const challengeTypes = [
    { value: 'streak', label: 'Streak Challenge', icon: 'flame', description: 'Maintain consecutive days' },
    { value: 'completion_count', label: 'Completion Count', icon: 'checkmark-circle', description: 'Total completions' },
    { value: 'consistency', label: 'Consistency', icon: 'calendar', description: 'Regular completion' },
    { value: 'group_goal', label: 'Group Goal', icon: 'people', description: 'Collective target' },
  ];

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a challenge name');
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (formData.goal.target <= 0) {
      Alert.alert('Error', 'Please enter a valid target');
      return;
    }

    onSubmit(formData);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'streak',
      habitCriteria: {
        anyHabit: true,
      },
      goal: {
        target: 7,
        metric: 'days',
        description: 'Complete for 7 days',
      },
      duration: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      maxParticipants: 10,
      isPublic: true,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modal: {
      backgroundColor: colors.background.primary,
      borderRadius: 24,
      padding: 0,
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      flex: 1,
      flexDirection: 'column',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 20,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light + '20',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text.primary,
      letterSpacing: -0.5,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background.tertiary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    formContainer: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
      marginLeft: 4,
    },
    input: {
      borderWidth: 1.5,
      borderColor: colors.border.light + '40',
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.secondary,
      marginBottom: 20,
      shadowColor: colors.brand.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    typeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    typeOption: {
      flex: 1,
      minWidth: '47%',
      padding: 18,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    selectedType: {
      borderColor: colors.brand.primary,
      backgroundColor: colors.brand.primary + '12',
      borderWidth: 2.5,
    },
    unselectedType: {
      borderColor: colors.border.light + '40',
      backgroundColor: colors.background.secondary,
      borderWidth: 1.5,
    },
    typeIcon: {
      marginBottom: 10,
    },
    typeLabel: {
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },
    typeDescription: {
      fontSize: 11,
      textAlign: 'center',
      lineHeight: 15,
      paddingHorizontal: 4,
    },
    selectedTypeText: {
      color: colors.brand.primary,
    },
    unselectedTypeText: {
      color: colors.text.primary,
    },
    selectedTypeDescription: {
      color: colors.brand.primary + 'CC',
    },
    unselectedTypeDescription: {
      color: colors.text.secondary,
    },
    row: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 20,
    },
    halfWidth: {
      flex: 1,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      padding: 20,
      backgroundColor: colors.background.secondary,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border.light + '20',
    },
    switchLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 16,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopColor: colors.border.light + '20',
      alignItems: 'center',
      flexShrink: 0,
      backgroundColor: colors.background.secondary + '50',
    },
    button: {
      flex: 1,
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 56,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    primaryButton: {
      backgroundColor: colors.brand.primary,
    },
    secondaryButton: {
      backgroundColor: colors.background.tertiary,
      borderWidth: 1.5,
      borderColor: colors.border.light + '40',
    },
    buttonText: {
      fontSize: 17,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    primaryButtonText: {
      color: colors.text.inverse,
    },
    secondaryButtonText: {
      color: colors.text.primary,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
  <KeyboardAvoidingView
    style={styles.overlay}
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
  >
  <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Challenge</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={{ paddingBottom: 16 }}
              style={{ flex: 1 }}
            >
              <Text style={styles.label}>Challenge Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
                placeholder="Enter challenge name"
                placeholderTextColor={colors.text.secondary}
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, description: text }))
                }
                placeholder="Describe your challenge"
                placeholderTextColor={colors.text.secondary}
                multiline
              />

              <Text style={styles.label}>Challenge Type</Text>
              <View style={styles.typeContainer}>
                {challengeTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeOption,
                      formData.type === type.value
                        ? styles.selectedType
                        : styles.unselectedType,
                    ]}
                    onPress={() =>
                      setFormData(prev => ({ ...prev, type: type.value as any }))
                    }
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={32}
                      color={
                        formData.type === type.value
                          ? colors.brand.primary
                          : colors.text.secondary
                      }
                      style={styles.typeIcon}
                    />
                    <Text
                      style={[
                        styles.typeLabel,
                        formData.type === type.value
                          ? styles.selectedTypeText
                          : styles.unselectedTypeText,
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text
                      style={[
                        styles.typeDescription,
                        formData.type === type.value
                          ? styles.selectedTypeDescription
                          : styles.unselectedTypeDescription,
                      ]}
                    >
                      {type.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Target</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.goal.target.toString()}
                    onChangeText={(text) =>
                      setFormData(prev => ({
                        ...prev,
                        goal: { ...prev.goal, target: parseInt(text) || 0 }
                      }))
                    }
                    placeholder="7"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfWidth}>
                  <Text style={styles.label}>Duration (days)</Text>
                  <TextInput
                    style={styles.input}
                    value="7"
                    placeholder="7"
                    placeholderTextColor={colors.text.secondary}
                    keyboardType="numeric"
                    editable={false}
                  />
                </View>
              </View>

              <Text style={styles.label}>Max Participants</Text>
              <TextInput
                style={styles.input}
                value={formData.maxParticipants?.toString() || '10'}
                onChangeText={(text) =>
                  setFormData(prev => ({
                    ...prev,
                    maxParticipants: parseInt(text) || 10
                  }))
                }
                placeholder="10"
                placeholderTextColor={colors.text.secondary}
                keyboardType="numeric"
              />
            </ScrollView>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {loading ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
    </View>
  </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateChallengeModal;
