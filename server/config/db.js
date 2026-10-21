import mongoose from 'mongoose';

let isDbConnected = false;
let dbMode = 'disconnected';

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weathersphere';

  // If uri is the placeholder string from example, handle gracefully
  if (uri.includes('your_mongodb_connection_string')) {
    console.warn('⚠️ MONGODB_URI is set to placeholder. Please update server/.env with a real connection string.');
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000, // Quick timeout so server doesn't hang if no local mongod
    });

    isDbConnected = true;
    dbMode = 'mongodb';
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}`);
    console.warn('⚡ Operating in in-memory resilient fallback mode. API & Auth will remain fully functional.');
    isDbConnected = false;
    dbMode = 'in-memory-fallback';
  }
};

export const getDbStatus = () => ({
  connected: isDbConnected,
  mode: dbMode,
  message: isDbConnected
    ? 'MongoDB is actively connected and persisting records.'
    : 'Running with resilient in-memory storage fallback. Connect local MongoDB or MongoDB Atlas in server/.env for database persistence.'
});
