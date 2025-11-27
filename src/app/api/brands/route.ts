import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Brand from "@/models/Brand";
import Product from "@/models/Product";
import slugify from "slugify";

const slugOptions = { lower: true, strict: true, trim: true };
const toSlug = (value: string) => slugify(value, slugOptions);

export async function GET() {
  try {
    await connectDB();

    const brands = await Brand.find({}, { name: 1, slug: 1 })
      .sort({ name: 1 })
      .lean();

    if (brands.length) {
      return NextResponse.json({ brands });
    }

    const productBrands = await Product.find(
      { brandName: { $exists: true, $ne: "" } },
      { brandName: 1, brandSlug: 1 }
    ).lean();

    const fallback = Array.from(
      productBrands.reduce((acc, doc) => {
        const name = (doc.brandName || "").trim();
        if (!name) return acc;
        const slug = doc.brandSlug || toSlug(name);
        if (!slug || acc.has(slug)) return acc;
        acc.set(slug, { _id: slug, name, slug });
        return acc;
      }, new Map<string, { _id: string; name: string; slug: string }>())
    ).map(([, value]) => value);

    return NextResponse.json({ brands: fallback });
  } catch (error) {
    console.error("Brand API error:", error);
    return NextResponse.json(
      { error: "Failed to load brands" },
      { status: 500 }
    );
  }
}
