import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireMongoUser } from "@/lib/requestAuth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const user = await requireMongoUser(req, "_id");

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Orders API error:", err);
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
