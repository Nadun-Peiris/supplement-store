import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { isValidObjectId } from "mongoose";
import { requireMongoUser } from "@/lib/requestAuth";
import { cancelSubscriptionAndSync } from "@/lib/subscriptions/cancelSubscription";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ subscriptionId: string }> }
) {
  try {
    await connectDB();
    const { subscriptionId } = await params;

    if (!isValidObjectId(subscriptionId)) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 1. Authenticate User
    const user = await requireMongoUser(req, "_id");

    // 2. Find Subscription in your DB
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: user._id,
    });
    if (!subscription || !subscription.subscriptionId) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({ message: "Already cancelled" });
    }

    await cancelSubscriptionAndSync(subscription);

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled on PayHere and Database" 
    });

  } catch (error) {
    console.error("CANCEL SUBSCRIPTION ERROR:", error);
    const message =
      error instanceof Error && error.message === "PAYHERE_CANCEL_FAILED"
        ? "PayHere could not cancel the subscription"
        : error instanceof Error && error.message === "PAYHERE_OAUTH_MISSING"
        ? "PayHere cancellation is not configured"
        : "Internal Server Error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
