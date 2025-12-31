import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  RefreshControl,
  Dimensions,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../lib/themeContext';
import { useRouter } from 'expo-router';
import { useChallenges } from '../../hooks/useChallenges';
import { Challenge } from '../../lib/challengesApi';
import JoinChallengeModal from './JoinChallengeModal';
import { useAuth } from '../../lib/authContext';

const { width } = Dimensions.get('window');

interface ChallengeDetailsScreenProps {
  navigation: any;
  route: {
    params: {
      challengeId: string;
    };
  };
}

const ChallengeDetailsScreen: React.FC<ChallengeDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { colors } = useTheme();
  const {
    challenges,
    userChallenges,
    joinChallenge,
    leaveChallenge,
    cancelChallenge,
    fetchUserChallenges,
    loading,
    error,
    clearError,
    getChallenge,
    generateInviteCode,
  } = useChallenges();
  const router = useRouter();
  const { user } = useAuth();
  const { challengeId } = route.params;

  const [refreshing, setRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [defaultInviteCode, setDefaultInviteCode] = useState<string | undefined>(undefined);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [inviteCodeForShare, setInviteCodeForShare] = useState<string | undefined>(undefined);

  const challenge = challenges.find(c => c.id === challengeId);
  const userChallenge = userChallenges.find(uc => uc.id === challengeId);

  useEffect(() => {
    // If challenge isn't loaded yet, attempt to fetch it
    if (!challenge) {
      (async () => {
        try {
          // first try fetching user challenges to populate local cache
          await fetchUserChallenges();
          // if still missing, call getChallenge exposed by the hook
          if (!challenges.find(c => c.id === challengeId)) {
            try {
              await getChallenge(challengeId);
            } catch (e) {
              // ignore — will show not found
            }
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserChallenges();
    setRefreshing(false);
  };

  const handleJoinChallenge = async () => {
    if (!challenge) return;

    Alert.alert(
      'Join Challenge',
      `Are you sure you want to join "${challenge.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: async () => {
            // Open Join modal prefilling invite code if present
            setDefaultInviteCode(challenge.inviteCode);
            setShowJoinModal(true);
          },
        },
      ]
    );
  };

  const handleLeaveChallenge = async () => {
    if (!challenge) return;

    Alert.alert(
      'Leave Challenge',
      `Are you sure you want to leave "${challenge.name}"? Your progress will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveChallenge(challengeId);
              Alert.alert('Success', 'You have left the challenge.');
            } catch (err) {
              console.error('Failed to leave challenge:', err);
            }
          },
        },
      ]
    );
  };

  const handleCancelChallenge = async () => {
    if (!challenge) return;

    Alert.alert(
      'Cancel Challenge',
      `Are you sure you want to cancel "${challenge.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel Challenge',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelChallenge(challengeId);
              Alert.alert('Success', 'Challenge has been cancelled.');
              router.back();
            } catch (err) {
              console.error('Failed to cancel challenge:', err);
            }
          },
        },
      ]
    );
  };

  const handleShareChallenge = async () => {
    if (!challenge) return;

    try {
      // Use existing invite code or generate a new one
      let codeToShare = inviteCodeForShare || challenge.inviteCode;
      
      if (!codeToShare) {
        Alert.alert('Error', 'No invite code available. Please generate one first.');
        return;
      }

      const shareMessage = `Join my habit challenge "${challenge.name}"!\n\nChallenge Code: ${codeToShare}\n\nGoal: ${challenge.goal.description}\nDuration: ${challenge.duration.durationDays} days\n\nDownload the Habit X app and use the invite code to join!`;

      await Share.share({
        message: shareMessage,
        title: `Join my habit challenge: ${challenge.name}`,
      });
    } catch (err) {
      console.error('Failed to share challenge:', err);
    }
  };

  const handleGenerateInviteCode = async () => {
    if (!challenge) return;

    try {
      setGeneratingCode(true);
      const code = await generateInviteCode(challenge.id);
      setInviteCodeForShare(code);
      Alert.alert('Success', `Invite code generated: ${code}\n\nYou can now share this code with others to invite them to the challenge.`);
    } catch (err) {
      console.error('Failed to generate invite code:', err);
      Alert.alert('Error', 'Failed to generate invite code. Please try again.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleCopyInviteCode = async () => {
    const codeToShare = inviteCodeForShare || challenge?.inviteCode;
    if (!codeToShare) {
      Alert.alert('Error', 'No invite code available.');
      return;
    }
    
    try {
      await Clipboard.setString(codeToShare);
      Alert.alert('Copied', `Invite code "${codeToShare}" copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy invite code:', err);
      Alert.alert('Error', 'Failed to copy invite code.');
    }
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
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

  const getChallengeTypeColor = () => {
    if (!challenge) return colors.brand.primary;
    switch (challenge.type) {
      case 'streak':
        return colors.status.warning;
      case 'completion_count':
        return colors.status.success;
      case 'consistency':
        return colors.brand.primary;
      case 'group_goal':
        return colors.status.info;
      default:
        return colors.brand.secondary;
    }
  };

  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const endDate = new Date(challenge.duration.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  const getTotalParticipants = () => {
    if (!challenge) return 0;
    return challenge.participants.length + (isParticipant ? 0 : 0); // Already included if participant
  };

  const getParticipantNames = (): string[] => {
    if (!challenge) return [];
    return challenge.participants.slice(0, 5).map(p => p.username);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return 'play-circle';
      case 'completed':
        return 'checkmark-circle';
      case 'failed':
        return 'close-circle';
      case 'cancelled':
        return 'ban';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.status.success;
      case 'completed':
        return colors.brand.primary;
      case 'failed':
        return colors.status.error;
      case 'cancelled':
        return colors.text.secondary;
      default:
        return colors.text.secondary;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateProgress = () => {
    if (!userChallenge?.userProgress) return 0;
    return (userChallenge.userProgress.currentValue / userChallenge.userProgress.targetValue) * 100;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    backText: {
      fontSize: 16,
      color: colors.brand.primary,
      marginLeft: 8,
    },
    challengeHeader: {
      backgroundColor: colors.card.background,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      elevation: 3,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      overflow: 'hidden',
    },
    headerGradient: {
      padding: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    typeText: {
      color: colors.text.inverse,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
      textTransform: 'uppercase',
    },
    challengeName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.inverse,
      marginBottom: 8,
      flex: 1,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 14,
      fontWeight: '600',
      textTransform: 'uppercase',
      marginLeft: 8,
      color: colors.text.inverse,
    },
    description: {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 24,
      marginBottom: 16,
    },
    goalSection: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 16,
    },
    goalCard: {
      backgroundColor: colors.card.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    goalTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    goalText: {
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: '500',
      lineHeight: 22,
    },
    goalMetric: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.brand.primary,
      marginTop: 8,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: width / 3 - 20,
      backgroundColor: colors.card.background,
      borderRadius: 12,
      padding: 16,
      margin: 4,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    participantsSection: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
    },
    participantsList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 12,
    },
    participantChip: {
      backgroundColor: colors.card.background,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      margin: 4,
    },
    participantText: {
      fontSize: 14,
      color: colors.text.primary,
    },
    timelineSection: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    timelineIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    timelineContent: {
      flex: 1,
    },
    timelineTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    timelineSubtitle: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    rewardsSection: {
      backgroundColor: colors.background.secondary,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
    },
    rewardItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    rewardIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    rewardContent: {
      flex: 1,
    },
    rewardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 4,
    },
    rewardDescription: {
      fontSize: 14,
      color: colors.text.secondary,
    },
    progressCard: {
      backgroundColor: colors.card.background,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 16,
      padding: 20,
      elevation: 3,
      shadowColor: colors.card.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    progressTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 16,
    },
    progressBar: {
      height: 12,
      backgroundColor: colors.background.tertiary,
      borderRadius: 6,
      marginBottom: 12,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.brand.primary,
      borderRadius: 6,
    },
    progressText: {
      fontSize: 14,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    progressStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    actionButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 20,
      paddingTop: 0,
      gap: 12,
      flexWrap: 'wrap',
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.brand.primary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 120,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.background.secondary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 120,
    },
    dangerButton: {
      flex: 1,
      backgroundColor: colors.status.error,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      minWidth: 120,
    },
    shareButton: {
      backgroundColor: colors.background.secondary,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.inverse,
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text.primary,
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
  });

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.text.secondary} />
          <Text style={styles.emptyText}>
            Challenge not found. It may have been cancelled or removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isParticipant = !!userChallenge;
  const isCreator = user && challenge.createdBy.id === user.id;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Challenge Header */}
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.secondary]}
          style={styles.challengeHeader}
        >
          <View style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <Text style={styles.challengeName} numberOfLines={2}>
                {challenge.name}
              </Text>
              <View style={styles.typeBadge}>
                <Ionicons
                  name={getChallengeTypeIcon(challenge.type)}
                  size={16}
                  color={colors.text.inverse}
                />
                <Text style={styles.typeText}>
                  {challenge.type.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <Ionicons
                name={getStatusIcon(challenge.status)}
                size={20}
                color={colors.text.inverse}
              />
              <Text style={styles.statusText}>
                {challenge.status}
              </Text>
            </View>

            {challenge.description && (
              <Text style={styles.description} numberOfLines={3}>
                {challenge.description}
              </Text>
            )}
          </View>
        </LinearGradient>

        {/* Goal Section */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Challenge Goal</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>Objective</Text>
            <Text style={styles.goalText}>{challenge.goal.description}</Text>
            <Text style={styles.goalMetric}>
              Target: {challenge.goal.target} {challenge.goal.metric}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getDaysRemaining()}</Text>
              <Text style={styles.statLabel}>Days Left</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{getTotalParticipants()}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{challenge.duration.durationDays}</Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
          </View>
        </View>

        {/* Participants Section */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsList}>
            {getParticipantNames().map((name, index) => (
              <View key={index} style={styles.participantChip}>
                <Text style={styles.participantText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="play-circle" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Started</Text>
              <Text style={styles.timelineSubtitle}>
                {formatDate(challenge.duration.startDate)}
              </Text>
            </View>
          </View>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIcon}>
              <Ionicons name="flag" size={20} color={colors.brand.primary} />
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Ends</Text>
              <Text style={styles.timelineSubtitle}>
                {formatDate(challenge.duration.endDate)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.rewardItem}>
            <View style={styles.rewardIcon}>
              <Ionicons name="star" size={20} color={colors.text.inverse} />
            </View>
            <View style={styles.rewardContent}>
              <Text style={styles.rewardTitle}>XP Reward</Text>
              <Text style={styles.rewardDescription}>
                Earn {challenge.rewards?.xpReward || 0} XP upon completion
              </Text>
            </View>
          </View>
          {challenge.rewards?.winner && challenge.rewards.winner.length > 0 && (
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name="trophy" size={20} color={colors.text.inverse} />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>Winner Rewards</Text>
                <Text style={styles.rewardDescription}>
                  {challenge.rewards.winner.join(', ')}
                </Text>
              </View>
            </View>
          )}
          {challenge.rewards?.participation && challenge.rewards.participation.length > 0 && (
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name="medal" size={20} color={colors.text.inverse} />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>Participation Rewards</Text>
                <Text style={styles.rewardDescription}>
                  {challenge.rewards.participation.join(', ')}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Progress Section (only for participants) */}
        {isParticipant && userChallenge?.userProgress && (
          <View style={styles.progressCard}>
            <Text style={styles.progressTitle}>Your Progress</Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(calculateProgress(), 100)}%` },
                ]}
              />
            </View>

            <Text style={styles.progressText}>
              {userChallenge.userProgress.currentValue} / {userChallenge.userProgress.targetValue} completed
              ({calculateProgress().toFixed(0)}%)
            </Text>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userChallenge.userProgress.currentValue}</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userChallenge.userProgress.targetValue}</Text>
                <Text style={styles.statLabel}>Target</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{userChallenge.rewards?.xpReward || 0}</Text>
                <Text style={styles.statLabel}>XP Earned</Text>
              </View>
            </View>
          </View>
        )}

        {/* Invite Code Section (for creators) */}
        {isParticipant && isCreator && (inviteCodeForShare || challenge.inviteCode) && (
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <View style={styles.rewardItem}>
              <View style={styles.rewardIcon}>
                <Ionicons name="share-social" size={20} color={colors.text.inverse} />
              </View>
              <View style={styles.rewardContent}>
                <Text style={styles.rewardTitle}>Share with Others</Text>
                <Text style={styles.rewardDescription}>
                  {inviteCodeForShare || challenge.inviteCode}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.rewardItem, { backgroundColor: colors.brand.primary }]}
              onPress={handleCopyInviteCode}
            >
              <Ionicons name="copy" size={20} color={colors.text.inverse} />
              <Text style={[styles.rewardTitle, { color: colors.text.inverse, marginLeft: 12 }]}>
                Copy Code
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isParticipant ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinChallenge}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Join Challenge</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {isCreator && (
              <>
                {!inviteCodeForShare && !challenge.inviteCode ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleGenerateInviteCode}
                    disabled={loading || generatingCode}
                  >
                    <Text style={styles.buttonText}>
                      {generatingCode ? 'Generating...' : 'Generate Invite Code'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleShareChallenge}
                    disabled={loading}
                  >
                    <Text style={styles.buttonText}>Share Challenge</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleLeaveChallenge}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Leave Challenge</Text>
            </TouchableOpacity>
            {isCreator && (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleCancelChallenge}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Cancel Challenge</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Join modal (prefill with invite code if available) */}
      <JoinChallengeModal
        visible={showJoinModal}
        onClose={() => { setShowJoinModal(false); setDefaultInviteCode(undefined); }}
        onSubmit={(_challengeId: string, inviteCode?: string) => {
          // Wrap async work so the prop remains a void-returning function per prop type
          (async () => {
            try {
              await joinChallenge(challengeId, inviteCode);
              setShowJoinModal(false);
              Alert.alert('Success', 'You have joined the challenge!');
            } catch (err) {
              console.error('Failed to join challenge via invite:', err);
            }
          })();
        }}
        loading={loading}
        defaultInviteCode={defaultInviteCode}
      />
    </SafeAreaView>
  );
};

export default ChallengeDetailsScreen;
