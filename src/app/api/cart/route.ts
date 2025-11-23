import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { adminAuth } from "@/lib/firebaseAdmin";

// Utility: get user or guest ID
async function getCartOwner(req: Request) {
  // Logged-in user (via Firebase token)
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      return { userId: decoded.uid, guestId: null };
    } catch (err) {
      console.error("Firebase token invalid.");
    }
  }

  // Guest user
  const guestId = req.headers.get("x-guest-id");

  return { userId: null, guestId };
}

/* ============================================
   POST — Add to Cart
============================================ */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { productId, name, price, image } = await req.json();
    const { userId, guestId } = await getCartOwner(req);

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    // FIND OWNER CART
    let cart = await Cart.findOne(userId ? { userId } : { guestId });

    // Create new cart if none exists
    if (!cart) {
      cart = await Cart.create({
        userId,
        guestId,
        items: [
          {
            productId,
            name,
            price,
            quantity: 1,
            image,
          },
        ],
      });

      return NextResponse.json({ success: true, cart });
    }

    // Check if product already exists
    const index = cart.items.findIndex((item: any) => item.productId === productId);

    if (index >= 0) {
      cart.items[index].quantity += 1;
    } else {
      cart.items.push({
        productId,
        name,
        price,
        quantity: 1,
        image,
      });
    }

    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("CART POST ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ============================================
   GET — Fetch Cart
============================================ */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);

    const cart = await Cart.findOne(userId ? { userId } : { guestId });

    return NextResponse.json({ cart: cart || { items: [] } });
  } catch (err) {
    console.error("CART GET ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ============================================
   DELETE — Clear Cart
============================================ */
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);

    await Cart.findOneAndDelete(userId ? { userId } : { guestId });

    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("CART DELETE ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
