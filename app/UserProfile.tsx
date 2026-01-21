import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, ThemedCard } from '../components/Themed';
import { UserAvatar } from '../components/friends/UserAvatar';
import { useTheme } from '../lib/themeContext';
import { useFriends } from '../lib/friendsContext';
import { UserProfile } from '../lib/friendsApi';
import Theme from '../lib/theme';
import { FEATURES } from '../lib/config';

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { sendFriendRequest, removeFriend, getUserProfile } = useFriends();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = params.userId as string;
  const profileData = params.profileData as string;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (profileData) {
          // Use provided profile data
          const parsedProfile = JSON.parse(profileData);
          setProfile(parsedProfile);
        } else if (userId) {
          // Fetch profile data
          const fetchedProfile = await getUserProfile(userId);
          setProfile(fetchedProfile);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId, profileData, getUserProfile]);

  const handleSendFriendRequest = async () => {
    if (!profile) return;

    Alert.alert(
      'Send Friend Request',
      `Send a friend request to ${profile.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await sendFriendRequest(profile.id);
              setProfile(prev => prev ? { ...prev, friendshipStatus: 'request_sent' } : null);
              Alert.alert('Success', `Friend request sent to ${profile.username}!`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to send friend request');
            }
          },
        },
      ]
    );
  };

  const handleRemoveFriend = async () => {
    if (!profile) return;

    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${profile.username} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(profile.id);
              setProfile(prev => prev ? { ...prev, friendshipStatus: 'none' } : null);
              Alert.alert('Success', `${profile.username} has been removed from your friends`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };



  const getFriendshipActionButton = () => {
    if (!profile || profile.friendshipStatus === 'self') return null;

    // Hide friend action buttons entirely when the feature is disabled
    if (!FEATURES.friendRequests) return null;

    switch (profile.friendshipStatus) {
      case 'none':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.brand.primary }]}
            onPress={handleSendFriendRequest}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add" size={20} color="white" />
            <ThemedText variant="inverse" size="base" weight="semibold" style={styles.actionButtonText}>
              Add Friend
            </ThemedText>
          </TouchableOpacity>
        );
      case 'request_sent':
        return (
          <View style={[styles.actionButton, { backgroundColor: colors.status.warning }]}>
            <Ionicons name="hourglass" size={20} color="white" />
            <ThemedText variant="inverse" size="base" weight="semibold" style={styles.actionButtonText}>
              Request Sent
            </ThemedText>
          </View>
        );
      case 'request_received':
        return (
          <View style={[styles.actionButton, { backgroundColor: colors.brand.primary }]}>
            <Ionicons name="mail" size={20} color="white" />
            <ThemedText variant="inverse" size="base" weight="semibold" style={styles.actionButtonText}>
              Pending Request
            </ThemedText>
          </View>
        );
      case 'friends':
        return (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.status.error }]}
            onPress={handleRemoveFriend}
            activeOpacity={0.8}
          >
            <Ionicons name="person-remove" size={20} color="white" />
            <ThemedText variant="inverse" size="base" weight="semibold" style={styles.actionButtonText}>
              Remove Friend
            </ThemedText>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

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
            {profile?.username || 'User Profile'}
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );

  const renderProfileContent = () => {
    if (!profile) return null;

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <ThemedCard variant="elevated" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <UserAvatar 
              username={profile.username}
              size="large"
              style={styles.profileAvatar}
            />
            <View style={styles.profileInfo}>
              <ThemedText variant="primary" size="xxl" weight="bold">
                {profile.username}
              </ThemedText>
              {profile.bio && (
                <ThemedText variant="secondary" size="base" style={styles.bio}>
                  {profile.bio}
                </ThemedText>
              )}
              <ThemedText variant="tertiary" size="xs" style={styles.joinDate}>
                Joined {new Date(profile.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>
          </View>
          
          {/* Action Button */}
          <View style={styles.actionContainer}>
            {getFriendshipActionButton()}
          </View>
        </ThemedCard>

        {/* Habit Stats */}
        <ThemedCard variant="elevated" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="bar-chart" size={24} color={colors.brand.primary} />
            <ThemedText variant="primary" size="lg" weight="bold" style={styles.statsTitle}>
              Habit Statistics
            </ThemedText>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.brand.primary}20` }]}>
                <Ionicons name="list" size={20} color={colors.brand.primary} />
              </View>
              <ThemedText variant="primary" size="xl" weight="bold">
                {profile.habitStats.totalHabits}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Total Habits
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.status.success}20` }]}>
                <Ionicons name="checkmark-circle" size={20} color={colors.status.success} />
              </View>
              <ThemedText variant="primary" size="xl" weight="bold">
                {profile.habitStats.completedToday}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Completed Today
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.status.warning}20` }]}>
                <Ionicons name="flash" size={20} color={colors.status.warning} />
              </View>
              <ThemedText variant="primary" size="xl" weight="bold">
                {profile.habitStats.activeStreaks}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Active Streaks
              </ThemedText>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.status.info}20` }]}>
                <Ionicons name="trophy" size={20} color={colors.status.info} />
              </View>
              <ThemedText variant="primary" size="xl" weight="bold">
                {profile.habitStats.longestStreak}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Longest Streak
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        {/* Privacy Note */}
        {profile.friendshipStatus !== 'friends' && profile.friendshipStatus !== 'self' && (
          <ThemedCard variant="outlined" style={styles.privacyCard}>
            <View style={styles.privacyContent}>
              <Ionicons name="lock-closed" size={24} color={colors.text.tertiary} />
              <ThemedText variant="tertiary" size="sm" style={styles.privacyText}>
                More details are visible to friends only
              </ThemedText>
            </View>
          </ThemedCard>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <ThemedText variant="secondary" size="base" style={styles.loadingText}>
            Loading profile...
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.status.error} />
          <ThemedText variant="primary" size="lg" weight="semibold" style={styles.errorTitle}>
            Failed to Load Profile
          </ThemedText>
          <ThemedText variant="secondary" size="base" style={styles.errorMessage}>
            {error}
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <ThemedText variant="inverse" size="base" weight="semibold">
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {renderHeader()}
      {renderProfileContent()}
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
  profileCard: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
  },

  profileAvatar: {
    marginRight: Theme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: Theme.spacing.sm,
  },
  xpText: {
    marginLeft: Theme.spacing.sm,
  },
  bio: {
    marginBottom: Theme.spacing.sm,
    lineHeight: 20,
  },
  joinDate: {
    marginTop: 4,
  },
  actionContainer: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.sm,
  },
  actionButtonText: {
    marginLeft: 4,
  },
  statsCard: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.xl,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  statsTitle: {
    marginLeft: Theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.sm,
  },
  privacyCard: {
    marginTop: Theme.spacing.lg,
    padding: Theme.spacing.lg,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    marginLeft: Theme.spacing.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  errorTitle: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
  },
  bottomSpacing: {
    height: Theme.spacing.xl,
  },
});