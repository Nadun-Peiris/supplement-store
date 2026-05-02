import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User, { type IUser } from "@/models/User";
import Subscription from "@/models/Subscription";
import { requireMongoUser } from "@/lib/requestAuth";

type DashboardSubscription = {
  id: string | null;
  subscriptionId: string | null;
  status: "active" | "cancelled" | "completed" | null;
  active: boolean;
  nextBillingDate: Date | null;
  lastPaymentDate: Date | null;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireMongoUser(req, "_id firebaseId");
    const user = (await User.findById(authUser._id).lean()) as
      | (IUser & { _id: string })
      | null;

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    let subscription: DashboardSubscription | null = user.subscription
      ? {
          id: user.subscription.subscriptionId,
          subscriptionId: user.subscription.subscriptionId,
          status: user.subscription.status,
          active: user.subscription.active,
          nextBillingDate: user.subscription.nextBillingDate,
          lastPaymentDate: user.subscription.lastPaymentDate,
        }
      : null;

    // Fallback: if the embedded subscription is missing, try the Subscription collection
    if (!subscription?.subscriptionId) {
      type SubscriptionFallback = {
        subscriptionId?: string | null;
        status?: "active" | "cancelled" | "completed" | null;
        nextBillingDate?: Date | null;
        lastPaymentDate?: Date | null;
      };

      const latest = (await Subscription.findOne({ user: user._id })
        .sort({ updatedAt: -1 })
        .lean()) as SubscriptionFallback | null;

      if (latest) {
        subscription = {
          id: latest.subscriptionId ?? null,
          subscriptionId: latest.subscriptionId ?? null,
          status: latest.status ?? null,
          active:
            latest.status === "active",
          nextBillingDate: latest.nextBillingDate ?? null,
          lastPaymentDate: latest.lastPaymentDate ?? null,
        };

      }
    }

    return NextResponse.json({
      subscription: subscription ?? null,
    });
  } catch (err) {
    console.error("Subscription API error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load subscription" },
      { status }
    );
  }
}
