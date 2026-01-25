import { Request, Response } from 'express';
import { HabitRepository, IHabit } from '../models/Habit';
import { UserRepository } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { getToday, getYesterdayStr } from '../utils/dateUtils';

// @desc    Get all habits for authenticated user
// @route   GET /api/habits
// @access  Private
export const getHabits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habits = await HabitRepository.findByUserId(req.user.id);
  
  res.status(200).json({
    success: true,
    count: habits.length,
    data: habits,
  });
});

// @desc    Get single habit for authenticated user
// @route   GET /api/habits/:id
// @access  Private
export const getHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habit = await HabitRepository.findById(req.params.id);

  if (!habit || habit.userId !== req.user.id) {
    throw createError('Habit not found', 404);
  }

  res.status(200).json({
    success: true,
    data: habit,
  });
});

// @desc    Create new habit for authenticated user
// @route   POST /api/habits
// @access  Private
export const createHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const { name, description, goal, frequency, customFrequency, category, startDate } = req.body;

  if (!name || name.trim() === '') {
    throw createError('Habit name is required', 400);
  }

  if (!category) {
    throw createError('Category is required', 400);
  }

  if (!['Health', 'Work', 'Learning', 'Lifestyle'].includes(category)) {
    throw createError('Invalid category. Must be one of: Health, Work, Learning, Lifestyle', 400);
  }

  if (!startDate) {
    throw createError('Start date is required', 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
    throw createError('Start date must be in YYYY-MM-DD format', 400);
  }

  if (!['daily', 'weekly', 'custom'].includes(frequency)) {
    throw createError('Invalid frequency. Must be one of: daily, weekly, custom', 400);
  }

  if (frequency === 'custom') {
    if (!customFrequency || !customFrequency.type || !customFrequency.value) {
      throw createError('Custom frequency details are required when frequency is custom', 400);
    }
    if (!['times_per_week', 'times_per_month', 'every_x_days'].includes(customFrequency.type)) {
      throw createError('Invalid custom frequency type', 400);
    }
    if (customFrequency.value < 1 || customFrequency.value > 365) {
      throw createError('Custom frequency value must be between 1 and 365', 400);
    }
  }

  // Check for duplicate habit name
  const existingHabit = await HabitRepository.findByUserIdAndName(req.user.id, name);
  if (existingHabit) {
    throw createError('You already have a habit with this name', 400);
  }

  // Check habit count limit
  const userHabits = await HabitRepository.findByUserId(req.user.id);
  if (userHabits.length >= 50) {
    throw createError('Maximum number of habits reached (50)', 400);
  }

  const habitData: Omit<IHabit, 'id' | 'createdAt' | 'updatedAt'> = {
    userId: req.user.id,
    name: name.trim(),
    description: description || '',
    goal: goal || '',
    frequency: frequency || 'daily',
    customFrequency: frequency === 'custom' ? customFrequency : undefined,
    category,
    startDate,
    streak: 0,
  };

  const habit = await HabitRepository.create(habitData);

  res.status(201).json({
    success: true,
    data: habit,
    message: 'Habit created successfully',
  });
});

// @desc    Update habit for authenticated user
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habit = await HabitRepository.findById(req.params.id);

  if (!habit || habit.userId !== req.user.id) {
    throw createError('Habit not found', 404);
  }

  // Check for duplicate name
  if (req.body.name && req.body.name.trim() !== habit.name) {
    const existingHabit = await HabitRepository.findByUserIdAndName(req.user.id, req.body.name);
    if (existingHabit && existingHabit.id !== req.params.id) {
      throw createError('You already have a habit with this name', 400);
    }
  }

  const allowedUpdates = ['name', 'description', 'goal', 'frequency', 'customFrequency', 'category'];
  const updates: Partial<IHabit> = {};
  
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      (updates as any)[key] = req.body[key];
    }
  }

  // Validate category
  if (updates.category && !['Health', 'Work', 'Learning', 'Lifestyle'].includes(updates.category)) {
    throw createError('Invalid category', 400);
  }

  // Validate frequency
  if (updates.frequency && !['daily', 'weekly', 'custom'].includes(updates.frequency)) {
    throw createError('Invalid frequency', 400);
  }

  if (updates.frequency === 'custom') {
    if (!updates.customFrequency?.type || !updates.customFrequency?.value) {
      throw createError('Custom frequency details are required', 400);
    }
  } else if (updates.frequency) {
    updates.customFrequency = undefined;
  }

  const updatedHabit = await HabitRepository.update(req.params.id, updates);

  res.status(200).json({
    success: true,
    data: updatedHabit,
    message: 'Habit updated successfully',
  });
});

