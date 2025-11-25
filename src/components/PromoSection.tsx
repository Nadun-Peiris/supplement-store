"use client";

import Image from "next/image";
import "./styles/promoSection.css";

const promos = [
  {
    title: "MASS GAINER",
    bg: "/promo/mass-bg.png",
    product: "/promo/mass-product.png",
    link: "/mass-gainers",
  },
  {
    title: "EXPLOSIVE ENERGY",
    bg: "/promo/explosive-bg.png",
    product: "/promo/explosive-product.png",
    link: "/preworkout",
  },
  {
    title: "MAXIMUM POTENCY",
    bg: "/promo/potency-bg.png",
    product: "/promo/potency-product.png",
    link: "/creatine",
  },
];

export default function PromoSection() {
  return (
    <section className="promo-section">
      <div className="promo-carousel">
        {promos.map((promo, i) => (
          <a key={i} href={promo.link} className="promo-card">

            {/* BG */}
            <Image fill src={promo.bg} alt={promo.title} className="promo-bg" />

            {/* TEXT */}
            <div className="promo-content">
              <h2>{promo.title}</h2>
            </div>

            {/* PRODUCT */}
            <div className="promo-product-wrapper">
              <Image
                src={promo.product}
                alt={promo.title}
                width={304}
                height={226}
                className="promo-product"
              />
            </div>

            {/* BUTTON NOW AT BOTTOM */}
            <button className="promo-btn">Shop Now</button>

          </a>
        ))}
      </div>
    </section>
  );
}
