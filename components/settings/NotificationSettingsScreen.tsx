import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { enhancedNotificationService, NotificationSettings, DEFAULT_SETTINGS } from '../../lib/enhancedNotificationService';
import { useTheme } from '../../lib/themeContext';

interface NotificationSettingsScreenProps {
  onClose?: () => void;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ onClose }) => {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [showTimePicker, setShowTimePicker] = useState<{
    type: 'morning' | 'evening' | 'quietStart' | 'quietEnd' | null;
    show: boolean;
  }>({ type: null, show: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = enhancedNotificationService.getSettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    try {
      await enhancedNotificationService.saveSettings({ [key]: value });
      
      // If enabling notifications for the first time, schedule them
      if (key === 'enabled' && value) {
        await enhancedNotificationService.scheduleDailyReminders();
      }
    } catch (error) {
      console.error('Failed to update notification setting:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker({ type: null, show: false });
    }

    if (selectedTime && showTimePicker.type) {
      const timeString = selectedTime.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });

      let settingKey: keyof NotificationSettings;
      switch (showTimePicker.type) {
        case 'morning':
          settingKey = 'morningTime';
          break;
        case 'evening':
          settingKey = 'eveningTime';
          break;
        case 'quietStart':
          settingKey = 'quietHoursStart';
          break;
        case 'quietEnd':
          settingKey = 'quietHoursEnd';
          break;
        default:
          return;
      }

      updateSetting(settingKey, timeString);
    }

    if (Platform.OS === 'ios') {
      setShowTimePicker({ type: null, show: false });
    }
  };

  const showTimePickerModal = (type: 'morning' | 'evening' | 'quietStart' | 'quietEnd') => {
    setShowTimePicker({ type, show: true });
  };

  const parseTime = (timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (timeString: string): string => {
    const date = parseTime(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const requestPermissions = async () => {
    const granted = await enhancedNotificationService.requestPermissions();
    if (!granted) {
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive habit reminders.',
        [{ text: 'OK' }]
      );
    }
  };

  const testNotification = async () => {
    try {
      await enhancedNotificationService.sendImmediateNotification(
        '🧪 Test Notification',
        'This is a test notification from your habit tracker!',
        { type: 'test' }
      );
      Alert.alert('Success', 'Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please check your settings.');
    }
  };

  const SettingRow: React.FC<{
    title: string;
    subtitle?: string;
    icon: string;
    children: React.ReactNode;
  }> = ({ title, subtitle, icon, children }) => (
    <View style={[styles.settingRow, { backgroundColor: colors.card.background }]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={colors.brand.primary} style={styles.settingIcon} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.text.secondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {children}
    </View>
  );

  const TimeButton: React.FC<{
    time: string;
    onPress: () => void;
  }> = ({ time, onPress }) => (
    <TouchableOpacity
      style={[styles.timeButton, { backgroundColor: colors.brand.primary + '20', borderColor: colors.brand.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.timeButtonText, { color: colors.brand.primary }]}>
        {formatTime(time)}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.loadingText, { color: colors.text.primary }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.card.background, borderBottomColor: colors.border.light }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Notification Settings</Text>
        <TouchableOpacity onPress={testNotification} style={styles.testButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Master Enable/Disable */}
        <View style={styles.section}>
          <SettingRow
            title="Enable Notifications"
            subtitle="Master switch for all notifications"
            icon="notifications"
          >
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: colors.border.light, true: colors.brand.primary + '40' }}
              thumbColor={settings.enabled ? colors.brand.primary : colors.text.secondary}
            />
          </SettingRow>
        </View>

        {settings.enabled && (
          <>
            {/* Reminder Types */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Reminder Types</Text>
              
              <SettingRow
                title="Morning Reminders"
                subtitle="Start your day with motivation"
                icon="sunny"
              >
                <Switch
                  value={settings.morningReminders}
                  onValueChange={(value) => updateSetting('morningReminders', value)}
                  trackColor={{ false: colors.border.light, true: colors.brand.primary + '40' }}
                  thumbColor={settings.morningReminders ? colors.brand.primary : colors.text.secondary}
                />
              </SettingRow>

              <SettingRow
                title="Evening Reminders"
                subtitle="Complete your habits before bed"
                icon="moon"
              >
                <Switch
                  value={settings.eveningReminders}
                  onValueChange={(value) => updateSetting('eveningReminders', value)}
                  trackColor={{ false: colors.border.light, true: colors.brand.primary + '40' }}
                  thumbColor={settings.eveningReminders ? colors.brand.primary : colors.text.secondary}
                />
              </SettingRow>

              <SettingRow
                title="Streak Reminders"
                subtitle="Stay motivated to maintain streaks"
                icon="flame"
              >
                <Switch
                  value={settings.streakReminders}
                  onValueChange={(value) => updateSetting('streakReminders', value)}
                  trackColor={{ false: colors.border.light, true: colors.brand.primary + '40' }}
                  thumbColor={settings.streakReminders ? colors.brand.primary : colors.text.secondary}
                />
              </SettingRow>

              <SettingRow
                title="Motivational Messages"
                subtitle="Receive encouraging messages"
                icon="heart"
              >
                <Switch
                  value={settings.motivationalMessages}
                  onValueChange={(value) => updateSetting('motivationalMessages', value)}
                  trackColor={{ false: colors.border.light, true: colors.brand.primary + '40' }}
                  thumbColor={settings.motivationalMessages ? colors.brand.primary : colors.text.secondary}
                />
              </SettingRow>
            </View>

            {/* Timing Settings */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Timing</Text>
              
              {settings.morningReminders && (
                <SettingRow
                  title="Morning Time"
                  subtitle="When to send morning reminders"
                  icon="time"
                >
                  <TimeButton
                    time={settings.morningTime}
                    onPress={() => showTimePickerModal('morning')}
                  />
                </SettingRow>
              )}

              {settings.eveningReminders && (
                <SettingRow
                  title="Evening Time"
                  subtitle="When to send evening reminders"
                  icon="time"
                >
                  <TimeButton
                    time={settings.eveningTime}
                    onPress={() => showTimePickerModal('evening')}
                  />
                </SettingRow>
              )}
            </View>

            {/* Quiet Hours */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Quiet Hours</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.text.secondary }]}>
                No notifications will be sent during these hours
              </Text>
              
              <SettingRow
                title="Quiet Hours Start"
                subtitle="When to start quiet hours"
                icon="moon"
              >
                <TimeButton
                  time={settings.quietHoursStart}
                  onPress={() => showTimePickerModal('quietStart')}
                />
              </SettingRow>

              <SettingRow
                title="Quiet Hours End"
                subtitle="When to end quiet hours"
                icon="sunny"
              >
                <TimeButton
                  time={settings.quietHoursEnd}
                  onPress={() => showTimePickerModal('quietEnd')}
                />
              </SettingRow>
            </View>

            {/* Permissions */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.permissionButton, { backgroundColor: colors.brand.primary }]}
                onPress={requestPermissions}
              >
                <Ionicons name="shield-checkmark" size={20} color="white" style={styles.permissionIcon} />
                <Text style={styles.permissionButtonText}>Check Permissions</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Time Picker Modal */}
      {showTimePicker.show && showTimePicker.type && (
        <DateTimePicker
          value={parseTime(
            showTimePicker.type === 'morning' ? settings.morningTime :
            showTimePicker.type === 'evening' ? settings.eveningTime :
            showTimePicker.type === 'quietStart' ? settings.quietHoursStart :
            settings.quietHoursEnd
          )}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    ...Platform.select({
      ios: {
        paddingTop: 48,
      },
      android: {
        paddingTop: 16,
      },
    }),
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  testButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionIcon: {
    marginRight: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;