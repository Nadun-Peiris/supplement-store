import ShopPage from "../../[category]/ShopPage";
import { connectDB } from "@/lib/mongoose";
import Product from "@/models/Product";
import { buildBrandFilter, combineFilters } from "@/lib/productFilters";
import { normalizeProduct } from "@/lib/products";
import type { ProductDTO } from "@/types/product";

type LeanProduct = Parameters<typeof normalizeProduct>[0];

type ShopBrandPageProps = {
  params: Promise<{ brand: string }>;
};

export default async function ShopBrandPage({ params }: ShopBrandPageProps) {
  const { brand } = await params;
  const brandSlug = decodeURIComponent(brand);

  await connectDB();

  const page = 1;
  const limit = 9;
  const filter = combineFilters(buildBrandFilter([brandSlug]));

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

  return (
    <ShopPage
      categorySlug=""
      initialBrandFilters={[brandSlug]}
      initialProducts={plainProducts}
      initialPage={totalProducts ? Math.min(page, totalPages || 1) : 1}
      initialTotalPages={totalPages}
      initialTotalProducts={totalProducts}
    />
  );
}
