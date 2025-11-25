"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartItemInput {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity?: number;
}

interface CartContextType {
  count: number;
  refreshCart: () => Promise<void>;
  addToCart: (product: CartItemInput) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  count: 0,
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
});

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  /* --------------------------------------------
     Load cart and update count
  --------------------------------------------- */
  const refreshCart = async () => {
    try {
      let guestId = localStorage.getItem("guestId");
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem("guestId", guestId);
      }

      const res = await fetch("/api/cart", {
        method: "GET",
        headers: { "x-guest-id": guestId },
      });

      const data = await res.json();
      const items: CartItem[] = data.cart?.items || [];

      setCount(items.reduce((sum, i) => sum + i.quantity, 0));
    } catch (err) {
      console.error("Cart refresh failed:", err);
    }
  };

  /* --------------------------------------------
     Add To Cart (with quantity support)
  --------------------------------------------- */
  const addToCart = async ({
    productId,
    name,
    price,
    image,
    quantity = 1,
  }: CartItemInput) => {
    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = crypto.randomUUID();
      localStorage.setItem("guestId", guestId);
    }

    await fetch("/api/cart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify({
        productId,
        name,
        price,
        image,
        quantity,
      }),
    });

    // Instant frontend update (no delay)
    setCount((prev) => prev + quantity);

    // Full sync in background
    refreshCart();
  };

  /* --------------------------------------------
     Update Quantity
  --------------------------------------------- */
  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1) return;

    let guestId = localStorage.getItem("guestId") as string;

    await fetch("/api/cart/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    refreshCart();
  };

  /* --------------------------------------------
     Remove Item
  --------------------------------------------- */
  const removeFromCart = async (productId: string) => {
    let guestId = localStorage.getItem("guestId") as string;

    await fetch("/api/cart/remove", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-guest-id": guestId,
      },
      body: JSON.stringify({ productId }),
    });

    refreshCart();
  };

  /* --------------------------------------------
     Auto-load cart on mount
  --------------------------------------------- */
  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        count,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
