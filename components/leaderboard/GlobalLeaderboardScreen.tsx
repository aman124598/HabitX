import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { ThemedCard, ThemedText, ThemedView } from '../Themed';
import Theme, { getShadow } from '../../lib/theme';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { GlobalLeaderboardEntry } from '../../lib/leaderboardApi';
import { useFriends } from '../../lib/friendsContext';
import { useRouter } from 'expo-router';
import authService from '../../lib/auth';

const { width } = Dimensions.get('window');

interface GlobalLeaderboardScreenProps {
  onClose?: () => void;
}

const GlobalLeaderboardScreen: React.FC<GlobalLeaderboardScreenProps> = ({
  onClose,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { getUserProfile } = useFriends();
  const {
    globalLeaderboard,
    userPosition,
    loading,
    error,
    fetchAllGlobalLeaderboard,
    fetchUserPosition,
    clearError,
  } = useLeaderboard();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  // Debug: Log leaderboard state changes
  useEffect(() => {
    if (globalLeaderboard) {
      console.log('📊 GlobalLeaderboardScreen: Current leaderboard state:', {
        totalUsers: globalLeaderboard.totalUsers,
        displayedUsers: globalLeaderboard.leaderboard?.length || 0,
        userRank: globalLeaderboard.userRank,
        sampleUsers: globalLeaderboard.leaderboard?.slice(0, 3).map(u => ({
          rank: u.rank,
          username: u.user.username,
          totalXP: u.totalXP
        })) || []
      });
    }
  }, [globalLeaderboard]);

  const loadLeaderboard = async () => {
    try {
      console.log('🔍 GlobalLeaderboardScreen: Starting to load leaderboard...');
      // Fetch all users across pages (API caps 100 per page)
      await Promise.all([
        fetchAllGlobalLeaderboard(100),
        fetchUserPosition(),
      ]);
      console.log('✅ GlobalLeaderboardScreen: Leaderboard loaded successfully');
    } catch (err) {
      console.error('❌ GlobalLeaderboardScreen: Failed to load leaderboard:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Force refresh and refetch all pages
      await Promise.all([
        fetchAllGlobalLeaderboard(100),
        fetchUserPosition(),
      ]);
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err);
    }
    setRefreshing(false);
  };

  const handleUserTap = async (userId: string) => {
    try {
      const currentUser = authService.getCurrentUser();
      
      // Check if this is the current user's profile
      if (currentUser && userId === currentUser.id) {
        // Navigate to own profile - we can create a self-profile object
        const selfProfile = {
          id: currentUser.id,
          username: currentUser.username,
          email: currentUser.email,
          totalXP: currentUser.totalXP || 0,
          level: currentUser.level || 1,
          bio: currentUser.bio,
          avatar: currentUser.avatar,
          isPublic: currentUser.isPublic || true,
          createdAt: currentUser.createdAt,
          habitStats: {
            totalHabits: 0,
            completedToday: 0,
            activeStreaks: 0,
            longestStreak: 0,
          },
          friendshipStatus: 'self' as const,
        };
        
        router.push({
          pathname: '/UserProfile',
          params: { userId, profileData: JSON.stringify(selfProfile) },
        });
        return;
      }
      
      // For other users, fetch their profile
      const profile = await getUserProfile(userId);
      router.push({
        pathname: '/UserProfile',
        params: { userId, profileData: JSON.stringify(profile) },
      });
    } catch (error: any) {
      console.error('Profile access error:', error);
      // If user is private or not accessible, show a toast
      Alert.alert('Profile Unavailable', 'This user\'s profile is private or you need to be friends to view it.');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return 'trophy';
      case 2:
        return 'medal';
      case 3:
        return 'ribbon';
      default:
        return 'person';
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return colors.text.secondary;
    }
  };

  const getXPBadgeColor = (level: number) => {
    if (level >= 25) return colors.status.success;
    if (level >= 15) return colors.brand.primary;
    if (level >= 10) return colors.status.warning;
    return colors.text.secondary;
  };

  const renderCurrentUserPosition = () => {
    if (!userPosition || userPosition.rank === null) return null;

    const getRankGradient = (rank: number) => {
      if (rank === 1) return ['#FFD700', '#FFA500']; // Gold
      if (rank === 2) return ['#C0C0C0', '#A9A9A9']; // Silver  
      if (rank === 3) return ['#CD7F32', '#B8860B']; // Bronze
      return [colors.brand.primary, colors.brand.secondary || colors.brand.primary];
    };

    const gradient = getRankGradient(userPosition.rank);

    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.currentUserCard}
      >
        <View style={styles.currentUserOverlay}>
          <View style={styles.currentUserHeader}>
            <View style={styles.currentUserIcon}>
              <Ionicons name="person" size={28} color="white" />
            </View>
            <View>
              <ThemedText variant="inverse" size="base" weight="semibold">
                Your Position
              </ThemedText>
              <ThemedText variant="inverse" size="xs" style={styles.currentUserSubtitle}>
                Keep climbing!
              </ThemedText>
            </View>
            <View style={styles.currentUserTrophy}>
              <Ionicons 
                name={userPosition.rank <= 3 ? "trophy" : "medal"} 
                size={32} 
                color="white" 
              />
            </View>
          </View>
          
          <View style={styles.currentUserStats}>
            <View style={styles.currentUserStat}>
              <ThemedText variant="inverse" size="lg" weight="bold">
                #{userPosition.rank}
              </ThemedText>
              <ThemedText variant="inverse" size="xs">
                Global Rank
              </ThemedText>
            </View>
            <View style={styles.currentUserStat}>
              <ThemedText variant="inverse" size="lg" weight="bold">
                {userPosition.totalXP.toLocaleString()}
              </ThemedText>
              <ThemedText variant="inverse" size="xs">
                Total XP
              </ThemedText>
            </View>
            <View style={styles.currentUserStat}>
              <ThemedText variant="inverse" size="lg" weight="bold">
                L{userPosition.level}
              </ThemedText>
              <ThemedText variant="inverse" size="xs">
                Level
              </ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  };

  const renderLeaderboardEntry = (entry: GlobalLeaderboardEntry, index: number) => {
    const isTopThree = entry.rank <= 3;

    return (
      <ThemedCard
        key={entry.user.id}
        variant="elevated"
        style={styles.entryCard}
      >
        <TouchableOpacity 
          style={styles.entryContent}
          activeOpacity={0.8}
          onPress={() => handleUserTap(entry.user.id)}
        >
          {/* Rank Section */}
          <View style={styles.rankContainer}>
            <View style={[
              styles.rankBadge,
              { backgroundColor: isTopThree ? getRankColor(entry.rank) : colors.brand.primary }
            ]}>
              {isTopThree ? (
                <Ionicons
                  name={getRankIcon(entry.rank)}
                  size={18}
                  color="white"
                />
              ) : (
                <ThemedText variant="inverse" size="sm" weight="bold">
                  {entry.rank}
                </ThemedText>
              )}
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userHeader}>
              <ThemedText variant="primary" size="lg" weight="semibold" style={styles.username}>
                {entry.user.username}
              </ThemedText>
              <View style={[styles.levelBadge, { backgroundColor: `${getXPBadgeColor(entry.level)}20` }]}>
                <ThemedText variant="inverse" size="xs" weight="bold" style={{ color: getXPBadgeColor(entry.level) }}>
                  L{entry.level}
                </ThemedText>
              </View>
            </View>
            
            <ThemedText variant="secondary" size="sm" style={styles.userEmail}>
              {entry.user.email}
            </ThemedText>
            
            {/* Stats Badges */}
            <View style={styles.userStatsRow}>
              <View style={[styles.statBadge, { backgroundColor: `${colors.status.warning}20` }]}>
                <Ionicons name="flash" size={12} color={colors.status.warning} />
                <ThemedText variant="tertiary" size="xs" weight="medium">
                  {entry.activeStreaks}
                </ThemedText>
              </View>
              <View style={[styles.statBadge, { backgroundColor: `${colors.status.success}20` }]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.status.success} />
                <ThemedText variant="tertiary" size="xs" weight="medium">
                  {entry.completedToday}
                </ThemedText>
              </View>
              <View style={[styles.statBadge, { backgroundColor: `${colors.brand.primary}20` }]}>
                <Ionicons name="trending-up" size={12} color={colors.brand.primary} />
                <ThemedText variant="tertiary" size="xs" weight="medium">
                  {entry.longestStreak}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* XP Section */}
          <View style={styles.xpSection}>
            <ThemedText variant="primary" size="xl" weight="bold" style={styles.xpText}>
              {entry.totalXP.toLocaleString()}
            </ThemedText>
            <ThemedText variant="accent" size="xs" weight="medium" style={styles.xpLabel}>
              XP
            </ThemedText>
            <ThemedText variant="secondary" size="xs" style={styles.habitCount}>
              {entry.totalHabits} habits
            </ThemedText>
          </View>

          {/* Tap indicator */}
          <View style={styles.tapIndicator}>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </View>
        </TouchableOpacity>
      </ThemedCard>
    );
  };

  if (loading && !globalLeaderboard) {
    return (
      <ThemedView style={styles.container}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.secondary || colors.brand.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.header} edges={['top']}>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            )}
            <ThemedText variant="inverse" size="xl" weight="bold">
              Global Leaderboard
            </ThemedText>
            <View style={styles.headerPlaceholder} />
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Ionicons name="trophy" size={64} color={colors.text.secondary} />
          <ThemedText variant="secondary" size="lg">
            Loading leaderboard...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={[colors.brand.primary, colors.brand.secondary || colors.brand.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView style={styles.header} edges={['top']}>
          {onClose && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <ThemedText variant="inverse" size="xl" weight="bold">
              🏆 Global Leaderboard
            </ThemedText>
            <ThemedText variant="inverse" size="sm" style={styles.headerSubtitle}>
              {globalLeaderboard?.totalUsers || 0} champions competing
            </ThemedText>
          </View>
          <View style={styles.headerPlaceholder} />
        </SafeAreaView>
      </LinearGradient>

      {renderCurrentUserPosition()}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <LinearGradient
            colors={['rgba(255,215,0,0.3)', 'rgba(255,165,0,0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.sectionHeaderGradient}
          >
            <Text style={styles.sectionTitle}>🏆 Hall of Fame</Text>
            <Text style={styles.sectionSubtitle}>The most dedicated habit builders</Text>
          </LinearGradient>
        </View>

        {globalLeaderboard && globalLeaderboard.leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['rgba(255,215,0,0.2)', 'rgba(255,165,0,0.1)']}
              style={styles.emptyGradient}
            >
              <Ionicons name="trophy-outline" size={80} color={colors.status.warning} />
              <ThemedText variant="primary" size="xl" weight="bold">
                Be the First Champion!
              </ThemedText>
              <ThemedText variant="secondary" size="base" style={styles.emptyText}>
                Complete habits to earn XP and claim your spot on the leaderboard.
                Every habit completion brings you closer to glory! 🌟
              </ThemedText>
            </LinearGradient>
          </View>
        ) : (
          globalLeaderboard?.leaderboard.map(renderLeaderboardEntry)
        )}

        {/* Spacer for bottom */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // Header Styles
  headerGradient: {
    paddingBottom: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.md,
    paddingBottom: Theme.spacing.sm,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  closeButton: {
    padding: Theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Current User Card Styles
  currentUserCard: {
    margin: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  currentUserOverlay: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  currentUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  currentUserIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentUserTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  currentUserSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  currentUserTrophy: {
    alignItems: 'center',
  },
  currentUserStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  currentUserStat: {
    alignItems: 'center',
  },
  currentUserStatNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  currentUserStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Content Styles
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },

  // Leaderboard Entry Styles
  entryCard: {
    marginBottom: Theme.spacing.md,
  },
  
  topThreeCard: {
    // Add special styling for top 3 if needed
  },
  
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // ThemedCard already has padding
  },
  rankContainer: {
    alignItems: 'center',
    marginRight: Theme.spacing.lg,
    minWidth: 50,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userStatsRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
  },
  xpSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgba(0,0,0,0.8)',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  xpText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  habitCount: {
    fontSize: 11,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: Theme.spacing.lg,
  },
  emptyGradient: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.borderRadius.xl,
    alignItems: 'center',
    width: '100%',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  // Section Header Styles
  sectionHeader: {
    marginBottom: Theme.spacing.lg,
  },
  sectionHeaderGradient: {
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginTop: 4,
    textAlign: 'center',
  },

  // User Text Styles
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    opacity: 0.7,
  },

  // Tap indicator
  tapIndicator: {
    paddingLeft: Theme.spacing.sm,
    justifyContent: 'center',
  },
});

export default GlobalLeaderboardScreen;