// @desc    Delete habit for authenticated user
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habit = await HabitRepository.findById(req.params.id);

  if (!habit || habit.userId !== req.user.id) {
    throw createError('Habit not found', 404);
  }

  await HabitRepository.delete(req.params.id);

  res.status(200).json({
    success: true,
    data: {},
  });
});

// XP rewards configuration
const XP_REWARDS = {
  HABIT_COMPLETION: 10,      // Base XP for completing a habit
  STREAK_BONUS: 5,           // Bonus XP per streak day (capped)
  STREAK_BONUS_CAP: 50,      // Max streak bonus
  PERFECT_DAY_BONUS: 25,     // Bonus for completing all habits in a day
  STREAK_MILESTONE_7: 50,    // Week streak bonus
  STREAK_MILESTONE_30: 200,  // Month streak bonus
  STREAK_MILESTONE_100: 500, // 100 day streak bonus
};

// @desc    Toggle habit completion for authenticated user
// @route   POST /api/habits/:id/toggle
// @access  Private
export const toggleHabitCompletion = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habit = await HabitRepository.findById(req.params.id);

  if (!habit || habit.userId !== req.user.id) {
    throw createError('Habit not found', 404);
  }

  const today = getToday();
  const yesterday = getYesterdayStr();
  const isCompletedToday = habit.lastCompletedOn === today;
  
  let newStreak = habit.streak;
  let newLastCompletedOn: string | null | undefined = habit.lastCompletedOn;
  let xpEarned = 0;
  
  if (isCompletedToday) {
    // Uncomplete - no XP changes (don't remove XP)
    newStreak = Math.max(0, habit.streak - 1);
    newLastCompletedOn = null;
  } else {
    // Complete - award XP
    const continuesStreak = habit.lastCompletedOn === yesterday;
    newStreak = continuesStreak ? habit.streak + 1 : 1;
    newLastCompletedOn = today;
    
    // Calculate XP earned
    xpEarned = XP_REWARDS.HABIT_COMPLETION;
    
    // Streak bonus (capped)
    const streakBonus = Math.min(newStreak * XP_REWARDS.STREAK_BONUS, XP_REWARDS.STREAK_BONUS_CAP);
    xpEarned += streakBonus;
    
    // Streak milestones
    if (newStreak === 7) xpEarned += XP_REWARDS.STREAK_MILESTONE_7;
    if (newStreak === 30) xpEarned += XP_REWARDS.STREAK_MILESTONE_30;
    if (newStreak === 100) xpEarned += XP_REWARDS.STREAK_MILESTONE_100;
    
    // Check for perfect day bonus
    const allHabits = await HabitRepository.findByUserId(req.user.id);
    const completedCount = allHabits.filter(h => h.lastCompletedOn === today || h.id === habit.id).length;
    if (completedCount === allHabits.length && allHabits.length > 1) {
      xpEarned += XP_REWARDS.PERFECT_DAY_BONUS;
    }
    
    // Add XP to user
    if (xpEarned > 0) {
      await UserRepository.addXP(req.user.id, xpEarned);
    }
  }

  const updateData: Partial<IHabit> = {
    streak: newStreak,
    lastCompletedOn: newLastCompletedOn,
  };

  const updatedHabit = await HabitRepository.update(req.params.id, updateData);

  // Get updated user data for XP info
  const updatedUser = await UserRepository.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: updatedHabit,
    xp: {
      earned: xpEarned,
      total: updatedUser?.totalXP || 0,
      level: updatedUser?.level || 1,
    },
  });
});

