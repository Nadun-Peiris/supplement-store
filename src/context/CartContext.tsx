"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";
import { auth } from "@/lib/firebase";

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

  const getCartHeaders = useCallback(async () => {
    const headers: Record<string, string> = {};
    const currentUser = auth.currentUser;

    if (currentUser) {
      headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
    } else {
      headers["guest-id"] = getGuestId();
    }

    return headers;
  }, []);

  /* --------------------------------------------
      REFRESH CART
  --------------------------------------------- */
  const refreshCart = useCallback(async () => {
    try {
      const headers = await getCartHeaders();

      const res = await fetch(absoluteUrl("/api/cart"), {
        method: "GET",
        headers,
      });

      const data = await res.json();
      const items: CartItem[] = data.cart?.items || [];

      setCount(items.reduce((sum, i) => sum + i.quantity, 0));
    } catch (err) {
      console.error("Cart refresh failed:", err);
    }
  }, [getCartHeaders]);

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
    const headers = await getCartHeaders();

    const res = await fetch(absoluteUrl("/api/cart"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        productId,
        name,
        price,
        image,
        quantity,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Could not add item to cart");
    }

    // Instant update
    setCount((prev) => prev + quantity);

    // Sync backend
    void refreshCart();
  };

  /* --------------------------------------------
      UPDATE QUANTITY
  --------------------------------------------- */
  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1) return;

    const headers = await getCartHeaders();

    const res = await fetch(absoluteUrl("/api/cart/update"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Could not update cart");
    }

    void refreshCart();
  };

  /* --------------------------------------------
      REMOVE ITEM
  --------------------------------------------- */
  const removeFromCart = async (productId: string) => {
    const headers = await getCartHeaders();

    const res = await fetch(absoluteUrl("/api/cart/remove"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || "Could not remove item from cart");
    }

    void refreshCart();
  };

  /* --------------------------------------------
      ON MOUNT
  --------------------------------------------- */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshCart();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshCart]);

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
