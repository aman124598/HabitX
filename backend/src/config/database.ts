import { initializeFirestore } from './firestore';

/**
 * Connect to the database (Firestore via Firebase Admin SDK)
 */
export const connectDB = async (): Promise<void> => {
  try {
    initializeFirestore();
    console.log('✅ Firestore database connected');
  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error);
    throw error;
  }
};

export default connectDB;
