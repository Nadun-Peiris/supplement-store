import { NextRequest, NextResponse } from "next/server";
import { getProductBySlug } from "@/lib/products";

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
