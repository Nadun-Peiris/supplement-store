import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import {
  createOneTimeCheckout,
  extractCheckoutUrl,
} from "@/lib/lemonsqueezy";

const ONE_TIME_VARIANT_ID = process.env.LEMON_ONE_TIME_VARIANT_ID;

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

    const body = await req.json().catch(() => null);
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (!ONE_TIME_VARIANT_ID) {
      throw new Error("LEMON_ONE_TIME_VARIANT_ID is not configured");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.orderType !== "one_time") {
      return NextResponse.json(
        { error: "Order is not marked as one-time" },
        { status: 400 }
      );
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order can no longer be paid" },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(req);

    const checkout = await createOneTimeCheckout({
      variantId: ONE_TIME_VARIANT_ID,
      email: order.billingDetails.email,
      orderId: String(order._id),
      redirectUrl: `${baseUrl}/checkout/success?orderId=${order._id}`,
      amountInMajorUnits: order.total,
    });

    // Storing the provider + reference lets the webhook confirm which gateway
    // owns the order before mutating it.
    order.paymentProvider = "lemon_one_time";
    order.paymentReference = checkout.data.id;
    await order.save();

    const url = extractCheckoutUrl(checkout);

    if (!url) {
      throw new Error("Checkout URL missing from Lemon response");
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Lemon one-time checkout failed:", error);
    return NextResponse.json(
      { error: "Unable to create Lemon checkout session" },
      { status: 500 }
    );
  }
}
