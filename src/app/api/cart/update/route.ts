import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { adminAuth } from "@/lib/firebaseAdmin";

async function getOwner(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      return { userId: decoded.uid, guestId: null };
    } catch {}
  }

  return { userId: null, guestId: req.headers.get("guest-id") };
}

export async function PUT(req: Request) {
  try {
    await connectDB();

    const { productId, quantity } = await req.json();
    const { userId, guestId } = await getOwner(req);

    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const cart = await Cart.findOne(userId ? { userId } : { guestId });

    if (!cart)
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    const index = cart.items.findIndex((i: any) => i.productId === productId);

    if (index === -1)
      return NextResponse.json(
        { error: "Product not in cart" },
        { status: 404 }
      );

    cart.items[index].quantity = Math.max(1, quantity);
    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("UPDATE CART ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
