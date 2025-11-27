"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { FaArrowRight } from "react-icons/fa";
import "./styles/productCarousel.css";
import type { ProductDTO } from "@/types/product";
import { absoluteUrl } from "@/lib/absoluteUrl";

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

        // filter by category using the new API
        if (categorySlug) {
          params.append("category", categorySlug);
        }

        const res = await fetch(
          absoluteUrl(`/api/products/filter?${params.toString()}`)
        );

        const data = await res.json();

        // Shop filter API returns: { products, totalPages, ... }
        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        console.error("Carousel load error:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [categorySlug]);

  /* -------------------------------------------------- */
  /* LOADING SKELETON                                   */
  /* -------------------------------------------------- */
  if (loading)
    return (
      <section className="carousel-section">
        <div className="carousel-header">
          <h2>{category.toUpperCase()}</h2>
          <div className="skeleton-button shimmer" />
        </div>

        <div className="carousel-container">
          <div className="skeleton-track">
            {[1, 2, 3, 4].map((i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-image shimmer"></div>
                <div className="skeleton-info">
                  <div className="skeleton-line long shimmer"></div>
                  <div className="skeleton-line medium shimmer"></div>
                  <div className="skeleton-line short shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );

  /* -------------------------------------------------- */
  /* EMPTY STATE                                        */
  /* -------------------------------------------------- */
  if (!products.length)
    return <div className="carousel-empty">No products found.</div>;

  /* -------------------------------------------------- */
  /* LOADED CONTENT                                     */
  /* -------------------------------------------------- */
  return (
    <section className="carousel-section fade-in">
      <div className="carousel-header">
        <h2>{category.toUpperCase()}</h2>

        <Link href={viewAllHref} className="view-all">
          View All <FaArrowRight className="arrow-icon" />
        </Link>
      </div>

      <div className="carousel-container">
        <div className="carousel-track">
          {products.map((p) => (
            <ProductCard
              key={p._id}
              id={p._id}
              name={p.name}
              category={p.category}
              price={p.price}
              image={p.image}
              slug={p.slug ?? p._id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
