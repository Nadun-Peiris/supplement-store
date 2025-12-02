import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
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

    const cartFilter = userId ? { userId } : { guestId };
    let cart = await Cart.findOne(cartFilter);

    // Create new cart if none exists
    if (!cart) {
      cart = await Cart.create({
        userId: userId || undefined,
        guestId: guestId || undefined,
        items: [{ productId, name, price, quantity, image }],
      });

      return NextResponse.json({ success: true, cart });
    }

    // Update existing product quantity
    const index = cart.items.findIndex((i: any) => i.productId === productId);

    if (index >= 0) {
      cart.items[index].quantity += quantity;
    } else {
      cart.items.push({ productId, name, price, quantity, image });
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
