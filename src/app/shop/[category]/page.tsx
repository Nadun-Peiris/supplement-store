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
  const incomingHeaders = await headers();
  let base = resolveBaseUrl();

  if (!base) {
    const host =
      incomingHeaders.get("x-forwarded-host") ?? incomingHeaders.get("host") ?? "";
    const proto =
      incomingHeaders.get("x-forwarded-proto") ??
      (host.startsWith("localhost") ? "http" : "https");
    if (host) {
      base = `${proto}://${host}`;
    }
  }
  const query = new URLSearchParams({
    category,
    page: "1",
    limit: "9",
  });

  let data: FilterResponse = {};
  const requestHeaders: Record<string, string> = {};
  const authCookie = incomingHeaders.get("cookie");
  if (authCookie) requestHeaders.cookie = authCookie;
  const authHeader = incomingHeaders.get("authorization");
  if (authHeader) requestHeaders.authorization = authHeader;
  const protectionBypass = incomingHeaders.get("x-vercel-protection-bypass");
  if (protectionBypass) {
    requestHeaders["x-vercel-protection-bypass"] = protectionBypass;
  }

  const fetchFromApi = async () => {
    const url = base
      ? `${base}/api/products/filter?${query.toString()}`
      : `/api/products/filter?${query.toString()}`;

    const res = await fetch(url, {
      cache: "no-store",
      headers: requestHeaders,
    });

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.includes("application/json")) {
      throw new Error(`Unexpected response ${res.status} ${res.statusText}`);
    }

    data = await res.json();
  };

  try {
    await fetchFromApi();
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
