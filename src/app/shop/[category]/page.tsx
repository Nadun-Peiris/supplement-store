import ShopPage from "./ShopPage";
import {
  buildBrandFilter,
  buildCategoryFilter,
  buildPriceFilter,
  combineFilters,
} from "@/lib/productFilters";
import { getFilteredProducts } from "@/lib/products";

type ShopCategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ search?: string | string[] }>;
};

export default async function ShopCategoryPage({
  params,
  searchParams,
}: ShopCategoryPageProps) {
  const { category } = await params;
  const { search } = await searchParams;
  const categorySlug = category;
  const searchTerm = Array.isArray(search) ? search[0] ?? "" : search ?? "";

  const filter = combineFilters(
    buildCategoryFilter(categorySlug ? [categorySlug] : []),
    buildBrandFilter([]),
    buildPriceFilter(undefined, undefined)
  );
  const data = await getFilteredProducts(filter, {
    search: searchTerm,
    page: 1,
    limit: 9,
    sort: "default",
  });

  return (
    <ShopPage
      categorySlug={categorySlug}
      initialBrandFilters={[]}
      initialSearchTerm={searchTerm}
      initialProducts={Array.isArray(data.products) ? data.products : []}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
