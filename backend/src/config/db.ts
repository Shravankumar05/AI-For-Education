import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let mongoServer: MongoMemoryServer;

const connectDB = async (): Promise<void> => {
  try {
    // Use in-memory MongoDB for development
    if (process.env.NODE_ENV === 'development') {
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`Using MongoDB Memory Server at ${mongoUri}`);
      await mongoose.connect(mongoUri);
    } else {
      // Use real MongoDB connection for production
      const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-education';
      await mongoose.connect(MONGODB_URI);
    }
    
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;