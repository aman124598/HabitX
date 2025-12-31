import { initializeFirestore } from './firestore';

/**
 * Connect to database (Firestore)
 * This replaces the MongoDB connection
 */
export const connectDB = async (): Promise<void> => {
  try {
    initializeFirestore();
    console.log('✅ Database connected (Firebase Firestore)');
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    throw error;
  }
};

export default connectDB;
