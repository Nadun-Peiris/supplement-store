import clientPromise from "@/lib/mongodb";

export default async function MongoTestPage() {
  try {
    const client = await clientPromise;
    const db = client.db("supplementstore");

    // Just a test document
    const collections = await db.listCollections().toArray();

    return (
      <div style={{ padding: "2rem" }}>
        <h1>✅ MongoDB Connected Successfully!</h1>
        <p>Collections Found: {collections.map((c) => c.name).join(", ") || "None yet"}</p>
      </div>
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
    return <div>❌ Failed to connect to MongoDB</div>;
  }
}
