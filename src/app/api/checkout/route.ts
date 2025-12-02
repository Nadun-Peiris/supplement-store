import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      items,
      billingDetails,
      shippingMethod,
      purchaseType, // "one_time" or "subscription"
    } = body;

    if (!items || !billingDetails) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    // -------------------------
    // Determine user or guest
    // -------------------------
    let userId: string | null = null;
    let guestUser: string | null = null;

    const authHeader = req.headers.get("authorization");
    const guestId = req.headers.get("guest-id");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = await getAuth().verifyIdToken(token);

      const user = await User.findOne({ firebaseUid: decoded.uid });

      if (user) userId = user._id.toString();
    } else {
      guestUser = guestId || null;
    }

    // -------------------------
    // Fetch product details
    // -------------------------
    let orderItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product)
        return NextResponse.json(
          { error: "Product not found" },
          { status: 400 }
        );

      const lineTotal = product.price * item.quantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        lineTotal,
      });

      subtotal += lineTotal;
    }

    // -------------------------
    // Shipping cost
    // -------------------------
    const shippingCost =
      shippingMethod === "express_3_days" ? 500 : 0;

    const total = subtotal + shippingCost;

    // -------------------------
    // Payment Provider Selection
    // -------------------------
    let paymentProvider: string = "bank_transfer";

    if (purchaseType === "one_time") {
      paymentProvider = "bank_transfer"; // default
    }

    // Final payment provider decided on frontend when calling the payment route
    // (this route only creates order first)

    // -------------------------
    // Create the order
    // -------------------------
    const order = await Order.create({
      orderType: purchaseType === "subscription"
        ? "subscription"
        : "one_time",

      user: userId,
      guestUser: guestUser,

      items: orderItems,
      subtotal,
      shippingCost,
      total,
      shippingMethod,
      billingDetails,

      paymentProvider,
      status: "pending",
    });

    return NextResponse.json({
      orderId: String(order._id)
    });
  } catch (error) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
