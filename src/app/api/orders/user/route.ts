import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Subscription from "@/models/Subscription";
import { requireMongoUser } from "@/lib/requestAuth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await requireMongoUser(req, "_id");

    const orders = await Order.find({ user: user._id, paymentStatus: "paid" })
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
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load orders" },
      { status }
    );
  }
}
