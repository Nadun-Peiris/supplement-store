import ShopPage from "@/app/shop/ShopPage";
import { getFilteredProducts } from "@/lib/products";
import { buildBrandFilter, combineFilters } from "@/lib/productFilters";

type ShopBrandPageProps = {
  params: Promise<{ brand: string }>;
};

export default async function ShopBrandPage({ params }: ShopBrandPageProps) {
  const { brand } = await params;
  const brandSlug = decodeURIComponent(brand);

  const filter = combineFilters(buildBrandFilter([brandSlug]));
  const data = await getFilteredProducts(filter, {
    page: 1,
    limit: 9,
    sort: "default",
  });

  return (
    <ShopPage
      pageTitle={brandSlug}
      initialCategoryFilters={[]}
      initialBrandFilters={[brandSlug]}
      initialSearchTerm=""
      initialProducts={data.products}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
