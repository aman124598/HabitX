import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// Types
export type Frequency = 'daily' | 'weekly' | 'custom';
export type Category = 'Health' | 'Work' | 'Learning' | 'Lifestyle';

// Habit interface (Firestore version)
export interface IHabit {
  id: string;
  userId: string;
  name: string;
  description: string;
  goal?: string;
  frequency: Frequency;
  customFrequency?: {
    type: 'times_per_week' | 'times_per_month' | 'every_x_days';
    value: number;
  };
  reminders?: { time: string; timezone?: string; enabled?: boolean }[];
  notes?: { text: string; createdAt: Date }[];
  attachments?: { filename: string; url: string; mimeType?: string; size?: number; uploadedAt?: Date }[];
  xp?: number;
  badges?: string[];
  sharedWith?: string[];
  color?: string;
  icon?: string;
  lastBackupAt?: Date;
  category: Category;
  startDate: string;
  streak: number;
  lastCompletedOn?: string | null;
  lastCompletionXPAwardedOn?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Habit document type for Firestore
interface HabitDocument {
  userId: string;
  name: string;
  description: string;
  goal?: string;
  frequency: Frequency;
  customFrequency?: {
    type: 'times_per_week' | 'times_per_month' | 'every_x_days';
    value: number;
  };
  reminders?: { time: string; timezone?: string; enabled?: boolean }[];
  notes?: { text: string; createdAt: FirebaseFirestore.Timestamp }[];
  attachments?: { filename: string; url: string; mimeType?: string; size?: number; uploadedAt?: FirebaseFirestore.Timestamp }[];
  xp?: number;
  badges?: string[];
  sharedWith?: string[];
  color?: string;
  icon?: string;
  lastBackupAt?: FirebaseFirestore.Timestamp;
  category: Category;
  startDate: string;
  streak: number;
  lastCompletedOn?: string | null;
  lastCompletionXPAwardedOn?: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Habit Repository - Firestore operations for habits
 */
export const HabitRepository = {
  /**
   * Get collection reference
   */
  collection: () => getFirestore().collection(Collections.HABITS),

  /**
   * Convert Firestore document to IHabit
   */
  fromFirestore: (doc: FirebaseFirestore.DocumentSnapshot): IHabit | null => {
    if (!doc.exists) return null;
    const data = doc.data() as HabitDocument;
    
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      description: data.description || '',
      goal: data.goal,
      frequency: data.frequency || 'daily',
      customFrequency: data.customFrequency,
      reminders: data.reminders,
      notes: data.notes?.map(n => ({
        text: n.text,
        createdAt: timestampToDate(n.createdAt) || new Date(),
      })),
      attachments: data.attachments?.map(a => ({
        ...a,
        uploadedAt: timestampToDate(a.uploadedAt),
      })),
      xp: data.xp || 0,
      badges: data.badges,
      sharedWith: data.sharedWith,
      color: data.color,
      icon: data.icon,
      lastBackupAt: timestampToDate(data.lastBackupAt),
      category: data.category,
      startDate: data.startDate,
      streak: data.streak || 0,
      lastCompletedOn: data.lastCompletedOn,
      lastCompletionXPAwardedOn: data.lastCompletionXPAwardedOn,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  },

  /**
   * Convert IHabit to Firestore document
   */
  toFirestore: (habit: Partial<IHabit>): Partial<HabitDocument> => {
    const doc: Partial<HabitDocument> = {};
    
    if (habit.userId !== undefined) doc.userId = habit.userId;
    if (habit.name !== undefined) doc.name = habit.name.trim();
    if (habit.description !== undefined) doc.description = habit.description.trim();
    if (habit.goal !== undefined) doc.goal = habit.goal?.trim();
    if (habit.frequency !== undefined) doc.frequency = habit.frequency;
    if (habit.customFrequency !== undefined) doc.customFrequency = habit.customFrequency;
    if (habit.reminders !== undefined) doc.reminders = habit.reminders;
    if (habit.xp !== undefined) doc.xp = habit.xp;
    if (habit.badges !== undefined) doc.badges = habit.badges;
    if (habit.sharedWith !== undefined) doc.sharedWith = habit.sharedWith;
    if (habit.color !== undefined) doc.color = habit.color;
    if (habit.icon !== undefined) doc.icon = habit.icon;
    if (habit.category !== undefined) doc.category = habit.category;
    if (habit.startDate !== undefined) doc.startDate = habit.startDate;
    if (habit.streak !== undefined) doc.streak = Math.max(0, habit.streak);
    if (habit.lastCompletedOn !== undefined) doc.lastCompletedOn = habit.lastCompletedOn;
    if (habit.lastCompletionXPAwardedOn !== undefined) doc.lastCompletionXPAwardedOn = habit.lastCompletionXPAwardedOn;
    if (habit.lastBackupAt !== undefined) doc.lastBackupAt = dateToTimestamp(habit.lastBackupAt);
    
    return doc;
  },

  /**
   * Create a new habit
   */
  async create(habitData: Omit<IHabit, 'id' | 'createdAt' | 'updatedAt'>): Promise<IHabit> {
    const now = new Date();
    const id = generateId();

    // Validate custom frequency
    if (habitData.frequency === 'custom') {
      if (!habitData.customFrequency?.type || !habitData.customFrequency?.value) {
        throw new Error('Custom frequency details are required when frequency is custom');
      }
    }

    const docData: HabitDocument = {
      userId: habitData.userId,
      name: habitData.name.trim(),
      description: habitData.description?.trim() || '',
      goal: habitData.goal?.trim(),
      frequency: habitData.frequency || 'daily',
      customFrequency: habitData.frequency === 'custom' ? habitData.customFrequency : undefined,
      reminders: habitData.reminders,
      xp: habitData.xp || 0,
      badges: habitData.badges,
      sharedWith: habitData.sharedWith,
      color: habitData.color,
      icon: habitData.icon,
      category: habitData.category,
      startDate: habitData.startDate,
      streak: habitData.streak || 0,
      lastCompletedOn: habitData.lastCompletedOn,
      lastCompletionXPAwardedOn: habitData.lastCompletionXPAwardedOn,
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await HabitRepository.collection().doc(id).set(docData);
    
    return {
      id,
      ...habitData,
      description: habitData.description || '',
      streak: habitData.streak || 0,
      xp: habitData.xp || 0,
      createdAt: now,
      updatedAt: now,
    };
  },

  /**
   * Find habit by ID
   */
  async findById(id: string): Promise<IHabit | null> {
    const doc = await HabitRepository.collection().doc(id).get();
    return HabitRepository.fromFirestore(doc);
  },

  /**
   * Find all habits for a user
   */
  async findByUserId(userId: string): Promise<IHabit[]> {
    const snapshot = await HabitRepository.collection()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => HabitRepository.fromFirestore(doc)!).filter(Boolean);
  },

  /**
   * Find habit by user ID and name (for duplicate checking)
   */
  async findByUserIdAndName(userId: string, name: string): Promise<IHabit | null> {
    const snapshot = await HabitRepository.collection()
      .where('userId', '==', userId)
      .where('name', '==', name.trim())
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return HabitRepository.fromFirestore(snapshot.docs[0]);
  },

  /**
   * Update habit
   */
  async update(id: string, updates: Partial<IHabit>): Promise<IHabit | null> {
    const docRef = HabitRepository.collection().doc(id);
    
    const updateData = {
      ...HabitRepository.toFirestore(updates),
      updatedAt: dateToTimestamp(new Date()),
    };
    
    await docRef.update(updateData);
    return HabitRepository.findById(id);
  },

  /**
   * Delete habit
   */
  async delete(id: string): Promise<boolean> {
    await HabitRepository.collection().doc(id).delete();
    return true;
  },

  /**
   * Delete all habits for a user
   */
  async deleteByUserId(userId: string): Promise<number> {
    const snapshot = await HabitRepository.collection()
      .where('userId', '==', userId)
      .get();
    
    const batch = getFirestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return snapshot.size;
  },

  /**
   * Toggle habit completion
   */
  async toggleCompletion(id: string, date: string): Promise<IHabit | null> {
    const habit = await HabitRepository.findById(id);
    if (!habit) return null;

    const isCompleted = habit.lastCompletedOn === date;
    let newStreak = habit.streak;
    let newLastCompletedOn = habit.lastCompletedOn;

    if (isCompleted) {
      // Uncomplete - decrease streak and clear lastCompletedOn
      newStreak = Math.max(0, habit.streak - 1);
      newLastCompletedOn = null;
    } else {
      // Complete - check if streak continues
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (habit.lastCompletedOn === yesterdayStr) {
        // Continue streak
        newStreak = habit.streak + 1;
      } else if (!habit.lastCompletedOn || habit.lastCompletedOn < yesterdayStr) {
        // Start new streak
        newStreak = 1;
      }
      newLastCompletedOn = date;
    }

    return HabitRepository.update(id, {
      streak: newStreak,
      lastCompletedOn: newLastCompletedOn,
    });
  },

  /**
   * Get habits by category for a user
   */
  async findByCategory(userId: string, category: Category): Promise<IHabit[]> {
    const snapshot = await HabitRepository.collection()
      .where('userId', '==', userId)
      .where('category', '==', category)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => HabitRepository.fromFirestore(doc)!).filter(Boolean);
  },

