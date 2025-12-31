import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// UserChallenge interface
export interface IUserChallenge {
  id: string;
  userId: string;
  challengeId: string;
  status: 'pending' | 'active' | 'completed' | 'abandoned';
  joinedAt: Date;
  completedAt?: Date;
  progress: {
    currentValue: number;
    targetValue: number;
    percentage: number;
    lastUpdated: Date;
  };
  habitIds: string[];
  dailyProgress: {
    date: string;
    value: number;
    notes?: string;
  }[];
  achievements: {
    type: string;
    unlockedAt: Date;
    description: string;
  }[];
  rank: number;
  xpEarned: number;
  badges: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Firestore document type
interface UserChallengeDocument {
  userId: string;
  challengeId: string;
  status: 'pending' | 'active' | 'completed' | 'abandoned';
  joinedAt: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  progress: {
    currentValue: number;
    targetValue: number;
    percentage: number;
    lastUpdated: FirebaseFirestore.Timestamp;
  };
  habitIds: string[];
  dailyProgress: {
    date: string;
    value: number;
    notes?: string;
  }[];
  achievements: {
    type: string;
    unlockedAt: FirebaseFirestore.Timestamp;
    description: string;
  }[];
  rank: number;
  xpEarned: number;
  badges: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * UserChallenge Repository - Firestore operations
 */
export const UserChallengeRepository = {
  collection: () => getFirestore().collection(Collections.USER_CHALLENGES),

  fromFirestore: (doc: FirebaseFirestore.DocumentSnapshot): IUserChallenge | null => {
    if (!doc.exists) return null;
    const data = doc.data() as UserChallengeDocument;
    
    return {
      id: doc.id,
      userId: data.userId,
      challengeId: data.challengeId,
      status: data.status || 'pending',
      joinedAt: timestampToDate(data.joinedAt) || new Date(),
      completedAt: timestampToDate(data.completedAt),
      progress: {
        currentValue: data.progress?.currentValue || 0,
        targetValue: data.progress?.targetValue || 0,
        percentage: data.progress?.percentage || 0,
        lastUpdated: timestampToDate(data.progress?.lastUpdated) || new Date(),
      },
      habitIds: data.habitIds || [],
      dailyProgress: data.dailyProgress || [],
      achievements: (data.achievements || []).map(a => ({
        ...a,
        unlockedAt: timestampToDate(a.unlockedAt) || new Date(),
      })),
      rank: data.rank || 0,
      xpEarned: data.xpEarned || 0,
      badges: data.badges || [],
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  },

  async create(data: Omit<IUserChallenge, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUserChallenge> {
    const now = new Date();
    const id = generateId();

    // Calculate percentage
    const percentage = data.progress.targetValue > 0 
      ? Math.min((data.progress.currentValue / data.progress.targetValue) * 100, 100)
      : 0;

    const docData: UserChallengeDocument = {
      userId: data.userId,
      challengeId: data.challengeId,
      status: data.status || 'pending',
      joinedAt: dateToTimestamp(data.joinedAt || now)!,
      completedAt: data.completedAt ? dateToTimestamp(data.completedAt) : undefined,
      progress: {
        currentValue: data.progress.currentValue || 0,
        targetValue: data.progress.targetValue,
        percentage,
        lastUpdated: dateToTimestamp(now)!,
      },
      habitIds: data.habitIds || [],
      dailyProgress: data.dailyProgress || [],
      achievements: (data.achievements || []).map(a => ({
        ...a,
        unlockedAt: dateToTimestamp(a.unlockedAt)!,
      })),
      rank: data.rank || 0,
      xpEarned: data.xpEarned || 0,
      badges: data.badges || [],
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await UserChallengeRepository.collection().doc(id).set(docData);
    
    return {
      id,
      ...data,
      progress: { ...data.progress, percentage, lastUpdated: now },
      createdAt: now,
      updatedAt: now,
    };
  },

  async findById(id: string): Promise<IUserChallenge | null> {
    const doc = await UserChallengeRepository.collection().doc(id).get();
    return UserChallengeRepository.fromFirestore(doc);
  },

  async findByUserAndChallenge(userId: string, challengeId: string): Promise<IUserChallenge | null> {
    const snapshot = await UserChallengeRepository.collection()
      .where('userId', '==', userId)
      .where('challengeId', '==', challengeId)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return UserChallengeRepository.fromFirestore(snapshot.docs[0]);
  },

  async findByUser(userId: string): Promise<IUserChallenge[]> {
    const snapshot = await UserChallengeRepository.collection()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => UserChallengeRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async findByChallenge(challengeId: string): Promise<IUserChallenge[]> {
    const snapshot = await UserChallengeRepository.collection()
      .where('challengeId', '==', challengeId)
      .orderBy('progress.percentage', 'desc')
      .get();
    
    return snapshot.docs.map(doc => UserChallengeRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async update(id: string, updates: Partial<IUserChallenge>): Promise<IUserChallenge | null> {
    const docRef = UserChallengeRepository.collection().doc(id);
    const updateData: any = { updatedAt: dateToTimestamp(new Date()) };

    if (updates.status) updateData.status = updates.status;
    if (updates.completedAt) updateData.completedAt = dateToTimestamp(updates.completedAt);
    if (updates.habitIds) updateData.habitIds = updates.habitIds;
    if (updates.dailyProgress) updateData.dailyProgress = updates.dailyProgress;
    if (updates.rank !== undefined) updateData.rank = updates.rank;
    if (updates.xpEarned !== undefined) updateData.xpEarned = updates.xpEarned;
    if (updates.badges) updateData.badges = updates.badges;
    
    if (updates.progress) {
      const percentage = updates.progress.targetValue > 0 
        ? Math.min((updates.progress.currentValue / updates.progress.targetValue) * 100, 100)
        : 0;
      
      updateData.progress = {
        currentValue: updates.progress.currentValue,
        targetValue: updates.progress.targetValue,
        percentage,
        lastUpdated: dateToTimestamp(new Date()),
      };

      // Auto-complete if 100%
      if (percentage >= 100 && updates.status !== 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = dateToTimestamp(new Date());
      }
    }

    if (updates.achievements) {
      updateData.achievements = updates.achievements.map(a => ({
        ...a,
        unlockedAt: dateToTimestamp(a.unlockedAt),
      }));
    }

    await docRef.update(updateData);
    return UserChallengeRepository.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    await UserChallengeRepository.collection().doc(id).delete();
    return true;
  },

  async deleteByChallenge(challengeId: string): Promise<number> {
    const snapshot = await UserChallengeRepository.collection()
      .where('challengeId', '==', challengeId)
      .get();
    
    const batch = getFirestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    return snapshot.size;
  },

  async addDailyProgress(id: string, date: string, value: number, notes?: string): Promise<IUserChallenge | null> {
    const uc = await UserChallengeRepository.findById(id);
    if (!uc) return null;

    const existingIndex = uc.dailyProgress.findIndex(p => p.date === date);
    const dailyProgress = [...uc.dailyProgress];
    
    if (existingIndex >= 0) {
      dailyProgress[existingIndex] = { date, value, notes };
    } else {
      dailyProgress.push({ date, value, notes });
    }

    // Recalculate total progress
    const currentValue = dailyProgress.reduce((sum, p) => sum + p.value, 0);
    
    return UserChallengeRepository.update(id, {
      dailyProgress,
      progress: {
        ...uc.progress,
        currentValue,
      },
    });
  },

  async getLeaderboard(challengeId: string): Promise<IUserChallenge[]> {
    const snapshot = await UserChallengeRepository.collection()
      .where('challengeId', '==', challengeId)
      .orderBy('progress.percentage', 'desc')
      .get();
    
    const results = snapshot.docs.map(doc => UserChallengeRepository.fromFirestore(doc)!).filter(Boolean);
    
    // Assign ranks
    results.forEach((uc, index) => {
      uc.rank = index + 1;
    });
    
    return results;
  },
};

export const UserChallenge = UserChallengeRepository;
export default UserChallengeRepository;
