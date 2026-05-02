import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import { isValidObjectId } from "mongoose";
import { getBearerToken, getGuestIdHeader, verifyRequestToken } from "@/lib/requestAuth";

async function getOwner(req: Request) {
  if (getBearerToken(req)) {
    const decoded = await verifyRequestToken(req);
    return { userId: decoded.uid, guestId: null };
  }

  return { userId: null, guestId: getGuestIdHeader(req) };
}

export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { productId } = await req.json();
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

    const cart = await Cart.findOne(userId ? { userId } : { guestId: guestId! });

    if (!cart)
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });

    cart.items = cart.items.filter(
      (i: { productId: string }) => i.productId !== productId
    );

    await cart.save();

    return NextResponse.json({ success: true, cart });
  } catch (err) {
    console.error("REMOVE CART ERROR:", err);
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
