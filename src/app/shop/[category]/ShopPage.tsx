"use client";

import "./shop.css";
import ProductCard from "@/components/ProductCard";
import type { ProductDTO } from "@/types/product";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { useEffect, useMemo, useRef, useState } from "react";

type FilterOption = { id: string; name: string; slug: string };
type CategoryResponse = {
  _id?: string;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
  image?: string | null;
};
type BrandResponse = { _id?: string; slug?: string | null; name?: string | null };

type ShopPageProps = {
  categorySlug: string;
  initialProducts: ProductDTO[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalProducts: number;
};

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

const normalizeOptions = (options: FilterOption[]) =>
  Array.from(
    new Map(options.map((option) => [option.slug, option])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

const PRODUCTS_PER_PAGE = 9;

const clampPriceValue = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export default function ShopPage({
  categorySlug,
  initialProducts,
  initialPage,
  initialTotalPages,
  initialTotalProducts,
}: ShopPageProps) {
  const initialCategoryFilter =
    categorySlug && categorySlug.trim().length
      ? [slugifyText(categorySlug)]
      : [];

  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [totalPages, setTotalPages] = useState(Math.max(initialTotalPages, 1));
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
  const [currentPage, setCurrentPage] = useState(Math.max(initialPage, 1));

  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategoryFilter);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [priceInput, setPriceInput] = useState(() => ({
    min: 0,
    max: 100000,
  }));
  const [priceRange, setPriceRange] = useState(() => ({
    min: 0,
    max: 100000,
  }));

  const [sortOption, setSortOption] = useState("default");
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const didBootstrap = useRef(false);

  const heroTitle = useMemo(() => {
    const active = selectedCategories[0] ?? categorySlug;
    return slugToLabel(active || "Shop").toUpperCase();
  }, [selectedCategories, categorySlug]);

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      setLoadingFilters(true);
      try {
        const [cr, br] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/brands"),
        ]);

        const categoryData = await cr.json();
        const brandData = await br.json();

        if (!active) return;

        const normalizedCategories = normalizeOptions(
          (Array.isArray(categoryData?.categories)
            ? categoryData.categories
            : []
          ).map((cat: CategoryResponse) => {
            const fallback = cat.name || cat.title || "Category";
            const name =
              typeof fallback === "string" && fallback.trim().length
                ? fallback.trim()
                : "Category";
            const slug = slugifyText(cat.slug || name);

            return {
              id: cat._id ?? slug ?? name,
              name,
              slug,
            };
          })
        );

        const normalizedBrands = normalizeOptions(
          (Array.isArray(brandData?.brands) ? brandData.brands : []).map(
            (brand: BrandResponse) => {
              const fallback = brand.name || brand.slug || "Brand";
              const name =
                typeof fallback === "string" && fallback.trim().length
                  ? fallback.trim()
                  : "Brand";
              const slug = slugifyText(brand.slug || name);

              return {
                id: brand._id ?? slug ?? name,
                name,
                slug,
              };
            }
          )
        );

        setCategoryOptions(normalizedCategories);
        setBrandOptions(normalizedBrands);
      } catch (err) {
        if (active) {
          console.error("Failed to load filters", err);
          setCategoryOptions([]);
          setBrandOptions([]);
        }
      } finally {
        if (active) setLoadingFilters(false);
      }
    }

    loadFilters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!didBootstrap.current) {
      didBootstrap.current = true;
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      setLoadingProducts(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        selectedCategories.forEach((slug) => params.append("category", slug));
        selectedBrands.forEach((slug) => params.append("brand", slug));
        params.set("min", String(priceRange.min));
        params.set("max", String(priceRange.max));
        params.set("page", String(currentPage));
        params.set("limit", String(PRODUCTS_PER_PAGE));

        if (sortOption !== "default") {
          params.set("sort", sortOption);
        }

        const res = await fetch(
          `/api/products/filter?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();

        if (controller.signal.aborted) return;

        const safeProducts = Array.isArray(data.products) ? data.products : [];
        const safeTotalPages = Math.max(data.totalPages ?? 1, 1);
        const safeTotalProducts =
          typeof data.totalProducts === "number"
            ? data.totalProducts
            : safeProducts.length;

        setProducts(safeProducts);
        setTotalPages(safeTotalPages);
        setTotalProducts(safeTotalProducts);
        setCurrentPage((prev) => {
          const requested = data.currentPage ?? prev;
          const safePage = Math.min(
            Math.max(requested, 1),
            safeTotalPages || 1
          );
          return prev === safePage ? prev : safePage;
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Filter load error", err);
        setError("Unable to load products right now.");
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProducts(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [
    selectedCategories,
    selectedBrands,
    priceRange.min,
    priceRange.max,
    sortOption,
    currentPage,
  ]);

  const pageWindow = buildPageWindow(currentPage, totalPages);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((value) => value !== slug)
        : [...prev, slug];
      return next;
    });
    setCurrentPage(1);
  };

  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((value) => value !== slug)
        : [...prev, slug];
      return next;
    });
    setCurrentPage(1);
  };

  const updatePriceInput = (key: "min" | "max", value: number) => {
    setPriceInput((prev) => ({
      ...prev,
      [key]: clampPriceValue(value),
    }));
  };

  const applyPriceFilter = () => {
    const min = clampPriceValue(Math.min(priceInput.min, priceInput.max));
    const max = clampPriceValue(Math.max(min, priceInput.max));
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  return (
    <>
      <div className="shop-hero">
        <h1>{heroTitle}</h1>
      </div>

      <div className="shop-container">
        <aside className="sidebar-card">
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
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}

            <hr className="divider" />
          </div>

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
                    updatePriceInput("min", Number(e.target.value))
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
                    updatePriceInput("max", Number(e.target.value))
                  }
                />
              </label>
            </div>

            <button className="filter-btn" onClick={applyPriceFilter}>
              Apply Price
            </button>

            <hr className="divider" />
          </div>

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
                      onChange={() => toggleBrand(brand.slug)}
                    />
                    {brand.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

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

            <div className="sort-bar">
              <span className="sort-label">Sort by:</span>

              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
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
                slug={product.slug ?? product._id}
              />
            ))}
          </div>

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
