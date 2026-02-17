"use client";

import Image from "next/image";
import "./singleProduct.css";
import toast from "react-hot-toast";
import { useState } from "react";
import ProductCarousel from "@/components/ProductCarousel";
import FeaturesSection from "@/components/FeaturesSection";
import { useCart } from "@/context/CartContext";
import type { ProductDTO } from "@/types/product";

const slugifyText = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function SingleProductPage({ product }: { product: ProductDTO }) {
  const [qty, setQty] = useState(1);
  const stock = Math.max(product.stock ?? 0, 0);
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock < 4;
  const stockLabel = isOutOfStock
    ? "Out of stock"
    : isLowStock
      ? `Low stock (${stock} left)`
      : "In stock";
  const stockClass = isOutOfStock
    ? "sp-stock sp-stock-out"
    : isLowStock
      ? "sp-stock sp-stock-low"
      : "sp-stock sp-stock-in";
  const brandName = product.brandName?.trim() || "Unbranded";
  const brandSlug = slugifyText(brandName);
  const categoryName = product.category?.trim() || "Category";
  const categorySlug = slugifyText(categoryName);
  const hasKnownBrand = !["", "unknown", "unbranded", "n-a", "na"].includes(
    brandSlug.toLowerCase()
  );

  // 🌟 Use global cart context
  const { addToCart } = useCart();

  // Quantity controls
  const increaseQty = () => setQty((q) => (stock > 0 ? Math.min(q + 1, stock) : 1));
  const decreaseQty = () => setQty((q) => (q > 1 ? q - 1 : 1));

  // ⭐ ADD TO CART using global CartContext
  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    await addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty,
    });

    toast.success("Added to cart!");
  };

  return (
    <>
      <div className="sp-container">
        {/* ================== LEFT IMAGE BOX ================== */}
        <div className="sp-image-box">
          <Image
            src={product.image}
            width={600}
            height={600}
            alt={product.name}
            className="sp-main-img"
          />
        </div>

        {/* ====== DIVIDER ====== */}
        <div className="sp-divider"></div>

        {/* ================== RIGHT CONTENT ================== */}
        <div className="sp-info-box">
          <h1 className="sp-title">{product.name}</h1>

          <div className="sp-meta">
            {hasKnownBrand ? (
              <a
                className="sp-meta-item sp-meta-link"
                href={`/shop?brand=${encodeURIComponent(brandSlug)}`}
              >
                <b>Brand:</b> <span>{brandName}</span>
              </a>
            ) : (
              <span className="sp-meta-item">
                <b>Brand:</b> <span>{brandName}</span>
              </span>
            )}
            <span className="sp-meta-sep">|</span>
            <a className="sp-meta-item sp-meta-link" href={`/shop/${encodeURIComponent(categorySlug)}`}>
              <b>Category:</b> <span>{categoryName}</span>
            </a>
          </div>

          <span className={stockClass}>{stockLabel}</span>

          <p className="sp-price">LKR {product.price.toLocaleString()}</p>

          <p className="sp-desc">{product.description}</p>

          {/* ================== QUANTITY SELECTOR ================== */}
          <div className="sp-qty-row">
            <div className="sp-qty-box">
              <button className="sp-qty-btn" onClick={decreaseQty}>
                –
              </button>
              <span className="sp-qty-number">{qty}</span>
              <button
                className="sp-qty-btn"
                onClick={increaseQty}
                disabled={isOutOfStock || qty >= stock}
              >
                +
              </button>
            </div>

          </div>

          {/* ================== ACTION BUTTONS ================== */}
          <button
            className="sp-add-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            ADD TO CART
          </button>

          <button className="sp-buy-now" disabled={isOutOfStock}>
            BUY IT NOW
          </button>

          {/* ================== PAYMENT STRIP ================== */}
          <div className="safe-checkout-box">
            <p className="safe-checkout-title">
              Guarantee Safe & Secure Checkout
            </p>

            <Image
              src="/payment.png"
              width={300}
              height={80}
              alt="Payment Methods"
              className="safe-checkout-image"
            />
          </div>
        </div>
      </div>

      {/* ================== PRODUCT CAROUSEL ================== */}
      <ProductCarousel category={product.category} />

      <FeaturesSection />
    </>
  );
}
