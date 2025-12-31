import express from 'express';
import { leaderboardController } from '../controllers/leaderboardController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Global leaderboard routes
router.get('/global', leaderboardController.getGlobalLeaderboard as any);
router.get('/position', leaderboardController.getUserPosition as any);
router.get('/debug/user-count', leaderboardController.getUserCount as any);

export default router;