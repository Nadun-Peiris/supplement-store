"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { FaArrowRight } from "react-icons/fa";
import type { ProductDTO } from "@/types/product";

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ProductCarousel({ category }: { category: string }) {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const categorySlug = toSlug(category);
  const viewAllHref = categorySlug ? `/shop/${categorySlug}` : "/shop";

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams({
          limit: "10",
          page: "1",
          sort: "newest",
        });

        if (categorySlug) {
          params.append("category", categorySlug);
        }

        // ✅ FIXED: RELATIVE FETCH ONLY (works on Vercel)
        const res = await fetch(`/api/products/filter?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json();

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error("Product carousel load error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [categorySlug]);

  /* --------------------- LOADING SKELETON --------------------- */
  if (loading)
    return (
      <section className="w-full overflow-hidden bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-16">
        <div className="mb-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem]">
            {category.toUpperCase()}
          </h2>
          <div className="h-10 w-[100px] animate-pulse rounded-full bg-neutral-200 md:w-[120px]" />
        </div>

        <div className="relative mx-auto">
          <div className="grid grid-flow-col auto-cols-[85%] gap-6 overflow-hidden md:auto-cols-[70%] xl:auto-cols-[calc(25%-1.125rem)] pointer-events-none">
            {[1, 2, 3, 4].map((i) => (
              <div className="flex w-full flex-col gap-3" key={i}>
                <div className="aspect-[3/4] w-full animate-pulse rounded-[12px] bg-neutral-200" />
                <div className="flex flex-col items-center gap-2 px-2">
                  <div className="h-[14px] w-[80%] animate-pulse rounded-[6px] bg-neutral-200" />
                  <div className="h-[14px] w-[60%] animate-pulse rounded-[6px] bg-neutral-200" />
                  <div className="h-[14px] w-[40%] animate-pulse rounded-[6px] bg-neutral-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );

  /* --------------------- EMPTY --------------------- */
  if (!products.length)
    return (
      <section className="w-full overflow-hidden bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-16">
        <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem]">
          {category.toUpperCase()}
        </h2>
        <p className="mt-4 text-neutral-500">No products found.</p>
      </section>
    );

  /* --------------------- LOADED --------------------- */
  return (
    <section className="w-full overflow-hidden bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-16">
      <div className="mb-6 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem] leading-none">
          {category.toUpperCase()}
        </h2>

        <Link
          href={viewAllHref}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#525252] bg-[#262626] px-5 text-[0.9rem] font-semibold text-white no-underline transition-all duration-300 ease-in-out hover:border-[#15d1f5] hover:bg-[#111] hover:text-white md:w-auto"
        >
          View All <FaArrowRight />
        </Link>
      </div>

      <div className="relative mx-auto">
        <div className="grid grid-flow-col auto-cols-[85%] gap-6 overflow-x-auto scroll-smooth pr-6 md:pr-2 snap-x snap-proximity md:auto-cols-[70%] xl:auto-cols-[calc(25%-1.125rem)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {products.map((p) => (
            <div key={p._id} className="snap-center">
              <ProductCard
                id={p._id}
                name={p.name}
                category={p.category}
                price={p.price}
                discountPrice={p.discountPrice}
                image={p.image}
                slug={p.slug ?? p._id}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
