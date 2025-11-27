import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import {
  buildBrandFilter,
  buildCategoryFilter,
  buildPriceFilter,
  combineFilters,
  parseListParam,
  parseNumberParam,
} from "@/lib/productFilters";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const categories = parseListParam(searchParams.getAll("category"));
    const brands = parseListParam(searchParams.getAll("brand"));
    const minPrice = parseNumberParam(searchParams.get("min"));
    const maxPrice = parseNumberParam(searchParams.get("max"));
    const sort = searchParams.get("sort") || "default"; // <-- NEW

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "9", 10), 1),
      60
    );

    const skip = (page - 1) * limit;

    // ------------------------------
    // 🔵 BUILD FILTER OBJECT
    // ------------------------------
    const filter = combineFilters(
      buildCategoryFilter(categories),
      buildBrandFilter(brands),
      buildPriceFilter(minPrice, maxPrice)
    );

    // ------------------------------
    // 🔵 BUILD SORT OBJECT (WooCommerce style)
    // ------------------------------
    let sortQuery: any = {};

    switch (sort) {
      case "price-asc":
        sortQuery.price = 1;
        break;
      case "price-desc":
        sortQuery.price = -1;
        break;
      case "name-asc":
        sortQuery.name = 1;
        break;
      case "name-desc":
        sortQuery.name = -1;
        break;
      case "newest":
        sortQuery.createdAt = -1;
        break;
      default:
        // Your current default: newest first
        sortQuery.createdAt = -1;
        break;
    }

    // ------------------------------
    // 🔵 QUERY DB
    // ------------------------------
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(filter),

      Product.find(filter)
        .sort(sortQuery) // <-- SORT ADDED
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = totalProducts ? Math.ceil(totalProducts / limit) : 0;

    return NextResponse.json({
      products,
      totalProducts,
      totalPages,
      currentPage: totalProducts ? Math.min(page, totalPages || 1) : 1,
    });
  } catch (error) {
    console.error("FILTER API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to filter products" },
      { status: 500 }
    );
  }
}
