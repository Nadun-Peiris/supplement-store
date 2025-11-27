import ShopPage from "./ShopPage";
import "./shop.css";

const resolveBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.BASE_URL) return process.env.BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;
  const base = resolveBaseUrl();
  const query = new URLSearchParams({
    category,
    page: "1",
    limit: "9",
  });

  const res = await fetch(`${base}/api/products/filter?${query.toString()}`, {
    cache: "no-store",
  });

  const data = await res.json();

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
