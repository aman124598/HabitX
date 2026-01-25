import * as React from "react";
import { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert, Switch, TextInput, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const FS: any = FileSystem;
import * as Sharing from 'expo-sharing';
import SafeNotifications from '../../lib/safeNotifications';
import { ThemedView, ThemedText, ThemedDivider } from "../../components/Themed";
import { useHabits } from "../../hooks/useHabits";
import { useAuth } from "../../lib/authContext";
import { useTheme } from "../../lib/themeContext";
import { useTutorial } from "../../lib/tutorialContext";
import { Theme } from "../../lib/theme";
import { habitsService } from "../../lib/habitsApi";
import { useRouter } from 'expo-router';
import NotificationSettingsScreen from "../../components/settings/NotificationSettingsScreen";

const SETTINGS_KEYS = {
  NOTIFICATIONS_ENABLED: 'settings:notificationsEnabled',
  BACKUP_AUTO: 'settings:backupAuto',
  DAILY_REMINDER_TIME: 'settings:dailyReminderTime',
};

SafeNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

interface AppSettings {
  notificationsEnabled: boolean;
  backupAuto: boolean;
  dailyReminderTime: string;
}

// Clean settings item component
function SettingsItem({ 
  icon, 
  title, 
  subtitle, 
  onPress, 
  rightElement,
  danger = false,
}: { 
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  
  return (
    <Pressable 
      onPress={onPress} 
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && { opacity: 0.7 }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : colors.background.tertiary }]}>
        <Ionicons 
          name={icon} 
          size={20} 
          color={danger ? colors.status.error : colors.brand.primary} 
        />
      </View>
      <View style={styles.itemContent}>
        <ThemedText 
          variant="primary" 
          weight="medium" 
          size="base"
          style={danger ? { color: colors.status.error } : undefined}
        >
          {title}
        </ThemedText>
        {subtitle && (
          <ThemedText variant="tertiary" size="sm" style={styles.itemSubtitle}>
            {subtitle}
          </ThemedText>
        )}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
      )}
    </Pressable>
  );
}

// Section header component
function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <ThemedText 
      variant="tertiary" 
      weight="semibold" 
      size="xs" 
      style={[styles.sectionHeader, { color: colors.text.tertiary }]}
    >
      {title.toUpperCase()}
    </ThemedText>
  );
}

// Card wrapper component
function SettingsCard({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
      {children}
    </View>
  );
}

