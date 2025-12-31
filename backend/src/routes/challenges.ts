import express from 'express';
import { challengeController } from '../controllers/challengeController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Challenge management routes
router.post('/', challengeController.createChallenge as any);
router.get('/', challengeController.getChallenges as any);
router.get('/user', challengeController.getUserChallenges as any);

// Challenge participation routes (must come before generic /:challengeId)
router.post('/join/invite', challengeController.joinByInviteCode as any);

// Specific challenge routes (must come before generic /:challengeId)
router.get('/:challengeId/leaderboard', challengeController.getLeaderboard as any);
router.post('/:challengeId/join', challengeController.joinChallenge as any);
router.delete('/:challengeId/leave', challengeController.leaveChallenge as any);
router.delete('/:challengeId/cancel', challengeController.cancelChallenge as any);
router.post('/:challengeId/invite', challengeController.generateInviteCode as any);

// Generic challenge by ID (must come after specific routes)
router.get('/:challengeId', challengeController.getChallengeById as any);

// Progress and utility routes
router.post('/progress', challengeController.updateProgress as any);

export default router;
