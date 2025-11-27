"use client";

import { useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";
import "@/components/styles/cart.css";
import CartItem from "@/components/CartItem";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 NEW → Update Header Counter
  const { refreshCart } = useCart();

  // Load Cart
  useEffect(() => {
    async function loadCart() {
      let guestId = localStorage.getItem("guestId");
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem("guestId", guestId);
      }

      const res = await fetch(absoluteUrl("/api/cart"), {
        headers: { "x-guest-id": guestId },
      });

      const data = await res.json();
      setCart(data.cart || { items: [] });

      refreshCart(); // ← Update header badge on page load
      setLoading(false);
    }

    loadCart();
  }, [refreshCart]);

  // Update quantity
  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1) return;

    let guestId = localStorage.getItem("guestId") as string;

    const res = await fetch(absoluteUrl("/api/cart/update"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    const data = await res.json();

    if (res.ok) {
      setCart(data.cart);
      refreshCart(); // 🔥 FIX → Update header after qty change
    } else {
      toast.error(data.error);
    }
  };

  // Remove item
  const removeItem = async (productId: string) => {
    let guestId = localStorage.getItem("guestId") as string;

    const res = await fetch(absoluteUrl("/api/cart/remove"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();

    if (res.ok) {
      setCart(data.cart);
      toast.success("Item removed");
      refreshCart(); // 🔥 FIX → Update header after delete
    }
  };

  const subtotal =
    cart?.items?.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    ) || 0;

  return (
    <div className="cart-page-container">
      <h1 className="cart-title">CART</h1>
      <p className="cart-breadcrumb">Home Page • Cart</p>

      <div className="cart-layout">
        {/* LEFT SIDE */}
        <div className="cart-left">
          <div className="cart-table-header">
            <span>PRODUCT</span>
            <span>PRICE</span>
            <span>QUANTITY</span>
            <span>SUBTOTAL</span>
          </div>

          <div className="cart-items">
            {loading ? (
              <p>Loading...</p>
            ) : cart.items.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              cart.items.map((item: any) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeItem={removeItem}
                />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — TOTALS */}
        <div className="cart-summary">
          <h3>CART TOTALS</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>LKR {subtotal.toLocaleString()}</strong>
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>LKR {subtotal.toLocaleString()}</strong>
          </div>

          <button
            className="checkout-btn"
            onClick={() => (window.location.href = "/checkout")}
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
