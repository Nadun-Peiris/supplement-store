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
      <section className="w-full bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-12">
        <div className="mb-6 flex flex-row items-center justify-between gap-3">
          <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem] leading-none">
            {category.toUpperCase()}
          </h2>
          <div className="h-10 w-[90px] shrink-0 animate-pulse rounded-full bg-neutral-200 md:w-[120px]" />
        </div>

        <div className="flex gap-3 overflow-hidden md:gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[75vw] md:w-[40vw] lg:w-[28vw] xl:w-[calc(25%-18px)]"
            >
              <div className="rounded-[20px] border border-neutral-100 bg-white p-3 shadow-sm">
                <div className="mb-3 flex flex-col gap-1">
                  <div className="h-4 w-[70%] animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-[45%] animate-pulse rounded bg-neutral-200" />
                </div>
                <div className="aspect-[4/5] w-full animate-pulse rounded-[14px] bg-neutral-200" />
                <div className="mt-3 flex flex-col gap-2">
                  <div className="h-3 w-[80%] animate-pulse rounded bg-neutral-200" />
                  <div className="h-3 w-[60%] animate-pulse rounded bg-neutral-200" />
                  <div className="h-5 w-[50%] animate-pulse rounded bg-neutral-200" />
                  <div className="mt-1 h-10 w-full animate-pulse rounded-[10px] bg-neutral-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );

  /* --------------------- EMPTY --------------------- */
  if (!products.length)
    return (
      <section className="w-full bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-12">
        <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem]">
          {category.toUpperCase()}
        </h2>
        <p className="mt-4 text-neutral-500">No products found.</p>
      </section>
    );

  /* --------------------- LOADED --------------------- */
  return (
    <section className="w-full bg-white px-4 py-8 md:px-6 md:py-10 xl:px-16 xl:py-12">
      {/* Header: heading left, View All button right — always row */}
      <div className="mb-6 flex flex-row items-center justify-between gap-3">
        <h2 className="text-[2rem] font-bold text-[#111] md:text-[2.4rem] xl:text-[4rem] leading-none">
          {category.toUpperCase()}
        </h2>

        <Link
          href={viewAllHref}
          className="inline-flex shrink-0 h-10 items-center justify-center gap-2 rounded-full border border-[#525252] bg-[#262626] px-4 md:px-5 text-[0.8rem] md:text-[0.9rem] font-semibold text-white no-underline transition-all duration-300 ease-in-out hover:border-[#15d1f5] hover:bg-[#111] hover:text-white"
        >
          View All <FaArrowRight />
        </Link>
      </div>

      {/*
        -mr-4 / -mr-6 / -mr-16 extends the scroll container flush to the section edge
        so the peeking card isn't cut off by the section's padding.
        pr-4 / pr-6 / pr-16 on the inner flex restores the right padding after the last card.

        Card widths:
          Mobile  → w-[75vw]              = 1 full card + ~0.33 of next card peeking
          Tablet  → w-[40vw]              = ~2.33 cards
          LG      → w-[28vw]              = ~3.33 cards
          XL      → calc(25% - 18px)      = 4 cards
      */}
      <div className="overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mr-4 md:-mr-6 xl:-mr-16">
        <div className="flex gap-3 md:gap-5 pr-4 md:pr-6 xl:pr-16">
          {products.map((p) => (
            <div
              key={p._id}
              className="shrink-0 w-[75vw] md:w-[40vw] lg:w-[28vw] xl:w-[calc(25%-18px)]"
            >
              <ProductCard
                id={p._id}
                name={p.name}
                category={p.category}
                price={p.price}
                discountPrice={p.discountPrice}
                stock={p.stock}
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