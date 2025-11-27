"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";
import "./styles/categoryCarousel.css";

interface Category {
  _id: string;
  name: string;
  image: string;
}

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const autoPlayTimer = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCategories() {
      try {
        const res = await fetch(absoluteUrl("/api/categories"), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load categories");
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("Category carousel error:", err);
        setError("Unable to load categories right now.");
        setCategories([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCategories();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const node = carouselRef.current;
    if (!node || categories.length <= 1) return;

    if (autoPlayTimer.current) {
      window.clearInterval(autoPlayTimer.current);
      autoPlayTimer.current = null;
    }

    autoPlayTimer.current = window.setInterval(() => {
      const maxScroll = node.scrollWidth - node.clientWidth;
      const atEnd = node.scrollLeft >= maxScroll - 4;

      if (atEnd) {
        if (autoPlayTimer.current) {
          window.clearInterval(autoPlayTimer.current);
          autoPlayTimer.current = null;
        }
        node.scrollTo({ left: maxScroll, behavior: "smooth" });
        return;
      }

      node.scrollBy({ left: 240, behavior: "smooth" });
    }, 3500);

    return () => {
      if (autoPlayTimer.current) {
        window.clearInterval(autoPlayTimer.current);
        autoPlayTimer.current = null;
      }
    };
  }, [categories.length]);

  const renderSkeleton = () => (
    <div className="category-skeleton-row">
      {Array.from({ length: 6 }).map((_, idx) => (
        <div className="category-skeleton" key={idx}>
          <div className="category-visual">
            <span className="circle-bg skeleton" aria-hidden="true" />
          </div>
          <div className="skeleton-label" />
        </div>
      ))}
    </div>
  );

  return (
    <section className="category-section">
      <h2 className="category-title">
        <span className="shopby">SHOP BY</span> CATEGORY
      </h2>

      {loading && renderSkeleton()}

      {!loading && error && (
        <p className="category-message error">{error}</p>
      )}

      {!loading && !error && categories.length === 0 && (
        <p className="category-message">No categories available.</p>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="category-carousel-wrapper">
          <div className="category-carousel" ref={carouselRef}>
            {categories.map((cat) => {
              // Ensure Next Image always receives an alt string even if API data is missing
              const imageAlt =
                typeof cat.name === "string" && cat.name.trim().length > 0
                  ? cat.name
                  : "Category image";

              return (
                <Link
                  href={`/category/${cat._id}`}
                  key={cat._id}
                  className="category-item"
                >
                  <div className="category-visual">
                    <span className="circle-bg" aria-hidden="true" />
                    <Image
                      src={cat.image}
                      alt={imageAlt}
                      width={140}
                      height={140}
                      className="category-img"
                    />
                  </div>

                  <p className="cat-name">{cat.name}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
