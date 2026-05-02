import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { isValidObjectId } from "mongoose";
import { getBearerToken, getGuestIdHeader, verifyRequestToken } from "@/lib/requestAuth";

async function getCartOwner(req: Request) {
  const token = getBearerToken(req);
  if (token) {
    const decoded = await verifyRequestToken(req);
    return { userId: decoded.uid, guestId: null };
  }

  const guestId = getGuestIdHeader(req);
  if (!guestId) {
    return { userId: null, guestId: null };
  }

  return { userId: null, guestId };
}

/* -----------------------------------------
    POST – Add to cart
------------------------------------------ */
export async function POST(req: Request) {
  try {
    await connectDB();

    const { productId, name, image, quantity: rawQty = 1 } =
      await req.json();
    const { userId, guestId } = await getCartOwner(req);

    if (!userId && !guestId) {
      return NextResponse.json(
        { error: "Missing cart owner." },
        { status: 400 }
      );
    }

    if (!productId || !isValidObjectId(productId))
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );

    const quantity = Math.max(1, Number(rawQty) || 1);
    const product = await Product.findOne({ _id: productId, isActive: true }).select(
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

    const cartFilter = userId ? { userId } : { guestId: guestId! };
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
    const index = cart.items.findIndex(
      (i: { productId: string }) => i.productId === productId
    );

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

/* -----------------------------------------
    GET – Fetch cart
------------------------------------------ */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);
    if (!userId && !guestId) {
      return NextResponse.json({ cart: { items: [] } });
    }

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

/* -----------------------------------------
    DELETE – Clear cart
------------------------------------------ */
export async function DELETE(req: Request) {
  try {
    await connectDB();

    const { userId, guestId } = await getCartOwner(req);
    if (!userId && !guestId) {
      return NextResponse.json(
        { error: "Missing cart owner." },
        { status: 400 }
      );
    }

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
