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
    
    // Try to load local service account from file (Development default)
    const localServiceAccountPath = path.join(__dirname, '../../credentials/firebase-adminsdk.json');
    
    // --- STRATEGY 1: Render Secret File ---
    const renderSecretPath = '/etc/secrets/firebase-adminsdk.json';
    const fs = require('fs');
    if (!adminApp && fs.existsSync(renderSecretPath)) {
        console.log(`Checking Render secret file at: ${renderSecretPath}`);
        try {
            const fileContent = fs.readFileSync(renderSecretPath, 'utf8');
            console.log(`Render Secret File length: ${fileContent.length}`);
            console.log(`Render Secret Start: ${fileContent.substring(0, 20)}...`);
            
            const serviceAccount = JSON.parse(fileContent);
             adminApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
            });
            console.log('✅ Firebase Admin SDK initialized from Render Secret File');
        } catch (err) {
             console.error(`❌ Error reading/parsing Render secret file: ${err}`);
        }
    }

    // --- STRATEGY 2: Base64 Encoded Service Account ---
    if (!adminApp && process.env.FIREBASE_CREDENTIALS_BASE64) {
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
      }
    } 
    
    // --- STRATEGY 3: Project ID only (for Google Cloud Platform / specific environments) ---
    if (!adminApp && process.env.FIREBASE_PROJECT_ID) {
      // This only works if we are inside GCP authentication scope or have GOOGLE_APPLICATION_CREDENTIALS set validly
      // We assume if users try this, they know what they are doing.
       try {
          adminApp = admin.initializeApp({
            projectId: process.env.FIREBASE_PROJECT_ID,
          });
          console.log('✅ Firebase Admin SDK initialized from environment variables (Project ID only)');
       } catch (err) {
           console.log('⚠️ Failed to init with Project ID only (expected if not on GCP):', err);
       }
    } 
    
    // --- STRATEGY 4: Local File (Last Resort) ---
    if (!adminApp) {
        try {
             // check existence first to avoid require error
             if (fs.existsSync(localServiceAccountPath)) {
                 const serviceAccount = require(localServiceAccountPath);
                 adminApp = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: serviceAccount.project_id,
                 });
                 console.log('✅ Firebase Admin SDK initialized from local file');
             }
        } catch (e) {
             console.log('⚠️ Local credential file not found or invalid.');
        }
    }

    // --- FINAL CHECK ---
    if (!adminApp) {
        throw new Error('FATAL: No valid Firebase credentials found. Checked: Render Secret, Base64 Env, Project ID Env, Local File.');
    }

    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
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
