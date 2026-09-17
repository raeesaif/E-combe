import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<void> => {
  if (!env.mongoUri) {
    console.error(
      'MongoDB connection string is not defined in the environment variables.'
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(env.mongoUri);

    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};
