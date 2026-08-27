import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer = null;

/**
 * Mask password from MongoDB connection string for safe logging
 */
const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
  } catch {
    return 'authenticated_uri';
  }
};

// Mongoose Connection Event Listeners
mongoose.connection.on('connected', () => {
  console.log('🟢 [MongoDB Event] Connection established and active.');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 [MongoDB Event] Connection error occurred:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('🟡 [MongoDB Event] Disconnected from MongoDB instance.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🟢 [MongoDB Event] Successfully reconnected to MongoDB.');
});

/**
 * Connect to MongoDB Atlas or embedded fallback with retry logic
 */
export const connectDB = async (retries = 3, delayMs = 3000) => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (mongoUri) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 [MongoDB Atlas] Attempt ${attempt}/${retries}: Connecting to ${sanitizeMongoUri(mongoUri)}...`);

        await mongoose.connect(mongoUri, {
          maxPoolSize: 20,
          serverSelectionTimeoutMS: 8000,
          socketTimeoutMS: 45000,
          family: 4, // Force IPv4 to prevent IPv6 timeout issues on cloud hosts
        });

        console.log('✅ [MongoDB Atlas] Connected successfully to Cloud Database.');
        return;
      } catch (error) {
        console.error(`❌ [MongoDB Atlas] Connection attempt ${attempt} failed:`, error.message);

        if (attempt < retries) {
          console.log(`⏳ Retrying connection in ${delayMs / 1000}s...`);
          await new Promise((res) => setTimeout(res, delayMs));
        } else {
          console.error('💥 [MongoDB Atlas] All connection attempts exhausted.');
          console.warn('⚠️ Falling back to embedded in-memory database to keep server alive.');
          break;
        }
      }
    }
  }

  // Fallback to Embedded MongoMemoryServer for instant offline zero-config development
  try {
    console.log('⚡ Initializing embedded MongoMemoryServer for instant zero-config run...');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ [MongoMemoryServer] Connected successfully at: ${uri}`);
  } catch (memError) {
    console.error('❌ Fatal error initializing embedded database:', memError.message);
    process.exit(1);
  }
};

export const closeDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('🔒 Database connection gracefully closed.');
  } catch (err) {
    console.error('Error closing database:', err);
  }
};
