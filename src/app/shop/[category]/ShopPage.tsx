"use client";

import "./shop.css";
import ProductCard from "@/components/ProductCard";

export default function ShopPage({
  category,
  products,
}: {
  category: string;
  products: any[];
}) {
  return (
    <>
      {/* ============================== */}
      {/* HERO / CATEGORY TITLE SECTION */}
      {/* ============================== */}
      <div className="shop-hero">
        <h1>{category.toUpperCase()}</h1>
      </div>

      {/* ============================== */}
      {/* MAIN SHOP LAYOUT */}
      {/* ============================== */}
      <div className="shop-container">
        
        {/* Sidebar */}
        <aside className="sidebar-card">

          {/* PRODUCT CATEGORIES */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>PRODUCT CATEGORIES</h3>
              <span className="toggle-icon">−</span>
            </div>

            <ul className="sidebar-list">
              <li><input type="checkbox" /> Digestion</li>
              <li><input type="checkbox" /> Health Support</li>
              <li><input type="checkbox" /> Performance</li>
              <li><input type="checkbox" /> Protein</li>
              <li><input type="checkbox" /> Sports Nutrition</li>
              <li><input type="checkbox" /> Vegan</li>
              <li><input type="checkbox" /> Vitamins</li>
            </ul>

            <hr className="divider" />
          </div>

          {/* PRICE FILTER */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>FILTER BY PRICE</h3>
              <span className="toggle-icon">−</span>
            </div>

            <input type="range" min="0" max="100000" className="price-slider" />

            <p className="price-text">Price: LKR 0 — LKR 100,000</p>

            <button className="filter-btn">FILTER</button>

            <hr className="divider" />
          </div>

          {/* BRANDS */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3>BRANDS</h3>
              <span className="toggle-icon">−</span>
            </div>

            <ul className="sidebar-list">
              <li><input type="checkbox" /> Energy Gym</li>
              <li><input type="checkbox" /> Gym Sports</li>
              <li><input type="checkbox" /> Healthy</li>
              <li><input type="checkbox" /> Power Fitness Club</li>
              <li><input type="checkbox" /> The Fitness Center</li>
              <li><input type="checkbox" /> Victor Gym</li>
            </ul>
          </div>

        </aside>

        {/* Products */}
        <main className="shop-main">
          <div className="shop-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                id={product._id}
                name={product.name}
                category={product.category}
                price={product.price}
                image={product.image}
                slug={product.slug}
              />
            ))}
          </div>

          {/* ============================== */}
          {/* PAGINATION UI */}
          {/* ============================== */}
          <div className="pagination">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">Next →</button>
          </div>
        </main>

      </div>
    </>
  );
}
