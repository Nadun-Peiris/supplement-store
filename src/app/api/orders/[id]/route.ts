import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import PendingOrder from "@/models/PendingOrder";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      const pendingOrder = await PendingOrder.findById(id).lean();

      if (!pendingOrder) {
        return NextResponse.json(
          { error: "Order not found" },
          { status: 404 }
        );
      }

      if (pendingOrder.createdOrderId) {
        const createdOrder = await Order.findById(pendingOrder.createdOrderId);

        if (createdOrder) {
          return NextResponse.json({ order: createdOrder });
        }
      }

      return NextResponse.json({
        order: {
          _id: String(pendingOrder._id),
          paymentStatus: pendingOrder.paymentStatus,
          orderType: pendingOrder.orderType,
          paymentProvider: pendingOrder.paymentProvider,
          total: pendingOrder.total,
          items: pendingOrder.items,
        },
      });
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Order load error:", err);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}
