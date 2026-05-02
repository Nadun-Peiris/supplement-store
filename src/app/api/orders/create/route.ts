import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import "@/lib/firebaseAdmin";
import { isValidObjectId } from "mongoose";
import {
  getBearerToken,
  getGuestIdHeader,
  verifyRequestToken,
} from "@/lib/requestAuth";

const STANDARD_SHIPPING_COST = 400;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s()-]{6,20}$/;

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      items,
      billingDetails,
      purchaseType,
      checkoutMode,
    } = body;
    const isBuyNowCheckout = checkoutMode === "buy-now";

    if (!Array.isArray(items) || !items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const requiredBillingFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "street",
      "city",
      "country",
      "postcode",
    ] as const;

    if (
      !billingDetails ||
      requiredBillingFields.some(
        (field) =>
          typeof billingDetails[field] !== "string" ||
          !billingDetails[field].trim()
      )
    ) {
      return NextResponse.json(
        { error: "Billing details incomplete" },
        { status: 400 }
      );
    }

    const mappedItems = [];

    for (const item of items as Array<{
      productId?: string;
      name?: string;
      price?: number;
      quantity?: number;
    }>) {
      if (!item.productId || !isValidObjectId(item.productId)) {
        return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const product = await Product.findOne({
        _id: item.productId,
        isActive: true,
      }).select("name price discountPrice stock");

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        );
      }

      const availableStock =
        typeof product.stock === "number" ? Math.max(product.stock, 0) : 0;

      if (quantity > availableStock) {
        return NextResponse.json(
          { error: `${product.name} does not have enough stock` },
          { status: 400 }
        );
      }

      const effectivePrice =
        typeof product.discountPrice === "number" &&
        product.discountPrice < product.price
          ? product.discountPrice
          : product.price;

      mappedItems.push({
        product: item.productId,
        name: product.name || item.name || "",
        price: effectivePrice,
        quantity,
        lineTotal: effectivePrice * quantity,
      });
    }

    const computedSubtotal = mappedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0
    );
    const normalizedBillingDetails = {
      firstName: billingDetails.firstName.trim(),
      lastName: billingDetails.lastName.trim(),
      email: billingDetails.email.trim().toLowerCase(),
      phone: billingDetails.phone.trim(),
      street: billingDetails.street.trim(),
      city: billingDetails.city.trim(),
      country: billingDetails.country.trim(),
      postcode: billingDetails.postcode.trim(),
      apartment:
        typeof billingDetails.apartment === "string"
          ? billingDetails.apartment.trim()
          : "",
    };

    if (!EMAIL_REGEX.test(normalizedBillingDetails.email)) {
      return NextResponse.json(
        { error: "Invalid billing email address" },
        { status: 400 }
      );
    }

    if (!PHONE_REGEX.test(normalizedBillingDetails.phone)) {
      return NextResponse.json(
        { error: "Invalid billing phone number" },
        { status: 400 }
      );
    }

    const resolvedShippingCost = STANDARD_SHIPPING_COST;
    const computedTotal = computedSubtotal + resolvedShippingCost;

    const guestId = getGuestIdHeader(req);

    let userObjectId: string | null = null;
    let cartOwnerUserId: string | null = null;
    const cartOwnerGuestId: string | null = isBuyNowCheckout
      ? null
      : guestId || null;

    if (getBearerToken(req)) {
      const decoded = await verifyRequestToken(req);
      const user = await User.findOne({ firebaseId: decoded.uid }).select(
        "_id firebaseId"
      );

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      userObjectId = String(user._id);
      cartOwnerUserId = isBuyNowCheckout ? null : user.firebaseId;
    }

    if (purchaseType === "subscription" && !userObjectId) {
      return NextResponse.json(
        { error: "Login required for subscription checkout" },
        { status: 401 }
      );
    }

    if (!userObjectId && !isBuyNowCheckout && !cartOwnerGuestId) {
      return NextResponse.json(
        { error: "Guest checkout requires a valid guest cart." },
        { status: 400 }
      );
    }

    const order = await Order.create({
      orderType: purchaseType === "subscription" ? "subscription" : "normal",
      user: userObjectId,
      // TODO: migrate to admin-compatible structure after PayHere/cart cleanup no longer depends on these fields.
      cartOwnerUserId,
      cartOwnerGuestId,
      items: mappedItems,
      subtotal: computedSubtotal,
      shippingCost: resolvedShippingCost,
      total: computedTotal,
      paymentProvider: "payhere",
      paymentStatus: "pending",
      billingDetails: normalizedBillingDetails,
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
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Order creation failed" },
      { status }
    );
  }
}
