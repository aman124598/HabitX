import { Request, Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { FriendshipRepository, IFriendship } from '../models/Friendship';
import { UserRepository, IUser } from '../models/User';
import { HabitRepository } from '../models/Habit';

// Interface for friend response
interface FriendResponse {
  id: string;
  username: string;
  email: string;
  totalXP: number;
  level: number;
  bio?: string;
  avatar?: string;
  isPublic: boolean;
  createdAt: string;
  friendsSince?: string;
}

export const friendsController = {
  // @desc    Search users by username
  // @route   GET /api/friends/search
  // @access  Private
  searchUsers: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { query, limit = 20 } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      throw createError('Search query must be at least 2 characters', 400);
    }

    try {
      const limitNum = Math.min(parseInt(limit as string) || 20, 50);

      // Search for users
      const users = await UserRepository.searchByUsername(query.trim(), limitNum);
      
      // Filter out current user
      const filteredUsers = users.filter(user => user.id !== req.user!.id);

      // Get friendship status for each user
      const usersWithFriendStatus = await Promise.all(
        filteredUsers.map(async (user) => {
          const friendship = await FriendshipRepository.findByUsers(req.user!.id, user.id);

          let friendshipStatus = 'none';
          if (friendship) {
            if (friendship.status === 'accepted') {
              friendshipStatus = 'friends';
            } else if (friendship.status === 'pending') {
              friendshipStatus = friendship.requester === req.user!.id ? 'request_sent' : 'request_received';
            } else if (friendship.status === 'blocked') {
              friendshipStatus = 'blocked';
            }
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            totalXP: user.totalXP,
            level: user.level,
            bio: user.bio,
            avatar: user.avatar,
            isPublic: user.isPublic,
            createdAt: user.createdAt.toISOString(),
            friendshipStatus,
          };
        })
      );

      res.json({ success: true, data: usersWithFriendStatus });
    } catch (error: any) {
      console.error('Search users error:', error);
      throw createError('Failed to search users', 500);
    }
  }),

  // @desc    Send friend request
  // @route   POST /api/friends/request
  // @access  Private
  sendFriendRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { userId } = req.body;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    if (userId === req.user.id) {
      throw createError('Cannot send friend request to yourself', 400);
    }

    try {
      const recipient = await UserRepository.findById(userId);
      
      if (!recipient) {
        throw createError('User not found', 404);
      }

      if (!recipient.isPublic) {
        throw createError('Cannot send friend request to private user', 403);
      }

      // Check if friendship already exists
      const existingFriendship = await FriendshipRepository.findByUsers(req.user.id, userId);

      if (existingFriendship) {
        let message = 'Friend request already exists';
        if (existingFriendship.status === 'accepted') {
          message = 'You are already friends with this user';
        } else if (existingFriendship.status === 'blocked') {
          message = 'Cannot send friend request to this user';
        } else if (existingFriendship.status === 'pending') {
          message = existingFriendship.requester === req.user.id 
            ? 'Friend request already sent' 
            : 'This user has already sent you a friend request';
        }
        throw createError(message, 409);
      }

      const friendRequest = await FriendshipRepository.create({
        requester: req.user.id,
        recipient: userId,
        status: 'pending',
      });

      res.status(201).json({
        success: true,
        message: 'Friend request sent successfully',
        data: friendRequest,
      });
    } catch (error: any) {
      console.error('Send friend request error:', error);
      if (error.statusCode || error.status) throw error;
      throw createError('Failed to send friend request', 500);
    }
  }),

  // @desc    Respond to friend request (accept/decline)
  // @route   PUT /api/friends/request/:requestId
  // @access  Private
  respondToFriendRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { requestId } = req.params;
    const { action } = req.body;

    if (!['accept', 'decline'].includes(action)) {
      throw createError('Action must be either "accept" or "decline"', 400);
    }

    try {
      const friendRequest = await FriendshipRepository.findById(requestId);

      if (!friendRequest) {
        throw createError('Friend request not found', 404);
      }

      if (friendRequest.recipient !== req.user.id) {
        throw createError('You can only respond to friend requests sent to you', 403);
      }

      if (friendRequest.status !== 'pending') {
        throw createError('Friend request has already been responded to', 400);
      }

      const updated = action === 'accept' 
        ? await FriendshipRepository.accept(requestId)
        : await FriendshipRepository.decline(requestId);

      res.json({
        success: true,
        message: `Friend request ${action}ed successfully`,
        data: updated,
      });
    } catch (error: any) {
      console.error('Respond to friend request error:', error);
      if (error.statusCode || error.status) throw error;
      throw createError('Failed to respond to friend request', 500);
    }
  }),

  // @desc    Get friend requests (sent and received)
  // @route   GET /api/friends/requests
  // @access  Private
  getFriendRequests: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    try {
      const sentRequests = await FriendshipRepository.findSentByUser(req.user.id);
      const receivedRequests = await FriendshipRepository.findPendingForUser(req.user.id);

      const formatRequest = async (request: IFriendship, type: 'sent' | 'received') => {
        const requester = await UserRepository.findById(request.requester);
        const recipient = await UserRepository.findById(request.recipient);

        if (!requester || !recipient) return null;

        const formatUser = (user: IUser) => ({
          id: user.id,
          username: user.username,
          email: user.email,
          totalXP: user.totalXP,
          level: user.level,
          bio: user.bio,
          avatar: user.avatar,
          isPublic: user.isPublic,
          createdAt: user.createdAt.toISOString(),
        });

        return {
          id: request.id,
          requester: formatUser(requester),
          recipient: formatUser(recipient),
          status: request.status,
          createdAt: request.createdAt.toISOString(),
        };
      };

      const sent = (await Promise.all(sentRequests.map(r => formatRequest(r, 'sent')))).filter(Boolean);
      const received = (await Promise.all(receivedRequests.map(r => formatRequest(r, 'received')))).filter(Boolean);

      res.json({ success: true, data: { sent, received } });
    } catch (error: any) {
      console.error('Get friend requests error:', error);
      throw createError('Failed to get friend requests', 500);
    }
  }),

  // @desc    Get friends list
  // @route   GET /api/friends
  // @access  Private
  getFriends: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    try {
      const friendships = await FriendshipRepository.findAcceptedForUser(req.user.id);

      const friends: FriendResponse[] = await Promise.all(
        friendships.map(async (friendship) => {
          const friendId = friendship.requester === req.user!.id 
            ? friendship.recipient 
            : friendship.requester;
          
          const friend = await UserRepository.findById(friendId);
          if (!friend) return null;

          return {
            id: friend.id,
            username: friend.username,
            email: friend.email,
            totalXP: friend.totalXP,
            level: friend.level,
            bio: friend.bio,
            avatar: friend.avatar,
            isPublic: friend.isPublic,
            createdAt: friend.createdAt.toISOString(),
            friendsSince: friendship.updatedAt.toISOString(),
          };
        })
      ).then(results => results.filter(Boolean) as FriendResponse[]);

      res.json({ success: true, data: friends });
    } catch (error: any) {
      console.error('Get friends error:', error);
      throw createError('Failed to get friends', 500);
    }
  }),

  // @desc    Remove friend
  // @route   DELETE /api/friends/:friendId
  // @access  Private
  removeFriend: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { friendId } = req.params;

    try {
      const friendship = await FriendshipRepository.findByUsers(req.user.id, friendId);

      if (!friendship || friendship.status !== 'accepted') {
        throw createError('Friendship not found', 404);
      }

      await FriendshipRepository.delete(friendship.id);

      res.json({ success: true, message: 'Friend removed successfully' });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      if (error.status) throw error;
      throw createError('Failed to remove friend', 500);
    }
  }),

  // @desc    Cancel friend request
  // @route   DELETE /api/friends/request/:requestId
  // @access  Private
  cancelFriendRequest: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { requestId } = req.params;

    try {
      const friendRequest = await FriendshipRepository.findById(requestId);

      if (!friendRequest) {
        throw createError('Friend request not found', 404);
      }

      if (friendRequest.requester !== req.user.id) {
        throw createError('You can only cancel your own friend requests', 403);
      }

      if (friendRequest.status !== 'pending') {
        throw createError('Can only cancel pending friend requests', 400);
      }

      await FriendshipRepository.delete(requestId);

      res.json({ success: true, message: 'Friend request cancelled successfully' });
    } catch (error: any) {
      console.error('Cancel friend request error:', error);
      if (error.statusCode || error.status) throw error;
      throw createError('Failed to cancel friend request', 500);
    }
  }),

  // @desc    Get user profile
  // @route   GET /api/friends/profile/:userId
  // @access  Private
  getUserProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw createError('Not authenticated', 401);
    }

    const { userId } = req.params;

    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw createError('User not found', 404);
      }

      // Check if user is public or if they are friends
      let canViewProfile = user.isPublic;
      
      if (!canViewProfile && userId !== req.user.id) {
        const areFriends = await FriendshipRepository.areFriends(req.user.id, userId);
        canViewProfile = areFriends;
      }

      if (!canViewProfile && userId !== req.user.id) {
        throw createError('Cannot view this user\'s profile', 403);
      }

      // Get user's habit statistics
      const habits = await HabitRepository.findByUserId(userId);
      const today = new Date().toISOString().split('T')[0];
      
      const habitStats = {
        totalHabits: habits.length,
        completedToday: habits.filter(h => h.lastCompletedOn === today).length,
        activeStreaks: habits.filter(h => h.streak > 0).length,
        longestStreak: Math.max(...habits.map(h => h.streak), 0),
      };

      // Check friendship status
      let friendshipStatus = 'none';
      if (userId === req.user.id) {
        friendshipStatus = 'self';
      } else {
        const friendship = await FriendshipRepository.findByUsers(req.user.id, userId);
        if (friendship) {
          if (friendship.status === 'accepted') {
            friendshipStatus = 'friends';
          } else if (friendship.status === 'pending') {
            friendshipStatus = friendship.requester === req.user.id ? 'request_sent' : 'request_received';
          }
        }
      }

      res.json({
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          totalXP: user.totalXP,
          level: user.level,
          bio: user.bio,
          avatar: user.avatar,
          isPublic: user.isPublic,
          createdAt: user.createdAt.toISOString(),
          habitStats,
          friendshipStatus,
        },
      });
    } catch (error: any) {
      console.error('Get user profile error:', error);
      if (error.status) throw error;
      throw createError('Failed to get user profile', 500);
    }
  }),
};

export default friendsController;