"use client";
import ProductCard from "@/components/ProductCard";
import type { ProductDTO } from "@/types/product";
import { useEffect, useMemo, useRef, useState } from "react";

type FilterOption = { id: string; name: string; slug: string };
type CategoryResponse = { _id?: string; slug?: string; name?: string | null };
type BrandResponse = { _id?: string; slug?: string; name?: string | null };

type ShopPageProps = {
  categorySlug: string;
  initialProducts: ProductDTO[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalProducts: number;
};

// Helpers
const slugifyText = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugToLabel = (slug: string) => {
  if (!slug) return "Shop";
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const buildPageWindow = (page: number, pages: number) => {
  if (pages <= 1) return [];
  const maxButtons = 5;

  if (pages <= maxButtons) {
    return Array.from({ length: pages }, (_, i) => i + 1);
  }

  let start = Math.max(1, page - 2);
  const end = Math.min(pages, start + maxButtons - 1);

  if (end - start < maxButtons - 1) {
    start = Math.max(1, end - maxButtons + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

// Skeleton loader
function SkeletonList({ count = 10 }: { count?: number }) {
  return (
    <ul className="sidebar-list">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="skeleton-item">
          <div className="skeleton skeleton-checkbox" />
          <div className="skeleton skeleton-line" style={{ width: "70%" }} />
        </li>
      ))}
    </ul>
  );
}

export default function ShopPage({
  categorySlug,
  initialProducts,
  initialPage,
  initialTotalPages,
  initialTotalProducts,
}: ShopPageProps) {
  const [products, setProducts] = useState(initialProducts);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categorySlug ? [categorySlug] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [priceInput, setPriceInput] = useState({ min: 0, max: 100000 });
  const [priceRange, setPriceRange] = useState(priceInput);

  const [sortOption, setSortOption] = useState("default");

  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const didBootstrap = useRef(false);

  const categoryKey = selectedCategories.join(",");
  const brandKey = selectedBrands.join(",");

  const heroTitle = useMemo(() => {
    const active = selectedCategories[0] ?? categorySlug;
    return slugToLabel(active || "Shop").toUpperCase();
  }, [selectedCategories, categorySlug]);

  // Load categories & brands
  useEffect(() => {
    async function loadFilters() {
      try {
        const [cr, br] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/brands"),
        ]);

        const categoryData = await cr.json();
        const brandData = await br.json();

        setCategoryOptions(
          categoryData?.categories?.map((cat: CategoryResponse) => ({
            id: cat._id ?? cat.slug ?? cat.name ?? slugifyText("category"),
            name: cat.name ?? "Category",
            slug: cat.slug ?? slugifyText(cat.name ?? ""),
          })) ?? []
        );

        setBrandOptions(
          brandData?.brands?.map((brand: BrandResponse) => ({
            id: brand._id ?? brand.slug ?? brand.name ?? slugifyText("brand"),
            name: brand.name ?? "Brand",
            slug: brand.slug ?? slugifyText(brand.name ?? ""),
          })) ?? []
        );
      } catch (err) {
        console.error("Failed to load filters", err);
      } finally {
        setLoadingFilters(false);
      }
    }
    loadFilters();
  }, []);

  // Load products when filters change
  useEffect(() => {
    if (!didBootstrap.current) {
      didBootstrap.current = true;
      return;
    }

    async function loadProducts() {
      setLoadingProducts(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (categoryKey) params.set("category", categoryKey);
        if (brandKey) params.set("brand", brandKey);
        params.set("min", String(priceRange.min));
        params.set("max", String(priceRange.max));
        params.set("page", String(currentPage));
        params.set("limit", "9");

        if (sortOption !== "default") params.set("sort", sortOption);

        const res = await fetch(`/api/products/filter?${params.toString()}`);

        if (!res.ok) throw new Error("Failed to load products");

        const data = await res.json();

        setProducts(data.products ?? []);
        setTotalPages(Math.max(data.totalPages ?? 1, 1));
        setTotalProducts(data.totalProducts ?? 0);
        setCurrentPage((p) => Math.min(p, data.totalPages ?? 1));
      } catch (err) {
        console.error("Filter load error", err);
        setError("Unable to load products right now.");
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, [
    categoryKey,
    brandKey,
    priceRange.min,
    priceRange.max,
    sortOption,
    currentPage,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryKey, brandKey, priceRange.min, priceRange.max, sortOption]);

  // 🔥 FIX: Add this line
  const pageWindow = buildPageWindow(currentPage, totalPages);

  return (
    <>
      {/* HERO */}
      <div className="shop-hero">
        <h1>{heroTitle}</h1>
      </div>

      <div className="shop-container">
        {/* SIDEBAR */}
        <aside className="sidebar-card">
          {/* Categories */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>PRODUCT CATEGORIES</h3>
            </div>

            {loadingFilters ? (
              <SkeletonList />
            ) : (
              <ul className="sidebar-list">
                {categoryOptions.map((cat) => (
                  <li key={cat.id}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(cat.slug)
                            ? prev.filter((c) => c !== cat.slug)
                            : [...prev, cat.slug]
                        )
                      }
                    />
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}

            <hr className="divider" />
          </div>

          {/* Price Filter */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>FILTER BY PRICE</h3>
            </div>

            <div className="price-inputs">
              <label>
                Min (LKR)
                <input
                  type="number"
                  min={0}
                  value={priceInput.min}
                  onChange={(e) =>
                    setPriceInput((p) => ({
                      ...p,
                      min: Math.max(0, Number(e.target.value)),
                    }))
                  }
                />
              </label>

              <label>
                Max (LKR)
                <input
                  type="number"
                  min={0}
                  value={priceInput.max}
                  onChange={(e) =>
                    setPriceInput((p) => ({
                      ...p,
                      max: Math.max(0, Number(e.target.value)),
                    }))
                  }
                />
              </label>
            </div>

            <button
              className="filter-btn"
              onClick={() => {
                const min = Math.max(
                  0,
                  Math.min(priceInput.min, priceInput.max)
                );
                const max = Math.max(min, priceInput.max);
                setPriceRange({ min, max });
              }}
            >
              Apply Price
            </button>

            <hr className="divider" />
          </div>

          {/* Brands */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>BRANDS</h3>
            </div>

            {loadingFilters ? (
              <SkeletonList />
            ) : (
              <ul className="sidebar-list">
                {brandOptions.map((brand) => (
                  <li key={brand.id}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand.slug)}
                      onChange={() =>
                        setSelectedBrands((prev) =>
                          prev.includes(brand.slug)
                            ? prev.filter((b) => b !== brand.slug)
                            : [...prev, brand.slug]
                        )
                      }
                    />
                    {brand.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* PRODUCTS */}
        <main className="shop-main">
          <div className="shop-toolbar">
            <div className="shop-status">
              {error ? (
                <span className="shop-error">{error}</span>
              ) : (
                <span>
                  Showing {products.length} of {totalProducts} products
                </span>
              )}

              {loadingProducts && (
                <span className="shop-loading">Loading…</span>
              )}
            </div>

            {/* Sort Bar */}
            <div className="sort-bar">
              <span className="sort-label">Sort by:</span>

              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="default">Default sorting</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="name-asc">Name: A → Z</option>
                <option value="name-desc">Name: Z → A</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                category={product.category}
                price={product.price}
                image={product.image}
                slug={product.slug}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((prev) => Math.max(1, prev - 1))
                }
              >
                ← Prev
              </button>

              {pageWindow.map((p) => (
                <button
                  key={p}
                  className={`page-btn ${
                    p === currentPage ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
              >
                Next →
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
