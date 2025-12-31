import express from 'express';
import { friendsController } from '../controllers/friendsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search users
router.get('/search', friendsController.searchUsers as any);

// Friend requests
router.get('/requests', friendsController.getFriendRequests as any);
router.post('/request', friendsController.sendFriendRequest as any);
router.put('/request/:requestId', friendsController.respondToFriendRequest as any);
router.delete('/request/:requestId', friendsController.cancelFriendRequest as any);

// Friends
router.get('/', friendsController.getFriends as any);
router.delete('/:friendId', friendsController.removeFriend as any);

// User profiles
router.get('/profile/:userId', friendsController.getUserProfile as any);

export default router;