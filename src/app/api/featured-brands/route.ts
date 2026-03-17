import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Brand from "@/models/Brand";
import FeaturedBrand from "@/models/FeaturedBrand";

type PopulatedFeaturedBrand = {
  _id: string;
  index: number;
  brandId?: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  } | null;
};

export async function GET() {
  try {
    await connectDB();

    const items = await FeaturedBrand.find()
      .sort({ index: 1, createdAt: 1 })
      .limit(6)
      .populate({
        path: "brandId",
        model: Brand,
        select: "name slug image",
      })
      .lean<PopulatedFeaturedBrand[]>();

    const brands = items
      .filter((item) => item.brandId)
      .map((item) => {
        const brand = item.brandId!;

        return {
          _id: item._id,
          index: item.index,
          brandId: brand._id,
          brand: {
            _id: brand._id,
            name: brand.name,
            slug: brand.slug,
            image: brand.image,
          },
        };
      });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("FEATURED BRAND GET ERROR", error);
    return NextResponse.json(
      { error: "Failed to load featured brands" },
      { status: 500 }
    );
  }
}
