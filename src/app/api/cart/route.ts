import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { adminAuth } from "@/lib/firebaseAdmin";

// Normalize: ALWAYS use "guest-id"
async function getCartOwner(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];
  let userId: string | null = null;

  // Logged-in user
  if (token) {
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      console.error("Invalid Firebase token");
    }
  }

  // Guest user
  const guestId = req.headers.get("guest-id") || null;
  return { userId, guestId };
}

/* -----------------------------------------
    POST – Add to cart
------------------------------------------ */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { productId, name, price, image, quantity: rawQty = 1 } =
      await req.json();
    const { userId, guestId } = await getCartOwner(req);

    if (!productId)
      return NextResponse.json(
        { error: "Missing productId" },
        { status: 400 }
      );

    const quantity = Math.max(1, Number(rawQty) || 1);
    const product = await Product.findById(productId).select(
      "name price discountPrice image stock"
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const availableStock =
      typeof product.stock === "number" ? Math.max(product.stock, 0) : 0;

    if (availableStock <= 0) {
      return NextResponse.json(
        { error: "Product is out of stock" },
        { status: 400 }
      );
    }

    const effectivePrice =
      typeof product.discountPrice === "number" &&
      product.discountPrice < product.price
        ? product.discountPrice
        : product.price;
    const originalPrice = product.price;
    const resolvedName = product.name || name || "";
    const resolvedImage = product.image || image || "";

    const cartFilter = userId ? { userId } : { guestId };
    let cart = await Cart.findOne(cartFilter);

    // Create new cart if none exists
    if (!cart) {
      cart = await Cart.create({
        userId: userId || undefined,
        guestId: guestId || undefined,
        items: [
          {
            productId,
            name: resolvedName,
            price: effectivePrice,
            originalPrice,
            quantity,
            image: resolvedImage,
          },
        ],
      });

      return NextResponse.json({ success: true, cart });
    }

    // Update existing product quantity
    const index = cart.items.findIndex((i: any) => i.productId === productId);

    if (index >= 0) {
      const nextQuantity = cart.items[index].quantity + quantity;

      if (nextQuantity > availableStock) {
        return NextResponse.json(
          { error: "Requested quantity exceeds available stock" },
          { status: 400 }
        );
      }

      cart.items[index].quantity = nextQuantity;
      cart.items[index].price = effectivePrice;
      cart.items[index].originalPrice = originalPrice;
      cart.items[index].name = resolvedName;
      cart.items[index].image = resolvedImage;
    } else {
      if (quantity > availableStock) {
        return NextResponse.json(
          { error: "Requested quantity exceeds available stock" },
          { status: 400 }
        );
      }

      cart.items.push({
        productId,
        name: resolvedName,
        price: effectivePrice,
        originalPrice,
        quantity,
        image: resolvedImage,
      });
    }

    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("CART POST ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* -----------------------------------------
    GET – Fetch cart
------------------------------------------ */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);

    let cart = null;

    if (userId) {
      cart = await Cart.findOne({ userId });
    }

    if (!cart && guestId) {
      cart = await Cart.findOne({ guestId });
    }

    return NextResponse.json({ cart: cart || { items: [] } });
  } catch (err) {
    console.error("CART GET ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* -----------------------------------------
    DELETE – Clear cart
------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);

    let deleted = null;

    if (userId) {
      deleted = await Cart.findOneAndDelete({ userId });
    }

    if (!deleted && guestId) {
      await Cart.findOneAndDelete({ guestId });
    }

    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("CART DELETE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
