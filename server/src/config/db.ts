import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MongoDB_URI:string = process.env.MONGODB_URI || 'mongodb://localhost:27017/event-management';

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    
    const conn = await mongoose.connect(MongoDB_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });
  } catch (error) {
    console.error(`MongoDB connection error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
