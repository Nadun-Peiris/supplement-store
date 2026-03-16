import ShopPage from "./[category]/ShopPage";
import { getFilteredProducts } from "@/lib/products";
import { buildBrandFilter, combineFilters, parseListParam } from "@/lib/productFilters";

export const dynamic = "force-dynamic";

type ShopIndexPageProps = {
  searchParams: Promise<{ brand?: string | string[]; search?: string | string[] }>;
};

export default async function ShopIndexPage({ searchParams }: ShopIndexPageProps) {
  const { brand, search } = await searchParams;
  const brandFilters = parseListParam(brand ?? null);
  const searchTerm = Array.isArray(search) ? search[0] ?? "" : search ?? "";
  const filter = combineFilters(buildBrandFilter(brandFilters));
  const data = await getFilteredProducts(filter, {
    search: searchTerm,
    page: 1,
    limit: 9,
    sort: "default",
  });

  return (
    <ShopPage
      categorySlug=""
      initialBrandFilters={brandFilters}
      initialSearchTerm={searchTerm}
      initialProducts={data.products}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
