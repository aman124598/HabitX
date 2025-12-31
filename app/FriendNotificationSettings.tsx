import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, ThemedCard } from '../components/Themed';
import { useTheme } from '../lib/themeContext';
import { friendNotificationService, FriendNotificationSettings } from '../lib/friendNotificationService';
import Theme from '../lib/theme';

export default function FriendNotificationSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [settings, setSettings] = useState<FriendNotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const currentSettings = friendNotificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(async (key: keyof FriendNotificationSettings, value: boolean) => {
    if (!settings) return;

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await friendNotificationService.saveSettings({ [key]: value });
      
      // Show feedback for important changes
      if (key === 'enabled') {
        Alert.alert(
          'Settings Updated',
          value ? 'Friend notifications are now enabled' : 'Friend notifications are now disabled'
        );
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  }, [settings]);

  const renderHeader = () => (
    <LinearGradient
      colors={[colors.brand.primary, colors.brand.secondary]}
      style={styles.headerGradient}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <ThemedText variant="inverse" size="xl" weight="bold">
            Friend Notifications
          </ThemedText>
          <ThemedText variant="inverse" size="sm" style={styles.subtitle}>
            Manage friend-related notifications
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSettingItem = (
    key: keyof FriendNotificationSettings,
    title: string,
    description: string,
    value: boolean,
    disabled = false
  ) => (
    <ThemedCard key={key} variant="elevated" style={styles.settingCard}>
      <View style={styles.settingContent}>
        <View style={styles.settingInfo}>
          <ThemedText variant="primary" size="base" weight="semibold">
            {title}
          </ThemedText>
          <ThemedText variant="secondary" size="sm" style={styles.settingDescription}>
            {description}
          </ThemedText>
        </View>
        <Switch
          value={value}
          onValueChange={(newValue) => updateSetting(key, newValue)}
          trackColor={{ false: colors.background.tertiary, true: colors.brand.primary }}
          thumbColor={value ? 'white' : colors.text.tertiary}
          disabled={disabled}
        />
      </View>
    </ThemedCard>
  );

  if (loading || !settings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ThemedText variant="secondary" size="base">
            Loading settings...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            General Settings
          </ThemedText>
          
          {renderSettingItem(
            'enabled',
            'Enable Friend Notifications',
            'Receive all friend-related notifications',
            settings.enabled
          )}
        </View>

        <View style={styles.section}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            Friend Request Notifications
          </ThemedText>
          
          {renderSettingItem(
            'friendRequestReceived',
            'Friend Request Received',
            'Get notified when someone sends you a friend request',
            settings.friendRequestReceived,
            !settings.enabled
          )}
          
          {renderSettingItem(
            'friendRequestAccepted',
            'Friend Request Accepted',
            'Get notified when someone accepts your friend request',
            settings.friendRequestAccepted,
            !settings.enabled
          )}
        </View>

        <View style={styles.section}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            Friend Activity Notifications
          </ThemedText>
          
          {renderSettingItem(
            'newFriendActivity',
            'Friend Activity Updates',
            'Get notified about friend achievements, level ups, and milestones',
            settings.newFriendActivity,
            !settings.enabled
          )}
        </View>

        <View style={styles.section}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            Notification Style
          </ThemedText>
          
          {renderSettingItem(
            'soundEnabled',
            'Sound',
            'Play sound for friend notifications',
            settings.soundEnabled,
            !settings.enabled
          )}
          
          {renderSettingItem(
            'vibrationEnabled',
            'Vibration',
            'Vibrate for friend notifications',
            settings.vibrationEnabled,
            !settings.enabled
          )}
        </View>

        {/* Info Card */}
        <ThemedCard variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <Ionicons name="information-circle" size={24} color={colors.brand.primary} />
            <View style={styles.infoText}>
              <ThemedText variant="primary" size="sm" weight="semibold">
                About Friend Notifications
              </ThemedText>
              <ThemedText variant="secondary" size="xs" style={styles.infoDescription}>
                Friend notifications help you stay connected with your habit-building community. 
                You can customize which types of notifications you receive to match your preferences.
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  backButton: {
    padding: Theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: Theme.spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  subtitle: {
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  section: {
    marginTop: Theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: Theme.spacing.md,
  },
  settingCard: {
    marginBottom: Theme.spacing.sm,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  settingDescription: {
    marginTop: 4,
  },
  infoCard: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.lg,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  infoDescription: {
    marginTop: 4,
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpacing: {
    height: Theme.spacing.xl,
  },
});