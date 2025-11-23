"use client";

import Image from "next/image";
import "./styles/brandLogoSlider.css";

// Placeholder logos — replace with your real files later
const brands = [
  "/brands/brand1.webp",
  "/brands/brand1.webp",
  "/brands/brand1.webp",
  "/brands/brand1.webp",
  "/brands/brand1.webp",
  "/brands/brand1.webp",
];

export default function BrandLogoSlider() {
  return (
    <section className="brand-section">
      <h2 className="brand-title">
        POPULAR <span>BRANDS</span>
      </h2>

      <div className="brand-grid">
        {brands.map((logo, index) => (
          <div className="brand-card" key={index}>
            <Image
              src={logo}
              alt={`brand-${index}`}
              width={140}
              height={140}
              className="brand-image"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
