import * as admin from 'firebase-admin';
import path from 'path';

let db: FirebaseFirestore.Firestore | null = null;
let adminApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK and return Firestore instance
 */
export const initializeFirestore = (): FirebaseFirestore.Firestore => {
  if (db) return db;

  try {
    // Try to load service account from file
    const serviceAccountPath = path.join(__dirname, '../../credentials/firebase-adminsdk.json');
    
    try {
      const serviceAccount = require(serviceAccountPath);
      
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
      });
      
      console.log('✅ Firebase Admin SDK initialized from service account file');
    } catch (fileError) {
      // If no service account file, try environment variables
      console.log('📝 No service account file found, trying environment variables...');
      
      if (process.env.FIREBASE_PROJECT_ID) {
        adminApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log('✅ Firebase Admin SDK initialized from environment variables');
      } else {
        throw new Error('No Firebase credentials found. Please provide either a service account file or environment variables.');
      }
    }

    db = admin.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('✅ Firestore database connected');
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize Firestore:', error);
    throw error;
  }
};

/**
 * Get Firestore instance (must call initializeFirestore first)
 */
export const getFirestore = (): FirebaseFirestore.Firestore => {
  if (!db) {
    throw new Error('Firestore not initialized. Call initializeFirestore() first.');
  }
  return db;
};

/**
 * Get Firebase Admin Auth instance
 */
export const getAuth = (): admin.auth.Auth => {
  if (!adminApp) {
    throw new Error('Firebase Admin not initialized. Call initializeFirestore() first.');
  }
  return admin.auth(adminApp);
};

/**
 * Collection names (centralized for consistency)
 */
export const Collections = {
  USERS: 'users',
  HABITS: 'habits',
  CHALLENGES: 'challenges',
  USER_CHALLENGES: 'userChallenges',
  FRIENDSHIPS: 'friendships',
} as const;

/**
 * Helper to generate a unique ID
 */
export const generateId = (): string => {
  return getFirestore().collection('_').doc().id;
};

/**
 * Convert Firestore Timestamp to Date
 */
export const timestampToDate = (timestamp: FirebaseFirestore.Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  return timestamp.toDate();
};

/**
 * Convert Date to Firestore Timestamp
 */
export const dateToTimestamp = (date: Date | undefined): FirebaseFirestore.Timestamp | undefined => {
  if (!date) return undefined;
  return admin.firestore.Timestamp.fromDate(date);
};

export default { initializeFirestore, getFirestore, getAuth, Collections, generateId };