  /**
   * Get habits completed today for a user
   */
  async findCompletedToday(userId: string): Promise<IHabit[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const snapshot = await HabitRepository.collection()
      .where('userId', '==', userId)
      .where('lastCompletedOn', '==', today)
      .get();
    
    return snapshot.docs.map(doc => HabitRepository.fromFirestore(doc)!).filter(Boolean);
  },

  /**
   * Add XP to habit
   */
  async addXP(id: string, xpAmount: number): Promise<IHabit | null> {
    const habit = await HabitRepository.findById(id);
    if (!habit) return null;

    return HabitRepository.update(id, {
      xp: (habit.xp || 0) + xpAmount,
    });
  },

  /**
   * Bulk create habits (for import)
   */
  async bulkCreate(habits: Omit<IHabit, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<IHabit[]> {
    const now = new Date();
    const batch = getFirestore().batch();
    const createdHabits: IHabit[] = [];

    for (const habitData of habits) {
      const id = generateId();
      const docRef = HabitRepository.collection().doc(id);
      
      const docData: HabitDocument = {
        userId: habitData.userId,
        name: habitData.name.trim(),
        description: habitData.description?.trim() || '',
        goal: habitData.goal?.trim(),
        frequency: habitData.frequency || 'daily',
        customFrequency: habitData.frequency === 'custom' ? habitData.customFrequency : undefined,
        reminders: habitData.reminders,
        xp: habitData.xp || 0,
        badges: habitData.badges,
        sharedWith: habitData.sharedWith,
        color: habitData.color,
        icon: habitData.icon,
        category: habitData.category,
        startDate: habitData.startDate,
        streak: habitData.streak || 0,
        lastCompletedOn: habitData.lastCompletedOn,
        lastCompletionXPAwardedOn: habitData.lastCompletionXPAwardedOn,
        createdAt: dateToTimestamp(now)!,
        updatedAt: dateToTimestamp(now)!,
      };

      batch.set(docRef, docData);
      
      createdHabits.push({
        id,
        ...habitData,
        description: habitData.description || '',
        streak: habitData.streak || 0,
        xp: habitData.xp || 0,
        createdAt: now,
        updatedAt: now,
      });
    }

    await batch.commit();
    return createdHabits;
  },
};

// Export for backward compatibility
export const Habit = HabitRepository;
export default HabitRepository;
