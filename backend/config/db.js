import mongoose from 'mongoose';
import { config } from './env.js';

/**
 * Connect to MongoDB
 * Normalized design: Node is the single writer to all collections
 */
export async function connectDB() {
  try {
    await mongoose.connect(config.mongodbUri);

    const dbName = mongoose.connection.name || 'unknown';
    console.log(`✓ MongoDB connected successfully (database: ${dbName})`);

    mongoose.connection.on('error', (error) => {
      console.error('✗ MongoDB runtime error:', error.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Disconnect from MongoDB (cleanup)
 */
export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection failed:', error.message);
    throw error;
  }
}

export default {
  connectDB,
  disconnectDB,
};
