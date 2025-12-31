import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/themeContext';
import { Challenge } from '../../lib/challengesApi';
import { useAuth } from '../../lib/authContext';

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

interface ChallengeCardProps {
  challenge: Challenge;
  isUserChallenge: boolean;
  onJoin: (challengeId: string, inviteCode?: string) => void;
  onLeave: (challengeId: string) => void;
  onCancel: (challengeId: string) => void;
  onViewLeaderboard: (challenge: Challenge) => void;
  onViewDetails: (challenge: Challenge) => void;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  isUserChallenge,
  onJoin,
  onLeave,
  onCancel,
  onViewLeaderboard,
  onViewDetails,
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();

  const getDaysRemaining = () => {
    const endDate = new Date(challenge.duration.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days); // Ensure days never go below 0
  };

  const getChallengeTypeIcon = () => {
    switch (challenge.type) {
      case 'streak':
        return 'flame';
      case 'completion_count':
        return 'checkmark-circle';
      case 'consistency':
        return 'calendar';
      case 'group_goal':
        return 'people';
      default:
        return 'trophy';
    }
  };

  const getChallengeTypeLabel = () => {
    switch (challenge.type) {
      case 'streak':
        return 'Streak Challenge';
      case 'completion_count':
        return 'Completion Count';
      case 'consistency':
        return 'Consistency Challenge';
      case 'group_goal':
        return 'Group Goal';
      default:
        return 'Challenge';
    }
  };

  const progressPercentage = challenge.userProgress?.progressPercentage || 0;
  const daysRemaining = getDaysRemaining();
  const isCreator = user && challenge.createdBy.id === user.id;
  const displayStatus = getChallengeDisplayStatus(challenge);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card.background,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      elevation: 3,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    headerLeft: {
      flex: 1,
      marginRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 4,
    },
    typeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 6,
    },
    description: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 2,
    },
    progressContainer: {
      marginBottom: 16,
    },
    progressLabel: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      backgroundColor: colors.background.tertiary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.brand.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      color: colors.text.secondary,
      marginTop: 4,
    },
    actionsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  minWidth: 72,
  justifyContent: 'center',
  marginRight: 8,
  marginTop: 8,
  flexShrink: 1,
    },
    primaryButton: {
      backgroundColor: colors.brand.primary,
    },
    secondaryButton: {
      backgroundColor: colors.background.tertiary,
    },
    dangerButton: {
      backgroundColor: colors.status.error,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 4,
    },
    primaryButtonText: {
      color: colors.text.inverse,
    },
    secondaryButtonText: {
      color: colors.text.primary,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    activeBadge: {
      backgroundColor: colors.status.success,
    },
    completedBadge: {
      backgroundColor: colors.brand.primary,
    },
    cancelledBadge: {
      backgroundColor: colors.status.error,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.inverse,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onViewDetails(challenge)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{challenge.name}</Text>
          <View style={styles.typeContainer}>
            <Ionicons
              name={getChallengeTypeIcon()}
              size={16}
              color={colors.brand.primary}
            />
            <Text style={styles.typeText}>{getChallengeTypeLabel()}</Text>
          </View>
        </View>
        <View style={[
          styles.statusBadge, 
          displayStatus === 'active' ? styles.activeBadge :
          displayStatus === 'completed' ? styles.completedBadge :
          styles.cancelledBadge
        ]}>
          <Text style={styles.statusText}>{displayStatus.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.description}>{challenge.description}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{challenge.goal.target}</Text>
          <Text style={styles.statLabel}>{challenge.goal.metric}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{challenge.participants.length}</Text>
          <Text style={styles.statLabel}>Participants</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {displayStatus === 'completed' ? '0' : daysRemaining}
          </Text>
          <Text style={styles.statLabel}>
            {displayStatus === 'completed' ? 'Completed' : 'Days Left'}
          </Text>
        </View>
        {challenge.userProgress && (
          <View style={styles.statItem}>
            <Text style={styles.statValue}>#{challenge.userProgress.rank}</Text>
            <Text style={styles.statLabel}>Rank</Text>
          </View>
        )}
      </View>

      {isUserChallenge && challenge.userProgress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(progressPercentage, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {challenge.userProgress.currentValue} / {challenge.userProgress.targetValue} 
            ({progressPercentage.toFixed(0)}%)
          </Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={(e) => {
            e.stopPropagation();
            onViewDetails(challenge);
          }}
        >
          <Ionicons name="information-circle" size={16} color={colors.text.primary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={(e) => {
            e.stopPropagation();
            onViewLeaderboard(challenge);
          }}
        >
          <Ionicons name="trophy" size={16} color={colors.text.primary} />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            Leaderboard
          </Text>
        </TouchableOpacity>

        {isUserChallenge ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {isCreator && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  onCancel(challenge.id);
                }}
              >
                <Ionicons name="close" size={16} color={colors.text.inverse} />
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
            {!isCreator && (
              <TouchableOpacity
                style={[styles.actionButton, styles.dangerButton]}
                onPress={(e) => {
                  e.stopPropagation();
                  onLeave(challenge.id);
                }}
              >
                <Ionicons name="exit" size={16} color={colors.text.inverse} />
                <Text style={[styles.buttonText, styles.primaryButtonText]}>
                  Leave
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : challenge.isPublic ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={(e) => {
              e.stopPropagation();
              // For public challenges, always use the regular join endpoint (without invite code)
              // Note: The invite code is only used when a user manually enters an invite code to join
              onJoin(challenge.id);
            }}
          >
            <Ionicons name="add" size={16} color={colors.text.inverse} />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              Join
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={(e) => {
              e.stopPropagation();
              // For private challenges, show join modal with invite code input
              onJoin('', ''); // This will trigger the join modal
            }}
          >
            <Ionicons name="lock-closed" size={16} color={colors.text.primary} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              Private
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default ChallengeCard;
