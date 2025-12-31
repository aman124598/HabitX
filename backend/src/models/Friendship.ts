import { getFirestore, Collections, generateId, timestampToDate, dateToTimestamp } from '../config/firestore';

// Friendship interface
export interface IFriendship {
  id: string;
  requester: string;
  recipient: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

// Firestore document type
interface FriendshipDocument {
  requester: string;
  recipient: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

/**
 * Friendship Repository - Firestore operations
 */
export const FriendshipRepository = {
  collection: () => getFirestore().collection(Collections.FRIENDSHIPS),

  fromFirestore: (doc: FirebaseFirestore.DocumentSnapshot): IFriendship | null => {
    if (!doc.exists) return null;
    const data = doc.data() as FriendshipDocument;
    
    return {
      id: doc.id,
      requester: data.requester,
      recipient: data.recipient,
      status: data.status || 'pending',
      createdAt: timestampToDate(data.createdAt) || new Date(),
      updatedAt: timestampToDate(data.updatedAt) || new Date(),
    };
  },

  async create(data: Omit<IFriendship, 'id' | 'createdAt' | 'updatedAt'>): Promise<IFriendship> {
    // Prevent self-friendship
    if (data.requester === data.recipient) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if friendship already exists
    const existing = await FriendshipRepository.findByUsers(data.requester, data.recipient);
    if (existing) {
      throw new Error('Friendship already exists');
    }

    const now = new Date();
    const id = generateId();

    const docData: FriendshipDocument = {
      requester: data.requester,
      recipient: data.recipient,
      status: data.status || 'pending',
      createdAt: dateToTimestamp(now)!,
      updatedAt: dateToTimestamp(now)!,
    };

    await FriendshipRepository.collection().doc(id).set(docData);
    
    return {
      id,
      ...data,
      status: data.status || 'pending',
      createdAt: now,
      updatedAt: now,
    };
  },

  async findById(id: string): Promise<IFriendship | null> {
    const doc = await FriendshipRepository.collection().doc(id).get();
    return FriendshipRepository.fromFirestore(doc);
  },

  async findByUsers(user1: string, user2: string): Promise<IFriendship | null> {
    // Check both directions
    const snapshot1 = await FriendshipRepository.collection()
      .where('requester', '==', user1)
      .where('recipient', '==', user2)
      .limit(1)
      .get();
    
    if (!snapshot1.empty) {
      return FriendshipRepository.fromFirestore(snapshot1.docs[0]);
    }

    const snapshot2 = await FriendshipRepository.collection()
      .where('requester', '==', user2)
      .where('recipient', '==', user1)
      .limit(1)
      .get();
    
    if (!snapshot2.empty) {
      return FriendshipRepository.fromFirestore(snapshot2.docs[0]);
    }

    return null;
  },

  async findPendingForUser(userId: string): Promise<IFriendship[]> {
    const snapshot = await FriendshipRepository.collection()
      .where('recipient', '==', userId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => FriendshipRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async findAcceptedForUser(userId: string): Promise<IFriendship[]> {
    // Get friendships where user is requester
    const snapshot1 = await FriendshipRepository.collection()
      .where('requester', '==', userId)
      .where('status', '==', 'accepted')
      .get();
    
    // Get friendships where user is recipient
    const snapshot2 = await FriendshipRepository.collection()
      .where('recipient', '==', userId)
      .where('status', '==', 'accepted')
      .get();
    
    const friendships = [
      ...snapshot1.docs.map(doc => FriendshipRepository.fromFirestore(doc)!),
      ...snapshot2.docs.map(doc => FriendshipRepository.fromFirestore(doc)!),
    ].filter(Boolean);

    return friendships;
  },

  async findSentByUser(userId: string): Promise<IFriendship[]> {
    const snapshot = await FriendshipRepository.collection()
      .where('requester', '==', userId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map(doc => FriendshipRepository.fromFirestore(doc)!).filter(Boolean);
  },

  async update(id: string, updates: Partial<IFriendship>): Promise<IFriendship | null> {
    const docRef = FriendshipRepository.collection().doc(id);
    const updateData: any = { updatedAt: dateToTimestamp(new Date()) };

    if (updates.status) updateData.status = updates.status;

    await docRef.update(updateData);
    return FriendshipRepository.findById(id);
  },

  async accept(id: string): Promise<IFriendship | null> {
    return FriendshipRepository.update(id, { status: 'accepted' });
  },

  async decline(id: string): Promise<IFriendship | null> {
    return FriendshipRepository.update(id, { status: 'declined' });
  },

  async block(id: string): Promise<IFriendship | null> {
    return FriendshipRepository.update(id, { status: 'blocked' });
  },

  async delete(id: string): Promise<boolean> {
    await FriendshipRepository.collection().doc(id).delete();
    return true;
  },

  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await FriendshipRepository.findAcceptedForUser(userId);
    
    return friendships.map(f => 
      f.requester === userId ? f.recipient : f.requester
    );
  },

  async areFriends(user1: string, user2: string): Promise<boolean> {
    const friendship = await FriendshipRepository.findByUsers(user1, user2);
    return friendship?.status === 'accepted';
  },
};

export const Friendship = FriendshipRepository;
export default FriendshipRepository;
