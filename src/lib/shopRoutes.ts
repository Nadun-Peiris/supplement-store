export function getShopCategoryHref(categorySlug?: string | null) {
  const slug = (categorySlug ?? "").trim();
  return slug ? `/shop/category/${encodeURIComponent(slug)}` : "/shop";
}

export function getShopBrandHref(brandSlug?: string | null) {
  const slug = (brandSlug ?? "").trim();
  return slug ? `/shop/brand/${encodeURIComponent(slug)}` : "/shop";
}
