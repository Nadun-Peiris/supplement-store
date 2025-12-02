import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { adminAuth } from "@/lib/firebaseAdmin";
import User from "@/models/User";
import Order from "@/models/Order";
import {
  createSubscriptionCheckout,
  extractCheckoutUrl,
} from "@/lib/lemonsqueezy";

const SUBSCRIPTION_VARIANT_ID = process.env.LEMON_SUBSCRIPTION_VARIANT_ID;

function resolveBaseUrl(req: NextRequest): string {
  const envBase =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (envBase) {
    return envBase.replace(/\/+$/, "");
  }

  const headerOrigin = req.headers.get("origin");
  if (headerOrigin) {
    return headerOrigin.replace(/\/+$/, "");
  }

  const requestUrl = new URL(req.url);
  return requestUrl.origin;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.orderType !== "subscription") {
      return NextResponse.json(
        { error: "Order is not marked as subscription" },
        { status: 400 }
      );
    }

    if (!order.user) {
      order.user = user._id;
      await order.save();
    } else if (order.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        { error: "Order does not belong to the authenticated user" },
        { status: 403 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order can no longer be paid" },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(req);

    const checkout = await createSubscriptionCheckout({
      email: user.email,
      userId: user._id.toString(),
      orderId: order._id.toString(),
      redirectUrl: `${baseUrl}/checkout/success?orderId=${order._id}`,
      amountInMajorUnits: order.total,
    });

    // Persist the provider now so the webhook can safely trust this order.
    order.paymentProvider = "lemon_subscription";
    order.paymentReference = checkout.data.id;
    await order.save();

    const url = extractCheckoutUrl(checkout);
    if (!url) {
      throw new Error("Checkout URL missing from Lemon response");
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Lemon subscription checkout failed:", error);
    return NextResponse.json(
      { error: "Unable to create Lemon checkout session" },
      { status: 500 }
    );
  }
}
