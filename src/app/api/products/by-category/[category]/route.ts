import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { buildCategoryFilter } from "@/lib/productFilters";

export async function GET(
  req: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {
    await connectDB();

    const { category } = await context.params;
    const categoryFilter = buildCategoryFilter([category]) ?? {};
    const products = await Product.find(categoryFilter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ products }, { status: 200 });

  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
