"use client";

import { Check, ChevronDown } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { ProductDTO } from "@/types/product";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import FilterDrawer from "./components/FilterDrawer";
import FilterSidebar, { type FilterOption } from "./components/FilterSidebar";

type CategoryResponse = {
  _id?: string;
  slug?: string | null;
  name?: string | null;
  title?: string | null;
};

type BrandResponse = {
  _id?: string;
  slug?: string | null;
  name?: string | null;
};

type ShopPageProps = {
  pageTitle?: string;
  initialCategoryFilters?: string[];
  initialBrandFilters?: string[];
  initialSearchTerm?: string;
  initialProducts: ProductDTO[];
  initialPage: number;
  initialTotalPages: number;
  initialTotalProducts: number;
};

const PRODUCTS_PER_PAGE = 9;
const DEFAULT_PRICE_RANGE = { min: 0, max: 100000 };
const SORT_OPTIONS = [
  { value: "default", label: "Default sorting" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "newest", label: "Newest First" },
] as const;

const slugifyText = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const slugToLabel = (slug: string) => {
  if (!slug) return "Shop";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
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
  Array.from(new Map(options.map((option) => [option.slug, option])).values()).sort(
    (left, right) => left.name.localeCompare(right.name)
  );

const clampPriceValue = (value: number) =>
  Number.isFinite(value) ? Math.max(0, value) : 0;

export default function ShopPage({
  pageTitle,
  initialCategoryFilters = [],
  initialBrandFilters = [],
  initialSearchTerm = "",
  initialProducts,
  initialPage,
  initialTotalPages,
  initialTotalProducts,
}: ShopPageProps) {
  const [products, setProducts] = useState<ProductDTO[]>(initialProducts);
  const [totalPages, setTotalPages] = useState(Math.max(initialTotalPages, 1));
  const [totalProducts, setTotalProducts] = useState(initialTotalProducts);
  const [currentPage, setCurrentPage] = useState(Math.max(initialPage, 1));
  const [categoryOptions, setCategoryOptions] = useState<FilterOption[]>([]);
  const [brandOptions, setBrandOptions] = useState<FilterOption[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategoryFilters.map(slugifyText)
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    initialBrandFilters.map(slugifyText)
  );
  const [searchTerm] = useState(initialSearchTerm.trim());
  const [priceInput, setPriceInput] = useState(DEFAULT_PRICE_RANGE);
  const [priceRange, setPriceRange] = useState(DEFAULT_PRICE_RANGE);
  const [sortOption, setSortOption] = useState("default");
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didBootstrap = useRef(false);

  const heroTitle = useMemo(() => {
    const fixedTitle = pageTitle?.trim();
    if (fixedTitle) return slugToLabel(fixedTitle).toUpperCase();
    return slugToLabel(selectedCategories[0] || "Shop").toUpperCase();
  }, [pageTitle, selectedCategories]);

  const activeFilterCount = useMemo(() => {
    const hasPriceFilter =
      priceRange.min > DEFAULT_PRICE_RANGE.min ||
      priceRange.max < DEFAULT_PRICE_RANGE.max;

    return (
      selectedCategories.length +
      selectedBrands.length +
      (hasPriceFilter ? 1 : 0)
    );
  }, [priceRange.max, priceRange.min, selectedBrands.length, selectedCategories.length]);

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      setLoadingFilters(true);

      try {
        const [categoriesResponse, brandsResponse] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/brands"),
        ]);
        const categoryData = await categoriesResponse.json();
        const brandData = await brandsResponse.json();
        if (!active) return;

        setCategoryOptions(
          normalizeOptions(
            (Array.isArray(categoryData?.categories) ? categoryData.categories : []).map(
              (category: CategoryResponse) => {
                const fallback = category.name || category.title || "Category";
                const name =
                  typeof fallback === "string" && fallback.trim().length
                    ? fallback.trim()
                    : "Category";
                const slug = slugifyText(category.slug || name);

                return { id: category._id ?? slug, name, slug };
              }
            )
          )
        );

        setBrandOptions(
          normalizeOptions(
            (Array.isArray(brandData?.brands) ? brandData.brands : []).map(
              (brand: BrandResponse) => {
                const fallback = brand.name || brand.slug || "Brand";
                const name =
                  typeof fallback === "string" && fallback.trim().length
                    ? fallback.trim()
                    : "Brand";
                const slug = slugifyText(brand.slug || name);

                return { id: brand._id ?? slug, name, slug };
              }
            )
          )
        );
      } catch {
        if (!active) return;
        setCategoryOptions([]);
        setBrandOptions([]);
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
        if (searchTerm) params.set("search", searchTerm);
        if (sortOption !== "default") params.set("sort", sortOption);

        const response = await fetch(`/api/products/filter?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data = await response.json();
        if (controller.signal.aborted) return;

        const safeProducts = Array.isArray(data.products) ? data.products : [];
        const safeTotalPages = Math.max(data.totalPages ?? 1, 1);

        setProducts(safeProducts);
        setTotalPages(safeTotalPages);
        setTotalProducts(
          typeof data.totalProducts === "number"
            ? data.totalProducts
            : safeProducts.length
        );
        setCurrentPage((prev) => {
          const safePage = Math.min(
            Math.max(data.currentPage ?? prev, 1),
            safeTotalPages
          );
          return prev === safePage ? prev : safePage;
        });
      } catch {
        if (controller.signal.aborted) return;
        setError("Unable to load products right now.");
        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (!controller.signal.aborted) setLoadingProducts(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [
    currentPage,
    priceRange.max,
    priceRange.min,
    searchTerm,
    selectedBrands,
    selectedCategories,
    sortOption,
  ]);

  const pageWindow = buildPageWindow(currentPage, totalPages);

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((value) => value !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((value) => value !== slug) : [...prev, slug]
    );
    setCurrentPage(1);
  };

  const applyPriceFilter = () => {
    const min = clampPriceValue(Math.min(priceInput.min, priceInput.max));
    const max = clampPriceValue(Math.max(min, priceInput.max));
    setPriceRange({ min, max });
    setCurrentPage(1);
  };

  const handlePriceInputChange = (field: "min" | "max", value: number) => {
    setPriceInput((prev) => ({
      ...prev,
      [field]: clampPriceValue(value),
    }));
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    setCurrentPage(1);
  };

  return (
    <>
      <FilterDrawer
        activeFilterCount={activeFilterCount}
        categoryOptions={categoryOptions}
        brandOptions={brandOptions}
        selectedCategories={selectedCategories}
        selectedBrands={selectedBrands}
        priceInput={priceInput}
        loadingFilters={loadingFilters}
        onToggleCategory={toggleCategory}
        onToggleBrand={toggleBrand}
        onPriceInputChange={handlePriceInputChange}
        onApplyPrice={applyPriceFilter}
        sortControl={
          <div>
            <h3 className="mb-4 text-[0.85rem] font-black uppercase tracking-[0.1em] text-[#111]">
              Sort Products
            </h3>
            <SortDropdown
              value={sortOption}
              onChange={handleSortChange}
              buttonClassName="w-full rounded-[12px] border border-[#d4d7e1] bg-white px-4 py-3 text-[0.95rem] font-semibold text-[#111] hover:border-[#03c7fe]"
              menuClassName="mt-2 w-full rounded-[16px] border border-[#dfe3ea] bg-white p-2 shadow-[0_18px_50px_rgba(17,17,17,0.14)]"
            />
            <hr className="mt-5 border-0 border-t border-[#ededed]" />
          </div>
        }
      />

      <div className="mb-6 w-full rounded-[25px] bg-[#f5f5f5] px-4 py-16 text-center md:mb-6 md:py-[4rem]">
        <h1 className="m-0 text-[2.1rem] font-black md:text-[3rem]">{heroTitle}</h1>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 px-4 pb-8 md:grid-cols-[1.2fr_2.8fr] md:px-8 md:pb-12 xl:grid-cols-[1fr_3fr] xl:px-16 xl:pb-16">
        <FilterSidebar
          categoryOptions={categoryOptions}
          brandOptions={brandOptions}
          selectedCategories={selectedCategories}
          selectedBrands={selectedBrands}
          priceInput={priceInput}
          loadingFilters={loadingFilters}
          onToggleCategory={toggleCategory}
          onToggleBrand={toggleBrand}
          onPriceInputChange={handlePriceInputChange}
          onApplyPrice={applyPriceFilter}
        />

        <main className="order-1 w-full md:order-2">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 max-[900px]:flex-col max-[900px]:items-start">
            <div className="flex items-center gap-3 text-[0.95rem] font-semibold text-[#333]">
              {error ? (
                <span className="font-bold text-red-600">{error}</span>
              ) : (
                <span>
                  Showing {products.length} of {totalProducts} products
                  {searchTerm ? ` for "${searchTerm}"` : ""}
                </span>
              )}
              {loadingProducts && <span className="text-[#03c7fe]">Loading…</span>}
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <span className="text-[1rem] font-semibold text-[#333]">Sort by:</span>
              <SortDropdown
                value={sortOption}
                onChange={handleSortChange}
                buttonClassName="min-w-[250px] rounded-full border border-[#d4d7e1] bg-white px-5 py-[0.65rem] text-[0.95rem] font-semibold text-[#111] hover:border-[#03c7fe]"
                menuClassName="right-0 mt-3 min-w-[250px] rounded-[20px] border border-[#dfe3ea] bg-white p-2 shadow-[0_18px_50px_rgba(17,17,17,0.14)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                category={product.category}
                price={product.price}
                discountPrice={product.discountPrice}
                stock={product.stock}
                image={product.image}
                slug={product.slug ?? product._id}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex flex-wrap justify-center gap-[10px]">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="cursor-pointer rounded-[10px] border border-[#ddd] bg-white px-6 py-3 text-[0.9rem] font-semibold transition-colors duration-200 hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Prev
              </button>

              {pageWindow.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`cursor-pointer rounded-[10px] border px-6 py-3 text-[0.9rem] font-semibold transition-colors duration-200 ${
                    page === currentPage
                      ? "border-[#03c7fe] bg-[#111] text-white"
                      : "border-[#ddd] bg-white hover:bg-[#f1f1f1]"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="cursor-pointer rounded-[10px] border border-[#ddd] bg-white px-6 py-3 text-[0.9rem] font-semibold transition-colors duration-200 hover:bg-[#f1f1f1] disabled:cursor-not-allowed disabled:opacity-40"
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

type SortDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  buttonClassName: string;
  menuClassName: string;
};

function SortDropdown({
  value,
  onChange,
  buttonClassName,
  menuClassName,
}: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const activeLabel =
    SORT_OPTIONS.find((option) => option.value === value)?.label ?? SORT_OPTIONS[0].label;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={`flex items-center justify-between gap-4 transition-colors duration-200 focus:border-[#03c7fe] focus:outline-none ${buttonClassName}`}
      >
        <span>{activeLabel}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-[#03c7fe] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sort products"
          className={`absolute z-30 overflow-hidden ${menuClassName}`}
        >
          {SORT_OPTIONS.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-[14px] px-4 py-3 text-left text-[0.92rem] font-semibold transition-colors duration-150 ${
                  selected
                    ? "bg-[#111] text-white"
                    : "text-[#1c1c1c] hover:bg-[#f3f8fb]"
                }`}
              >
                <span>{option.label}</span>
                <Check
                  size={16}
                  className={selected ? "opacity-100" : "opacity-0"}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
