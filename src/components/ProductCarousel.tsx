"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { FaArrowRight } from "react-icons/fa";
import "./styles/productCarousel.css";
import type { ProductDTO } from "@/types/product";

export default function ProductCarousel({ category }: { category: string }) {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?category=${category}&limit=10`);
        const data: ProductDTO[] = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

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

        <Link href={`/category/${category.toLowerCase()}`} className="view-all">
          View All <FaArrowRight className="arrow-icon" />
        </Link>
      </div>

      <div className="carousel-container">
        <div className="carousel-track" ref={carouselRef}>
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
