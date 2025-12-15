import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const options = {};

if (!uri) {
  throw new Error("❌ Please add your Mongo URI to .env.local");
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  // ✅ Re-use the same client between invocations (works in dev + Vercel lambdas)
  global._mongoClientPromise = client.connect();
}

const clientPromise: Promise<MongoClient> = global._mongoClientPromise;

export default clientPromise;
