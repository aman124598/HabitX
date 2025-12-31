import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '../Themed';
import { ThemedText } from '../Themed';
import { ThemedCard } from '../Themed';
import { ThemedDivider } from '../Themed';
import { useTheme } from '../../lib/themeContext';
import { useGamification } from '../../lib/gamificationContext';
import { Theme } from '../../lib/theme';
import { gamificationService, Achievement, GamificationData, XP_REWARDS, LEVEL_SYSTEM } from '../../lib/gamificationService';

interface GamificationDashboardProps {
  habits: any[];
  visible: boolean;
  onClose: () => void;
  gamificationData?: any;
}

interface LevelProgressProps {
  currentXP: number;
  nextLevelXP: number;
  level: number;
}

interface AchievementCardProps {
  achievement: Achievement;
  isEarned: boolean;
  onPress: () => void;
}

interface BadgeItemProps {
  badge: string;
  rarity: Achievement['rarity'];
}

function LevelProgress({ currentXP, nextLevelXP, level }: LevelProgressProps) {
  const { colors } = useTheme();
  const progress = nextLevelXP > 0 ? (currentXP / nextLevelXP) * 100 : 100;
  const progressAnim = new Animated.Value(0);

  React.useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.levelProgress}>
      <View style={styles.levelInfo}>
        <ThemedText variant="inverse" size="base" weight="medium">
          Level {level}
        </ThemedText>
        <ThemedText variant="inverse" size="sm">
          {currentXP} / {nextLevelXP} XP
        </ThemedText>
      </View>
      <View style={[styles.progressBarContainer, { backgroundColor: `${colors.background.secondary}40` }]}>
        <Animated.View 
          style={[
            styles.progressBar, 
            { 
              backgroundColor: colors.background.secondary,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              })
            }
          ]} 
        />
      </View>
    </View>
  );
}

