import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { isValidObjectId } from "mongoose";
import { getBearerToken, getGuestIdHeader, verifyRequestToken } from "@/lib/requestAuth";

async function getOwner(req: Request) {
  if (getBearerToken(req)) {
    const decoded = await verifyRequestToken(req);
    return { userId: decoded.uid, guestId: null };
  }

  return { userId: null, guestId: getGuestIdHeader(req) };
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const { productId, quantity } = await req.json();
    const { userId, guestId } = await getOwner(req);

    if (!userId && !guestId) {
      return NextResponse.json(
        { error: "Missing cart owner." },
        { status: 400 }
      );
    }

    if (!productId || !isValidObjectId(productId)) {
      return NextResponse.json({ error: "Invalid productId" }, { status: 400 });
    }

    const nextQuantity = Math.max(1, Number(quantity) || 1);
    const product = await Product.findOne({ _id: productId, isActive: true }).select(
      "stock price discountPrice name image"
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const availableStock =
      typeof product.stock === "number" ? Math.max(product.stock, 0) : 0;

    if (nextQuantity > availableStock) {
      return NextResponse.json(
        { error: "Requested quantity exceeds available stock" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne(userId ? { userId } : { guestId: guestId! });

    if (!cart)
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const index = cart.items.findIndex(
      (i: { productId: string }) => i.productId === productId
    );

    if (index === -1)
      return NextResponse.json(
        { error: "Product not in cart" },
        { status: 404 }
      );

    const effectivePrice =
      typeof product.discountPrice === "number" &&
      product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

    cart.items[index].quantity = nextQuantity;
    cart.items[index].price = effectivePrice;
    cart.items[index].originalPrice = product.price;
    cart.items[index].name = product.name;
    cart.items[index].image = product.image;
    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Server error" },
      { status }
    );
  }
}
