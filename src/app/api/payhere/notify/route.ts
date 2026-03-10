import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();

  const orderId = form.get("order_id");
  const statusCode = form.get("status_code");
  const paymentId = form.get("payment_id");

  await connectDB();

  if (statusCode === "2") {
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "paid",
      paymentReference: paymentId,
    });
  }

  return NextResponse.json({ success: true });
}