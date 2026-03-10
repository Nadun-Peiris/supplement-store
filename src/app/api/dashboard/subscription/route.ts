import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User, { type IUser } from "@/models/User";
import Subscription from "@/models/Subscription";

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

    let subscription = user.subscription;

    // Fallback: if the embedded subscription is missing, try the Subscription collection
    if (!subscription?.id) {
      type SubscriptionFallback = {
        subscriptionId?: string | null;
        status?: string | null;
        nextBillingDate?: Date | null;
      };

      const latest = (await Subscription.findOne({ user: user._id })
        .sort({ updatedAt: -1 })
        .lean()) as SubscriptionFallback | null;

      if (latest) {
        subscription = {
          id: latest.subscriptionId ?? null,
          status: latest.status ?? null,
          active:
            typeof latest.status === "string" &&
            ["active"].includes(
              latest.status.toLowerCase()
            ),
          nextBillingDate: latest.nextBillingDate ?? null,
          lemonCustomerId: null,
          cancelledAt:
            latest.status === "cancelled" ? new Date() : null,
        };

        // Keep user doc in sync for future reads
        await User.updateOne(
          { _id: user._id },
          { $set: { subscription } }
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
