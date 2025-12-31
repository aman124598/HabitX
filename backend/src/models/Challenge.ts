import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// Types
export type ChallengeType = 'streak' | 'completion_count' | 'consistency' | 'group_goal';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Challenge interface
export interface IChallenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  createdBy: string;
  participants: string[];
  maxParticipants?: number;
  isPublic: boolean;
  habitCriteria: {
    category?: string;
    name?: string;
    frequency?: string;
    anyHabit?: boolean;
  };
  goal: {
    target: number;
    metric: string;
    description: string;
  };
  duration: {
    startDate: Date;
    endDate: Date;
    durationDays: number;
  };
  rewards: {
    winner: string[];
    participation: string[];
    xpReward: number;
    badges: string[];
  };
  rules: {
    allowMultipleHabits: boolean;
    requireApproval: boolean;
    minStreakLength?: number;
  };
  status: ChallengeStatus;
  leaderboard: {
    userId: string;
    username: string;
    progress: number;
    rank: number;
    lastUpdated: Date;
  }[];
  chatEnabled: boolean;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Firestore document type
interface ChallengeDocument {
  name: string;
  description: string;
  type: ChallengeType;
  createdBy: string;
  participants: string[];
  maxParticipants?: number;
  isPublic: boolean;
  habitCriteria: {
    category?: string;
    name?: string;
    frequency?: string;
    anyHabit?: boolean;
  };
  goal: {
    target: number;
    metric: string;
    description: string;
  };
  duration: {
    startDate: FirebaseFirestore.Timestamp;
    endDate: FirebaseFirestore.Timestamp;
    durationDays: number;
  };
  rewards: {
    winner: string[];
    participation: string[];
    xpReward: number;
    badges: string[];
  };
  rules: {
    allowMultipleHabits: boolean;
    requireApproval: boolean;
    minStreakLength?: number;
  };
  status: ChallengeStatus;
  leaderboard: {
    userId: string;
    username: string;
    progress: number;
    rank: number;
    lastUpdated: FirebaseFirestore.Timestamp;
  }[];
  chatEnabled: boolean;
  inviteCode?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Challenge Repository - Firestore operations
 */
export const ChallengeRepository = {
  collection: () => getFirestore().collection(Collections.CHALLENGES),

  fromFirestore: (doc: FirebaseFirestore.DocumentSnapshot): IChallenge | null => {
    if (!doc.exists) return null;
    const data = doc.data() as ChallengeDocument;
    
    return {
      id: doc.id,
      name: data.name,
      description: data.description,
      type: data.type,
      createdBy: data.createdBy,
      participants: data.participants || [],
      maxParticipants: data.maxParticipants,
      isPublic: data.isPublic ?? false,
      habitCriteria: data.habitCriteria || {},
      goal: data.goal,
      duration: {
        startDate: timestampToDate(data.duration.startDate) || new Date(),
        endDate: timestampToDate(data.duration.endDate) || new Date(),
        durationDays: data.duration.durationDays,
      },
      rewards: data.rewards || { winner: [], participation: [], xpReward: 100, badges: [] },
      rules: data.rules || { allowMultipleHabits: false, requireApproval: false },
      status: data.status || 'draft',
      leaderboard: (data.leaderboard || []).map(l => ({
        ...l,
        lastUpdated: timestampToDate(l.lastUpdated) || new Date(),
      })),
      chatEnabled: data.chatEnabled ?? true,
      inviteCode: data.inviteCode,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  },

  async create(challengeData: Omit<IChallenge, 'id' | 'createdAt' | 'updatedAt' | 'inviteCode'>): Promise<IChallenge> {
    const now = new Date();
    const id = generateId();
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Calculate duration days
    const diffTime = Math.abs(challengeData.duration.endDate.getTime() - challengeData.duration.startDate.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const docData: ChallengeDocument = {
      name: challengeData.name.trim(),
      description: challengeData.description.trim(),
      type: challengeData.type,
      createdBy: challengeData.createdBy,
      participants: challengeData.participants || [],
      maxParticipants: challengeData.maxParticipants,
      isPublic: challengeData.isPublic ?? false,
      habitCriteria: challengeData.habitCriteria || {},
      goal: challengeData.goal,
      duration: {
        startDate: dateToTimestamp(challengeData.duration.startDate)!,
        endDate: dateToTimestamp(challengeData.duration.endDate)!,
        durationDays,
      },
      rewards: challengeData.rewards || { winner: [], participation: [], xpReward: 100, badges: [] },
      rules: challengeData.rules || { allowMultipleHabits: false, requireApproval: false },
      status: challengeData.status || 'draft',
      leaderboard: [],
      chatEnabled: challengeData.chatEnabled ?? true,
      inviteCode,
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await ChallengeRepository.collection().doc(id).set(docData);
    
    return {
      id,
      ...challengeData,
      inviteCode,
      leaderboard: [],
      duration: { ...challengeData.duration, durationDays },
      createdAt: now,
      updatedAt: now,
    };
  },

  async findById(id: string): Promise<IChallenge | null> {
    const doc = await ChallengeRepository.collection().doc(id).get();
    return ChallengeRepository.fromFirestore(doc);
  },

  async findByInviteCode(inviteCode: string): Promise<IChallenge | null> {
    const snapshot = await ChallengeRepository.collection()
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return ChallengeRepository.fromFirestore(snapshot.docs[0]);
  },

  async findByCreator(creatorId: string): Promise<IChallenge[]> {
    const snapshot = await ChallengeRepository.collection()
      .where('createdBy', '==', creatorId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ChallengeRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async findByParticipant(userId: string): Promise<IChallenge[]> {
    const snapshot = await ChallengeRepository.collection()
      .where('participants', 'array-contains', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ChallengeRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async findPublicChallenges(limit: number = 20): Promise<IChallenge[]> {
    const snapshot = await ChallengeRepository.collection()
      .where('isPublic', '==', true)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ChallengeRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async update(id: string, updates: Partial<IChallenge>): Promise<IChallenge | null> {
    const docRef = ChallengeRepository.collection().doc(id);
    const updateData: any = { updatedAt: dateToTimestamp(new Date()) };

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.description) updateData.description = updates.description.trim();
    if (updates.type) updateData.type = updates.type;
    if (updates.participants) updateData.participants = updates.participants;
    if (updates.maxParticipants !== undefined) updateData.maxParticipants = updates.maxParticipants;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.habitCriteria) updateData.habitCriteria = updates.habitCriteria;
    if (updates.goal) updateData.goal = updates.goal;
    if (updates.rewards) updateData.rewards = updates.rewards;
    if (updates.rules) updateData.rules = updates.rules;
    if (updates.status) updateData.status = updates.status;
    if (updates.chatEnabled !== undefined) updateData.chatEnabled = updates.chatEnabled;
    if (updates.leaderboard) {
      updateData.leaderboard = updates.leaderboard.map(l => ({
        ...l,
        lastUpdated: dateToTimestamp(l.lastUpdated),
      }));
    }
    if (updates.duration) {
      updateData.duration = {
        startDate: dateToTimestamp(updates.duration.startDate),
        endDate: dateToTimestamp(updates.duration.endDate),
        durationDays: updates.duration.durationDays,
      };
    }

    await docRef.update(updateData);
    return ChallengeRepository.findById(id);
  },

  async delete(id: string): Promise<boolean> {
    await ChallengeRepository.collection().doc(id).delete();
    return true;
  },

  async addParticipant(challengeId: string, userId: string): Promise<IChallenge | null> {
    const challenge = await ChallengeRepository.findById(challengeId);
    if (!challenge) return null;
    if (challenge.participants.includes(userId)) return challenge;

    const newParticipants = [...challenge.participants, userId];
    return ChallengeRepository.update(challengeId, { participants: newParticipants });
  },

  async removeParticipant(challengeId: string, userId: string): Promise<IChallenge | null> {
    const challenge = await ChallengeRepository.findById(challengeId);
    if (!challenge) return null;

    const newParticipants = challenge.participants.filter(p => p !== userId);
    return ChallengeRepository.update(challengeId, { participants: newParticipants });
  },

  async updateLeaderboard(challengeId: string, leaderboard: IChallenge['leaderboard']): Promise<IChallenge | null> {
    // Sort by progress and assign ranks
    const sorted = [...leaderboard].sort((a, b) => b.progress - a.progress);
    sorted.forEach((entry, index) => {
      entry.rank = index + 1;
      entry.lastUpdated = new Date();
    });
    
    return ChallengeRepository.update(challengeId, { leaderboard: sorted });
  },
};

export const Challenge = ChallengeRepository;
export default ChallengeRepository;
