import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";

// GET a single subscription's details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    await connectDB();
    const { subscriptionId } = await params;

    // 1. Verify User (Security)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await getAuth().verifyIdToken(token); // Throws error if invalid

    // 2. Fetch the Subscription from MongoDB
    const subscription = await Subscription.findById(subscriptionId).lean();

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("FETCH SINGLE SUBSCRIPTION ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
