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
import { testEmailSystem } from '../services/firebaseService';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .optional() // Password is optional when Firebase ID token is provided
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

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

const verifyEmailValidation = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// Routes
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfileValidation, validate, updateProfile);
router.put('/password', authenticateToken, changePasswordValidation, validate, changePassword);

// Email verification routes
// NOTE: verification endpoint accepts either legacy token+email or a Firebase ID token in Authorization header.
// Validation is handled inside the controller to support both flows.
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', forgotPasswordValidation, validate, resendVerificationEmail);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);

// Gamification routes
router.get('/gamification', authenticateToken, getUserGamification);
router.post('/gamification/xp', authenticateToken, addXPValidation, validate, addUserXP);

// Email testing routes
router.post('/test-email', [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
], validate, async (req, res) => {
  try {
    const { email } = req.body;
    console.log(`\n📧 Testing email system for: ${email}`);
    
    const result = await testEmailSystem(email);
    
    return res.status(result.success ? 200 : 500).json({
      success: result.success,
      message: result.message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Test email endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: `❌ Test failed: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
