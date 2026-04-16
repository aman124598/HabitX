import { Request, Response } from 'express';
import { UserRepository, IUser } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { clerkClient } from '@clerk/clerk-sdk-node';

function getPreferredClerkEmail(clerkUser: any): string {
  if (!clerkUser) return '';

  const primaryEmailId = clerkUser.primaryEmailAddressId as string | undefined;
  if (primaryEmailId && Array.isArray(clerkUser.emailAddresses)) {
    const primary = clerkUser.emailAddresses.find((emailObj: any) => emailObj?.id === primaryEmailId);
    if (primary?.emailAddress) return String(primary.emailAddress);
  }

  if (Array.isArray(clerkUser.emailAddresses)) {
    const first = clerkUser.emailAddresses.find((emailObj: any) => !!emailObj?.emailAddress);
    if (first?.emailAddress) return String(first.emailAddress);
  }

  return '';
}

// @desc    Get current logged in user (or auto-create from Clerk session)
// @route   GET /api/auth/me
// @access  Private (Clerk JWT required)
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.userId) {
    throw createError('Not authenticated', 401);
  }

  const clerkUserId = req.auth.userId;

  // Find user by Clerk ID
  let user = await UserRepository.findByClerkId(clerkUserId);

  // If user exists but missing fields, sync from Clerk
  if (user && (!user.username || !user.email || user.username.startsWith('user_'))) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      const email = getPreferredClerkEmail(clerkUser);
      const username = clerkUser.username || clerkUser.firstName || email?.split('@')[0];

      if (username || email) {
        const updateData: Partial<IUser> = {};
        if (!user.username || user.username.startsWith('user_')) updateData.username = username;
        if (!user.email) updateData.email = email;
        
        const updated = await UserRepository.update(user.id, updateData);
        if (updated) user = updated;
        console.log(`🔄 Self-healed user record for Clerk ID: ${clerkUserId}`);
      }
    } catch (err) {
      console.warn('Silent sync failed in getMe:', err);
    }
  }

  // If user still doesn't exist (should be handled by middleware) but somehow reached here
  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({ success: true, data: user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.userId) {
    throw createError('Not authenticated', 401);
  }

  const { username, bio, avatar, isPublic } = req.body;

  // Check for username conflicts
  if (username) {
    const existing = await UserRepository.findByUsername(username);
    if (existing && existing.clerkId !== req.auth.userId) {
      throw createError('Username already taken', 400);
    }
  }

  const updateData: Partial<IUser> = {};
  if (username !== undefined) updateData.username = username.trim();
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatar !== undefined) updateData.avatar = avatar;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  let user = await UserRepository.findByClerkId(req.auth.userId);
  if (!user) throw createError('User not found', 404);

  // Update in local DB
  const updated = await UserRepository.update(user.id, updateData);
  if (!updated) throw createError('User not found', 404);

  // Sync with Clerk if username changed
  if (username) {
    try {
      await clerkClient.users.updateUser(req.auth.userId, { username: username.trim() });
    } catch (err) {
      console.warn('Could not sync username with Clerk:', err);
      // We don't fail the whole request because local DB is updated
    }
  }

  res.status(200).json({ success: true, data: updated });
});

// @desc    Password changes are managed by Clerk
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (_req: Request, res: Response) => {
  res.status(400).json({
    success: false,
    message: 'Password changes are managed through Clerk. Use the Clerk account portal or forgot-password flow.',
  });
});

// @desc    Get user gamification data
// @route   GET /api/auth/gamification
// @access  Private
export const getUserGamification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.userId) throw createError('Not authenticated', 401);

  const user = await UserRepository.findByClerkId(req.auth.userId);
  if (!user) throw createError('User not found', 404);

  res.status(200).json({
    success: true,
    data: { totalXP: user.totalXP || 0, level: user.level || 1 },
  });
});

// @desc    Add XP to user
// @route   POST /api/auth/gamification/xp
// @access  Private
export const addUserXP = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.userId) throw createError('Not authenticated', 401);

  const { xp } = req.body;
  if (typeof xp !== 'number' || xp <= 0) throw createError('XP must be a positive number', 400);

  const user = await UserRepository.findByClerkId(req.auth.userId);
  if (!user) throw createError('User not found', 404);

  const oldLevel = user.level || 1;
  const updatedUser = await UserRepository.addXP(user.id, xp);
  if (!updatedUser) throw createError('Failed to update XP', 500);

  res.status(200).json({
    success: true,
    data: {
      totalXP: updatedUser.totalXP,
      level: updatedUser.level,
      xpAdded: xp,
      leveledUp: updatedUser.level! > oldLevel,
      previousLevel: oldLevel,
    },
  });
});

// These endpoints are deprecated — Clerk handles registration and login client-side
export const register = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Registration is handled by Clerk on the client.' });
});

export const login = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Login is handled by Clerk on the client.' });
});

export const verifyEmail = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Email verification is handled by Clerk.' });
});

export const resendVerificationEmail = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Resend verification is handled by Clerk.' });
});

export const forgotPassword = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Password reset is handled by Clerk.' });
});

export const resetPassword = asyncHandler(async (_req: Request, res: Response) => {
  res.status(410).json({ success: false, message: 'Password reset is handled by Clerk.' });
});
