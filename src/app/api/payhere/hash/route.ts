import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { isValidObjectId } from "mongoose";
import User from "@/models/User";
import {
  getBearerToken,
  getGuestIdHeader,
  verifyRequestToken,
} from "@/lib/requestAuth";

const amountsMatch = (left: number, right: number) =>
  Math.round(left * 100) === Math.round(right * 100);

export async function POST(req: Request) {
  try {
    await connectDB();

    const { orderId, amount, currency } = await req.json();
    const guestId = getGuestIdHeader(req);

    if (!orderId || !isValidObjectId(orderId) || currency !== "LKR") {
      return NextResponse.json(
        { error: "Invalid payment request" },
        { status: 400 }
      );
    }

    let order = null;
    if (getBearerToken(req)) {
      const decoded = await verifyRequestToken(req);
      const user = await User.findOne({ firebaseId: decoded.uid }).select("_id");

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      order = await Order.findOne({ _id: orderId, user: user._id }).select(
        "total paymentStatus paymentProvider"
      );
    } else if (guestId) {
      order = await Order.findOne({
        _id: orderId,
        cartOwnerGuestId: guestId,
      }).select("total paymentStatus paymentProvider");
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentProvider !== "payhere") {
      return NextResponse.json(
        { error: "Order is not configured for PayHere" },
        { status: 400 }
      );
    }

    if (order.paymentStatus !== "pending") {
      return NextResponse.json(
        { error: "Order is not pending payment" },
        { status: 400 }
      );
    }

    const requestedAmount = Number(amount);

    if (
      !Number.isFinite(requestedAmount) ||
      !amountsMatch(requestedAmount, Number(order.total))
    ) {
      return NextResponse.json(
        { error: "Payment amount does not match order total" },
        { status: 400 }
      );
    }

    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
      return NextResponse.json(
        { error: "PayHere credentials are not configured" },
        { status: 500 }
      );
    }

    const formattedAmount = Number(order.total).toFixed(2);

    const hashedSecret = CryptoJS.MD5(merchantSecret)
      .toString()
      .toUpperCase();

    const hash = CryptoJS.MD5(
      merchantId +
        orderId +
        formattedAmount +
        currency +
        hashedSecret
    )
      .toString()
      .toUpperCase();

    return NextResponse.json({ hash });
  } catch (error) {
    console.error("PAYHERE HASH ERROR:", error);
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to generate payment hash" },
      { status }
    );
  }
}