function AchievementCard({ achievement, isEarned, onPress }: AchievementCardProps) {
  const { colors } = useTheme();
  const rarityColor = gamificationService.getRarityColor(achievement.rarity);
  const rarityEmoji = gamificationService.getRarityEmoji(achievement.rarity);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.achievementCard,
      { backgroundColor: colors.card.background },
      { opacity: pressed ? 0.8 : 1 },
      !isEarned && { opacity: 0.6 }
    ]}>
      <View style={[styles.achievementIcon, { backgroundColor: `${rarityColor}20` }]}>
        <Ionicons 
          name={achievement.icon as any} 
          size={24} 
          color={isEarned ? rarityColor : colors.text.tertiary} 
        />
      </View>
      <View style={styles.achievementInfo}>
        <View style={styles.achievementHeader}>
          <ThemedText 
            variant={isEarned ? "primary" : "tertiary"} 
            size="sm" 
            weight="semibold"
            style={{ flex: 1 }}
          >
            {achievement.title}
          </ThemedText>
          <ThemedText size="xs">{rarityEmoji}</ThemedText>
        </View>
        <ThemedText 
          variant="secondary" 
          size="xs" 
          style={styles.achievementDescription}
        >
          {achievement.description}
        </ThemedText>
        <View style={styles.achievementReward}>
          <ThemedText variant="accent" size="xs" weight="medium">
            +{achievement.xpReward} XP
          </ThemedText>
          {isEarned && (
            <View style={styles.earnedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.status.success} />
              <ThemedText variant="primary" size="xs" weight="medium" style={{ color: colors.status.success }}>
                Earned
              </ThemedText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export function GamificationDashboard({ habits, visible, onClose, gamificationData: propGamificationData }: GamificationDashboardProps) {
  const { colors } = useTheme();
  const { showFlamesAnimation } = useGamification();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'achievements'>('overview');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);

  useEffect(() => {
    if (visible && habits.length > 0) {
      const data = propGamificationData || gamificationService.getGamificationData(habits, gamificationService.getCachedUserGamification() || undefined);
      setGamificationData(data);
    }
  }, [visible, habits, propGamificationData]);

  if (!gamificationData) return null;

  const stats = gamificationService.calculateUserStatsSync(habits, gamificationService.getCachedUserGamification() || undefined);
  const earnedAchievements = gamificationService.getEarnedAchievements(stats);
  const availableAchievements = gamificationService.getAvailableAchievements(stats);

  const renderOverview = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Level Card */}
      <LinearGradient 
        colors={[colors.brand.primary, colors.brand.secondary]}
        style={styles.levelCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.levelCardContent}>
          <View style={styles.levelText}>
            <ThemedText variant="inverse" size="xxxl" weight="extrabold">
              Level {gamificationData.level}
            </ThemedText>
            <ThemedText variant="inverse" size="base">
              Total XP: {gamificationData.totalXP}
            </ThemedText>
          </View>
          <View style={styles.levelIcon}>
            <Ionicons name="star" size={40} color="white" />
          </View>
        </View>
        <LevelProgress 
          currentXP={gamificationData.currentLevelXP}
          nextLevelXP={gamificationData.nextLevelXP}
          level={gamificationData.level}
        />
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <ThemedCard style={styles.statCard}>
          <Ionicons name="trophy" size={24} color={colors.status.warning} />
          <ThemedText variant="primary" size="xl" weight="bold">
            {earnedAchievements.length}
          </ThemedText>
          <ThemedText variant="secondary" size="xs">
            Achievements
          </ThemedText>
        </ThemedCard>
        <ThemedCard style={styles.statCard}>
          <Ionicons name="flame" size={24} color={colors.status.error} />
          <ThemedText variant="primary" size="xl" weight="bold">
            {stats.longestStreak}
          </ThemedText>
          <ThemedText variant="secondary" size="xs">
            Best Streak
          </ThemedText>
        </ThemedCard>
      </View>

      {/* XP Guide */}
      <ThemedCard style={styles.xpGuide}>
        <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
          💰 How to Earn XP
        </ThemedText>
        <View style={styles.xpRewardsList}>
          <View style={styles.xpRewardItem}>
            <ThemedText variant="secondary" size="sm">Complete a habit</ThemedText>
            <ThemedText variant="accent" size="sm" weight="medium">+{XP_REWARDS.HABIT_COMPLETION} XP</ThemedText>
          </View>
          <View style={styles.xpRewardItem}>
            <ThemedText variant="secondary" size="sm">7-day streak bonus</ThemedText>
            <ThemedText variant="accent" size="sm" weight="medium">+{XP_REWARDS.STREAK_7_DAYS} XP</ThemedText>
          </View>
          <View style={styles.xpRewardItem}>
            <ThemedText variant="secondary" size="sm">30-day streak bonus</ThemedText>
            <ThemedText variant="accent" size="sm" weight="medium">+{XP_REWARDS.STREAK_30_DAYS} XP</ThemedText>
          </View>
          <View style={styles.xpRewardItem}>
            <ThemedText variant="secondary" size="sm">Perfect day (all habits)</ThemedText>
            <ThemedText variant="accent" size="sm" weight="medium">+{XP_REWARDS.PERFECT_DAY} XP</ThemedText>
          </View>
        </View>
        
        {/* Test UI removed */}
      </ThemedCard>

      {/* Recent Achievements */}
      {earnedAchievements.length > 0 && (
        <ThemedCard style={styles.recentAchievements}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            🏆 Recent Achievements
          </ThemedText>
          {earnedAchievements.slice(0, 3).map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isEarned={true}
              onPress={() => setSelectedAchievement(achievement)}
            />
          ))}
        </ThemedCard>
      )}
    </ScrollView>
  );

  const renderAchievements = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {earnedAchievements.length > 0 && (
        <View style={styles.achievementSection}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            🏆 Earned Achievements ({earnedAchievements.length})
          </ThemedText>
          {earnedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isEarned={true}
              onPress={() => setSelectedAchievement(achievement)}
            />
          ))}
        </View>
      )}

      {availableAchievements.length > 0 && (
        <View style={styles.achievementSection}>
          <ThemedText variant="primary" size="lg" weight="bold" style={styles.sectionTitle}>
            🎯 Available Achievements ({availableAchievements.length})
          </ThemedText>
          {availableAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              isEarned={false}
              onPress={() => setSelectedAchievement(achievement)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText variant="primary" size="xxl" weight="bold">
              🎮 Gamification
            </ThemedText>
            <ThemedText variant="secondary" size="sm">
              Track your progress and earn rewards
            </ThemedText>
          </View>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </Pressable>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          {(['overview', 'achievements'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setSelectedTab(tab)}
              style={[
                styles.tabButton,
                selectedTab === tab && { backgroundColor: colors.brand.primary }
              ]}
            >
              <ThemedText
                variant={selectedTab === tab ? "inverse" : "secondary"}
                size="sm"
                weight="medium"
                style={{ textTransform: 'capitalize' }}
              >
                {tab}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {selectedTab === 'overview' && renderOverview()}
          {selectedTab === 'achievements' && renderAchievements()}
        </View>

        {/* Achievement Detail Modal */}
        <Modal
          visible={!!selectedAchievement}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedAchievement(null)}
        >
          <View style={styles.modalOverlay}>
            <ThemedCard style={styles.achievementModal}>
              {selectedAchievement && (
                <>
                  <View style={styles.achievementModalHeader}>
                    <View style={[
                      styles.achievementModalIcon, 
                      { backgroundColor: `${gamificationService.getRarityColor(selectedAchievement.rarity)}20` }
                    ]}>
                      <Ionicons 
                        name={selectedAchievement.icon as any} 
                        size={32} 
                        color={gamificationService.getRarityColor(selectedAchievement.rarity)} 
                      />
                    </View>
                    <ThemedText variant="primary" size="xl" weight="bold" style={{ textAlign: 'center' }}>
                      {selectedAchievement.title}
                    </ThemedText>
                    <ThemedText variant="secondary" size="base" style={{ textAlign: 'center', marginVertical: Theme.spacing.sm }}>
                      {selectedAchievement.description}
                    </ThemedText>
                    <View style={styles.achievementModalStats}>
                      <View style={styles.achievementModalStat}>
                        <ThemedText variant="accent" size="lg" weight="bold">
                          +{selectedAchievement.xpReward} XP
                        </ThemedText>
                        <ThemedText variant="tertiary" size="xs">Reward</ThemedText>
                      </View>
                      <View style={styles.achievementModalStat}>
                        <ThemedText size="lg">
                          {gamificationService.getRarityEmoji(selectedAchievement.rarity)}
                        </ThemedText>
                        <ThemedText variant="tertiary" size="xs" style={{ textTransform: 'capitalize' }}>
                          {selectedAchievement.rarity}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setSelectedAchievement(null)}
                    style={[styles.modalButton, { backgroundColor: colors.brand.primary }]}
                  >
                    <ThemedText variant="inverse" size="base" weight="medium">
                      Close
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </ThemedCard>
          </View>
        </Modal>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Theme.spacing.lg,
    paddingTop: Theme.spacing.xxl,
  },
  headerLeft: {
    flex: 1,
  },
  closeButton: {
    padding: Theme.spacing.sm,
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: Theme.spacing.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  levelCard: {
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  levelCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  levelText: {
    flex: 1,
  },
  levelIcon: {
    padding: Theme.spacing.md,
  },
  levelProgress: {
    gap: Theme.spacing.sm,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Theme.borderRadius.sm,
  },
  quickStats: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Theme.spacing.md,
    gap: Theme.spacing.xs,
  },
  xpGuide: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: Theme.spacing.md,
  },
  xpRewardsList: {
    gap: Theme.spacing.sm,
  },
  xpRewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xs,
  },
  recentAchievements: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  achievementSection: {
    marginBottom: Theme.spacing.lg,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  achievementDescription: {
    marginBottom: Theme.spacing.xs,
  },
  achievementReward: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  achievementModal: {
    width: '100%',
    maxWidth: 400,
    padding: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
  },
  achievementModalHeader: {
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  achievementModalIcon: {
    width: 64,
    height: 64,
    borderRadius: Theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Theme.spacing.md,
  },
  achievementModalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Theme.spacing.md,
  },
  achievementModalStat: {
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  modalButton: {
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
});
