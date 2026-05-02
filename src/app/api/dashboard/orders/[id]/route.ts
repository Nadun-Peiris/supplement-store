import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Subscription from "@/models/Subscription";
import { requireMongoUser } from "@/lib/requestAuth";

// params is a Promise in Next.js App Router; unwrap it before use
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const user = await requireMongoUser(req, "_id");

    const order = await Order.findOne({ _id: id, user: user._id }).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    let subscriptionId = order.subscriptionId ?? null;

    if (order.orderType === "subscription" && !subscriptionId) {
      const subscription = await Subscription.findOne({ orderId: order._id })
        .select("subscriptionId")
        .lean<{ subscriptionId?: string | null } | null>();

      subscriptionId = subscription?.subscriptionId ?? null;
    }

    return NextResponse.json({
      order: {
        ...order,
        subscriptionId,
      },
    });
  } catch (e) {
    console.error(e);
    const status =
      typeof e === "object" &&
      e !== null &&
      "status" in e &&
      typeof e.status === "number"
        ? e.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Server Error" },
      { status }
    );
  }
}
