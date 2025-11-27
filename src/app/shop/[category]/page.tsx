import ShopPage from "./ShopPage";
import { headers } from "next/headers";

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host")!;
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function ShopIndexPage() {
  const base = await getBaseUrl();

  const query = new URLSearchParams({
    page: "1",
    limit: "9",
  });

  const res = await fetch(`${base}/api/products/filter?${query.toString()}`, {
    cache: "no-store",
  });

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
