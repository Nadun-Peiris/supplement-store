"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";

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

// Generate / get guest ID
function getGuestId() {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guestId", id);
  }
  return id;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  /* --------------------------------------------
      REFRESH CART
  --------------------------------------------- */
  const refreshCart = async () => {
    try {
      const guestId = getGuestId();

      const res = await fetch(absoluteUrl("/api/cart"), {
        method: "GET",
        headers: { "guest-id": guestId },
      });

      const data = await res.json();
      const items: CartItem[] = data.cart?.items || [];

      setCount(items.reduce((sum, i) => sum + i.quantity, 0));
    } catch (err) {
      console.error("Cart refresh failed:", err);
    }
  };

  /* --------------------------------------------
      ADD TO CART
  --------------------------------------------- */
  const addToCart = async ({
    productId,
    name,
    price,
    image,
    quantity = 1,
  }: CartItemInput) => {
    const guestId = getGuestId();

    await fetch(absoluteUrl("/api/cart"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "guest-id": guestId,
      },
      body: JSON.stringify({
        productId,
        name,
        price,
        image,
        quantity,
      }),
    });

    // Instant update
    setCount((prev) => prev + quantity);

    // Sync backend
    refreshCart();
  };

  /* --------------------------------------------
      UPDATE QUANTITY
  --------------------------------------------- */
  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1) return;

    const guestId = getGuestId();

    await fetch(absoluteUrl("/api/cart/update"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "guest-id": guestId,
      },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    refreshCart();
  };

  /* --------------------------------------------
      REMOVE ITEM
  --------------------------------------------- */
  const removeFromCart = async (productId: string) => {
    const guestId = getGuestId();

    await fetch(absoluteUrl("/api/cart/remove"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "guest-id": guestId,
      },
      body: JSON.stringify({ productId }),
    });

    refreshCart();
  };

  /* --------------------------------------------
      ON MOUNT
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
