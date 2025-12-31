import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useChallenges } from '../../hooks/useChallenges';
import { Leaderboard, LeaderboardEntry } from '../../lib/challengesApi';

interface ChallengeLeaderboardScreenProps {
  navigation: any;
  route: {
    params: {
      challengeId: string;
    };
  };
}

const ChallengeLeaderboardScreen: React.FC<ChallengeLeaderboardScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const { getLeaderboard, loading, error, clearError } = useChallenges();
  const { challengeId } = route.params;

  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [challengeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(challengeId);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
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

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <View key={entry.user.id} style={styles.entryContainer}>
      <View style={styles.rankContainer}>
        <Ionicons
          name={getRankIcon(entry.rank)}
          size={24}
          color={getRankColor(entry.rank)}
        />
        <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>
          #{entry.rank}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.username}>{entry.user.username}</Text>
        <Text style={styles.userEmail}>{entry.user.email}</Text>
      </View>

      <View style={styles.progressInfo}>
        <Text style={styles.progressValue}>
          {entry.currentValue}/{entry.targetValue}
        </Text>
        <Text style={styles.progressPercentage}>
          {entry.progressPercentage.toFixed(0)}%
        </Text>
        {entry.xp > 0 && (
          <Text style={styles.xpText}>{entry.xp} XP</Text>
        )}
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    challengeInfo: {
      backgroundColor: colors.card.background,
      margin: 20,
      padding: 20,
      borderRadius: 16,
      elevation: 3,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    challengeTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
    },
    challengeType: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    challengeGoal: {
      fontSize: 14,
      color: colors.brand.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 16,
    },
    entryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      elevation: 2,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    rankContainer: {
      alignItems: 'center',
      minWidth: 60,
      marginRight: 16,
    },
    rankText: {
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
    },
    userEmail: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 2,
    },
    progressInfo: {
      alignItems: 'flex-end',
    },
    progressValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    progressPercentage: {
      fontSize: 14,
      color: colors.brand.primary,
      marginTop: 2,
    },
    xpText: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.text.secondary,
      marginTop: 16,
    },
  });

  if (loading && !leaderboard) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Ionicons name="trophy" size={64} color={colors.text.secondary} />
          <Text style={styles.loadingText}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!leaderboard) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>
            Unable to load leaderboard. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View style={styles.challengeInfo}>
        <Text style={styles.challengeTitle}>{leaderboard.challenge.name}</Text>
        <Text style={styles.challengeType}>
          {leaderboard.challenge.type.replace('_', ' ').toUpperCase()} CHALLENGE
        </Text>
        <Text style={styles.challengeGoal}>
          {leaderboard.challenge.goal.description}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Rankings</Text>

        {leaderboard.leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color={colors.text.secondary} />
            <Text style={styles.emptyText}>
              No participants have made progress yet.
              Be the first to complete your habits!
            </Text>
          </View>
        ) : (
          leaderboard.leaderboard.map((entry, index) =>
            renderLeaderboardEntry(entry, index)
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChallengeLeaderboardScreen;
