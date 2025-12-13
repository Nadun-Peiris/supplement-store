"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";
import "./styles/promoSection.css";

interface FeaturedCategory {
  _id: string;
  index: number;
  category: {
    _id: string;
    name: string;
    slug: string;
    image?: string;
  };
}

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
      <section className="promo-section">
        <p className="promo-message">
          Featured categories will appear here once they are selected.
        </p>
      </section>
    );
  }

  return (
    <section className="promo-section">
      <div className="promo-carousel">
        {loading &&
          skeletons.map((_, idx) => (
            <div className="promo-card promo-skeleton" key={`promo-skel-${idx}`}>
              <span className="promo-skeleton-bg" />
            </div>
          ))}

        {!loading &&
          featured.map((promo, i) => {
            const bg =
              fallbackBackgrounds[i % fallbackBackgrounds.length] ||
              fallbackBackgrounds[0];
            const product =
              promo.category.image ||
              fallbackProducts[i % fallbackProducts.length] ||
              fallbackProducts[0];

            return (
              <a
                key={promo._id}
                href={`/shop/${promo.category.slug}`}
                className="promo-card"
              >
                <span className="promo-glow" aria-hidden="true" />

                {/* BG */}
                <Image fill src={bg} alt={promo.category.name} className="promo-bg" />
                <span className="promo-overlay" aria-hidden="true" />

                {/* TEXT */}
                <div className="promo-content">
                  <div className="promo-meta">
                    <span className="promo-rank">TOP {i + 1}</span>
                    <span className="promo-pill">FEATURED</span>
                  </div>
                  <h2>{promo.category.name}</h2>
                  <p className="promo-subtitle">Bestsellers and new drops curated for you.</p>
                </div>

                {/* PRODUCT */}
                <div className="promo-product-wrapper">
                  <Image
                    src={product}
                    alt={promo.category.name}
                    width={304}
                    height={226}
                    className="promo-product"
                  />
                </div>

                <button className="promo-btn">
                  Shop Now
                  <span className="promo-arrow">→</span>
                </button>
              </a>
            );
          })}
      </div>
    </section>
  );
}
