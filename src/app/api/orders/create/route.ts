import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { items, billing } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // create order in MongoDB
    const order = await Order.create({
      items,
      ...billing,
      orderStatus: "pending-payment",
    });

    return NextResponse.json({
      success: true,
      orderId: order._id,
      redirectTo: `/checkout/success?order=${order._id}`,
    });
  } catch (err) {
    console.log("ORDER CREATE ERROR:", err);
    return NextResponse.json({ error: "Order creation failed" }, { status: 500 });
  }
}
