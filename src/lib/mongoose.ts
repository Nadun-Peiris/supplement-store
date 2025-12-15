import mongoose, { type Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;
const DB_NAME = "supplementstore"; // ✅ MUST match your Atlas database name

if (!MONGODB_URI) {
  throw new Error("❌ Missing MONGODB_URI in environment variables");
}

type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached = global._mongooseCache || { conn: null, promise: null };
if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

export const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    // Re-use the same connection in every Vercel lambda/runtime
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: DB_NAME,
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};
