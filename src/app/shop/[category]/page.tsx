import type { ProductDTO } from "@/types/product";
import { headers } from "next/headers";
import ShopPage from "./ShopPage";
import "./shop.css";

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return null;
};

type FilterResponse = {
  products?: ProductDTO[];
  currentPage?: number;
  totalPages?: number;
  totalProducts?: number;
};

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;
  let base = resolveBaseUrl();

  if (!base) {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host");
    const proto = hdrs.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
    if (host) {
      base = `${proto}://${host}`;
    } else {
      const port = process.env.PORT ?? "3000";
      base = `http://127.0.0.1:${port}`;
    }
  }
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
