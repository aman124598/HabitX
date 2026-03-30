import { Request, Response } from 'express';
import { UserRepository, IUser } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';

// @desc    Get current logged in user (or auto-create from Clerk session)
// @route   GET /api/auth/me
// @access  Private (Clerk JWT required)
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.userId) {
    throw createError('Not authenticated', 401);
  }

  const clerkUserId = req.auth.userId;

  // Try to find existing user by Clerk ID
  let user = await UserRepository.findByClerkId(clerkUserId);

  // Auto-create MongoDB record on first login
  if (!user) {
    const clerkUser = (req as any).clerkUser;
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
    const username =
      clerkUser?.username ||
      clerkUser?.firstName ||
      email.split('@')[0] ||
      `user_${clerkUserId.slice(-8)}`;

    user = await UserRepository.create({
      clerkId: clerkUserId,
      username,
      email,
      emailVerified: true,
    });
    console.log(`✅ Auto-created MongoDB user for Clerk ID: ${clerkUserId}`);
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

  const { username, email, bio, avatar, isPublic } = req.body;

  // Check for username conflicts
  if (username) {
    const existing = await UserRepository.findByUsername(username);
    if (existing && existing.clerkId !== req.auth.userId) {
      throw createError('Username already taken', 400);
    }
  }

  const updateData: Partial<IUser> = {};
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatar !== undefined) updateData.avatar = avatar;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  let user = await UserRepository.findByClerkId(req.auth.userId);
  if (!user) throw createError('User not found', 404);

  const updated = await UserRepository.update(user.id, updateData);
  if (!updated) throw createError('User not found', 404);

  res.status(200).json({ success: true, data: updated });
});

// @desc    Change password (not applicable for Clerk — password changes happen via Clerk dashboard/flow)
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

// @desc    Update user gamification data (add XP)
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
      leveledUp: updatedUser.level > oldLevel,
      previousLevel: oldLevel,
    },
  });
});

// These endpoints are no longer needed — Clerk handles email verification and password reset
// Stubs kept to avoid 404s if old clients call them
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
