import { Request, Response } from 'express';
import { UserRepository, IUser } from '../models/User';
import { generateToken } from '../utils/jwt';
import { asyncHandler, createError } from '../middleware/errorHandler';
import authService from '../services/firebaseService';
import * as admin from 'firebase-admin';
import path from 'path';
import crypto from 'crypto';
import { firebaseSyncService } from '../services/firebaseSyncService';
import { verifyIdTokenViaRest } from '../services/firebaseTokenVerifier';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password, firebaseUid } = req.body;
  const firebaseTokenHeader = req.headers['x-firebase-token'];
  const bearerAuth = (req.headers.authorization || '').startsWith('Bearer ') ? (req.headers.authorization || '').split(' ')[1] : undefined;
  const idTokenFromHeader = (firebaseTokenHeader as string) || bearerAuth;

  let firebaseUidFromToken: string | undefined;
  let emailVerifiedInFirebase = false;

  // If frontend provided a Firebase ID token, verify it
  if (idTokenFromHeader) {
    let adminVerified = false;
    try {
      if (!admin.apps.length) {
        const serviceAccountPath = path.join(__dirname, '../../credentials/firebase-adminsdk.json');
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
          projectId: serviceAccount.project_id,
        });
        console.log('✅ Firebase Admin initialized in authController');
      }
      const decoded = await admin.auth().verifyIdToken(idTokenFromHeader);
      firebaseUidFromToken = decoded.uid;
      const firebaseUser = await admin.auth().getUser(decoded.uid);
      emailVerifiedInFirebase = firebaseUser.emailVerified || false;
      console.log(`🔐 [Admin] Firebase user ${decoded.email} - emailVerified: ${emailVerifiedInFirebase}`);
      adminVerified = true;
    } catch (adminErr: any) {
      console.warn('⚠️ Admin SDK verify failed, falling back to REST:', adminErr?.message || adminErr);
    }

    if (!adminVerified) {
      try {
        const info = await verifyIdTokenViaRest(idTokenFromHeader);
        firebaseUidFromToken = info.uid;
        emailVerifiedInFirebase = !!info.emailVerified;
        console.log(`🔐 [REST] Firebase user ${info.email} - emailVerified: ${emailVerifiedInFirebase}`);
      } catch (restErr: any) {
        console.warn('Invalid Firebase ID token:', restErr?.message || restErr);
        throw createError('Invalid Firebase authentication. Please try again.', 401);
      }
    }

    if (!emailVerifiedInFirebase) {
      throw createError('Email not verified. Please verify your email before completing registration.', 403);
    }
  }

  // Check if user already exists
  const existingEmail = await UserRepository.findByEmail(email);
  const existingUsername = await UserRepository.findByUsername(username);

  if (existingEmail || existingUsername) {
    throw createError('User with this email or username already exists', 400);
  }

  // Create user in Firestore
  const userPayload: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
    username,
    email,
    emailVerified: emailVerifiedInFirebase,
  };

  if (firebaseUidFromToken) {
    userPayload.firebaseUid = firebaseUidFromToken;
    try {
      await firebaseSyncService.syncUsernameToFirebase(firebaseUidFromToken, username);
      console.log('✅ Username synced to Firebase displayName');
    } catch (syncErr) {
      console.warn('⚠️ Could not sync username to Firebase:', syncErr);
    }
  } else {
    if (!password) {
      throw createError('Password is required', 400);
    }
    userPayload.password = password;
  }

  const user = await UserRepository.create(userPayload);

  console.log(`✅ User created: ${user.username} (${user.email}) - emailVerified: ${user.emailVerified}`);

  const token = generateToken({ id: user.id, username: user.username, email: user.email });

  res.status(201).json({
    success: true,
    message: 'User registered successfully.',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      token,
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const firebaseTokenHeader = req.headers['x-firebase-token'];
  const bearerAuth = (req.headers.authorization || '').startsWith('Bearer ') ? (req.headers.authorization || '').split(' ')[1] : undefined;
  const firebaseToken = (firebaseTokenHeader as string) || bearerAuth;

  if (!email || !password) {
    throw createError('Please provide email and password', 400);
  }

  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Firebase authentication
  if (user.firebaseUid && firebaseToken) {
    try {
      await firebaseSyncService.ensureUserInSync(user.firebaseUid);
    } catch (syncErr) {
      console.warn('[auth] Sync warning:', syncErr);
    }
    
    const token = generateToken({ id: user.id, username: user.username, email: user.email });
    
    return res.status(200).json({
      success: true,
      data: { user, token },
    });
  }
  
  if (user.firebaseUid && !firebaseToken) {
    throw createError('Please try logging in again. If issue persists, use "Forgot Password" to reset.', 401);
  }

  // Legacy password authentication
  if (!user.password) {
    throw createError('Invalid credentials', 401);
  }

  const isMatch = await UserRepository.comparePassword(user, password);

  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  const token = generateToken({ id: user.id, username: user.username, email: user.email });

  res.status(200).json({
    success: true,
    data: { user, token },
  });
});

