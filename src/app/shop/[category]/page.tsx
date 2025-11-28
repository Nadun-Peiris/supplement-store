import ShopPage from "./ShopPage";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import {
  buildBrandFilter,
  buildCategoryFilter,
  buildPriceFilter,
  combineFilters,
} from "@/lib/productFilters";
import { normalizeProduct } from "@/lib/products";
import type { ProductDTO } from "@/types/product";

type LeanProduct = Parameters<typeof normalizeProduct>[0];

type ShopCategoryPageProps = {
  params: Promise<{ category: string }>; // ✅ FIX: params is now a Promise
};

export default async function ShopCategoryPage({
  params,
}: ShopCategoryPageProps) {

  // ✅ FIX: Must await params (Next.js 16 requirement)
  const { category } = await params;
  const categorySlug = category;

  await connectDB();

  const page = 1;
  const limit = 9;

  const filter = combineFilters(
    buildCategoryFilter(categorySlug ? [categorySlug] : []),
    buildBrandFilter([]),
    buildPriceFilter(undefined, undefined)
  );

  const [totalProducts, products] = await Promise.all([
    Product.countDocuments(filter),
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanProduct[]>(),
  ]);

  const totalPages = totalProducts ? Math.ceil(totalProducts / limit) : 0;

  const plainProducts: ProductDTO[] = products.map(normalizeProduct);

  const data = {
    products: plainProducts,
    totalProducts,
    totalPages,
    currentPage: totalProducts ? Math.min(page, totalPages || 1) : 1,
  };

  return (
    <ShopPage
      categorySlug={categorySlug}
      initialProducts={Array.isArray(data.products) ? data.products : []}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
