import ShopPage from "./ShopPage";
import { absoluteUrl } from "@/lib/absoluteUrl";

type ShopCategoryPageProps = {
  params: { category: string };
};

export default async function ShopCategoryPage({
  params,
}: ShopCategoryPageProps) {
  const categorySlug = params.category;

  const query = new URLSearchParams({
    page: "1",
    limit: "9",
  });

  if (categorySlug) {
    query.append("category", categorySlug);
  }

  const res = await fetch(
    absoluteUrl(`/api/products/filter?${query.toString()}`),
    { cache: "no-store" }
  );

  if (!res.ok) {
    console.error("Failed to load products", await res.text());
  }

  const data = await res.json();

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
