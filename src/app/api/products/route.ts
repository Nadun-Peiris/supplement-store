import { NextResponse } from "next/server";
import { getProducts, normalizeProduct } from "@/lib/products";
import Product from "@/models/Product";
import { connectDB } from "@/lib/mongoose";
import {
  buildBrandFilter,
  buildCategoryFilter,
  buildPriceFilter,
  combineFilters,
  parseListParam,
  parseNumberParam,
} from "@/lib/productFilters";
import { normalizeProductWritePayload } from "@/lib/productWrite";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categories = parseListParam(searchParams.getAll("category"));
    const brands = parseListParam(searchParams.getAll("brand"));
    const minPrice = parseNumberParam(searchParams.get("min"));
    const maxPrice = parseNumberParam(searchParams.get("max"));
    const limitParam = parseInt(searchParams.get("limit") || "0", 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : undefined;

    const filter = combineFilters(
      buildCategoryFilter(categories),
      buildBrandFilter(brands),
      buildPriceFilter(minPrice, maxPrice)
    );

    const products = await getProducts(filter, limit);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const payload = normalizeProductWritePayload(body);

    if (!payload.name || !payload.category || typeof payload.price !== "number" || !payload.image) {
      return NextResponse.json(
        { error: "Name, category, price, and image are required" },
        { status: 400 }
      );
    }

    const product = await Product.create({
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
    });

    return NextResponse.json(
      { product: normalizeProduct(product.toObject()) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
