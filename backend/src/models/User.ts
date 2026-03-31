import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// User interface — auth is handled entirely by Clerk
export interface IUser {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  clerkId?: string;
  totalXP?: number;
  level?: number;
  isPublic?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User document type for Firestore
interface UserDocument {
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  clerkId?: string;
  totalXP?: number;
  level?: number;
  isPublic?: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * User Repository - Firestore operations for users
 */
export const UserRepository = {
  /**
   * Get collection reference
   */
  collection: () => getFirestore().collection(Collections.USERS),

  /**
   * Convert Firestore document to IUser
   */
  fromFirestore: (doc: FirebaseFirestore.DocumentSnapshot): IUser | null => {
    if (!doc.exists) return null;
    const data = doc.data() as UserDocument;
    return {
      id: doc.id,
      username: data.username,
      email: data.email,
      bio: data.bio,
      avatar: data.avatar,
      emailVerified: data.emailVerified ?? false,
      clerkId: data.clerkId,
      totalXP: data.totalXP ?? 0,
      level: data.level ?? 1,
      isPublic: data.isPublic ?? true,
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  },

  /**
   * Convert IUser to Firestore document
   */
  toFirestore: (user: Partial<IUser>): Partial<UserDocument> => {
    const doc: Partial<UserDocument> = {};

    if (user.username !== undefined) doc.username = user.username;
    if (user.email !== undefined) doc.email = user.email?.toLowerCase();
    if (user.bio !== undefined) doc.bio = user.bio;
    if (user.avatar !== undefined) doc.avatar = user.avatar;
    if (user.emailVerified !== undefined) doc.emailVerified = user.emailVerified;
    if (user.clerkId !== undefined) doc.clerkId = user.clerkId;
    if (user.totalXP !== undefined) doc.totalXP = user.totalXP;
    if (user.level !== undefined) doc.level = user.level;
    if (user.isPublic !== undefined) doc.isPublic = user.isPublic;

    return doc;
  },

  /**
   * Create a new user
   */
  async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const now = new Date();
    const id = generateId();

    const docData: UserDocument = {
      username: userData.username.trim(),
      email: userData.email.toLowerCase().trim(),
      bio: userData.bio?.trim(),
      avatar: userData.avatar,
      emailVerified: userData.emailVerified ?? false,
      clerkId: userData.clerkId,
      totalXP: userData.totalXP ?? 0,
      level: userData.level ?? 1,
      isPublic: userData.isPublic ?? true,
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await UserRepository.collection().doc(id).set(docData);

    return {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    const doc = await UserRepository.collection().doc(id).get();
    return UserRepository.fromFirestore(doc);
  },

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    const snapshot = await UserRepository.collection()
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return UserRepository.fromFirestore(snapshot.docs[0]);
  },

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    const snapshot = await UserRepository.collection()
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return UserRepository.fromFirestore(snapshot.docs[0]);
  },

  /**
   * Find user by Clerk ID
   */
  async findByClerkId(clerkId: string): Promise<IUser | null> {
    const snapshot = await UserRepository.collection()
      .where('clerkId', '==', clerkId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return UserRepository.fromFirestore(snapshot.docs[0]);
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const docRef = UserRepository.collection().doc(id);

    const updateData = {
      ...UserRepository.toFirestore(updates),
      updatedAt: dateToTimestamp(new Date()),
    };

    await docRef.update(updateData);
    return UserRepository.findById(id);
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    await UserRepository.collection().doc(id).delete();
    return true;
  },

  /**
   * Get all users (with pagination)
   */
  async findAll(limit: number = 50, startAfter?: string): Promise<IUser[]> {
    let query = UserRepository.collection()
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      const startDoc = await UserRepository.collection().doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => UserRepository.fromFirestore(doc)!).filter(Boolean);
  },

  /**
   * Add XP to a user and calculate level
   */
  async addXP(id: string, xpToAdd: number): Promise<IUser | null> {
    const user = await UserRepository.findById(id);
    if (!user) return null;

    const currentXP = user.totalXP || 0;
    const newTotalXP = currentXP + xpToAdd;

    // Level formula: level = floor(totalXP / 100) + 1
    const newLevel = Math.floor(newTotalXP / 100) + 1;

    return UserRepository.update(id, {
      totalXP: newTotalXP,
      level: newLevel,
    });
  },
};

// Export for backward compatibility
export const User = UserRepository;
export default UserRepository;
