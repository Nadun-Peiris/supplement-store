import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import {
  getBearerToken,
  getGuestIdHeader,
  verifyRequestToken,
} from "@/lib/requestAuth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await connectDB();

    const token = getBearerToken(req);
    const guestId = getGuestIdHeader(req);
    let order = null;

    if (token) {
      const decoded = await verifyRequestToken(req);
      const user = await User.findOne({ firebaseId: decoded.uid }).select("_id");

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      order = await Order.findOne({ _id: id, user: user._id });
    } else if (guestId) {
      order = await Order.findOne({ _id: id, cartOwnerGuestId: guestId });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (err) {
    console.error("Order load error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load order" },
      { status }
    );
  }
}
