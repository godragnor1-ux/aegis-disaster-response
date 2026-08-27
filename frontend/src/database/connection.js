import mongoose from 'mongoose';

let mongoMemoryServer = null;

const sanitizeMongoUri = (uri) => {
  if (!uri) return 'undefined';
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
  } catch {
    return 'authenticated_uri';
  }
};

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
          family: 4,
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

  try {
    console.log('⚡ Initializing embedded MongoMemoryServer for instant zero-config run...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ [MongoMemoryServer] Connected successfully at: ${uri}`);
  } catch (memError) {
    console.warn('⚠️ Embedded database initialization skipped or module not installed:', memError.message);
    if (!mongoUri) {
      console.error('❌ Please set MONGO_URI environment variable in your deployment dashboard.');
    }
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
