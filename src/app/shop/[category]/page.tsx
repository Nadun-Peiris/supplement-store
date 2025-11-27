import ShopPage from "./ShopPage";
import "./shop.css";

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
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
