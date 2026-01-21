import * as React from "react";
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, Switch, TextInput, Modal, FlatList, Share, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// Some expo-file-system type definitions can be inconsistent across SDKs —
// use a runtime alias to avoid TS errors while keeping runtime behaviour.
const FS: any = FileSystem;
import * as Sharing from 'expo-sharing';
import * as Notifications from 'expo-notifications';
import SafeNotifications from '../../lib/safeNotifications';
import { ThemedView, ThemedText, ThemedCard, ThemedDivider } from "../../components/Themed";
import { useHabits } from "../../hooks/useHabits";
import { useAuth } from "../../lib/authContext";
import { useTheme } from "../../lib/themeContext";
import { useTutorial } from "../../lib/tutorialContext";
import { Theme } from "../../lib/theme";
import { habitsService } from "../../lib/habitsApi";
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import NotificationSettingsScreen from "../../components/settings/NotificationSettingsScreen";

// Settings storage keys
const SETTINGS_KEYS = {
  NOTIFICATIONS_ENABLED: 'settings:notificationsEnabled',
  BACKUP_AUTO: 'settings:backupAuto',
  // THEME_CUSTOM removed
  DAILY_REMINDER_TIME: 'settings:dailyReminderTime',
};

// Notification setup - updated to fix deprecation warning
SafeNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Types for settings
interface AppSettings {
  notificationsEnabled: boolean;
  backupAuto: boolean;
  dailyReminderTime: string;
}

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, rightElement, disabled }: SettingsItemProps) {
  const { colors } = useTheme();
  
  return (
    <Pressable 
      onPress={disabled ? undefined : onPress} 
      style={[styles.settingsItem, disabled && styles.settingsItemDisabled]}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.background.tertiary }]}>
          <Ionicons name={icon} size={20} color={disabled ? colors.text.tertiary : colors.text.secondary} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText variant="primary" weight="medium" size="base" style={disabled ? { opacity: 0.5 } : undefined}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText 
              variant="tertiary" 
              size="sm" 
              style={disabled ? { ...styles.subtitle, opacity: 0.5 } : styles.subtitle}
            >
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
      )}
    </Pressable>
  );
}

function FAQItem({ question, answer, icon, isExpanded, onToggle, searchQuery }: {
  question: string;
  answer: string;
  icon: keyof typeof Ionicons.glyphMap;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}) {
  const { colors } = useTheme();
  
  // Filter based on search query
  if (searchQuery && !question.toLowerCase().includes(searchQuery.toLowerCase()) && 
      !answer.toLowerCase().includes(searchQuery.toLowerCase())) {
    return null;
  }

  return (
    <Pressable style={styles.faqItem} onPress={onToggle}>
      <View style={styles.faqItemHeader}>
        <View style={styles.faqItemLeft}>
          <View style={[styles.faqIcon, { backgroundColor: colors.background.tertiary }]}>
            <Ionicons name={icon} size={16} color={colors.brand.primary} />
          </View>
          <ThemedText variant="primary" size="base" weight="medium" style={styles.faqQuestion}>
            {question}
          </ThemedText>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.text.tertiary} 
        />
      </View>
      {isExpanded && (
        <ThemedText variant="secondary" size="sm" style={styles.faqAnswer}>
          {answer}
        </ThemedText>
      )}
    </Pressable>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText variant="primary" weight="bold" size="lg" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <ThemedCard variant="default" style={styles.sectionCard}>
        {children}
      </ThemedCard>
    </View>
  );
}

