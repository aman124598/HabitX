import { Response } from 'express';
import { ChallengeRepository, IChallenge } from '../models/Challenge';
import { UserChallengeRepository, IUserChallenge } from '../models/UserChallenge';
import { UserRepository } from '../models/User';
import { HabitRepository } from '../models/Habit';
import { AuthRequest } from '../types/express';

export const challengeController = {
  // Create a new challenge
  async createChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, description, habitCriteria, goal, duration, rewards, type } = req.body;
      const userId = req.user!.id;

      if (!name || !habitCriteria || !goal || !duration) {
        res.status(400).json({ error: 'Name, habit criteria, goal, and duration are required' });
        return;
      }

      const startDate = new Date(duration.startDate);
      const endDate = new Date(duration.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({ error: 'Invalid start or end date format' });
        return;
      }

      if (endDate <= startDate) {
        res.status(400).json({ error: 'End date must be after start date' });
        return;
      }

      const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const challenge = await ChallengeRepository.create({
        name,
        description: description || '',
        type: type || 'streak',
        createdBy: userId,
        habitCriteria: habitCriteria || {},
        goal,
        duration: { startDate, endDate, durationDays },
        rewards: rewards || { winner: [], participation: [], xpReward: 100, badges: [] },
        participants: [userId],
        status: 'active',
        isPublic: true,
        rules: { allowMultipleHabits: false, requireApproval: false },
        leaderboard: [],
        chatEnabled: true,
      });

      // Create user challenge for creator
      await UserChallengeRepository.create({
        userId,
        challengeId: challenge.id,
        progress: { currentValue: 0, targetValue: goal.target, percentage: 0, lastUpdated: new Date() },
        status: 'active',
        joinedAt: new Date(),
        habitIds: [],
        dailyProgress: [],
        achievements: [],
        rank: 0,
        xpEarned: 0,
        badges: [],
      });

      res.status(201).json(challenge);
    } catch (error: any) {
      console.error('Create challenge error:', error);
      res.status(500).json({ error: 'Failed to create challenge', details: error.message });
    }
  },

  // Get all active challenges
  async getChallenges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const challenges = await ChallengeRepository.findPublicChallenges(20);
      res.json({ challenges, pagination: { page: 1, limit: 20, total: challenges.length, pages: 1 } });
    } catch (error: any) {
      console.error('Get challenges error:', error);
      res.status(500).json({ error: 'Failed to fetch challenges', details: error.message });
    }
  },

  // Get single challenge by ID
  async getChallengeById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = (req as any).params;
      const challenge = await ChallengeRepository.findById(challengeId);

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      res.json(challenge);
    } catch (error: any) {
      console.error('Get challenge by id error:', error);
      res.status(500).json({ error: 'Failed to fetch challenge', details: error.message });
    }
  },

  // Get user's challenges
  async getUserChallenges(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const challenges = await ChallengeRepository.findByParticipant(userId);

      const challengesWithProgress = await Promise.all(
        challenges.map(async (challenge) => {
          const userChallenge = await UserChallengeRepository.findByUserAndChallenge(userId, challenge.id);
          return {
            ...challenge,
            userProgress: userChallenge ? {
              currentValue: userChallenge.progress.currentValue,
              targetValue: userChallenge.progress.targetValue,
              progressPercentage: userChallenge.progress.percentage,
              rank: userChallenge.rank,
              achievements: userChallenge.achievements,
            } : null,
          };
        })
      );

      res.json(challengesWithProgress);
    } catch (error: any) {
      console.error('Get user challenges error:', error);
      res.status(500).json({ error: 'Failed to fetch user challenges', details: error.message });
    }
  },

  // Join a challenge
  async joinChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const { inviteCode } = req.body;
      const userId = req.user!.id;

      let challenge: IChallenge | null = null;
      
      if (inviteCode && challengeId === inviteCode) {
        challenge = await ChallengeRepository.findByInviteCode(inviteCode);
      } else {
        challenge = await ChallengeRepository.findById(challengeId);
      }

      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      if (challenge.status !== 'active') {
        res.status(400).json({ error: 'Challenge is not active' });
        return;
      }

      if (challenge.participants.includes(userId)) {
        res.status(400).json({ error: 'Already participating in this challenge' });
        return;
      }

      if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
        res.status(400).json({ error: 'Challenge is full' });
        return;
      }

      await ChallengeRepository.addParticipant(challenge.id, userId);

      await UserChallengeRepository.create({
        userId,
        challengeId: challenge.id,
        progress: { currentValue: 0, targetValue: challenge.goal.target, percentage: 0, lastUpdated: new Date() },
        status: 'active',
        joinedAt: new Date(),
        habitIds: [],
        dailyProgress: [],
        achievements: [],
        rank: 0,
        xpEarned: 0,
        badges: [],
      });

      const updatedChallenge = await ChallengeRepository.findById(challenge.id);
      res.json(updatedChallenge);
    } catch (error: any) {
      console.error('Join challenge error:', error);
      res.status(500).json({ error: 'Failed to join challenge', details: error.message });
    }
  },

  // Join challenge by invite code
  async joinByInviteCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { inviteCode } = req.body;
      const userId = req.user!.id;

      if (!inviteCode) {
        res.status(400).json({ error: 'Invite code is required' });
        return;
      }

      const challenge = await ChallengeRepository.findByInviteCode(inviteCode);
      if (!challenge) {
        res.status(404).json({ error: 'Invalid invite code' });
        return;
      }

      if (challenge.status !== 'active') {
        res.status(400).json({ error: 'Challenge is not active' });
        return;
      }

      if (challenge.participants.includes(userId)) {
        res.status(400).json({ error: 'Already participating in this challenge' });
        return;
      }

      if (challenge.maxParticipants && challenge.participants.length >= challenge.maxParticipants) {
        res.status(400).json({ error: 'Challenge is full' });
        return;
      }

      await ChallengeRepository.addParticipant(challenge.id, userId);

      await UserChallengeRepository.create({
        userId,
        challengeId: challenge.id,
        progress: { currentValue: 0, targetValue: challenge.goal.target, percentage: 0, lastUpdated: new Date() },
        status: 'active',
        joinedAt: new Date(),
        habitIds: [],
        dailyProgress: [],
        achievements: [],
        rank: 0,
        xpEarned: 0,
        badges: [],
      });

      const updatedChallenge = await ChallengeRepository.findById(challenge.id);
      res.json(updatedChallenge);
    } catch (error: any) {
      console.error('Join by invite code error:', error);
      res.status(500).json({ error: 'Failed to join challenge', details: error.message });
    }
  },

  // Leave a challenge
  async leaveChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const userId = req.user!.id;

      const challenge = await ChallengeRepository.findById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      if (!challenge.participants.includes(userId)) {
        res.status(400).json({ error: 'Not participating in this challenge' });
        return;
      }

      if (challenge.createdBy === userId) {
        res.status(400).json({ error: 'Challenge creator cannot leave. Cancel the challenge instead.' });
        return;
      }

      await ChallengeRepository.removeParticipant(challengeId, userId);

      const userChallenge = await UserChallengeRepository.findByUserAndChallenge(userId, challengeId);
      if (userChallenge) {
        await UserChallengeRepository.delete(userChallenge.id);
      }

      res.json({ message: 'Successfully left the challenge' });
    } catch (error: any) {
      console.error('Leave challenge error:', error);
      res.status(500).json({ error: 'Failed to leave challenge', details: error.message });
    }
  },

  // Update challenge progress based on habit completion
  async updateProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { habitId } = req.body;
      const userId = req.user!.id;

      const habit = await HabitRepository.findById(habitId);
      if (!habit) {
        res.status(404).json({ error: 'Habit not found' });
        return;
      }

      const userChallenges = await UserChallengeRepository.findByUser(userId);
      const activeChallenges = userChallenges.filter(uc => uc.status === 'active');
      
      const updatedChallenges: IUserChallenge[] = [];

      for (const userChallenge of activeChallenges) {
        const challenge = await ChallengeRepository.findById(userChallenge.challengeId);
        if (!challenge) continue;
        
        const meetsCategory = !challenge.habitCriteria.category || habit.category === challenge.habitCriteria.category;
        const meetsName = !challenge.habitCriteria.name || habit.name.toLowerCase().includes(challenge.habitCriteria.name.toLowerCase());

        if (meetsCategory && meetsName) {
          const today = new Date().toISOString().split('T')[0];
          const updated = await UserChallengeRepository.addDailyProgress(userChallenge.id, today, 1);
          if (updated) updatedChallenges.push(updated);
        }
      }

      res.json({ message: 'Progress updated', updatedChallenges: updatedChallenges.length });
    } catch (error: any) {
      console.error('Update progress error:', error);
      res.status(500).json({ error: 'Failed to update progress', details: error.message });
    }
  },

  // Get challenge leaderboard
  async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;

      const challenge = await ChallengeRepository.findById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      const leaderboardData = await UserChallengeRepository.getLeaderboard(challengeId);
      
      // Get user details for each entry
      const leaderboardWithUsers = await Promise.all(
        leaderboardData.map(async (entry) => {
          const user = await UserRepository.findById(entry.userId);
          return {
            rank: entry.rank,
            user: user ? { id: user.id, username: user.username, email: user.email } : null,
            currentValue: entry.progress.currentValue,
            targetValue: entry.progress.targetValue,
            progressPercentage: entry.progress.percentage,
            achievements: entry.achievements,
            xp: entry.xpEarned,
          };
        })
      );

      res.json({
        challenge: { id: challenge.id, name: challenge.name, type: challenge.type, goal: challenge.goal },
        leaderboard: leaderboardWithUsers,
      });
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard', details: error.message });
    }
  },

  // Generate invite code
  async generateInviteCode(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const userId = req.user!.id;

      const challenge = await ChallengeRepository.findById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      if (challenge.createdBy !== userId) {
        res.status(403).json({ error: 'Only challenge creator can generate invite codes' });
        return;
      }

      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await ChallengeRepository.update(challengeId, { inviteCode } as any);

      res.json({ inviteCode });
    } catch (error: any) {
      console.error('Generate invite code error:', error);
      res.status(500).json({ error: 'Failed to generate invite code', details: error.message });
    }
  },

  // Cancel challenge (creator only)
  async cancelChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.params;
      const userId = req.user!.id;

      const challenge = await ChallengeRepository.findById(challengeId);
      if (!challenge) {
        res.status(404).json({ error: 'Challenge not found' });
        return;
      }

      if (challenge.createdBy !== userId) {
        res.status(403).json({ error: 'Only challenge creator can cancel' });
        return;
      }

      await ChallengeRepository.update(challengeId, { status: 'cancelled' });
      await UserChallengeRepository.deleteByChallenge(challengeId);

      res.json({ message: 'Challenge cancelled successfully' });
    } catch (error: any) {
      console.error('Cancel challenge error:', error);
      res.status(500).json({ error: 'Failed to cancel challenge', details: error.message });
    }
  },
};

export default challengeController;
