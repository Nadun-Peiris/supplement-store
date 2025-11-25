"use client";

import Image from "next/image";
import {
  FiTruck,
  FiLock,
  FiUsers,
  FiHeart,
  FiRefreshCcw,
} from "react-icons/fi";
import "./singleProduct.css";
import toast from "react-hot-toast";
import { useState } from "react";
import ProductCarousel from "@/components/ProductCarousel";
import FeaturesSection from "@/components/FeaturesSection";
import { useCart } from "@/context/CartContext";

export default function SingleProductPage({ product }: { product: any }) {
  const [qty, setQty] = useState(1);

  // 🌟 Use global cart context
  const { addToCart } = useCart();

  // Quantity controls
  const increaseQty = () => setQty((q) => q + 1);
  const decreaseQty = () => setQty((q) => (q > 1 ? q - 1 : 1));

  // ⭐ ADD TO CART using global CartContext
  const handleAddToCart = async () => {
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
            <b>Brand:</b> Fitness Pro
            <span className="sp-stock">✔ In stock</span>
          </div>

          <p className="sp-price">LKR {product.price.toLocaleString()}</p>

          <p className="sp-desc">{product.description}</p>

          {/* ================== QUANTITY SELECTOR ================== */}
          <div className="sp-qty-row">
            <div className="sp-qty-box">
              <button className="sp-qty-btn" onClick={decreaseQty}>
                –
              </button>
              <span className="sp-qty-number">{qty}</span>
              <button className="sp-qty-btn" onClick={increaseQty}>
                +
              </button>
            </div>

            {/* HEART & REFRESH ICONS */}
            <button className="sp-icon-btn">
              <FiHeart size={20} />
            </button>
            <button className="sp-icon-btn">
              <FiRefreshCcw size={20} />
            </button>
          </div>

          {/* ================== ACTION BUTTONS ================== */}
          <button className="sp-add-btn" onClick={handleAddToCart}>
            ADD TO CART
          </button>

          <button className="sp-buy-now">BUY IT NOW</button>

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
