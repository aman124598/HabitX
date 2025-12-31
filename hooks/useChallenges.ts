import { useState, useEffect } from 'react';
import { challengesApi, Challenge, CreateChallengeData, Leaderboard } from '../lib/challengesApi';
import authService from '../lib/auth';

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

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChallenges = async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }) => {
    if (!authService.isAuthenticated()) {
      console.log('📱 Skipping fetchChallenges - user not authenticated');
      return { challenges: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await challengesApi.getChallenges(params);
      
      // Filter out challenges that the user has already joined, but keep public challenges
      const userChallengeIds = userChallenges.map(uc => uc.id);
      const availableChallenges = result.challenges.filter(challenge => 
        !userChallengeIds.includes(challenge.id) && challenge.isPublic
      );
      
      // Preserve existing challenges and add new ones, then sort by creation date
      setChallenges(prev => {
        const existingIds = prev.map(c => c.id);
        const newChallenges = availableChallenges.filter(c => !existingIds.includes(c.id));
        const allChallenges = [...prev, ...newChallenges];
        
        // Sort by creation date (newest first) and then by participant count
        return allChallenges.sort((a, b) => {
          const dateCompare = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (dateCompare !== 0) return dateCompare;
          return b.participants.length - a.participants.length;
        });
      });
      
      return { ...result, challenges: availableChallenges };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchUserChallenges = async (status?: string) => {
    if (!authService.isAuthenticated()) {
      console.log('📱 Skipping fetchUserChallenges - user not authenticated');
      return [];
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await challengesApi.getUserChallenges(status);
      
      // If no status provided, don't filter - return all challenges sorted
      if (!status) {
        const sortedChallenges = result.sort((a, b) => {
          // Sort by status (active first), then by creation date
          const aStatus = getChallengeDisplayStatus(a);
          const bStatus = getChallengeDisplayStatus(b);
          
          if (aStatus !== bStatus) {
            if (aStatus === 'active') return -1;
            if (bStatus === 'active') return 1;
            if (aStatus === 'completed') return -1;
            if (bStatus === 'completed') return 1;
          }
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setUserChallenges(sortedChallenges);
        return sortedChallenges;
      }
      
      // Filter challenges based on their display status
      let filteredChallenges = result;
      if (status === 'active') {
        filteredChallenges = result.filter(challenge => getChallengeDisplayStatus(challenge) === 'active');
      } else if (status === 'completed') {
        filteredChallenges = result.filter(challenge => getChallengeDisplayStatus(challenge) === 'completed');
      }
      
      setUserChallenges(filteredChallenges);
      return filteredChallenges;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user challenges');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async (data: CreateChallengeData) => {
    try {
      setLoading(true);
      setError(null);
      const newChallenge = await challengesApi.createChallenge(data);
      setUserChallenges(prev => [newChallenge, ...prev]);
      return newChallenge;
    } catch (err: any) {
      setError(err.message || 'Failed to create challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string, inviteCode?: string) => {
    try {
      setLoading(true);
      setError(null);
      let challenge;
      
      if (inviteCode) {
        // If invite code is provided, use the invite code endpoint
        challenge = await challengesApi.joinByInviteCode(inviteCode);
      } else {
        // Otherwise use the regular join endpoint
        challenge = await challengesApi.joinChallenge(challengeId);
      }
      
      // Add the challenge to userChallenges
      setUserChallenges(prev => {
        // Check if challenge is already in the list
        if (prev.some(c => c.id === challenge.id)) {
          return prev;
        }
        return [challenge, ...prev];
      });
      
      // Remove the challenge from the discover challenges list
      setChallenges(prev => prev.filter(c => c.id !== challenge.id));
      
      return challenge;
    } catch (err: any) {
      setError(err.message || 'Failed to join challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveChallenge = async (challengeId: string) => {
    try {
      setLoading(true);
      setError(null);
      await challengesApi.leaveChallenge(challengeId);
      
      // Find the challenge being left
      const challengeToLeave = userChallenges.find(c => c.id === challengeId);
      
      setUserChallenges(prev => prev.filter(c => c.id !== challengeId));
      
      // Add the challenge back to the discover list if it's public
      if (challengeToLeave && challengeToLeave.isPublic) {
        setChallenges(prev => {
          // Only add if it's not already in the list
          if (!prev.some(c => c.id === challengeId)) {
            return [challengeToLeave, ...prev];
          }
          return prev;
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to leave challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelChallenge = async (challengeId: string) => {
    try {
      setLoading(true);
      setError(null);
      await challengesApi.cancelChallenge(challengeId);
      setUserChallenges(prev => 
        prev.map(c => 
          c.id === challengeId 
            ? { ...c, status: 'cancelled' }
            : c
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to cancel challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async (challengeId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('📱 Generating invite code for challenge:', challengeId);
      const result = await challengesApi.generateInviteCode(challengeId);
      console.log('✅ Invite code generated:', result.inviteCode);
      return result.inviteCode;
    } catch (err: any) {
      console.error('❌ Failed to generate invite code:', err);
      setError(err.message || 'Failed to generate invite code');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboard = async (challengeId: string): Promise<Leaderboard> => {
    try {
      setLoading(true);
      setError(null);
      return await challengesApi.getLeaderboard(challengeId);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch leaderboard');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getChallenge = async (challengeId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await challengesApi.getChallenge(challengeId);
      // Ensure challenge is present in local cache
      setChallenges(prev => {
        if (prev.some(c => c.id === data.id)) return prev;
        return [data, ...prev];
      });
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenge');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
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
    generateInviteCode,
    getLeaderboard,
  getChallenge,
    clearError: () => setError(null),
  };
};

export default useChallenges;
