import admin from 'firebase-admin';
import { UserRepository } from '../models/User';

/**
 * Firebase-Firestore Synchronization Service
 * 
 * SYNC STRATEGY:
 * - Passwords: ONLY in Firebase (Firebase is source of truth)
 * - Usernames: Synced to Firebase displayName
 * - Emails: Synced (must match)
 * - Profile data (XP, level, bio, avatar): ONLY in Firestore
 */

export class FirebaseSyncService {
  /**
   * Sync username from Firestore to Firebase
   * Updates Firebase user's displayName to match Firestore username
   */
  async syncUsernameToFirebase(firebaseUid: string, username: string): Promise<void> {
    try {
      await admin.auth().updateUser(firebaseUid, {
        displayName: username,
      });
      console.log(`✅ Synced username "${username}" to Firebase user ${firebaseUid}`);
    } catch (error) {
      console.error('❌ Failed to sync username to Firebase:', error);
      throw new Error('Failed to sync username to Firebase');
    }
  }

  /**
   * Sync username from Firebase to Firestore
   * Updates Firestore username to match Firebase displayName
   */
  async syncUsernameFromFirebase(firebaseUid: string): Promise<void> {
    try {
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      const displayName = firebaseUser.displayName;

      if (displayName) {
        const firestoreUser = await UserRepository.findByFirebaseUid(firebaseUid);
        if (firestoreUser && firestoreUser.username !== displayName) {
          await UserRepository.update(firestoreUser.id, { username: displayName });
          console.log(`✅ Synced username from Firebase: ${displayName}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync username from Firebase:', error);
      throw new Error('Failed to sync username from Firebase');
    }
  }

  /**
   * Sync email verification status from Firebase to Firestore
   */
  async syncEmailVerificationStatus(firebaseUid: string): Promise<boolean> {
    try {
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      const emailVerified = firebaseUser.emailVerified;

      const firestoreUser = await UserRepository.findByFirebaseUid(firebaseUid);
      if (firestoreUser && firestoreUser.emailVerified !== emailVerified) {
        await UserRepository.update(firestoreUser.id, { emailVerified });
        console.log(`✅ Synced email verification status: ${emailVerified}`);
      }

      return emailVerified;
    } catch (error) {
      console.error('❌ Failed to sync email verification status:', error);
      return false;
    }
  }

  /**
   * Get user from Firebase and ensure Firestore is in sync
   * This is the master sync function called during login
   */
  async ensureUserInSync(firebaseUid: string): Promise<void> {
    try {
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      const firestoreUser = await UserRepository.findByFirebaseUid(firebaseUid);

      if (!firestoreUser) {
        console.log('⚠️ Firebase user exists but Firestore user missing');
        return;
      }

      const updates: any = {};
      let needsUpdate = false;

      // Sync username (Firebase displayName → Firestore username)
      if (firebaseUser.displayName && firestoreUser.username !== firebaseUser.displayName) {
        console.log(`🔄 Syncing username: "${firestoreUser.username}" → "${firebaseUser.displayName}"`);
        updates.username = firebaseUser.displayName;
        needsUpdate = true;
      }

      // Sync email verification status
      if (firestoreUser.emailVerified !== firebaseUser.emailVerified) {
        console.log(`🔄 Syncing email verification: ${firestoreUser.emailVerified} → ${firebaseUser.emailVerified}`);
        updates.emailVerified = firebaseUser.emailVerified;
        needsUpdate = true;
      }

      // Sync email (should always match, but just in case)
      if (firebaseUser.email && firestoreUser.email !== firebaseUser.email) {
        console.log(`🔄 Syncing email: "${firestoreUser.email}" → "${firebaseUser.email}"`);
        updates.email = firebaseUser.email;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await UserRepository.update(firestoreUser.id, updates);
        console.log('✅ User data synced successfully');
      } else {
        console.log('✅ User data already in sync');
      }
    } catch (error) {
      console.error('❌ Failed to sync user data:', error);
      // Don't throw - sync failures shouldn't block login
    }
  }

  /**
   * Update user profile and sync to Firebase
   * Called when user updates their profile
   */
  async updateUserProfile(
    userId: string,
    updates: {
      username?: string;
      bio?: string;
      avatar?: string;
      isPublic?: boolean;
    }
  ): Promise<void> {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update Firestore
      await UserRepository.update(userId, updates);

      // Sync username to Firebase if it was updated
      if (updates.username && user.firebaseUid) {
        await this.syncUsernameToFirebase(user.firebaseUid, updates.username);
      }

      console.log('✅ User profile updated and synced');
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * CRITICAL: Verify that password is NEVER stored in Firestore for Firebase users
   * (With Firestore, passwords are only stored for legacy non-Firebase users if any)
   */
  async ensurePasswordNotInFirestore(firebaseUid: string): Promise<void> {
    try {
      const user = await UserRepository.findByFirebaseUid(firebaseUid);
      
      if (user && user.password) {
        console.warn(`⚠️ WARNING: Firebase user ${firebaseUid} has password in Firestore - removing it`);
        await UserRepository.update(user.id, { password: undefined });
        console.log('✅ Removed password from Firestore for Firebase user');
      }
    } catch (error) {
      console.error('❌ Failed to clean up password:', error);
    }
  }

  // Alias for backwards compatibility
  async ensurePasswordNotInMongoDB(firebaseUid: string): Promise<void> {
    return this.ensurePasswordNotInFirestore(firebaseUid);
  }
}

export const firebaseSyncService = new FirebaseSyncService();