export default function SettingsTab() {
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const { habits, refresh, clearAllHabits } = useHabits();
  const { user, logout } = useAuth();
  const { setHasSeenTutorial } = useTutorial();
  const router = useRouter();
  
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: false,
    backupAuto: false,
    dailyReminderTime: '09:00',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSearchQuery, setHelpSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const closeModal = () => setShowModal(null);

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

  const handleNotifications = async () => {
    if (!settings.notificationsEnabled) {
      const { status } = await SafeNotifications.requestPermissionsAsync();
      if (status === 'granted') {
        await saveSettings({ notificationsEnabled: true });
        await scheduleDailyReminder();
        Alert.alert('Success', 'Notifications enabled!');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in device settings.');
      }
    } else {
      await saveSettings({ notificationsEnabled: false });
      await SafeNotifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('Notifications Disabled', 'You will no longer receive reminders.');
    }
  };

  const scheduleDailyReminder = async () => {
    try {
      const { notificationService } = await import('../../lib/notificationService');
      if (settings.notificationsEnabled) {
        await notificationService.initializeDailyNotifications();
      } else {
        await notificationService.cancelAllNotifications();
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  };

  const createBackup = async () => {
    try {
      setIsLoading(true);
      const backup = {
        version: '1.0.1',
        timestamp: new Date().toISOString(),
        habits: habits,
        settings: settings,
      };
      
      const exportsDir = `${FS.documentDirectory}HabitTracker/exports/`;
      try {
        const dirInfo = await FS.getInfoAsync(exportsDir);
        if (!dirInfo.exists) {
          await FS.makeDirectoryAsync(exportsDir, { intermediates: true });
        }
      } catch (e) {}

      const fileName = `habit_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const fileUri = `${exportsDir}${fileName}`;
      await FS.writeAsStringAsync(fileUri, JSON.stringify(backup, null, 2), { encoding: 'utf8' });

      try {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, { dialogTitle: 'Share Habit Backup' });
        }
      } catch (shareErr) {}

      Alert.alert('Backup Created', `${habits.length} habits backed up successfully.`);
    } catch (error) {
      Alert.alert('Backup Failed', 'Could not create backup.');
    } finally {
      setIsLoading(false);
    }
  };

  const restoreBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const backup = JSON.parse(content);
        if (backup?.habits) {
          Alert.alert(
            'Restore Backup',
            `Replace ${habits.length} habits with ${backup.habits.length} from backup?`,
            [
              { text: 'Cancel' },
              {
                text: 'Restore',
                style: 'destructive',
                onPress: async () => {
                  await clearAllHabits();
                  await habitsService.importHabits(backup.habits);
                  await refresh();
                  Alert.alert('Success', 'Backup restored!');
                }
              }
            ]
          );
        }
      }
    } catch (error) {
      Alert.alert('Restore Failed', 'Invalid backup file.');
    }
  };

  const exportToCSV = async () => {
    try {
      setIsLoading(true);
      const csvHeaders = ['Name', 'Category', 'Frequency', 'Streak', 'Last Completed'];
      const csvRows = habits.map(habit => [
        habit.name,
        habit.category,
        habit.frequency,
        habit.streak || 0,
        habit.lastCompletedOn || 'Never',
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      
      const exportsDir = `${FS.documentDirectory}HabitTracker/exports/`;
      try {
        const dirInfo = await FS.getInfoAsync(exportsDir);
        if (!dirInfo.exists) await FS.makeDirectoryAsync(exportsDir, { intermediates: true });
      } catch (e) {}

      const fileName = `habits_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
      const fileUri = `${exportsDir}${fileName}`;
      await FS.writeAsStringAsync(fileUri, csvContent, { encoding: 'utf8' });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      Alert.alert('Export Complete', `${habits.length} habits exported.`);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export habits.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.primary }]}>
        <ThemedText variant="primary" weight="bold" size="xxxl">Settings</ThemedText>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card.background, borderColor: colors.border.light }]}>
          <View style={[styles.avatar, { backgroundColor: colors.brand.primary }]}>
            <ThemedText style={styles.avatarText}>
              {(user?.username || 'U').charAt(0).toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText variant="primary" weight="bold" size="xl">
              {user?.username || 'User'}
            </ThemedText>
            <ThemedText variant="tertiary" size="sm">
              {user?.email || 'No email'}
            </ThemedText>
            <View style={styles.statsRow}>
              <View style={[styles.statBadge, { backgroundColor: colors.background.tertiary }]}>
                <ThemedText variant="primary" weight="semibold" size="sm">
                  {habits.length} habits
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <SectionHeader title="Notifications" />
        <SettingsCard>
          <SettingsItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle={settings.notificationsEnabled ? 'Enabled' : 'Disabled'}
            rightElement={
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleNotifications}
                trackColor={{ false: colors.background.tertiary, true: colors.brand.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="time-outline"
            title="Reminder Settings"
            subtitle="Morning & evening reminders"
            onPress={() => setShowModal('advancedNotifications')}
          />
        </SettingsCard>

        {/* Appearance Section */}
        <SectionHeader title="Appearance" />
        <SettingsCard>
          <SettingsItem
            icon={isDark ? "moon" : "sunny-outline"}
            title="Theme"
            subtitle={isDark ? 'Dark' : 'Light'}
            onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
            rightElement={
              <View style={[styles.themeBadge, { backgroundColor: colors.background.tertiary }]}>
                <Ionicons 
                  name={isDark ? "moon" : "sunny"} 
                  size={16} 
                  color={colors.brand.primary} 
                />
              </View>
            }
          />
        </SettingsCard>

        {/* Data Section */}
        <SectionHeader title="Data Management" />
        <SettingsCard>
          <SettingsItem
            icon="cloud-upload-outline"
            title="Create Backup"
            subtitle={`Backup ${habits.length} habits`}
            onPress={createBackup}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="cloud-download-outline"
            title="Restore Backup"
            subtitle="Import from file"
            onPress={restoreBackup}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="download-outline"
            title="Export to CSV"
            subtitle="Download spreadsheet"
            onPress={exportToCSV}
          />
        </SettingsCard>

        {/* Support Section */}
        <SectionHeader title="Support" />
        <SettingsCard>
          <SettingsItem
            icon="book-outline"
            title="View Tutorial"
            subtitle="Learn how to use the app"
            onPress={() => {
              Alert.alert('View Tutorial', 'Show the tutorial again?', [
                { text: 'Cancel' },
                { text: 'View', onPress: () => setHasSeenTutorial(false) }
              ]);
            }}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="help-circle-outline"
            title="Help & FAQ"
            subtitle="Get answers to common questions"
            onPress={() => setShowHelpModal(true)}
          />
        </SettingsCard>

        {/* Account Section */}
        <SectionHeader title="Account" />
        <SettingsCard>
          <SettingsItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={() => {
              Alert.alert('Sign Out', 'Are you sure?', [
                { text: 'Cancel' },
                { text: 'Sign Out', onPress: logout }
              ]);
            }}
          />
          <ThemedDivider style={styles.divider} />
          <SettingsItem
            icon="trash-outline"
            title="Clear All Data"
            subtitle="Delete all habits permanently"
            danger
            onPress={() => {
              Alert.alert('Clear All Data', 'This cannot be undone.', [
                { text: 'Cancel' },
                { 
                  text: 'Delete All', 
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert('Confirm', 'Are you absolutely sure?', [
                      { text: 'Cancel' },
                      { text: 'Yes, Delete', style: 'destructive', onPress: clearAllHabits }
                    ]);
                  }
                }
              ]);
            }}
          />
        </SettingsCard>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Image 
            source={require('../../assets/images/appicon.png')} 
            style={styles.logoMini}
            resizeMode="contain"
          />
          <ThemedText variant="primary" weight="bold" size="lg">HABIT X</ThemedText>
          <ThemedText variant="tertiary" size="sm">Version 1.0.1</ThemedText>
        </View>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={isLoading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingBox, { backgroundColor: colors.card.background }]}>
            <ThemedText variant="primary" weight="medium">Processing...</ThemedText>
          </View>
        </View>
      </Modal>

      {/* Advanced Notifications Modal */}
      <Modal
        visible={showModal === 'advancedNotifications'}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <NotificationSettingsScreen onClose={closeModal} />
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={showHelpModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHelpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.helpModal, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.modalHeader}>
              <ThemedText variant="primary" weight="bold" size="xl">Help & FAQ</ThemedText>
              <Pressable onPress={() => setShowHelpModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </Pressable>
            </View>
            
            <View style={[styles.searchBox, { backgroundColor: colors.background.tertiary }]}>
              <Ionicons name="search" size={18} color={colors.text.tertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Search..."
                placeholderTextColor={colors.text.tertiary}
                value={helpSearchQuery}
                onChangeText={setHelpSearchQuery}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.faqList}>
              {[
                { q: 'How do I create a habit?', a: 'Tap the + button on the home screen, choose a category, and give your habit a name.', id: '1' },
                { q: 'How do streaks work?', a: 'Complete habits daily to build streaks. Missing a day resets your streak to 0.', id: '2' },
                { q: 'How do I set up reminders?', a: 'Enable notifications in Settings, then configure your preferred reminder times.', id: '3' },
                { q: 'Can I export my data?', a: 'Yes! Go to Data Management and tap Export to CSV.', id: '4' },
                { q: 'How do I restore a backup?', a: 'Go to Data Management, tap Restore Backup, and select your backup file.', id: '5' },
              ].filter(item => 
                !helpSearchQuery || 
                item.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
                item.a.toLowerCase().includes(helpSearchQuery.toLowerCase())
              ).map((item) => (
                <Pressable 
                  key={item.id} 
                  style={[styles.faqItem, { backgroundColor: colors.background.tertiary }]}
                  onPress={() => setExpandedFAQ(expandedFAQ === item.id ? null : item.id)}
                >
                  <View style={styles.faqHeader}>
                    <ThemedText variant="primary" weight="medium" size="base" style={styles.faqQ}>
                      {item.q}
                    </ThemedText>
                    <Ionicons 
                      name={expandedFAQ === item.id ? "chevron-up" : "chevron-down"} 
                      size={18} 
                      color={colors.text.tertiary} 
                    />
                  </View>
                  {expandedFAQ === item.id && (
                    <ThemedText variant="secondary" size="sm" style={styles.faqA}>
                      {item.a}
                    </ThemedText>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
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
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
  },
  itemSubtitle: {
    marginTop: 2,
  },
  divider: {
    marginLeft: 66,
  },
  themeBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  logoMini: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: 24,
    borderRadius: 12,
    minWidth: 150,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  helpModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeBtn: {
    padding: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  faqList: {
    flex: 1,
  },
  faqItem: {
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQ: {
    flex: 1,
    marginRight: 12,
  },
  faqA: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    lineHeight: 20,
  },
});
