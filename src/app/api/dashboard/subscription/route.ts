import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User, { type IUser } from "@/models/User";
import Subscription from "@/models/Subscription";

type DashboardSubscription = {
  id: string | null;
  subscriptionId: string | null;
  status: "active" | "cancelled" | "completed" | null;
  active: boolean;
  nextBillingDate: Date | null;
  cancelledAt: Date | null;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    const user = (await User.findOne({ firebaseId: decoded.uid }).lean()) as
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
          cancelledAt: user.subscription.cancelledAt,
        }
      : null;

    // Fallback: if the embedded subscription is missing, try the Subscription collection
    if (!subscription?.subscriptionId) {
      type SubscriptionFallback = {
        subscriptionId?: string | null;
        status?: "active" | "cancelled" | "completed" | null;
        nextBillingDate?: Date | null;
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
          cancelledAt: latest.status === "cancelled" ? new Date() : null,
        };

        // Keep user doc in sync for future reads
        await User.updateOne(
          { _id: user._id },
          {
            $set: {
              subscription: {
                subscriptionId: subscription.subscriptionId,
                status: subscription.status,
                active: subscription.active,
                nextBillingDate: subscription.nextBillingDate,
                cancelledAt: subscription.cancelledAt,
              },
            },
          }
        );
      }
    }

    return NextResponse.json({
      subscription: subscription ?? null,
    });
  } catch (err) {
    console.error("Subscription API error:", err);
    return NextResponse.json(
      { error: "Failed to load subscription" },
      { status: 500 }
    );
  }
}
