"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";

interface FeaturedCategory {
  _id: string;
  index: number;
  category: {
    _id: string;
    name: string;
    slug: string;
    image?: string;          // True product image
    backgroundImage?: string;// True background image
    description?: string;    // True category description
    itemCount?: number;      // True number of items in the category
    tag?: string;            // True promotional tag (e.g., "SALE")
  };
}

// Kept purely as a safety net to prevent Next.js Image crashes if API data is missing
const fallbackBackgrounds = [
  "/promo/mass-bg.png",
  "/promo/explosive-bg.png",
  "/promo/potency-bg.png",
];

const fallbackProducts = [
  "/promo/mass-product.png",
  "/promo/explosive-product.png",
  "/promo/potency-product.png",
];

export default function PromoSection() {
  const [featured, setFeatured] = useState<FeaturedCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeatured() {
      setLoading(true);
      try {
        const res = await fetch(absoluteUrl("/api/featured-categories"), {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to load featured categories");
        }

        const data = await res.json();
        const items: FeaturedCategory[] = Array.isArray(data.items)
          ? data.items
          : [];

        const sortedTopThree = items
          .filter((item) => item.category && item.category.slug)
          .sort((a, b) => a.index - b.index)
          .slice(0, 3);

        setFeatured(sortedTopThree);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("PROMO FEATURED LOAD ERROR:", err);
        setFeatured([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFeatured();
    return () => controller.abort();
  }, []);

  const skeletons = Array.from({ length: 3 });

  if (!loading && featured.length === 0) {
    return (
      <section className="w-full py-12">
        <p className="px-6 py-8 text-center text-[#b3b3b3]">
          Featured categories will appear here once they are selected.
        </p>
      </section>
    );
  }

  return (
    <section className="w-full py-12 max-sm:py-10">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-8 overflow-visible px-8 max-[900px]:flex max-[900px]:justify-start max-[900px]:snap-x max-[900px]:snap-mandatory max-[900px]:overflow-x-auto max-[900px]:scroll-p-6 max-sm:gap-5 max-sm:px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loading &&
          skeletons.map((_, idx) => (
            <div
              key={`promo-skel-${idx}`}
              className="relative h-[380px] w-full max-w-[560px] flex-none animate-pulse overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] max-[900px]:w-[420px] max-[900px]:max-w-none max-sm:h-[320px] max-sm:w-[calc(100%-2rem)] max-sm:rounded-[20px]"
            />
          ))}

        {!loading &&
          featured.map((promo, i) => {
            // Prioritize true API data, fallback only if missing to prevent UI crashes
            const bg =
              promo.category.backgroundImage ||
              fallbackBackgrounds[i % fallbackBackgrounds.length] ||
              fallbackBackgrounds[0];
            const product =
              promo.category.image ||
              fallbackProducts[i % fallbackProducts.length] ||
              fallbackProducts[0];

            return (
              <Link
                key={promo._id}
                href={`/shop/${promo.category.slug}`}
                className="group relative block h-[380px] w-full max-w-[560px] flex-none snap-center overflow-hidden rounded-[22px] bg-black text-white no-underline max-[900px]:w-[420px] max-[900px]:max-w-none max-sm:h-[320px] max-sm:w-[calc(100%-2rem)] max-sm:rounded-[20px]"
              >
                {/* GLOW */}
                <span
                  className="absolute -inset-[40%] z-[1] bg-[radial-gradient(ellipse_at_20%_30%,rgba(3,199,254,0.28),transparent_50%)] blur-[12px]"
                  aria-hidden="true"
                />

                {/* BG */}
                <Image
                  fill
                  src={bg}
                  alt={promo.category.name}
                  className="absolute inset-0 z-[1] object-cover"
                />
                
                {/* OVERLAY */}
                <span
                  className="absolute inset-0 z-[2] bg-gradient-to-br from-black/80 to-black/20"
                  aria-hidden="true"
                />

                {/* TEXT & TRUE DATA CONTENT */}
                <div className="absolute left-8 right-8 top-8 z-[6] max-sm:left-6 max-sm:right-6 max-sm:top-6">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="rounded-full border border-white/20 bg-white/12 px-[0.7rem] py-[0.2rem] text-[0.8rem] font-bold tracking-[0.04em]">
                      TOP {i + 1}
                    </span>
                    <span className="rounded-full border border-[#09e1ff] bg-[#03c7fe] px-[0.7rem] py-[0.2rem] text-[0.8rem] font-bold tracking-[0.04em] text-[#031821]">
                      FEATURED
                    </span>
                  </div>
                  <h2 className="text-[2.7rem] font-extrabold leading-[1.15] max-[900px]:text-[2.2rem] max-sm:max-w-[10ch] max-sm:text-[1.8rem]">
                    {promo.category.name}
                  </h2>
                  
                  {/* Only render description if provided by API */}
                  {promo.category.description && (
                    <p className="mt-2 max-w-[32ch] leading-[1.45] text-white/75 max-sm:max-w-[24ch]">
                      {promo.category.description}
                    </p>
                  )}
                  
                  {/* Only render extra metadata if provided by API */}
                  {(promo.category.tag || promo.category.itemCount) && (
                    <div className="mt-4 flex items-center gap-3">
                      {promo.category.tag && (
                        <span className="rounded-md bg-[#03c7fe]/15 px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-wider text-[#03c7fe]">
                          {promo.category.tag}
                        </span>
                      )}
                      {promo.category.itemCount && (
                        <span className="text-[0.85rem] font-medium text-white/60">
                          • {promo.category.itemCount} Items
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* PRODUCT */}
                <div className="absolute bottom-12 right-0 z-[8] max-sm:-right-5 max-sm:bottom-[5.5rem] max-sm:origin-bottom-right max-sm:scale-[0.85]">
                  <Image
                    src={product}
                    alt={promo.category.name}
                    width={304}
                    height={226}
                    className="transition-transform duration-400 ease-in-out group-hover:scale-[1.18]"
                  />
                </div>

                {/* BUTTON (Black & Blue Accent) */}
                <button className="group/btn absolute bottom-[1.6rem] left-8 z-10 inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#03c7fe]/40 bg-[#050505] px-6 py-2.5 text-[0.95rem] font-bold text-white transition-all duration-300 hover:border-[#03c7fe] hover:bg-[#03c7fe]/10 hover:shadow-[0_0_20px_rgba(3,199,254,0.25)] active:scale-95 max-sm:bottom-4 max-sm:left-6 max-sm:px-5 max-sm:py-2 max-sm:text-[0.85rem]">
                  Shop Now
                  <span className="text-[#03c7fe] transition-transform duration-300 ease-in-out group-hover/btn:translate-x-1">
                    →
                  </span>
                </button>
              </Link>
            );
          })}
      </div>
    </section>
  );
}