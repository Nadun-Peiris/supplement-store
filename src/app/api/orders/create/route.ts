import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { items, billingDetails, subtotal, shippingCost, total, purchaseType } =
      body;

    if (!items || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
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

    const authHeader = req.headers.get("authorization");
    const guestId = req.headers.get("guest-id");

    let userObjectId: string | null = null;
    let cartOwnerUserId: string | null = null;
    const cartOwnerGuestId: string | null = guestId || null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token && token !== "undefined") {
        try {
          const decoded = await getAuth().verifyIdToken(token);
          const user = await User.findOne({ firebaseId: decoded.uid }).select(
            "_id firebaseId"
          );

          if (user) {
            userObjectId = String(user._id);
            cartOwnerUserId = user.firebaseId;
          }
        } catch {
          // continue as guest
        }
      }
    }

    const order = await Order.create({
      orderType: purchaseType === "subscription" ? "subscription" : "normal",
      user: userObjectId,
      cartOwnerUserId,
      cartOwnerGuestId,
      items: mappedItems,
      subtotal,
      shippingCost,
      total,
      paymentProvider: "payhere",
      paymentStatus: "pending",
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
