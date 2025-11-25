import ShopPage from "./ShopPage";

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;   // ← FIX: unwrap params

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${base}/api/products/by-category/${category}`, {
    cache: "no-store",
  });

  const data = await res.json();

  return <ShopPage category={category} products={data.products || []} />;
}
