import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const { items, billingDetails, subtotal, shippingCost, total } = body;

    if (!items || !items.length) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!billingDetails) {
      return NextResponse.json(
        { error: "Billing details missing" },
        { status: 400 }
      );
    }

    const mappedItems = items.map(
      (item: {
        productId: string;
        name?: string;
        price?: number;
        quantity?: number;
      }) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const price = Number(item.price) || 0;

        return {
          product: item.productId,
          name: item.name || "",
          price,
          quantity,
          lineTotal: price * quantity,
        };
      }
    );

    const order = await Order.create({
      items: mappedItems,
      subtotal,
      shippingCost,
      total,

      paymentProvider: "payhere",
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",

      billingDetails,
    });

    return NextResponse.json({
      success: true,
      orderId: order._id,
      _id: order._id,
      total: order.total,
      billingDetails: order.billingDetails,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);

    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    );
  }
}
