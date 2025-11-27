import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({})
      .sort({ title: 1 }) // sort by title because name does not exist
      .lean();

    return NextResponse.json({
      categories: categories.map((cat) => ({
        _id: cat._id,
        name: cat.title,     // FIX: map title → name
        slug: cat.slug,
        image: cat.image,
      })),
    });
  } catch (error) {
    console.error("CATEGORIES API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}
