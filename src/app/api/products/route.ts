import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
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
