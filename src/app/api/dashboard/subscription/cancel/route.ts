import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { lemonFetch } from "@/lib/lemonsqueezy";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid });

    if (!user || !user.subscription?.id) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    // Cancel on Lemon Squeezy
    await lemonFetch(`/subscriptions/${user.subscription.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          type: "subscriptions",
          id: String(user.subscription.id),
          attributes: {
            cancelled: true,
          },
        },
      }),
    });

    // Update in MongoDB
    user.subscription.active = false;
    user.subscription.status = "cancelled";
    user.subscription.cancelledAt = new Date();
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel Subscription Error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
