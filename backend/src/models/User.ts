import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// User interface (Firestore version)
export interface IUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: Date;
  firebaseUid?: string;
  createdAt: Date;
  updatedAt: Date;
}

// User document type for Firestore
interface UserDocument {
  username: string;
  email: string;
  password?: string;
  bio?: string;
  avatar?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: FirebaseFirestore.Timestamp;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: FirebaseFirestore.Timestamp;
  firebaseUid?: string;
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
      password: data.password,
      bio: data.bio,
      avatar: data.avatar,
      emailVerified: data.emailVerified ?? false,
      verificationToken: data.verificationToken,
      verificationTokenExpiry: timestampToDate(data.verificationTokenExpiry),
      passwordResetToken: data.passwordResetToken,
      passwordResetTokenExpiry: timestampToDate(data.passwordResetTokenExpiry),
      firebaseUid: data.firebaseUid,
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
    if (user.password !== undefined) doc.password = user.password;
    if (user.bio !== undefined) doc.bio = user.bio;
    if (user.avatar !== undefined) doc.avatar = user.avatar;
    if (user.emailVerified !== undefined) doc.emailVerified = user.emailVerified;
    if (user.verificationToken !== undefined) doc.verificationToken = user.verificationToken;
    if (user.verificationTokenExpiry !== undefined) doc.verificationTokenExpiry = dateToTimestamp(user.verificationTokenExpiry);
    if (user.passwordResetToken !== undefined) doc.passwordResetToken = user.passwordResetToken;
    if (user.passwordResetTokenExpiry !== undefined) doc.passwordResetTokenExpiry = dateToTimestamp(user.passwordResetTokenExpiry);
    if (user.firebaseUid !== undefined) doc.firebaseUid = user.firebaseUid;
    
    return doc;
  },

  /**
   * Create a new user
   */
  async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const now = new Date();
    const id = generateId();
    
    // Hash password if provided
    let hashedPassword = userData.password;
    if (hashedPassword) {
      const salt = await bcrypt.genSalt(12);
      hashedPassword = await bcrypt.hash(hashedPassword, salt);
    }

    const docData: UserDocument = {
      username: userData.username.trim(),
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      bio: userData.bio?.trim(),
      avatar: userData.avatar,
      emailVerified: userData.emailVerified ?? false,
      verificationToken: userData.verificationToken,
      verificationTokenExpiry: dateToTimestamp(userData.verificationTokenExpiry),
      passwordResetToken: userData.passwordResetToken,
      passwordResetTokenExpiry: dateToTimestamp(userData.passwordResetTokenExpiry),
      firebaseUid: userData.firebaseUid,
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await UserRepository.collection().doc(id).set(docData);
    
    return {
      id,
      ...userData,
      password: hashedPassword,
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
   * Find user by Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<IUser | null> {
    const snapshot = await UserRepository.collection()
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return UserRepository.fromFirestore(snapshot.docs[0]);
  },

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();
    
    const snapshot = await UserRepository.collection()
      .where('verificationToken', '==', hashedToken)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    
    const user = UserRepository.fromFirestore(snapshot.docs[0]);
    if (!user) return null;
    
    // Check if token is expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < now) {
      return null;
    }
    
    return user;
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    const docRef = UserRepository.collection().doc(id);
    
    // Hash password if being updated
    if (updates.password) {
      const salt = await bcrypt.genSalt(12);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
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
   * Compare password
   */
  async comparePassword(user: IUser, candidatePassword: string): Promise<boolean> {
    if (!user.password) return false;
    return bcrypt.compare(candidatePassword, user.password);
  },

  /**
   * Generate verification token
   */
  generateVerificationToken(): { token: string; hashedToken: string; expiry: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, hashedToken, expiry };
  },

  /**
   * Generate password reset token
   */
  generatePasswordResetToken(): { token: string; hashedToken: string; expiry: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, hashedToken, expiry };
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
};

// Export for backward compatibility
export const User = UserRepository;
export default UserRepository;
