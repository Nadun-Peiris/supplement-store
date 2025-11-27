import ShopPage from "./ShopPage";

export default async function Page(props: { params: Promise<{ category: string }> }) {
  const { category } = await props.params;

  // --- SAFE FETCH FOR SERVER & VERCEL ---
  // Always use RELATIVE API ROUTE (no localhost!)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/products/by-category/${category}`,
    { cache: "no-store" }
  );

  const data = await res.json();

  return (
    <ShopPage
      categorySlug={category}
      initialProducts={data.products || []}
      initialPage={data.currentPage || 1}
      initialTotalPages={data.totalPages || 1}
      initialTotalProducts={data.totalProducts || 0}
    />
  );
}
