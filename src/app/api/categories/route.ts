import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Category from "@/models/Category";
import type { Types } from "mongoose";
import slugify from "slugify";

type CategoryLean = {
  _id: Types.ObjectId;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  image?: string | null;
};

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find().lean<CategoryLean>();

    const formatted = categories.map((cat) => {
      const name = cat.name ?? cat.title ?? "Category";
      const slug =
        cat.slug ?? slugify(name, { lower: true, strict: true }) ?? "category";

      return {
        id: cat._id.toString(),
        name,
        slug,
        image: cat.image ?? "",
      };
    });

    return NextResponse.json({ categories: formatted });
  } catch (error) {
    console.error("Category API error:", error);
    return NextResponse.json(
      { message: "Failed to load categories" },
      { status: 500 }
    );
  }
}
