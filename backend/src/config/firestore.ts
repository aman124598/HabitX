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
    // Debug: Print available env vars (keys only)
    console.log('configured env vars:', Object.keys(process.env).join(', '));

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
      
      // OPTION 1: Base64 Encoded Service Account
      if (process.env.FIREBASE_CREDENTIALS_BASE64) {
        try {
          const buffer = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64');
          const serviceAccount = JSON.parse(buffer.toString('utf-8'));
          
          adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
          });
          console.log('✅ Firebase Admin SDK initialized from Base64 env var');
          
        } catch (base64Error) {
          console.error('❌ Failed to parse FIREBASE_CREDENTIALS_BASE64 value:', base64Error);
          // Fall through to other methods is possible, but this usually implies configuration error
        }
      } 
      
      // OPTION 2: Project ID only (for Google Cloud Platform / specific environments)
      else if (process.env.FIREBASE_PROJECT_ID) {
        adminApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID,
        });
        console.log('✅ Firebase Admin SDK initialized from environment variables');
      } else {
        throw new Error('No Firebase credentials found. Please provide FIREBASE_CREDENTIALS_BASE64 or service account file.');
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
