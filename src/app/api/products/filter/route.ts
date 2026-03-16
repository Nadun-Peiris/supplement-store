import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import {
  buildBrandFilter,
  buildCategoryFilter,
  buildPriceFilter,
  combineFilters,
  parseListParam,
  parseNumberParam,
} from "@/lib/productFilters";
import { getFilteredProducts } from "@/lib/products";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const categories = parseListParam(searchParams.getAll("category"));
    const brands = parseListParam(searchParams.getAll("brand"));
    const minPrice = parseNumberParam(searchParams.get("min"));
    const maxPrice = parseNumberParam(searchParams.get("max"));
    const sort = searchParams.get("sort") || "default";
    const search = searchParams.get("search") || "";

    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "9", 10), 1),
      60
    );

    const filter = combineFilters(
      buildCategoryFilter(categories),
      buildBrandFilter(brands),
      buildPriceFilter(minPrice, maxPrice)
    );

    const data = await getFilteredProducts(filter, {
      search,
      page,
      limit,
      sort: sort as
        | "default"
        | "price-asc"
        | "price-desc"
        | "name-asc"
        | "name-desc"
        | "newest",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("FILTER API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to filter products" },
      { status: 500 }
    );
  }
}
