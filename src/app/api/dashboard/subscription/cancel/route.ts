import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import { requireMongoUser } from "@/lib/requestAuth";
import { cancelSubscriptionAndSync } from "@/lib/subscriptions/cancelSubscription";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireMongoUser(req, "_id");
    const user = await User.findById(authUser._id).select("_id subscription");
    const subscriptionId = user?.subscription?.subscriptionId;

    if (!user || !subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      subscriptionId,
      user: user._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({ success: true, message: "Already cancelled" });
    }

    await cancelSubscriptionAndSync(subscription);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel Subscription Error:", err);
    const message =
      err instanceof Error && err.message === "PAYHERE_CANCEL_FAILED"
        ? "PayHere could not cancel the subscription"
        : err instanceof Error && err.message === "PAYHERE_OAUTH_MISSING"
        ? "PayHere cancellation is not configured"
        : "Failed to cancel subscription";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
