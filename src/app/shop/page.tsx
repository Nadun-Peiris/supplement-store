import type { ProductDTO } from "@/types/product";
import { headers } from "next/headers";
import ShopPage from "./[category]/ShopPage";

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

export default async function ShopIndexPage() {
  let base = resolveBaseUrl();

  if (!base) {
    const hdrs = await headers();
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host") ?? "";
    const proto = hdrs.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    if (host) {
      base = `${proto}://${host}`;
    }
  }

  const query = new URLSearchParams({
    page: "1",
    limit: "9",
  });

  let data: FilterResponse = {};

  try {
    const url = base
      ? `${base}/api/products/filter?${query.toString()}`
      : `/api/products/filter?${query.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      throw new Error(`Unexpected response ${res.status} ${res.statusText}`);
    }

    data = await res.json();
  } catch (error) {
    console.error("Shop index preload failed:", error);
  }

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
