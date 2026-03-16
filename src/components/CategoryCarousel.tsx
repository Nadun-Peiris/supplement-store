"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const autoPlayTimer = useRef<number | null>(null);

  // 🚨 CLIENT FETCH MUST USE RELATIVE URL — NEVER absoluteUrl()
  useEffect(() => {
    const controller = new AbortController();

    async function loadCategories() {
      try {
        const res = await fetch("/api/categories", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to load categories");

        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Carousel load error:", err);
        setError("Unable to load categories right now.");
        setCategories([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCategories();
    return () => controller.abort();
  }, []);

  // Auto-scrolling
  useEffect(() => {
    const node = carouselRef.current;
    if (!node || categories.length <= 1) return;

    if (autoPlayTimer.current) {
      clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }

    autoPlayTimer.current = window.setInterval(() => {
      const max = node.scrollWidth - node.clientWidth;
      const atEnd = node.scrollLeft >= max - 4;

      if (atEnd) {
        clearInterval(autoPlayTimer.current!);
        autoPlayTimer.current = null;
        node.scrollTo({ left: max, behavior: "smooth" });
        return;
      }

      node.scrollBy({ left: 240, behavior: "smooth" });
    }, 3500);

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
        autoPlayTimer.current = null;
      }
    };
  }, [categories.length]);

  // Skeleton loader
  const renderSkeleton = () => (
    <div className="flex overflow-hidden px-6 pt-8 md:px-16 gap-5 md:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="flex flex-col items-center flex-none" key={i}>
          <div className="relative flex items-center justify-center w-[136px] h-[136px] md:w-[156px] md:h-[156px]">
            <span
              className="absolute top-1/2 left-1/2 w-[120px] h-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-100 animate-pulse md:w-[140px] md:h-[140px]"
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 h-[14px] w-[120px] rounded-full bg-neutral-200 animate-pulse" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="w-full bg-white py-10 md:py-16">
      <h2 className="ml-6 text-left text-[2.5rem] font-bold text-black md:ml-16 md:text-[4rem] leading-tight">
        <span className="text-[#03c7fe]">SHOP BY</span> CATEGORY
      </h2>

      {loading && renderSkeleton()}
      
      {!loading && error && (
        <p className="px-6 pt-8 text-base font-medium text-red-600 md:px-16">
          {error}
        </p>
      )}
      
      {!loading && !error && categories.length === 0 && (
        <p className="px-6 pt-8 text-base font-medium text-gray-700 md:px-16">
          No categories available.
        </p>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="m-0 w-full px-6 md:px-16">
          <div
            className="flex w-full snap-x snap-mandatory touch-pan-x gap-5 overflow-x-auto pt-8 scrollbar-none md:gap-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            ref={carouselRef}
          >
            {categories.map((cat) => (
              <Link
                href={`/shop/${cat.slug}`}
                key={cat._id}
                className="group flex flex-none snap-center flex-col items-center min-w-[150px] text-black md:min-w-[170px]"
              >
                {/* Visual Container */}
                <div className="relative flex items-center justify-center w-[136px] h-[136px] md:w-[156px] md:h-[156px]">
                  {/* Circle Background */}
                  <span
                    className="pointer-events-none absolute top-1/2 left-1/2 w-[120px] h-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f3f3f3] transition-colors duration-300 ease-in-out group-hover:bg-[#03c7fe] md:w-[140px] md:h-[140px]"
                    aria-hidden="true"
                  />
                  {/* Category Image */}
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={150}
                    height={150}
                    className="relative z-10 w-[120px] h-[120px] object-contain transition-transform duration-300 ease-in-out group-hover:scale-110 md:w-[150px] md:h-[150px]"
                  />
                </div>

                {/* Category Name */}
                <p className="mt-4 text-base font-bold tracking-[0.4px] md:mt-5 md:text-[1.2rem]">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}