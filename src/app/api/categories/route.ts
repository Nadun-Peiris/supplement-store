import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().lean();

    const formatted = categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.title,                // 👈 FIXED (from title → name)
      slug: cat.slug,                 // correct field
      image: cat.image,
    }));

    return NextResponse.json({ categories: formatted });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { message: "Failed to load categories" },
      { status: 500 }
    );
  }
}
