import mongoose from "mongoose";
import dns from "node:dns";

// Fix for Windows / ISP DNS resolvers failing on MongoDB SRV queries (querySrv ECONNREFUSED)
try {
  dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
  // Ignore if custom DNS cannot be set
}

let isMongoConnected = false;

export const getDbStatus = () => isMongoConnected;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("[MongoDB] Notice: MONGODB_URI not defined. Running in high-performance store mode.");
    isMongoConnected = false;
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    isMongoConnected = true;
    return conn;
  } catch (error) {
    console.warn(`[MongoDB] Connection note (${error.message}). Falling back to built-in persistent store.`);
    isMongoConnected = false;
    return null;
  }
};
