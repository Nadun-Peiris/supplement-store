"use client";

import Link from "next/link";
import "./chat.css";

type ProductCardProps = {
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    slug?: string;
  };
  onAdd?: (product: any) => void;
};

export default function ProductCardAI({ product, onAdd }: ProductCardProps) {
  const productHref = product.slug
    ? `/product/${product.slug}`
    : `/product/${product.id}`;

  return (
    <div className="ai-product-card">
      {/* PRODUCT IMAGE */}
      {product.image && (
        <div className="ai-product-img-box">
          <img src={product.image} alt={product.name} className="ai-product-img" />
        </div>
      )}

      <div className="ai-product-info">
        {/* NAME + PRICE */}
        <h4 className="ai-product-title">{product.name}</h4>
        <p className="ai-product-price">LKR {product.price?.toLocaleString()}</p>

        {/* BUTTONS */}
        <div className="ai-actions">
          <Link href={productHref} className="ai-view-btn">
            View
          </Link>

          <button
            className="ai-add-btn"
            type="button"
            onClick={() => onAdd?.(product)}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}
