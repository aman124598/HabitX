import React, { useState, useEffect } from 'react';
import { useGamification } from '../lib/gamificationContext';
import { PremiumXPReward } from './gamification/PremiumXPReward';
import { StreakCelebration } from './gamification/StreakCelebration';
import { LevelUpCelebration } from './gamification/LevelUpCelebration';

interface GamificationOverlayProps {
  children: React.ReactNode;
}

export function GamificationOverlay({ children }: GamificationOverlayProps) {
  // IMPORTANT: All hooks MUST be called unconditionally and in the same order every render
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [showLevelUpCelebration, setShowLevelUpCelebration] = useState(false);
  
  // Get gamification context - this must always be called
  const gamificationContext = useGamification();

  // Handle special celebrations with useEffect - must be called every render
  useEffect(() => {
    // Only proceed if context is available
    if (!gamificationContext) return;

    const currentReward = gamificationContext.currentReward;
    const isAnimationVisible = gamificationContext.isAnimationVisible;
    const streakInfo = gamificationContext.streakInfo;
    const levelInfo = gamificationContext.levelInfo;

    // Reset celebrations first
    setShowStreakCelebration(false);
    setShowLevelUpCelebration(false);

    if (currentReward && isAnimationVisible) {
      const title = currentReward.title?.toLowerCase() || '';
      
      // Check for streak milestone
      if (title.includes('streak') && streakInfo) {
        setShowStreakCelebration(true);
      }
      // Check for level up
      else if (title.includes('level') && levelInfo) {
        setShowLevelUpCelebration(true);
      }
    }
  }, [
    gamificationContext?.currentReward,
    gamificationContext?.isAnimationVisible,
    gamificationContext?.streakInfo,
    gamificationContext?.levelInfo
  ]);

  // Safe value extraction with fallbacks
  const currentReward = gamificationContext?.currentReward ?? null;
  const isAnimationVisible = gamificationContext?.isAnimationVisible ?? false;
  const hideAnimation = gamificationContext?.hideAnimation ?? (() => {});
  const streakInfo = gamificationContext?.streakInfo ?? null;
  const levelInfo = gamificationContext?.levelInfo ?? null;

  // Handler functions
  const handleStreakClose = () => {
    setShowStreakCelebration(false);
    hideAnimation();
  };

  const handleLevelUpClose = () => {
    setShowLevelUpCelebration(false);
    hideAnimation();
  };

  // Determine reward type based on XP amount and title
  const getRewardType = () => {
    if (!currentReward) return 'standard';
    
    const title = currentReward.title?.toLowerCase() || '';
    const amount = currentReward.amount || 0;
    
    if (title.includes('streak') || title.includes('fire')) return 'streak';
    if (title.includes('achievement') || title.includes('badge') || title.includes('unlock')) return 'achievement';
    if (title.includes('milestone') || title.includes('level') || amount >= 100) return 'milestone';
    
    return 'standard';
  };

  // Always render the same JSX structure to maintain consistent hook calls
  return (
    <>
      {children}
      
      {/* Only render celebrations if gamification context is available */}
      {gamificationContext && (
        <>
          {/* Streak Celebration */}
          {streakInfo && showStreakCelebration && (
            <StreakCelebration
              visible={showStreakCelebration}
              streakDays={streakInfo.days}
              habitName={streakInfo.habitName}
              onClose={handleStreakClose}
            />
          )}
          
          {/* Level Up Celebration */}
          {levelInfo && showLevelUpCelebration && (
            <LevelUpCelebration
              visible={showLevelUpCelebration}
              oldLevel={levelInfo.oldLevel}
              newLevel={levelInfo.newLevel}
              xpGained={levelInfo.xpGained}
              onClose={handleLevelUpClose}
            />
          )}
          
          {/* Standard XP Reward */}
          {currentReward && isAnimationVisible && !showStreakCelebration && !showLevelUpCelebration && (
            <PremiumXPReward
              visible={isAnimationVisible}
              xpAmount={currentReward.amount}
              title={currentReward.title}
              subtitle={currentReward.subtitle}
              type={getRewardType()}
              onClose={hideAnimation}
            />
          )}
        </>
      )}
    </>
  );
}