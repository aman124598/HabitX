import { useState, useCallback } from 'react';
import leaderboardApi, { 
  GlobalLeaderboard, 
  GlobalLeaderboardEntry, 
  UserPosition 
} from '../lib/leaderboardApi';

interface UseLeaderboardReturn {
  globalLeaderboard: GlobalLeaderboard | null;
  userPosition: UserPosition | null;
  loading: boolean;
  error: string | null;
  fetchGlobalLeaderboard: (params?: { limit?: number; page?: number }) => Promise<void>;
  fetchAllGlobalLeaderboard: (perPage?: number) => Promise<void>;
  fetchUserPosition: () => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboard | null>(null);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGlobalLeaderboard = useCallback(async (params?: { limit?: number; page?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaderboardApi.getGlobalLeaderboard(params);
      setGlobalLeaderboard(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch global leaderboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all pages of the global leaderboard by iterating pages until all users are loaded
  const fetchAllGlobalLeaderboard = useCallback(async (perPage: number = 100) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 fetchAllGlobalLeaderboard: Starting to fetch all pages...');

      let page = 1;
      let aggregated: GlobalLeaderboardEntry[] = [];
      let totalUsers = 0;
      let userRank: number | undefined = undefined;
      const seen = new Set<string>();

      // Safety cap to avoid infinite loops
      const maxPages = 200; // supports up to 20,000 users at 100/page

      while (page <= maxPages) {
        console.log(`📄 Fetching page ${page} with limit ${perPage}...`);
        const data = await leaderboardApi.getGlobalLeaderboard({ limit: perPage, page });
        
        totalUsers = data.totalUsers || totalUsers;
        userRank = data.userRank || userRank;

        console.log(`📄 Page ${page} response: ${data.leaderboard.length} users, totalUsers: ${totalUsers}, userRank: ${userRank}`);

        const beforeLen = aggregated.length;
        for (const entry of data.leaderboard) {
          const id = entry.user.id;
          if (!seen.has(id)) {
            seen.add(id);
            aggregated.push(entry);
          }
        }

        console.log(`📄 Page ${page} processed: added ${aggregated.length - beforeLen} new users (total: ${aggregated.length})`);

        // Stop conditions
        const received = data.leaderboard.length;
        if (received < perPage) {
          console.log(`🔚 Last page reached: received ${received} < ${perPage}`);
          break;
        }
        if (aggregated.length >= totalUsers) {
          console.log(`🔚 All users collected: ${aggregated.length} >= ${totalUsers}`);
          break;
        }
        if (aggregated.length === beforeLen) {
          console.log(`🔚 No progress made on page ${page}`);
          break;
        }

        page += 1;
      }

      // Ensure sorted by rank if provided
      aggregated.sort((a, b) => a.rank - b.rank);

      console.log(`✅ fetchAllGlobalLeaderboard completed: ${aggregated.length} total users`);

      setGlobalLeaderboard({
        leaderboard: aggregated,
        userRank: userRank,
        totalUsers: totalUsers || aggregated.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complete global leaderboard');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserPosition = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await leaderboardApi.getUserPosition();
      setUserPosition(data);
    } catch (err: any) {
      // Don't set error for user position failures - this is not critical
      console.warn('Failed to fetch user position:', err.message || err);
      // Set null to indicate no position available
      setUserPosition(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        leaderboardApi.getGlobalLeaderboard().then(setGlobalLeaderboard),
        leaderboardApi.getUserPosition().then(setUserPosition),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh leaderboard data');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    globalLeaderboard,
    userPosition,
    loading,
    error,
    fetchGlobalLeaderboard,
    fetchAllGlobalLeaderboard,
    fetchUserPosition,
    refreshAll,
    clearError,
  };
}