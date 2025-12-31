import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText, ThemedCard } from '../components/Themed';
import { UserAvatar } from '../components/friends/UserAvatar';
import { useFriendActions } from '../hooks/useFriendActions';
import { useTheme } from '../lib/themeContext';
import { useFriends } from '../lib/friendsContext';
import { toastService } from '../lib/toastService';
import Theme from '../lib/theme';
import { FEATURES } from '../lib/config';

export default function FriendSearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    searchResults,
    isLoading,
    error,
    searchUsers,
    getUserProfile,
    clearError,
    clearSearchResults,
  } = useFriends();

  const { sendFriendRequestWithConfirm } = useFriendActions();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      clearSearchResults();
      return;
    }

    try {
      setIsSearching(true);
      await searchUsers(query.trim());
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchUsers, clearSearchResults]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
    }, 500);
  }, [performSearch]);

  const handleSendFriendRequest = useCallback(async (userId: string, username: string) => {
    await sendFriendRequestWithConfirm(userId, username);
  }, [sendFriendRequestWithConfirm]);

  const handleViewProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      router.push({
        pathname: '/UserProfile',
        params: { userId, profileData: JSON.stringify(profile) },
      });
    } catch (error: any) {
      if (error.message?.includes('private') || error.message?.includes('privacy')) {
        toastService.profilePrivate('Profile is Private');
      } else {
        toastService.error('Profile Error', 'Failed to load user profile. Please try again.');
      }
    }
  }, [getUserProfile, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'friends':
        return colors.status.success;
      case 'request_sent':
        return colors.status.warning;
      case 'request_received':
        return colors.status.info;
      case 'blocked':
        return colors.status.error;
      case 'self':
        return colors.brand.primary;
      default:
        return colors.text.secondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'friends':
        return 'Friends';
      case 'request_sent':
        return 'Request Sent';
      case 'request_received':
        return 'Request Received';
      case 'blocked':
        return 'Blocked';
      case 'self':
        return 'Your Profile';
      default:
        return 'Not Connected';
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
            Find Friends
          </ThemedText>
          <ThemedText variant="inverse" size="sm" style={styles.subtitle}>
            Search by username or email
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
        <Ionicons name="search" size={20} color={colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search users..."
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {isSearching && (
          <ActivityIndicator size="small" color={colors.brand.primary} style={styles.searchLoader} />
        )}
      </View>
    </View>
  );

  const renderUserItem = (user: any) => {
    const canSendRequest = user.friendshipStatus === 'none';
    const isFriend = user.friendshipStatus === 'friends';
    const requestSent = user.friendshipStatus === 'request_sent';
    const requestReceived = user.friendshipStatus === 'request_received';
    const isBlocked = user.friendshipStatus === 'blocked';
    const isSelf = user.friendshipStatus === 'self';
    
    return (
      <ThemedCard key={user.id} variant="elevated" style={styles.userCard}>
        <TouchableOpacity
          style={styles.userContent}
          onPress={(isFriend || isSelf) ? () => handleViewProfile(user.id) : undefined}
          activeOpacity={(isFriend || isSelf) ? 0.8 : 1}
        >
          <View style={styles.userInfo}>
            <UserAvatar 
              username={user.username}
              level={user.level}
              size="medium"
              showLevel
            />
            <View style={styles.userDetails}>
              <ThemedText variant="primary" size="lg" weight="semibold">
                {user.username}
                {isSelf && (
                  <ThemedText variant="accent" size="sm"> (You)</ThemedText>
                )}
              </ThemedText>
              <ThemedText variant="secondary" size="sm">
                Level {user.level} • {user.totalXP.toLocaleString()} XP
              </ThemedText>
              {user.bio && (
                <ThemedText variant="tertiary" size="xs" style={styles.bio}>
                  {user.bio}
                </ThemedText>
              )}
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(user.friendshipStatus)}20` },
                  ]}
                >
                  <ThemedText
                    variant="tertiary"
                    size="xs"
                    weight="medium"
                    style={{ color: getStatusColor(user.friendshipStatus) }}
                  >
                    {getStatusText(user.friendshipStatus)}
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.userActions}>
            {canSendRequest && FEATURES.friendRequests && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.brand.primary }]}
                onPress={() => handleSendFriendRequest(user.id, user.username)}
                activeOpacity={0.8}
              >
                <Ionicons name="person-add" size={20} color="white" />
              </TouchableOpacity>
            )}
            {requestSent && (
              <TouchableOpacity
                style={[styles.sentButton, { backgroundColor: colors.status.warning }]}
                disabled
              >
                <Ionicons name="time" size={20} color="white" />
              </TouchableOpacity>
            )}
            {requestReceived && (
              <TouchableOpacity
                style={[styles.receivedButton, { backgroundColor: colors.status.info }]}
                onPress={() => {
                  toastService.info('Friend Request Pending', `${user.username} sent you a friend request. Check your friend requests to respond.`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="mail" size={20} color="white" />
              </TouchableOpacity>
            )}
            {(isFriend || isSelf) && (
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => handleViewProfile(user.id)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye" size={20} color={colors.brand.primary} />
              </TouchableOpacity>
            )}
            {isBlocked && (
              <TouchableOpacity
                style={[styles.blockedButton, { backgroundColor: colors.status.error }]}
                disabled
              >
                <Ionicons name="ban" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </ThemedCard>
    );
  };

  const renderContent = () => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={colors.text.tertiary} />
          <ThemedText variant="secondary" size="lg" weight="semibold" style={styles.emptyTitle}>
            Start Searching
          </ThemedText>
          <ThemedText variant="tertiary" size="base" style={styles.emptyDescription}>
            Enter a username or email to find friends
          </ThemedText>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <ThemedText variant="secondary" size="base" style={styles.loadingText}>
            Searching...
          </ThemedText>
        </View>
      );
    }

    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color={colors.text.tertiary} />
          <ThemedText variant="secondary" size="lg" weight="semibold" style={styles.emptyTitle}>
            No Users Found
          </ThemedText>
          <ThemedText variant="tertiary" size="base" style={styles.emptyDescription}>
            Try searching with a different username or email
          </ThemedText>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ThemedText variant="secondary" size="sm" style={styles.resultsCount}>
          {searchResults.length} user{searchResults.length !== 1 ? 's' : ''} found
        </ThemedText>
        {searchResults.map(renderUserItem)}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {renderHeader()}
        
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.status.error }]}>
            <ThemedText variant="inverse" size="sm">
              {error}
            </ThemedText>
            <TouchableOpacity onPress={clearError} style={styles.errorCloseButton}>
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        )}

        {renderSearchBar()}
        {renderContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
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
  searchContainer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    height: 48,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: Theme.fontWeight.medium as any,
  },
  searchLoader: {
    marginLeft: Theme.spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  resultsCount: {
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  userCard: {
    marginBottom: Theme.spacing.md,
  },
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: Theme.spacing.md,
  },
  userActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  bio: {
    marginTop: 2,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.7,
  },
  receivedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  viewButton: {
    padding: Theme.spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyTitle: {
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
  },
  errorCloseButton: {
    padding: 4,
  },
  bottomSpacing: {
    height: Theme.spacing.xl,
  },
});