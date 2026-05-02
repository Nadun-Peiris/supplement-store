import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { requireMongoUser } from "@/lib/requestAuth";

export async function GET(req: Request) {
  try {
    await connectDB();

    // 1. Verify Firebase Token
    const user = await requireMongoUser(req, "_id");

    // 2. Fetch the recurring Subscription documents for the authenticated user
    const subscriptions = await Subscription.find({ 
      user: user._id
    }) 
      .sort({ createdAt: -1 }) 
      .lean();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("FETCH USER SUBSCRIPTIONS ERROR:", error);
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Internal Server Error" },
      { status }
    );
  }
}
