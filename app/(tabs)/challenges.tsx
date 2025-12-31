import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/authContext';
import { useChallenges } from '../../hooks/useChallenges';
import { Challenge } from '../../lib/challengesApi';
import CreateChallengeModal from '../../components/challenges/CreateChallengeModal';
import JoinChallengeModal from '../../components/challenges/JoinChallengeModal';
import ChallengeCard from '../../components/challenges/ChallengeCard';
import { useRouter } from 'expo-router';

// Utility function to check if a challenge has ended
const isChallengeEnded = (challenge: Challenge): boolean => {
  const endDate = new Date(challenge.duration.endDate);
  const today = new Date();
  return endDate < today;
};

// Utility function to get challenge status based on dates
const getChallengeDisplayStatus = (challenge: Challenge): 'active' | 'completed' | 'cancelled' => {
  if (challenge.status === 'cancelled') return 'cancelled';
  if (challenge.status === 'completed') return 'completed';
  if (isChallengeEnded(challenge)) return 'completed';
  return 'active';
};

interface ChallengesScreenProps {
  navigation: any;
}

const ChallengesScreen: React.FC<ChallengesScreenProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    challenges,
    userChallenges,
    loading,
    error,
    fetchChallenges,
    fetchUserChallenges,
    createChallenge,
    joinChallenge,
    leaveChallenge,
    cancelChallenge,
    clearError,
  } = useChallenges();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'discover' | 'my-challenges'>('my-challenges');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Only load data when user is authenticated and not loading
    if (!authLoading && isAuthenticated) {
      loadInitialData();
    }
    
  }, [authLoading, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      // Load user challenges first
      await fetchUserChallenges();
      // Then load discover challenges (they will be merged with existing ones)
      await fetchChallenges({ limit: 50 });
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  useEffect(() => {
    // Only load data when user is authenticated
    if (!authLoading && isAuthenticated) {
      loadData();
    }
  }, [activeTab, authLoading, isAuthenticated]);

  const loadData = async () => {
    try {
      if (activeTab === 'discover') {
        // Fetch all challenges (both active and completed) for discover tab
        await fetchChallenges({ limit: 50 });
      } else {
        // For my-challenges tab, refresh user challenges
        await fetchUserChallenges();
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const onRefresh = async () => {
    if (!isAuthenticated) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      // Refresh both user challenges and discover challenges
      await Promise.all([
        fetchUserChallenges(),
        fetchChallenges({ limit: 50 })
      ]);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateChallenge = async (data: any) => {
    try {
      await createChallenge(data);
      setShowCreateModal(false);
      Alert.alert('Success', 'Challenge created successfully!');
    } catch (err) {
      console.error('Failed to create challenge:', err);
    }
  };

  const handleJoinChallenge = async (challengeId: string, inviteCode?: string) => {
    try {
      // If no challengeId but inviteCode is provided, it's from the join modal
      if (!challengeId && inviteCode) {
        await joinChallenge('', inviteCode);
        setShowJoinModal(false);
        Alert.alert('Success', 'Joined challenge successfully!');
      } else if (challengeId) {
        // Direct join for public challenges
        await joinChallenge(challengeId, inviteCode);
        Alert.alert('Success', 'Joined challenge successfully!');
      } else {
        // No challengeId and no inviteCode - show join modal
        setShowJoinModal(true);
        return;
      }
      
      // Refresh data to ensure proper filtering
      await loadData();
      
      // Switch to active tab to show the joined challenge
      if (activeTab === 'discover') {
        setActiveTab('my-challenges');
      }
    } catch (err: any) {
      console.error('Failed to join challenge:', err);
      Alert.alert('Error', err.message || 'Failed to join challenge');
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    Alert.alert(
      'Leave Challenge',
      'Are you sure you want to leave this challenge?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveChallenge(challengeId);
              Alert.alert('Success', 'Left challenge successfully');
            } catch (err) {
              console.error('Failed to leave challenge:', err);
            }
          },
        },
      ]
    );
  };

  const handleCancelChallenge = async (challengeId: string) => {
    Alert.alert(
      'Cancel Challenge',
      'Are you sure you want to cancel this challenge? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelChallenge(challengeId);
              Alert.alert('Success', 'Challenge cancelled successfully');
            } catch (err) {
              console.error('Failed to cancel challenge:', err);
            }
          },
        },
      ]
    );
  };

  const handleViewLeaderboard = (challenge: Challenge) => {
    // Use expo-router to push to the leaderboard page with query param
    router.push(`/ChallengeLeaderboard?challengeId=${encodeURIComponent(challenge.id)}`);
  };

  const handleViewDetails = (challenge: Challenge) => {
  router.push(`/ChallengeDetails?challengeId=${encodeURIComponent(challenge.id)}`);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingTop: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    headerButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    headerButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.brand.primary,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      maxWidth: 150,
    },
    activeTab: {
      backgroundColor: colors.brand.primary,
    },
    inactiveTab: {
      backgroundColor: colors.background.secondary,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '600',
    },
    activeTabText: {
      color: colors.text.inverse,
    },
    inactiveTabText: {
      color: colors.text.primary,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    emptyButton: {
      backgroundColor: colors.brand.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 20,
    },
    emptyButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginTop: 20,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.background.tertiary,
      marginVertical: 16,
    },
  });

  const renderEmptyState = () => {
    const isDiscover = activeTab === 'discover';
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isDiscover ? 'search' : 'trophy'}
          size={64}
          color={colors.text.secondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>
          {isDiscover ? 'No Public Challenges' : 'No Active Challenges'}
        </Text>
        <Text style={styles.emptyText}>
          {isDiscover
            ? 'There are no public challenges available right now. Check back later or create your own!'
            : 'You haven\'t joined any challenges yet. Browse the Discover tab to find challenges to join!'}
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => {
            if (isDiscover) {
              setShowCreateModal(true);
            } else {
              setActiveTab('discover');
            }
          }}
        >
          <Text style={styles.emptyButtonText}>
            {isDiscover ? 'Create Challenge' : 'Discover Challenges'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const currentChallenges = activeTab === 'discover' 
    ? challenges 
    : userChallenges.filter(challenge => {
        const status = getChallengeDisplayStatus(challenge);
        return status === 'active';
      });

  // Filter discover challenges to show only active ones
  const activeDiscoverChallenges = challenges.filter(challenge => {
    const status = getChallengeDisplayStatus(challenge);
    return status === 'active' && challenge.isPublic;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Challenges</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'my-challenges' ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab('my-challenges')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'my-challenges' ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            My Challenges
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'discover' ? styles.activeTab : styles.inactiveTab,
          ]}
          onPress={() => setActiveTab('discover')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'discover' ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'discover' ? (
          // Discover tab - show only active challenges
          <>
            {activeDiscoverChallenges.length === 0 ? (
              renderEmptyState()
            ) : (
              <>
                <Text style={styles.sectionHeader}>Active Challenges</Text>
                {activeDiscoverChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    isUserChallenge={false}
                    onJoin={handleJoinChallenge}
                    onLeave={handleLeaveChallenge}
                    onCancel={handleCancelChallenge}
                    onViewLeaderboard={handleViewLeaderboard}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </>
            )}
          </>
        ) : (
          // My Challenges tab
          currentChallenges.length === 0 ? (
            renderEmptyState()
          ) : (
            currentChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                isUserChallenge={true}
                onJoin={handleJoinChallenge}
                onLeave={handleLeaveChallenge}
                onCancel={handleCancelChallenge}
                onViewLeaderboard={handleViewLeaderboard}
                onViewDetails={handleViewDetails}
              />
            ))
          )
        )}
      </ScrollView>

      <CreateChallengeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateChallenge}
        loading={loading}
      />

      <JoinChallengeModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinChallenge}
        loading={loading}
      />
    </SafeAreaView>
  );
};

export default ChallengesScreen;
