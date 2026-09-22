import mongoose from "mongoose";

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined. Add it to .env.local and restart the server.");
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        family: 4,
      })
      .then((m) => m)
      .catch((e) => {
        cached.promise = null;
        const msg = e?.message || "unknown";
        if (msg.includes("querySrv ECONNREFUSED") || msg.includes("queryTxt")) {
          throw new Error(
            "DNS lookup for MongoDB Atlas failed (querySrv ECONNREFUSED). Your network/DNS is blocking Atlas SRV records. Fix: switch to Google DNS (8.8.8.8 / 1.1.1.1) or try a mobile hotspot, verify the cluster hostname in Atlas, and ensure the cluster is not paused."
          );
        }
        if (msg.includes("bad auth") || msg.includes("Authentication failed")) {
          throw new Error("MongoDB authentication failed. Check DB username/password in .env.local.");
        }
        if (msg.includes("IP") || msg.includes("whitelist") || msg.includes("not authorized")) {
          throw new Error("MongoDB connection blocked. In Atlas go to Network Access and add 0.0.0.0/0.");
        }
        throw new Error("Database connection failed: " + msg);
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
