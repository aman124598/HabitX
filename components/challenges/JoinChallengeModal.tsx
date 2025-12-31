import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';

interface JoinChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (challengeId: string, inviteCode?: string) => void;
  loading: boolean;
  defaultInviteCode?: string;
}

const JoinChallengeModal: React.FC<JoinChallengeModalProps> = ({
  visible,
  onClose,
  onSubmit,
  loading,
  defaultInviteCode,
}) => {
  const { colors } = useTheme();
  const [inviteCode, setInviteCode] = useState('');

  // If a default invite code is provided (e.g. from challenge details), prefill the input
  React.useEffect(() => {
    if (visible) {
      setInviteCode(defaultInviteCode ? defaultInviteCode : '');
    } else {
      setInviteCode('');
    }
  }, [visible, defaultInviteCode]);

  const handleSubmit = () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    // Use the invite code to join the challenge
    onSubmit('', inviteCode.trim().toUpperCase());
  };

  const handleClose = () => {
    setInviteCode('');
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.background.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modal: {
      backgroundColor: colors.background.secondary,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      marginBottom: 24,
    },
    description: {
      fontSize: 16,
      color: colors.text.secondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.text.primary,
      backgroundColor: colors.background.primary,
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    button: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.brand.primary,
    },
    secondaryButton: {
      backgroundColor: colors.background.tertiary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    primaryButtonText: {
      color: colors.text.inverse,
    },
    secondaryButtonText: {
      color: colors.text.primary,
    },
    iconContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    icon: {
      marginBottom: 12,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Join Challenge</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="people-circle"
                size={64}
                color={colors.brand.primary}
                style={styles.icon}
              />
            </View>

            <Text style={styles.description}>
              Enter an invite code to join a private challenge, or browse public challenges in the Discover tab.
            </Text>

            <Text style={styles.label}>Invite Code</Text>
            <TextInput
              style={styles.input}
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Enter invite code"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="characters"
              autoCorrect={false}
            />
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
              disabled={loading || !inviteCode.trim()}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {loading ? 'Joining...' : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default JoinChallengeModal;
