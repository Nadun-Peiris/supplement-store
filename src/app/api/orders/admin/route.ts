import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { NextResponse } from "next/server";

export async function GET(req: Request) {

  await connectDB();

  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");

  let filter: any = {};

  if (type === "normal") {
    filter.orderType = "normal";
  }

  if (type === "subscription") {
    filter.orderType = "subscription";
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 });

  return NextResponse.json({ orders });

}