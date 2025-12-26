"use client";

import Link from "next/link";
import "./ProductCardAI.css";

export default function ProductCardAI({ product }: any) {
  return (
    <div className="ai-product-card">
      <div className="ai-product-info">
        <h4>{product.name}</h4>
        <p className="ai-reason">{product.reason}</p>
      </div>

      <div className="ai-card-actions">
        <Link href={`/product/${product.id}`} className="view-btn">
          View Product
        </Link>

        <button
          className="add-btn"
          onClick={() => {
            // custom add-to-cart event
            window.dispatchEvent(
              new CustomEvent("add-to-cart-ai", {
                detail: { productId: product.id },
              })
            );
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
