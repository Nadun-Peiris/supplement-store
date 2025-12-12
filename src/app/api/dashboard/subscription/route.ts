import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User, { type IUser } from "@/models/User";
import Subscription from "@/models/Subscription";
import Order from "@/models/Order";

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
      const latest = await Subscription.findOne({ user: user._id })
        .sort({ updatedAt: -1 })
        .lean();

      if (latest) {
        subscription = {
          id: latest.lemonSubscriptionId,
          status: latest.status ?? null,
          active:
            typeof latest.status === "string" &&
            ["active", "on_trial", "past_due"].includes(
              latest.status.toLowerCase()
            ),
          nextBillingDate: latest.renewsAt ?? null,
          lemonCustomerId: latest.lemonCustomerId ?? null,
          cancelledAt: latest.cancelledAt ?? null,
        };

        // Keep user doc in sync for future reads
        await User.updateOne(
          { _id: user._id },
          { $set: { subscription } }
        );
      }
    }

    // Final fallback: infer from the latest paid subscription order
    if (!subscription?.id) {
      const latestOrder = await Order.findOne({
        user: user._id,
        orderType: "subscription",
        status: "paid",
      })
        .sort({ updatedAt: -1 })
        .lean();

      if (latestOrder) {
        subscription = {
          id: latestOrder.subscriptionId ?? latestOrder.paymentReference ?? null,
          status: latestOrder.nextBillingDate ? "active" : "inactive",
          active: Boolean(latestOrder.nextBillingDate),
          nextBillingDate: latestOrder.nextBillingDate ?? null,
          lemonCustomerId: user.subscription?.lemonCustomerId ?? null,
          cancelledAt: null,
        };

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