// @desc    Get habit stats for authenticated user
// @route   GET /api/habits/:id/stats
// @access  Private
export const getHabitStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habit = await HabitRepository.findById(req.params.id);

  if (!habit || habit.userId !== req.user.id) {
    throw createError('Habit not found', 404);
  }

  const today = getToday();
  const isCompletedToday = habit.lastCompletedOn === today;
  
  const daysSinceCreation = Math.floor(
    (Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const stats = {
    streak: habit.streak,
    isCompletedToday,
    daysSinceCreation,
    completionRate: daysSinceCreation > 0 ? (habit.streak / daysSinceCreation) * 100 : 0,
    lastCompleted: habit.lastCompletedOn,
  };

  res.status(200).json({
    success: true,
    data: { habit, stats },
  });
});

// @desc    Get all habits stats for authenticated user
// @route   GET /api/habits/stats/overview
// @access  Private
export const getUserHabitsOverview = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const habits = await HabitRepository.findByUserId(req.user.id);
  
  const today = getToday();
  const totalHabits = habits.length;
  const completedToday = habits.filter(habit => habit.lastCompletedOn === today).length;
  const activeStreaks = habits.filter(habit => habit.streak > 0).length;
  const longestStreak = Math.max(...habits.map(habit => habit.streak), 0);

  const overview = {
    totalHabits,
    completedToday,
    activeStreaks,
    longestStreak,
    completionRateToday: totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0,
    habits: habits.map(habit => ({
      id: habit.id,
      name: habit.name,
      streak: habit.streak,
      isCompletedToday: habit.lastCompletedOn === today,
      lastCompleted: habit.lastCompletedOn,
    })),
  };

  res.status(200).json({
    success: true,
    data: overview,
  });
});

// @desc    Clear all habits for authenticated user
// @route   DELETE /api/habits/clear
// @access  Private
export const clearAllHabits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const deletedCount = await HabitRepository.deleteByUserId(req.user.id);
  
  res.status(200).json({
    success: true,
    data: {},
    message: `All habits cleared. ${deletedCount} habits deleted.`,
    deletedCount,
  });
});

// @desc    Bulk toggle habits completion
// @route   POST /api/habits/bulk/toggle
// @access  Private
export const bulkToggleHabits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw createError('Not authenticated', 401);
  }

  const { habitIds } = req.body;

  if (!Array.isArray(habitIds) || habitIds.length === 0) {
    throw createError('Habit IDs array is required', 400);
  }

  const today = getToday();
  const yesterday = getYesterdayStr();
  const updatedHabits: IHabit[] = [];

  for (const habitId of habitIds) {
    const habit = await HabitRepository.findById(habitId);
    if (!habit || habit.userId !== req.user.id) continue;

    const isCompletedToday = habit.lastCompletedOn === today;
    let newStreak = habit.streak;
    let newLastCompletedOn: string | null | undefined = habit.lastCompletedOn;

    if (isCompletedToday) {
      newStreak = Math.max(0, habit.streak - 1);
      newLastCompletedOn = null;
    } else {
      const continuesStreak = habit.lastCompletedOn === yesterday;
      newStreak = continuesStreak ? habit.streak + 1 : 1;
      newLastCompletedOn = today;
    }

    const updated = await HabitRepository.update(habitId, {
      streak: newStreak,
      lastCompletedOn: newLastCompletedOn,
    });

    if (updated) updatedHabits.push(updated);
  }

  res.status(200).json({
    success: true,
    data: updatedHabits,
    message: `${updatedHabits.length} habits updated successfully`,
  });
});

// @desc    Add a note to a habit
// @route   POST /api/habits/:id/notes
// @access  Private
export const addHabitNote = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);

  const habit = await HabitRepository.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) throw createError('Habit not found', 404);

  const { text } = req.body;
  if (!text || text.trim() === '') throw createError('Note text is required', 400);

  const notes = habit.notes || [];
  notes.push({ text: text.trim(), createdAt: new Date() });

  const updated = await HabitRepository.update(req.params.id, { notes } as any);

  res.status(201).json({ success: true, data: updated, message: 'Note added' });
});

