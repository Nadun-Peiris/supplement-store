"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type FeaturedBrandItem = {
  _id: string;
  index: number;
  brandId: string;
  brand: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
};

export default function BrandLogoSlider() {
  const [brands, setBrands] = useState<FeaturedBrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadFeaturedBrands() {
      try {
        const res = await fetch("/api/featured-brands", {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Failed to load featured brands");

        const data = await res.json();
        setBrands(Array.isArray(data.brands) ? data.brands : []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Featured brands load error:", err);
        setError("Unable to load featured brands right now.");
        setBrands([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadFeaturedBrands();
    return () => controller.abort();
  }, []);

  return (
    <section className="w-full bg-white px-5 py-10 sm:px-8 sm:py-12">
      <h2 className="mb-8 text-2xl font-bold text-[#111] md:text-[2rem]">
        POPULAR <span className="font-black text-[#15D1F5]">BRANDS</span>
      </h2>

      {loading && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              className="flex h-[110px] animate-pulse items-center justify-center rounded-[20px] border border-[#eeeeee] bg-[#f7f7f7] sm:h-[130px] md:h-[170px]"
              key={index}
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      {!loading && !error && brands.length === 0 && (
        <p className="text-sm font-medium text-gray-600">
          No featured brands available.
        </p>
      )}

      {!loading && !error && brands.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fit,minmax(180px,1fr))] sm:gap-6">
          {brands.map((item) => (
            <Link
              href={`/shop/brand/${item.brand.slug}`}
              className="group flex h-[110px] cursor-pointer items-center justify-center rounded-[20px] border border-[#eeeeee] bg-white transition-colors duration-[350ms] ease-in-out hover:border-[#ccc] sm:h-[130px] sm:px-4 sm:py-6 md:h-[170px] md:px-6 md:py-8"
              key={item._id}
            >
              <Image
                src={item.brand.image || "/brands/brand1.webp"}
                alt={item.brand.name}
                width={140}
                height={140}
                className="scale-95 opacity-30 grayscale transition-all duration-[350ms] ease-in-out group-hover:opacity-100 group-hover:grayscale-0 max-sm:h-[100px] max-sm:w-[100px]"
              />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
