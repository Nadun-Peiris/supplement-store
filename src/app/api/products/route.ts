import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "0");

    const query = category ? { category } : {};
    const products = await getProducts(query, limit || undefined);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
