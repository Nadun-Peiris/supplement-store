import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug, normalizeProduct } from "@/lib/products";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { normalizeProductWritePayload } from "@/lib/productWrite";

// ✔ Next.js App Router passes params as the *2nd argument*
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    console.log("Fetching product with slug:", slug);

    const product = await getProductBySlug(slug);

    if (!product) {
      console.log("No product found!");
      return NextResponse.json({ product: null }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Server error", product: null },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await context.params;
    const existing = await getProductBySlug(slug);

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const payload = normalizeProductWritePayload(body, existing);

    if (!payload.name || !payload.category || typeof payload.price !== "number" || !payload.image) {
      return NextResponse.json(
        { error: "Name, category, price, and image are required" },
        { status: 400 }
      );
    }

    const updated = await Product.findOneAndUpdate(
      { slug: existing.slug },
      {
        $set: {
          name: payload.name,
          slug: payload.slug,
          category: payload.category,
          categorySlug: payload.categorySlug,
          brandName: payload.brandName ?? "",
          brandSlug: payload.brandSlug,
          price: payload.price,
          discountPrice: payload.discountPrice,
          currency: payload.currency,
          image: payload.image,
          hoverImage: payload.hoverImage,
          gallery: payload.gallery,
          description: payload.description,
          details: payload.details ?? {},
          coa: payload.coa,
          isActive: payload.isActive,
          stock: payload.stock,
        },
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      { product: normalizeProduct(updated as never) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
