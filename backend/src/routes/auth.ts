import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getUserGamification,
  addUserXP,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

const addXPValidation = [
  body('xp')
    .isNumeric()
    .withMessage('XP must be a number')
    .isFloat({ min: 0.01 })
    .withMessage('XP must be greater than 0'),
];

// Routes
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfileValidation, validate, updateProfile);
router.put('/password', authenticateToken, changePasswordValidation, validate, changePassword);

// Gamification routes
router.get('/gamification', authenticateToken, getUserGamification);
router.post('/gamification/xp', authenticateToken, addXPValidation, validate, addUserXP);

// Legacy stub routes — return 410 Gone (Clerk handles these client-side)
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
