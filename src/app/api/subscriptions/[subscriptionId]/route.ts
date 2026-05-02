import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { isValidObjectId } from "mongoose";
import { requireMongoUser } from "@/lib/requestAuth";

// GET a single subscription's details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    await connectDB();
    const { subscriptionId } = await params;

    if (!isValidObjectId(subscriptionId)) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // 1. Verify User (Security)
    const user = await requireMongoUser(req, "_id");

    // 2. Fetch the Subscription from MongoDB
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: user._id,
    }).lean();

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("FETCH SINGLE SUBSCRIPTION ERROR:", error);
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
