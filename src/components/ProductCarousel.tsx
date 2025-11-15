"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./styles/productCarousel.css";
import { FaArrowRight } from "react-icons/fa";

interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  hoverImage?: string;
  slug?: string;
}

export default function ProductCarousel({ category }: { category: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/products?category=${category}&limit=10`);
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

  const scrollLeft = () =>
    carouselRef.current?.scrollBy({ left: -400, behavior: "smooth" });
  const scrollRight = () =>
    carouselRef.current?.scrollBy({ left: 400, behavior: "smooth" });

  if (loading) return <div className="carousel-loading">Loading...</div>;
  if (!products.length)
    return <div className="carousel-empty">No products found.</div>;

  return (
    <section className="carousel-section">
      <div className="carousel-header">
        <h2>{category.toUpperCase()}</h2>
        <Link href={`/category/${category.toLowerCase()}`} className="view-all">
          View All <FaArrowRight className="arrow-icon" />
        </Link>
      </div>

      <div className="carousel-container">
        <button className="carousel-btn left" onClick={scrollLeft}>
          <FaChevronLeft />
        </button>

        <div className="carousel-track" ref={carouselRef}>
          {products.map((p) => (
            <ProductCard
              key={p._id}
              name={p.name}
              category={p.category}
              price={p.price}
              image={p.image}
              hoverImage={p.hoverImage}
              href={`/product/${p.slug || p._id}`}
            />
          ))}
        </div>

        <button className="carousel-btn right" onClick={scrollRight}>
          <FaChevronRight />
        </button>
      </div>
    </section>
  );
}
