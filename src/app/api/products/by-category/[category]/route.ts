import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";

export async function GET(
  req: Request,
  context: { params: Promise<{ category: string }> }
) {
  try {
    await connectDB();

    const { category } = await context.params;

    // Convert URL slug → real category format
    const formattedCategory = category
      .replace(/-/g, " ")               // sports-nutrition → sports nutrition
      .replace(/\b\w/g, (c) => c.toUpperCase()); // capitalize each word

    console.log("Filtering category:", formattedCategory);

    const products = await Product.find({
      category: formattedCategory,
    }).lean();

    return NextResponse.json({ products }, { status: 200 });

  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
