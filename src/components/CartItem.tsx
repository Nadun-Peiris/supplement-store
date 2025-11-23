"use client";

import Image from "next/image";
import "@/components/styles/cart.css";

export default function CartItem({ item, updateQuantity, removeItem }: any) {
  return (
    <div className="cart-item-row">
      {/* REMOVE BTN */}
      <button className="remove-btn" onClick={() => removeItem(item.productId)}>
        ×
      </button>

      {/* PRODUCT */}
      <div className="cart-product">
        <Image
          src={item.image}
          width={80}
          height={80}
          alt={item.name}
          className="cart-item-image"
        />
        <span className="cart-product-name">{item.name}</span>
      </div>

      {/* PRICE */}
      <span className="cart-price">
        LKR {item.price.toLocaleString()}
      </span>

      {/* QUANTITY */}
      <div className="cart-qty">
        <button
            className={`qty-btn qty-minus ${item.quantity === 1 ? "disabled" : ""}`}
            disabled={item.quantity === 1}
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
        >
            –
        </button>

        <span key={item.quantity} className="qty-number">
            {item.quantity}
        </span>

        <button
            className="qty-btn qty-plus"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
        >
            +
        </button>
      </div>



      {/* SUBTOTAL */}
      <span className="cart-subtotal">
        LKR {(item.price * item.quantity).toLocaleString()}
      </span>
    </div>
  );
}
