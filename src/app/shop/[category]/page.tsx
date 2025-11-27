import ShopPage from "./ShopPage";
import { headers } from "next/headers";

// MUST BE ASYNC NOW
async function getBaseUrl() {
  const h = await headers(); // ← FIXED
  const host = h.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function ShopIndexPage() {
  const base = await getBaseUrl(); // ← FIXED (await)
  
  const query = new URLSearchParams({
    page: "1",
    limit: "9",
  });

  const url = `${base}/api/products/filter?${query.toString()}`;

  const res = await fetch(url, {
    cache: "no-store",
  });

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
