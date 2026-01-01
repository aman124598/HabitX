import express from 'express';
import { body } from 'express-validator';
import {
  getHabits,
  getHabit,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getHabitStats,
  getUserHabitsOverview,
  bulkToggleHabits,
  clearAllHabits,
  addHabitNote,
  addHabitAttachment,
  exportHabits,
  importHabits,
  gamifyHabit,
  shareHabit,
  setHabitReminders,
} from '../controllers/habitController';
import { authenticateToken } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = express.Router();

// Validation rules
const createHabitValidation = [
  body('name')
    .notEmpty()
    .withMessage('Habit name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Habit name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('goal')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Goal must not exceed 150 characters'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['Health', 'Work', 'Learning', 'Lifestyle'])
    .withMessage('Category must be one of: Health, Work, Learning, Lifestyle'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Start date must be in YYYY-MM-DD format'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'custom'])
    .withMessage('Frequency must be one of: daily, weekly, custom'),
];

const updateHabitValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Habit name must be between 1 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  body('frequency')
  .optional()
  .isIn(['daily', 'weekly', 'custom'])
  .withMessage('Frequency must be one of: daily, weekly, custom'),
  body('streak')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Streak must be a non-negative integer'),
];

const bulkToggleValidation = [
  body('habitIds')
    .isArray({ min: 1 })
    .withMessage('Habit IDs array is required and must not be empty')
    .custom((value) => {
      if (value.some((id: any) => typeof id !== 'string' || id.length === 0)) {
        throw new Error('All habit IDs must be valid strings');
      }
      return true;
    }),
];

// Routes
router.route('/')
  .get(authenticateToken, getHabits)
  .post(authenticateToken, createHabitValidation, validate, createHabit);

// Overview stats route (must come before /:id routes)
router.route('/stats/overview')
  .get(authenticateToken, getUserHabitsOverview);

// Bulk operations route
router.route('/bulk/toggle')
  .post(authenticateToken, bulkToggleValidation, validate, bulkToggleHabits);

// Clear all habits route
router.route('/clear')
  .delete(authenticateToken, clearAllHabits);

router.route('/:id')
  .get(authenticateToken, getHabit)
  .put(authenticateToken, updateHabitValidation, validate, updateHabit)
  .delete(authenticateToken, deleteHabit);

router.route('/:id/toggle')
  .post(authenticateToken, toggleHabitCompletion);

router.route('/:id/stats')
  .get(authenticateToken, getHabitStats);

// Notes
router.route('/:id/notes')
  .post(authenticateToken, addHabitNote);

// Attachments (metadata only)
router.route('/:id/attachments')
  .post(authenticateToken, addHabitAttachment);

// Gamification
router.route('/:id/gamify')
  .post(authenticateToken, gamifyHabit);

// Share
router.route('/:id/share')
  .post(authenticateToken, shareHabit);

// Reminders
router.route('/:id/reminders')
  .post(authenticateToken, setHabitReminders);

// Export/Import
router.route('/export')
  .get(authenticateToken, exportHabits);

router.route('/import')
  .post(authenticateToken, importHabits);

export default router;
