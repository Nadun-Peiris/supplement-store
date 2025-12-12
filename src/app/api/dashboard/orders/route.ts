import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { connectDB } from "@/lib/mongoose";
import "@/lib/firebaseAdmin";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Orders API error:", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
