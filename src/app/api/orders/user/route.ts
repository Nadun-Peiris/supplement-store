import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Subscription from "@/models/Subscription";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(token);
    const user = await User.findOne({ firebaseId: decoded.uid }).lean();

    if (!user) {
      return NextResponse.json({ orders: [] });
    }

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const subscriptionOrderIds = orders
      .filter((order) => order.orderType === "subscription")
      .map((order) => order._id);

    let subscriptionIdByOrderId = new Map<string, string>();

    if (subscriptionOrderIds.length > 0) {
      const subscriptions = await Subscription.find({
        orderId: { $in: subscriptionOrderIds },
      })
        .select("orderId subscriptionId")
        .lean();

      subscriptionIdByOrderId = new Map(
        subscriptions
          .filter((subscription) => subscription.orderId && subscription.subscriptionId)
          .map((subscription) => [
            String(subscription.orderId),
            String(subscription.subscriptionId),
          ])
      );
    }

    const enrichedOrders = orders.map((order) => ({
      ...order,
      subscriptionId:
        order.orderType === "subscription"
          ? order.subscriptionId ??
            subscriptionIdByOrderId.get(String(order._id)) ??
            null
          : null,
    }));

    return NextResponse.json({ orders: enrichedOrders });
  } catch (err) {
    console.error("User orders load error:", err);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}
