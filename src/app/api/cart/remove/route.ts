import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { adminAuth } from "@/lib/firebaseAdmin";

// Helper
async function getOwner(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  if (token) {
    try {
      const decoded = await adminAuth().verifyIdToken(token);
      return { userId: decoded.uid, guestId: null };
    } catch {}
  }

  return { userId: null, guestId: req.headers.get("x-guest-id") };
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { productId } = await req.json();
    const { userId, guestId } = await getOwner(req);

    if (!productId)
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });

    const cart = await Cart.findOne(userId ? { userId } : { guestId });
    if (!cart)
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    cart.items = cart.items.filter((item: any) => item.productId !== productId);

    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("REMOVE ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
