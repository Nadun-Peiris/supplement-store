import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper: identify owner
async function getOwner(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      return { userId: decoded.uid, guestId: null };
    } catch (err) {
      console.log("Invalid token, fallback to guest.");
    }
  }

  return { guestId: req.headers.get("x-guest-id"), userId: null };
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const { productId, quantity } = await req.json();
    const { userId, guestId } = await getOwner(req);

    if (!productId || !quantity) {
      return NextResponse.json(
        { error: "Missing productId or quantity" },
        { status: 400 }
      );
    }

    const cart = await Cart.findOne(userId ? { userId } : { guestId });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    const item = cart.items.find((i: any) => i.productId === productId);
    if (!item) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    item.quantity = quantity;
    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
