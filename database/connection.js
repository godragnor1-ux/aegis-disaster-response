import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    // Support both MONGO_URI and MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (mongoUri) {
      console.log(`📡 Connecting to MongoDB Atlas / Cloud instance: ${mongoUri.split('@')[1] || 'authenticated connection'}`);
      await mongoose.connect(mongoUri, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // IPv4 preference
      });
      console.log('✅ MongoDB connected successfully to Atlas / Cloud.');
      return;
    }

    console.log('⚡ No MONGO_URI/MONGODB_URI provided. Initializing embedded MongoMemoryServer for instant zero-config run...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Embedded MongoMemoryServer connected at: ${uri}`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