// @desc    Google OAuth login/register
// @route   POST /api/auth/google-login
// @access  Public
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const bearerAuth = (req.headers.authorization || '').startsWith('Bearer ') ? (req.headers.authorization || '').split(' ')[1] : undefined;
  const { email, displayName, photoURL, firebaseUid } = req.body;

  if (!bearerAuth) {
    throw createError('Firebase token is required', 401);
  }

  if (!email || !firebaseUid) {
    throw createError('Email and Firebase UID are required', 400);
  }

  // Verify the Firebase ID token
  let verifiedUid: string;
  let emailVerified = false;

  try {
    if (!admin.apps.length) {
      const serviceAccountPath = path.join(__dirname, '../../credentials/firebase-adminsdk.json');
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
      });
    }
    const decoded = await admin.auth().verifyIdToken(bearerAuth);
    verifiedUid = decoded.uid;
    const firebaseUser = await admin.auth().getUser(decoded.uid);
    emailVerified = firebaseUser.emailVerified || false;
    console.log(`🔐 Google login: Firebase user ${decoded.email} - emailVerified: ${emailVerified}`);
  } catch (adminErr: any) {
    console.error('Firebase token verification failed:', adminErr?.message || adminErr);
    // Try REST fallback
    try {
      const info = await verifyIdTokenViaRest(bearerAuth);
      verifiedUid = info.uid;
      emailVerified = !!info.emailVerified;
    } catch (restErr: any) {
      throw createError('Invalid Firebase token', 401);
    }
  }

  // Check if UID matches
  if (verifiedUid !== firebaseUid) {
    throw createError('Firebase UID mismatch', 401);
  }

  // Check if user already exists
  let user = await UserRepository.findByFirebaseUid(firebaseUid);
  
  if (!user) {
    // Try to find by email
    user = await UserRepository.findByEmail(email);
  }

  if (user) {
    // User exists, update their info and log them in
    await UserRepository.update(user.id, {
      firebaseUid,
      emailVerified: emailVerified || user.emailVerified,
      avatar: photoURL || user.avatar,
    });

    user = await UserRepository.findById(user.id);
    
    console.log(`✅ Google login: Existing user ${user?.username} (${user?.email})`);
  } else {
    // Create new user from Google data
    const username = displayName?.replace(/\s+/g, '_').toLowerCase() || email.split('@')[0];
    
    // Ensure unique username
    let uniqueUsername = username;
    let counter = 1;
    while (await UserRepository.findByUsername(uniqueUsername)) {
      uniqueUsername = `${username}${counter}`;
      counter++;
    }

    const userPayload: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'> = {
      username: uniqueUsername,
      email,
      emailVerified: true, // Google emails are verified
      firebaseUid,
      totalXP: 0,
      level: 1,
      isPublic: true,
      avatar: photoURL,
    };

    user = await UserRepository.create(userPayload);

    // Sync username to Firebase
    try {
      await firebaseSyncService.syncUsernameToFirebase(firebaseUid, uniqueUsername);
    } catch (syncErr) {
      console.warn('⚠️ Could not sync username to Firebase:', syncErr);
    }

    console.log(`✅ Google login: Created new user ${user.username} (${user.email})`);
  }

  if (!user) {
    throw createError('Failed to create or find user', 500);
  }

  const token = generateToken({ id: user.id, username: user.username, email: user.email });

  res.status(200).json({
    success: true,
    message: 'Google login successful',
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        avatar: user.avatar,
        totalXP: user.totalXP,
        level: user.level,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const user = await UserRepository.findById(req.user.id);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const { username, email, bio, avatar, isPublic } = req.body;

  // Check for conflicts
  if (username) {
    const existing = await UserRepository.findByUsername(username);
    if (existing && existing.id !== req.user.id) {
      throw createError('Username already taken', 400);
    }
  }
  if (email) {
    const existing = await UserRepository.findByEmail(email);
    if (existing && existing.id !== req.user.id) {
      throw createError('Email already taken', 400);
    }
  }

  const updateData: Partial<IUser> = {};
  if (username !== undefined) updateData.username = username;
  if (email !== undefined) updateData.email = email;
  if (bio !== undefined) updateData.bio = bio.trim();
  if (avatar !== undefined) updateData.avatar = avatar;
  if (isPublic !== undefined) updateData.isPublic = isPublic;

  const user = await UserRepository.update(req.user.id, updateData);

  if (!user) {
    throw createError('User not found', 404);
  }

  // Sync username to Firebase
  if (username && user.firebaseUid) {
    try {
      await firebaseSyncService.syncUsernameToFirebase(user.firebaseUid, username);
    } catch (syncErr) {
      console.warn('⚠️ Failed to sync username to Firebase:', syncErr);
    }
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError('Please provide current and new password', 400);
  }

  const user = await UserRepository.findById(req.user.id);

  if (!user || !user.password) {
    throw createError('User not found or no password set', 404);
  }

  const isMatch = await UserRepository.comparePassword(user, currentPassword);

  if (!isMatch) {
    throw createError('Current password is incorrect', 400);
  }

  await UserRepository.update(req.user.id, { password: newPassword });

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
  });
});

