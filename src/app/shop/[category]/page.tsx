import ShopPage from "./ShopPage";
import { absoluteUrl } from "@/lib/absoluteUrl";

export default async function ShopIndexPage() {
  const query = new URLSearchParams({
    page: "1",
    limit: "9",
  });

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
      categorySlug=""
      initialProducts={Array.isArray(data.products) ? data.products : []}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
