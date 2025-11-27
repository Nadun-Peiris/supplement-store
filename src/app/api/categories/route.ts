import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import slugify from "slugify";

const slugOptions = { lower: true, strict: true, trim: true };
const toSlug = (value: string) => slugify(value, slugOptions);

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find(
      {},
      { _id: 1, name: 1, title: 1, slug: 1, image: 1 }
    )
      .sort({ name: 1, title: 1 })
      .lean();

    return NextResponse.json({
      categories: categories.map((cat) => {
        const name = (cat.name || cat.title || "").trim() || "Category";
        const slug = cat.slug || toSlug(name);

        return {
          _id: cat._id,
          name,
          slug,
          image: cat.image || "",
        };
      }),
    });
  } catch (error) {
    console.error("CATEGORIES API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
