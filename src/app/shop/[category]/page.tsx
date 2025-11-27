import type { ProductDTO } from "@/types/product";
import ShopPage from "./ShopPage";
import "./shop.css";

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
};

type FilterResponse = {
  products?: ProductDTO[];
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
};

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;
  const base = resolveBaseUrl();
  const query = new URLSearchParams({
    category,
    page: "1",
    limit: "9",
  });

  let data: FilterResponse = {};

  try {
    const res = await fetch(`${base}/api/products/filter?${query.toString()}`, {
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      throw new Error(`Unexpected response ${res.status} ${res.statusText}`);
    }

    data = await res.json();
  } catch (error) {
    console.error("Shop page preload failed:", error);
  }

  return (
    <ShopPage
      categorySlug={category}
      initialProducts={Array.isArray(data.products) ? data.products : []}
      initialPage={data.currentPage ?? 1}
      initialTotalPages={data.totalPages ?? 1}
      initialTotalProducts={data.totalProducts ?? 0}
    />
  );
}