// @desc    Get user gamification data
// @route   GET /api/auth/gamification
// @access  Private
export const getUserGamification = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const user = await UserRepository.findById(req.user.id);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      totalXP: user.totalXP || 0,
      level: user.level || 1,
    },
  });
});

// @desc    Update user gamification data (add XP)
// @route   POST /api/auth/gamification/xp
// @access  Private
export const addUserXP = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const { xp } = req.body;

  if (typeof xp !== 'number' || xp <= 0) {
    throw createError('XP must be a positive number', 400);
  }

  const user = await UserRepository.findById(req.user.id);

  if (!user) {
    throw createError('User not found', 404);
  }

  const oldLevel = user.level || 1;
  const updatedUser = await UserRepository.addXP(req.user.id, xp);

  if (!updatedUser) {
    throw createError('Failed to update XP', 500);
  }

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

// @desc    Verify email with verification token
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || '';

  if (authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split(' ')[1];
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      const firebaseUser = await admin.auth().getUser(decoded.uid);

      let user = await UserRepository.findByFirebaseUid(decoded.uid);
      if (!user && firebaseUser.email) {
        user = await UserRepository.findByEmail(firebaseUser.email);
      }

      if (!user) {
        throw createError('User not found', 404);
      }

      await UserRepository.update(user.id, {
        emailVerified: true,
        verificationToken: undefined,
        verificationTokenExpiry: undefined,
      });

      const updatedUser = await UserRepository.findById(user.id);
      return res.status(200).json({ success: true, message: 'Email verified successfully', data: updatedUser });
    } catch (error: any) {
      console.error('Firebase verification flow failed:', error.message || error);
      throw createError('Invalid Firebase verification token', 400);
    }
  }

  // Legacy token verification
  const { token, email } = req.body;

  if (!token || !email) {
    throw createError('Token and email are required', 400);
  }

  const user = await UserRepository.findByVerificationToken(token);

  if (!user || user.email !== email) {
    throw createError('Invalid or expired verification token', 400);
  }

  await UserRepository.update(user.id, {
    emailVerified: true,
    verificationToken: undefined,
    verificationTokenExpiry: undefined,
  });

  const updatedUser = await UserRepository.findById(user.id);

  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
    data: updatedUser,
  });
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw createError('If an account exists with this email, you will receive a verification email', 200);
  }

  if (user.emailVerified) {
    throw createError('Email is already verified', 400);
  }

  const { token, hashedToken, expiry } = UserRepository.generateVerificationToken();
  
  await UserRepository.update(user.id, {
    verificationToken: hashedToken,
    verificationTokenExpiry: expiry,
  });

  await authService.sendVerificationEmail(user.email, token, user.username);

  res.status(200).json({
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  });
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw createError('If an account exists with this email, you will receive a password reset email', 200);
  }

  const { token, hashedToken, expiry } = UserRepository.generatePasswordResetToken();
  
  await UserRepository.update(user.id, {
    passwordResetToken: hashedToken,
    passwordResetTokenExpiry: expiry,
  });

  try {
    await authService.sendPasswordResetEmail(user.email, token, user.username);
  } catch (error) {
    await UserRepository.update(user.id, {
      passwordResetToken: undefined,
      passwordResetTokenExpiry: undefined,
    });
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Password reset email sent. Please check your inbox.',
  });
});

// @desc    Reset password with reset token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    throw createError('Token, email, and new password are required', 400);
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserRepository.findByEmail(email);

  if (!user || user.passwordResetToken !== hashedToken) {
    throw createError('Invalid or expired password reset token', 400);
  }

  if (user.passwordResetTokenExpiry && user.passwordResetTokenExpiry < new Date()) {
    throw createError('Password reset token has expired', 400);
  }

  await UserRepository.update(user.id, {
    password: newPassword,
    passwordResetToken: undefined,
    passwordResetTokenExpiry: undefined,
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
  });
});