// @desc    Add attachment metadata to a habit
// @route   POST /api/habits/:id/attachments
// @access  Private
export const addHabitAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);

  const habit = await HabitRepository.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) throw createError('Habit not found', 404);

  const { filename, url, mimeType, size } = req.body;
  if (!url || !filename) throw createError('Attachment url and filename are required', 400);

  const attachments = habit.attachments || [];
  attachments.push({ filename, url, mimeType, size, uploadedAt: new Date() });

  const updated = await HabitRepository.update(req.params.id, { attachments } as any);

  res.status(201).json({ success: true, data: updated, message: 'Attachment added' });
});

// @desc    Export user's habits as CSV
// @route   GET /api/habits/export?format=csv
// @access  Private
export const exportHabits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);

  const format = (req.query.format as string) || 'csv';
  const habits = await HabitRepository.findByUserId(req.user.id);

  if (format === 'csv') {
    const header = ['id', 'name', 'description', 'goal', 'category', 'frequency', 'startDate', 'streak', 'lastCompletedOn', 'createdAt'];
    const rows = habits.map(h => [
      h.id, h.name, h.description || '', h.goal || '', h.category || '', h.frequency || '',
      h.startDate || '', String(h.streak || 0), h.lastCompletedOn || '', h.createdAt.toISOString()
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="habits_${req.user.id}.csv"`);
    return res.status(200).send(csv);
  }

  return res.status(200).json({ success: true, data: habits });
});

// @desc    Import habits
// @route   POST /api/habits/import
// @access  Private
export const importHabits = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);

  const items = req.body.items;
  if (!Array.isArray(items) || items.length === 0) throw createError('Items array is required', 400);

  const habitsToCreate = items
    .filter((it: any) => it.name)
    .map((it: any) => ({
      userId: req.user!.id,
      name: it.name,
      description: it.description || '',
      goal: it.goal || '',
      frequency: it.frequency || 'daily',
      category: it.category || 'Lifestyle',
      startDate: it.startDate || new Date().toISOString().split('T')[0],
      streak: 0,
    }));

  const created = await HabitRepository.bulkCreate(habitsToCreate as any);

  res.status(201).json({ success: true, data: created, message: `${created.length} habits imported` });
});

// @desc    Grant XP / award badge for a habit
// @route   POST /api/habits/:id/gamify
// @access  Private
export const gamifyHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);
  
  const habit = await HabitRepository.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) throw createError('Habit not found', 404);

  const { xp, badge } = req.body;
  const updates: Partial<IHabit> = {};
  
  if (typeof xp === 'number') {
    updates.xp = (habit.xp || 0) + xp;
  }
  
  if (badge) {
    const badges = habit.badges || [];
    if (!badges.includes(badge)) {
      badges.push(badge);
      updates.badges = badges;
    }
  }

  const updated = await HabitRepository.update(req.params.id, updates);
  res.status(200).json({ success: true, data: updated });
});

// @desc    Share habit with other users
// @route   POST /api/habits/:id/share
// @access  Private
export const shareHabit = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);
  
  const habit = await HabitRepository.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) throw createError('Habit not found', 404);

  const { userIds } = req.body;
  if (!Array.isArray(userIds) || userIds.length === 0) throw createError('userIds array is required', 400);
  
  const sharedWith = habit.sharedWith || [];
  for (const uid of userIds) {
    if (!sharedWith.includes(uid)) {
      sharedWith.push(uid);
    }
  }

  const updated = await HabitRepository.update(req.params.id, { sharedWith });
  res.status(200).json({ success: true, data: updated });
});

// @desc    Set reminders on a habit
// @route   POST /api/habits/:id/reminders
// @access  Private
export const setHabitReminders = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw createError('Not authenticated', 401);
  
  const habit = await HabitRepository.findById(req.params.id);
  if (!habit || habit.userId !== req.user.id) throw createError('Habit not found', 404);

  const { reminders } = req.body;
  if (!Array.isArray(reminders)) throw createError('Reminders array is required', 400);
  
  const formattedReminders = reminders.map((r: any) => ({
    time: r.time,
    timezone: r.timezone || undefined,
    enabled: r.enabled !== false,
  }));

  const updated = await HabitRepository.update(req.params.id, { reminders: formattedReminders });
  res.status(200).json({ success: true, data: updated });
});
