import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import FeaturedCategory from "@/models/FeaturedCategory";
import Category from "@/models/Category";

type PopulatedCategory = {
  _id: string;
  name?: string;
  title?: string;
  slug?: string;
  image?: string;
};

type FeaturedCategoryRecord = {
  _id: string;
  index: number;
  categoryId?: PopulatedCategory | null;
};

export async function GET() {
  try {
    await connectDB();

    const items = (await FeaturedCategory.find()
      .sort({ index: 1 })
      .populate({
        path: "categoryId",
        model: Category,
        select: "name title slug image",
      })
      .lean()) as unknown as FeaturedCategoryRecord[];

    const formatted = items
      .filter(
        (
          item
        ): item is FeaturedCategoryRecord & { categoryId: PopulatedCategory } =>
          Boolean(item.categoryId)
      )
      .map((item) => {
        const category = item.categoryId;
        const displayName =
          (category.name || category.title || "").trim() ||
          category.slug ||
          "Category";

        return {
          _id: item._id,
          index: item.index,
          categoryId: category._id,
          category: {
            _id: category._id,
            name: displayName,
            slug: category.slug,
            image: category.image,
          },
        };
      });

    return NextResponse.json({ items: formatted });
  } catch (err) {
    console.error("FEATURED CATEGORY GET (WEBSITE) ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
