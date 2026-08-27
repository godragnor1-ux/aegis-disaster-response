import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri) {
      console.log(`📡 Connecting to MongoDB instance: ${mongoUri.split('@')[1] || mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log('✅ External MongoDB connected successfully.');
      return;
    }

    console.log('⚡ Initializing embedded MongoMemoryServer for instant zero-config run...');
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