export default function SettingsTab() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const { habits, refresh, clearAllHabits } = useHabits();
  const { user, logout } = useAuth();
  const { setHasSeenTutorial } = useTutorial();
  const navigation = useNavigation();
  const router = useRouter();
  
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: false,
    backupAuto: false,
    dailyReminderTime: '09:00',
  // customTheme removed
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Modal management
  const openModal = (modalType: string, data: any = {}) => {
    setModalData(data);
    setShowModal(modalType);
  };

  const closeModal = () => {
    setShowModal(null);
    setModalData({});
  };

  // Import from CSV function
  const importFromCSV = async () => {
    try {
      setIsLoading(true);
      
      // For now, show a coming soon message
      Alert.alert(
        'Import Data',
        'CSV import feature is coming soon! You can currently create backups and export to CSV.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('Error', 'Import failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const notificationsEnabled = await AsyncStorage.getItem(SETTINGS_KEYS.NOTIFICATIONS_ENABLED);
      const backupAuto = await AsyncStorage.getItem(SETTINGS_KEYS.BACKUP_AUTO);
      const dailyReminderTime = await AsyncStorage.getItem(SETTINGS_KEYS.DAILY_REMINDER_TIME);
      setSettings({
        notificationsEnabled: notificationsEnabled === 'true',
        backupAuto: backupAuto === 'true',
        dailyReminderTime: dailyReminderTime || '09:00',
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      await AsyncStorage.setItem(SETTINGS_KEYS.NOTIFICATIONS_ENABLED, String(updatedSettings.notificationsEnabled));
      await AsyncStorage.setItem(SETTINGS_KEYS.BACKUP_AUTO, String(updatedSettings.backupAuto));
      await AsyncStorage.setItem(SETTINGS_KEYS.DAILY_REMINDER_TIME, updatedSettings.dailyReminderTime);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Feature handlers
  const handleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const { status } = await SafeNotifications.requestPermissionsAsync();
      if (status === 'granted') {
        await saveSettings({ notificationsEnabled: true });
        await scheduleDailyReminder();
        Alert.alert('Success', 'Notifications enabled! Daily reminders set for your habits.');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings to receive habit reminders.');
      }
    } else {
      await saveSettings({ notificationsEnabled: false });
      await SafeNotifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Notifications Disabled', 'You will no longer receive habit reminders.');
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      // Import the notification service
      const { notificationService } = await import('../../lib/notificationService');
      
      if (settings.notificationsEnabled) {
        // Initialize both morning and evening notifications
        await notificationService.initializeDailyNotifications();
      } else {
        // Cancel all notifications
        await notificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const handleBackup = async () => {
    Alert.alert(
      'Backup & Restore',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create Backup', onPress: createBackup },
        { text: 'Restore Backup', onPress: restoreBackup },
        { text: 'Toggle Auto Backup', onPress: () => saveSettings({ backupAuto: !settings.backupAuto }) }
      ]
    );
  };

  const createBackup = async () => {
    try {
      setIsLoading(true);
      
      const backup = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        habits: habits,
        settings: settings,
        totalHabits: habits.length,
        totalCompletions: habits.reduce((sum, habit) => sum + (habit.streak || 0), 0),
      };
      
  const exportsDir = `${FS.documentDirectory}HabitTracker/exports/`;
      // Ensure directory exists
      try {
        const dirInfo = await FS.getInfoAsync(exportsDir);
        if (!dirInfo.exists) {
          await FS.makeDirectoryAsync(exportsDir, { intermediates: true });
        }
      } catch (e) {
        // ignore and proceed
      }

      const fileName = `habit_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const fileUri = `${exportsDir}${fileName}`;
  await FS.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), { encoding: 'utf8' });

      // Try to share/save the file using system share dialog
      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Habit Backup' });
        }
      } catch (shareErr) {
        // Share was cancelled or failed - this is normal behavior
      }

      Alert.alert(
        'Backup Created! 🎉', 
        `Your backup has been saved:\n\n📁 File: ${fileName}\n📊 ${backup.totalHabits} habits included\n⚡ ${backup.totalCompletions} total completions\n\nSaved to: ${fileUri}`,
        [
          { text: 'OK' },
          { 
            text: 'View Location', 
            onPress: () => Alert.alert('File Location', `📂 ${fileUri}`) 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Backup Failed', 'Could not create backup. Please try again.');
      console.error('Backup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: false,
      });

      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        let backup: any = null;
        try {
          backup = JSON.parse(content);
        } catch (e) {
          Alert.alert('Invalid Backup', 'The selected file is not valid JSON.');
        }

        if (backup && backup.habits) {
          Alert.alert(
            'Restore Backup',
            `This will replace your current ${habits.length} habits with ${backup.habits.length} habits from the backup. Continue?`,
            [
              { text: 'Cancel' },
              {
                text: 'Restore',
                style: 'destructive',
                onPress: async () => {
                  await clearAllHabits();
                  await habitsService.importHabits(backup.habits);
                  if (backup.settings) {
                    await saveSettings(backup.settings);
                  }
                  await refresh();
                  Alert.alert('Success', 'Backup restored successfully!');
                }
              }
            ]
          );
        } else {
          Alert.alert('Invalid Backup', 'This file does not contain valid habit data.');
        }
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Could not restore backup. Please check the file format.');
    }
  };

  const handleExportImport = () => {
    Alert.alert(
      'Export & Import',
      'Choose an option:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export to CSV', onPress: exportToCSV },
        { text: 'Export to PDF', onPress: () => Alert.alert('Coming Soon', 'PDF export will be available in a future update.') },
        { text: 'Import from File', onPress: importFromFile }
      ]
    );
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      
      // Create CSV content locally if API fails
      const csvHeaders = ['Name', 'Category', 'Frequency', 'Streak', 'Last Completed', 'Created Date'];
      const csvRows = habits.map(habit => [
        habit.name,
        habit.category,
        habit.frequency,
        habit.streak || 0,
        habit.lastCompletedOn || 'Never',
        new Date(habit.createdAt).toLocaleDateString()
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
  const exportsDir = `${FS.documentDirectory}HabitTracker/exports/`;
      try {
        const dirInfo = await FS.getInfoAsync(exportsDir);
        if (!dirInfo.exists) {
          await FS.makeDirectoryAsync(exportsDir, { intermediates: true });
        }
      } catch (e) {
        // ignore
      }

      const fileName = `habits_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      const fileUri = `${exportsDir}${fileName}`;
  await FS.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Habits CSV' });
        }
      } catch (shareErr) {
        // Share was cancelled or failed - this is normal behavior
      }

      Alert.alert(
        'Export Successful! 📊', 
        `Your habits have been exported:\n\n📁 File: ${fileName}\n📈 ${habits.length} habits exported\n\nSaved to: ${fileUri}`,
        [
          { text: 'OK' },
          { 
            text: 'View Location', 
            onPress: () => Alert.alert('File Location', `📂 ${fileUri}`) 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export habits. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const importFromFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json'],
      });

      if (!result.canceled && result.assets[0]) {
  const content = await FS.readAsStringAsync(result.assets[0].uri);
        let habits;
        
        if (result.assets[0].name?.endsWith('.json')) {
          habits = JSON.parse(content);
        } else {
          // Simple CSV parsing
          const lines = content.split('\n');
          const headers = lines[0].split(',');
          habits = lines.slice(1).map((line: string) => {
            const values = line.split(',');
            return headers.reduce((obj: Record<string, string>, header: string, index: number) => {
              obj[header.trim()] = (values[index] || '').trim().replace(/"/g, '');
              return obj;
            }, {} as Record<string, string>);
          }).filter((h: Record<string, any>) => Boolean(h.name));
        }
        
        await habitsService.importHabits(habits);
        await refresh();
        Alert.alert('Import Successful', `${habits.length} habits imported successfully!`);
      }
    } catch (error) {
      Alert.alert('Import Failed', 'Could not import habits. Please check the file format.');
    }
  };

  const handleThemeCustomization = () => {
    Alert.alert(
      'Theme Customization',
      'Choose your preferred theme:',
      [
        { text: 'Cancel' },
        { text: 'Light Theme', onPress: () => setThemeMode('light') },
        { text: 'Dark Theme', onPress: () => setThemeMode('dark') }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.background.secondary }]}>
        <ThemedText variant="primary" size="xxxl" weight="bold">Settings</ThemedText>
        <ThemedText variant="secondary" size="base">Manage your account and advanced features</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Overview */}
        <ThemedCard variant="default" style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.background.tertiary }]}>
              <ThemedText style={styles.avatarInitial}>
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <ThemedText variant="primary" weight="bold" size="xl">
                {user?.username || 'User'}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                {user?.email || 'No email'}
              </ThemedText>
              <ThemedText variant="tertiary" size="xs" style={styles.memberSince}>
                {habits.length} active habits
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Smart Features */}
        <SettingsSection title="🔔 Smart Features">
          <SettingsItem
            icon="notifications-outline"
            title="Basic Notifications"
            subtitle={settings.notificationsEnabled ? `Daily reminders at ${settings.dailyReminderTime}` : "Set daily reminders"}
            onPress={() => openModal('notifications')}
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotifications}
              />
            }
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="cog-outline"
            title="Advanced Notification Settings"
            subtitle="Morning/evening reminders, leaderboard updates, quiet hours"
            onPress={() => openModal('advancedNotifications')}
          />
        </SettingsSection>

  {/* Notes & Attachments removed per user request */}

        {/* Account */}
        <SettingsSection title="👤 Account">
          <SettingsItem
            icon="book-outline"
            title="View Tutorial"
            subtitle="Learn how to use the app"
            onPress={() => {
              Alert.alert(
                'View Tutorial',
                'Would you like to view the app tutorial again?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'View Tutorial', 
                    onPress: () => setHasSeenTutorial(false)
                  }
                ]
              );
            }}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() => setShowHelpModal(true)}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure? Your data will be saved.', [
                { text: 'Cancel' },
                { text: 'Sign Out', onPress: logout }
              ]);
            }}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="trash-outline"
            title="Clear All Data"
            subtitle={`Delete ${habits.length} habits permanently`}
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'This will permanently delete all habits and progress. This action cannot be undone.',
                [
                  { text: 'Cancel' },
                  { 
                    text: 'Delete All', 
                    style: 'destructive', 
                    onPress: () => {
                      Alert.alert(
                        'Final Confirmation',
                        'Are you absolutely sure? This will delete everything.',
                        [
                          { text: 'Cancel' },
                          { text: 'Yes, Delete Everything', style: 'destructive', onPress: clearAllHabits }
                        ]
                      );
                    }
                  }
                ]
              );
            }}
          />
        </SettingsSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={styles.appBrandingFooter}>
            <View style={styles.miniLogoFooter}>
              <ThemedText style={styles.miniLogoText}>H</ThemedText>
            </View>
            <ThemedText variant="primary" weight="bold" size="lg" style={styles.appNameFooter}>
              HABIT X
            </ThemedText>
          </View>
          <ThemedText variant="tertiary" size="sm" style={styles.appVersion}>
            Version 1.0.0 • Build Better Habits
          </ThemedText>
        </View>
      </ScrollView>

      {/* Notifications Modal */}
      <Modal
        visible={showModal === 'notifications'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">
                🔔 Notification Settings
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <ThemedText variant="secondary" size="base" style={styles.modalDescription}>
                Stay on track with smart daily reminders for building and completing habits.
              </ThemedText>
              
              <View style={styles.notificationInfoCard}>
                <View style={styles.notificationInfoItem}>
                  <Ionicons name="sunny" size={24} color={colors.status.warning} />
                  <View style={styles.notificationInfoText}>
                    <ThemedText variant="primary" weight="semibold" size="base">
                      Morning Reminder (7-8 AM)
                    </ThemedText>
                    <ThemedText variant="secondary" size="sm">
                      Start your day right! Get motivated to set new habits.
                    </ThemedText>
                  </View>
                </View>
                
                <ThemedDivider style={{ marginVertical: Theme.spacing.md }} />
                
                <View style={styles.notificationInfoItem}>
                  <Ionicons name="moon" size={24} color={colors.brand.primary} />
                  <View style={styles.notificationInfoText}>
                    <ThemedText variant="primary" weight="semibold" size="base">
                      Evening Reminder (7-8 PM)
                    </ThemedText>
                    <ThemedText variant="secondary" size="sm">
                      End your day strong! Complete remaining habits.
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={styles.notificationFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                  <ThemedText variant="tertiary" size="sm">Random timing feels natural</ThemedText>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                  <ThemedText variant="tertiary" size="sm">Motivational messages</ThemedText>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
                  <ThemedText variant="tertiary" size="sm">Smart streak reminders</ThemedText>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <Pressable 
                  style={[styles.modalButton, { backgroundColor: colors.background.tertiary }]}
                  onPress={closeModal}
                >
                  <ThemedText variant="primary" weight="medium">Close</ThemedText>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, { backgroundColor: colors.brand.primary }]}
                  onPress={async () => {
                    if (settings.notificationsEnabled) {
                      await scheduleDailyReminder();
                      Alert.alert(
                        'Notifications Active! 🔔', 
                        'You\'ll receive:\n\n🌅 Morning reminder (7-8 AM) to set new habits\n🌙 Evening reminder (7-8 PM) to complete habits\n\nStay consistent and build better habits!'
                      );
                    } else {
                      Alert.alert('Enable Notifications', 'Please enable notifications first to set up reminders.');
                    }
                    closeModal();
                  }}
                >
                  <ThemedText style={{ color: 'white' }} weight="medium">
                    {settings.notificationsEnabled ? 'Refresh Reminders' : 'Enable First'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ThemedCard>
        </View>
      </Modal>

      {/* Backup Progress Modal */}
      <Modal
        visible={isLoading}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={styles.loadingModal}>
            <ThemedText variant="primary" weight="medium" size="base">
              🔄 Processing...
            </ThemedText>
            <ThemedText variant="tertiary" size="sm" style={{ marginTop: 8 }}>
              Please wait while we handle your request
            </ThemedText>
          </ThemedCard>
        </View>
      </Modal>

      {/* Backup Management Modal */}
      <Modal
        visible={showModal === 'backup'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">
                💾 Backup & Restore
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <SettingsItem
                icon="cloud-upload-outline"
                title="Create Backup"
                subtitle={`Backup ${habits.length} habits and progress`}
                onPress={async () => {
                  closeModal();
                  await createBackup();
                }}
              />
              <ThemedDivider style={styles.divider} />
              <SettingsItem
                icon="cloud-download-outline"
                title="Restore from Backup"
                subtitle="Import previously saved data"
                onPress={async () => {
                  closeModal();
                  await restoreBackup();
                }}
              />
              <ThemedDivider style={styles.divider} />
              <SettingsItem
                icon="refresh-outline"
                title="Auto Backup"
                subtitle={settings.backupAuto ? "Weekly automatic backups" : "Manual backups only"}
                rightElement={
                  <Switch
                    value={settings.backupAuto}
                    onValueChange={() => saveSettings({ backupAuto: !settings.backupAuto })}
                  />
                }
              />
            </View>
          </ThemedCard>
        </View>
      </Modal>

      {/* Export/Import Modal */}
      <Modal
        visible={showModal === 'export'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">
                📊 Export & Import
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <SettingsItem
                icon="document-outline"
                title="Export to CSV"
                subtitle="Download spreadsheet with all habit data"
                onPress={async () => {
                  closeModal();
                  await exportToCSV();
                }}
              />
              <ThemedDivider style={styles.divider} />
              <SettingsItem
                icon="document-text-outline"
                title="Export to PDF"
                subtitle="Generate detailed progress report"
                onPress={() => {
                  closeModal();
                  Alert.alert('PDF Export', 'PDF export feature coming soon!');
                }}
                disabled
              />
              <ThemedDivider style={styles.divider} />
              <SettingsItem
                icon="cloud-upload-outline"
                title="Import Data"
                subtitle="Import habits from CSV file"
                onPress={async () => {
                  closeModal();
                  await importFromCSV();
                }}
              />
            </View>
          </ThemedCard>
        </View>
      </Modal>

      {/* Theme Customization Modal */}
      <Modal
        visible={showModal === 'theme'}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">
                🎨 Theme Settings
              </ThemedText>
              <Pressable onPress={closeModal} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            
            <View style={styles.modalBody}>
              <SettingsItem
                icon="sunny-outline"
                title="Light Mode"
                subtitle="Clean, bright interface"
                onPress={() => {
                  setThemeMode('light');
                  closeModal();
                }}
                rightElement={themeMode === 'light' ? <Ionicons name="checkmark" size={24} color={colors.brand.primary} /> : undefined}
              />
              <ThemedDivider style={styles.divider} />
              <SettingsItem
                icon="moon-outline"
                title="Dark Mode"
                subtitle="Easy on the eyes"
                onPress={() => {
                  setThemeMode('dark');
                  closeModal();
                }}
                rightElement={themeMode === 'dark' ? <Ionicons name="checkmark" size={24} color={colors.brand.primary} /> : undefined}
              />
            </View>
          </ThemedCard>
        </View>
      </Modal>

      {/* Advanced Notification Settings Modal */}
      <Modal
        visible={showModal === 'advancedNotifications'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <NotificationSettingsScreen onClose={closeModal} />
      </Modal>
      
  {/* Ad banner */}
  {/* <AdBanner /> */}
      
      {/* Help & FAQ Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedCard style={{...styles.modalContent, ...styles.helpModalContent}}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">
                ❓ Help & FAQ
              </ThemedText>
              <Pressable onPress={() => setShowHelpModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <View style={[styles.searchInputContainer, { backgroundColor: colors.background.tertiary }]}>
                  <Ionicons name="search" size={20} color={colors.text.tertiary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text.primary }]}
                    placeholder="Search help topics..."
                    placeholderTextColor={colors.text.tertiary}
                    value={helpSearchQuery}
                    onChangeText={setHelpSearchQuery}
                  />
                  {helpSearchQuery.length > 0 && (
                    <Pressable onPress={() => setHelpSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
                    </Pressable>
                  )}
                </View>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.faqScrollView}>
                {/* Getting Started */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    🚀 Getting Started
                  </ThemedText>

                  <FAQItem
                    question="How do I create my first habit?"
                    answer="Tap the + button on the home screen, choose a category, set a frequency, and give your habit a name. Your new habit will appear on your home screen ready to track!"
                    icon="add-circle"
                    isExpanded={expandedFAQ === 'create-habit'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'create-habit' ? null : 'create-habit')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="What categories are available for habits?"
                    answer="Choose from: Health & Fitness, Learning, Productivity, Mindfulness, Social, Hobbies, Finance, and Custom categories to organize your habits effectively."
                    icon="grid"
                    isExpanded={expandedFAQ === 'categories'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'categories' ? null : 'categories')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Tracking Habits */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    📊 Tracking Habits
                  </ThemedText>

                  <FAQItem
                    question="How do I mark a habit as completed?"
                    answer="Simply tap the checkbox next to any habit on your home screen. You'll earn XP and see your streak grow! Habits reset daily at midnight."
                    icon="checkmark-circle"
                    isExpanded={expandedFAQ === 'complete-habit'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'complete-habit' ? null : 'complete-habit')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="How are streaks calculated?"
                    answer="Streaks count consecutive days of habit completion. Missing a day resets the streak to 0. Perfect for building consistency!"
                    icon="flame"
                    isExpanded={expandedFAQ === 'streaks'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'streaks' ? null : 'streaks')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="Can I edit or delete habits?"
                    answer="Long press on any habit card to see options to edit or delete. Be careful - deleting is permanent and will reset your streak."
                    icon="create"
                    isExpanded={expandedFAQ === 'edit-habit'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'edit-habit' ? null : 'edit-habit')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Streaks */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    🏆 Streaks & Progress
                  </ThemedText>

                  <FAQItem
                    question="How do streaks work?"
                    answer="Complete habits daily to build streaks. The longer you maintain a habit, the higher your streak count grows. Streaks reset if you miss a day!"
                    icon="flame"
                    isExpanded={expandedFAQ === 'streaks'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'streaks' ? null : 'streaks')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="How do I track my progress?"
                    answer="Check the Stats tab to see your daily, weekly, and monthly progress. View completion rates, streak counts, and habit trends!"
                    icon="stats-chart"
                    isExpanded={expandedFAQ === 'progress'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'progress' ? null : 'progress')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Notifications */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    🔔 Notifications & Reminders
                  </ThemedText>

                  <FAQItem
                    question="How do I set up daily reminders?"
                    answer="Go to Settings → Smart Features → Notifications & Reminders. Enable notifications and set your preferred reminder time."
                    icon="notifications"
                    isExpanded={expandedFAQ === 'notifications'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'notifications' ? null : 'notifications')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="Why aren't my notifications working?"
                    answer="Check that notifications are enabled in your device settings for this app. Also ensure you've granted notification permissions."
                    icon="alert-circle"
                    isExpanded={expandedFAQ === 'notification-issues'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'notification-issues' ? null : 'notification-issues')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Data Management */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    💾 Data & Backup
                  </ThemedText>

                  <FAQItem
                    question="How do I backup my data?"
                    answer="Go to Settings → Data Management → Backup & Restore → Create Backup. Your habits and progress will be saved to a file."
                    icon="cloud-upload"
                    isExpanded={expandedFAQ === 'backup'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'backup' ? null : 'backup')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="Can I export my habit data?"
                    answer="Yes! Go to Settings → Data Management → Export & Import → Export to CSV to download your data as a spreadsheet."
                    icon="download"
                    isExpanded={expandedFAQ === 'export'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'export' ? null : 'export')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Troubleshooting */}
                <View style={styles.faqSection}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    🔧 Troubleshooting
                  </ThemedText>

                  <FAQItem
                    question="My streaks aren't updating correctly"
                    answer="Streaks reset if you miss a day. Check that you're completing habits before midnight in your local timezone."
                    icon="refresh"
                    isExpanded={expandedFAQ === 'streak-issues'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'streak-issues' ? null : 'streak-issues')}
                    searchQuery={helpSearchQuery}
                  />

                  <FAQItem
                    question="The app is running slowly"
                    answer="Try clearing your cache or restarting the app. If issues persist, check for app updates in your app store."
                    icon="speedometer"
                    isExpanded={expandedFAQ === 'performance'}
                    onToggle={() => setExpandedFAQ(expandedFAQ === 'performance' ? null : 'performance')}
                    searchQuery={helpSearchQuery}
                  />
                </View>

                {/* Contact Support */}
                <View style={[styles.faqSection, styles.contactSection]}>
                  <ThemedText variant="primary" weight="bold" size="lg" style={styles.faqSectionTitle}>
                    📞 Need More Help?
                  </ThemedText>

                  <ThemedCard variant="elevated" style={styles.contactCard}>
                    <ThemedText variant="primary" size="base" style={styles.contactText}>
                      Can't find what you're looking for? We're here to help!
                    </ThemedText>
                    <View style={styles.contactButtons}>
                      <Pressable style={[styles.contactButton, { backgroundColor: colors.brand.primary }]}>
                        <Ionicons name="mail" size={16} color="white" />
                        <ThemedText variant="inverse" size="sm" weight="medium" style={styles.contactButtonText}>
                          Email Support
                        </ThemedText>
                      </Pressable>
                      <Pressable style={[styles.contactButton, { backgroundColor: colors.background.tertiary }]}>
                        <Ionicons name="bug" size={16} color={colors.text.secondary} />
                        <ThemedText variant="primary" size="sm" weight="medium" style={styles.contactButtonText}>
                          Report Bug
                        </ThemedText>
                      </Pressable>
                    </View>
                  </ThemedCard>
                </View>
              </ScrollView>
            </View>
          </ThemedCard>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  scrollContent: { 
    padding: Theme.spacing.lg,
  },
  userCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.lg,
  },
  userDetails: {
    flex: 1,
  },
  memberSince: {
    marginTop: Theme.spacing.xs,
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '700' as any,
    color: Theme.colors.text.primary,
  },
  brandText: {
    fontWeight: '700' as any,
    letterSpacing: 0.8,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: Theme.spacing.md,
    marginLeft: Theme.spacing.sm,
  },
  sectionCard: {
    padding: 0,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.lg,
    minHeight: 60,
  },
  settingsItemDisabled: {
    opacity: 0.5,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    marginTop: 2,
  },
  divider: {
    marginLeft: 68,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xxl,
    gap: Theme.spacing.md,
  },
  appBrandingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  miniLogoFooter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5A317',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.sm,
  },
  miniLogoText: {
    fontSize: 14,
    fontWeight: '900' as any,
    color: '#FFFFFF',
  },
  appNameFooter: {
    letterSpacing: 1.2,
  },
  appVersion: {
    // Styling handled by ThemedText
  },
  copyright: {
    // Styling handled by ThemedText
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: Theme.borderRadius.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.md,
  },
  modalCloseButton: {
    padding: Theme.spacing.sm,
  },
  modalBody: {
    padding: Theme.spacing.lg,
    paddingTop: 0,
  },
  modalDescription: {
    marginBottom: Theme.spacing.lg,
  },
  timePickerContainer: {
    marginBottom: Theme.spacing.lg,
  },
  timeInput: {
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  loadingModal: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
    minWidth: 200,
  },
  helpModalContent: {
    maxHeight: '90%',
  },
  searchContainer: {
    marginBottom: Theme.spacing.lg,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Theme.spacing.xs,
  },
  faqScrollView: {
    maxHeight: 400,
  },
  faqSection: {
    marginBottom: Theme.spacing.xl,
  },
  faqSectionTitle: {
    marginBottom: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.sm,
  },
  faqItem: {
    backgroundColor: 'transparent',
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    overflow: 'hidden',
  },
  faqItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Theme.spacing.md,
    minHeight: 60,
  },
  faqItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  faqQuestion: {
    flex: 1,
    lineHeight: 20,
  },
  faqAnswer: {
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.md,
    paddingTop: 0,
    lineHeight: 20,
    marginLeft: 52, // Align with question text
  },
  contactSection: {
    marginBottom: Theme.spacing.md,
  },
  contactCard: {
    padding: Theme.spacing.lg,
    alignItems: 'center',
  },
  contactText: {
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
    lineHeight: 20,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    width: '100%',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.sm,
  },
  contactButtonText: {
    fontSize: 14,
  },
  notificationInfoCard: {
    marginVertical: Theme.spacing.md,
  },
  notificationInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Theme.spacing.md,
  },
  notificationInfoText: {
    flex: 1,
    gap: Theme.spacing.xs,
  },
  notificationFeatures: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
  },
});
