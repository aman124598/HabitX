import React, { useCallback } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FriendRequestManager } from '../components/friends/FriendRequestManager';
import { useFriends } from '../lib/friendsContext';
import { useTheme } from '../lib/themeContext';
import { friendNotificationService } from '../lib/friendNotificationService';

export default function FriendRequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { getUserProfile } = useFriends();

  const handleNavigateToProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      router.push({
        pathname: '/UserProfile',
        params: { userId, profileData: JSON.stringify(profile) },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to load user profile');
    }
  }, [getUserProfile, router]);

  const handleNavigateToSearch = useCallback(() => {
    router.push('/FriendSearch');
  }, [router]);

  const handleGoBack = useCallback(() => {
    // Clear friend request notifications when leaving this screen
    friendNotificationService.clearFriendRequestNotifications();
    router.back();
  }, [router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <FriendRequestManager
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateToSearch={handleNavigateToSearch}
      />
    </SafeAreaView>
  );
}