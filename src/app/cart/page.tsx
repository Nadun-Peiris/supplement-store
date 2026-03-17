"use client";

import { useEffect, useState } from "react";
import { absoluteUrl } from "@/lib/absoluteUrl";
import CartItem from "@/components/CartItem";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { refreshCart } = useCart();

  useEffect(() => {
    async function loadCart() {
      let guestId = localStorage.getItem("guestId");
      if (!guestId) {
        guestId = crypto.randomUUID();
        localStorage.setItem("guestId", guestId);
      }

      const res = await fetch(absoluteUrl("/api/cart"), {
        headers: { "guest-id": guestId },
      });

      const data = await res.json();
      setCart(data.cart || { items: [] });

      refreshCart();
      setLoading(false);
    }

    loadCart();
  }, [refreshCart]);

  const updateQuantity = async (productId: string, qty: number) => {
    if (qty < 1) return;

    let guestId = localStorage.getItem("guestId") as string;

    const res = await fetch(absoluteUrl("/api/cart/update"), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "guest-id": guestId,
      },
      body: JSON.stringify({ productId, quantity: qty }),
    });

    const data = await res.json();

    if (res.ok) {
      setCart(data.cart);
      refreshCart();
    } else {
      toast.error(data.error);
    }
  };

  const removeItem = async (productId: string) => {
    let guestId = localStorage.getItem("guestId") as string;

    const res = await fetch(absoluteUrl("/api/cart/remove"), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "guest-id": guestId,
      },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();

    if (res.ok) {
      setCart(data.cart);
      toast.success("Item removed");
      refreshCart();
    }
  };

  const subtotal =
    cart?.items?.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    ) || 0;

  return (
    <div className="w-full bg-white px-6 py-12 md:px-12 lg:px-20 lg:py-16 xl:px-28 2xl:px-40">
      
      {/* HEADER SECTION */}
      <h1 className="mb-2 text-center text-[3rem] font-black tracking-wide text-[#111] md:text-[4.2rem]">
        CART
      </h1>
      <p className="mb-10 text-center text-base font-medium text-gray-400 md:mb-16">
        Home Page • Cart
      </p>

      {/* FULL WIDTH GRID LAYOUT */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_450px] xl:gap-16">
        
        {/* LEFT COLUMN: ITEMS */}
        <div className="flex flex-col gap-5 lg:order-1">
          {loading ? (
            <SkeletonCartItems count={3} />
          ) : cart.items.length === 0 ? (
            <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-20 text-center">
              <p className="text-xl font-medium text-gray-500">Your cart is empty.</p>
            </div>
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

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="h-fit w-full rounded-2xl border border-gray-100 bg-white p-7 shadow-sm lg:order-2 xl:p-9">
          <h3 className="mb-8 text-xl font-black text-[#111] xl:text-2xl">CART TOTALS</h3>

          <div className="mb-6 flex justify-between text-base font-medium text-gray-500">
            <span>Subtotal</span>
            <strong className="text-[#111]">LKR {subtotal.toLocaleString()}</strong>
          </div>

          <div className="mb-8 mt-6 border-t border-gray-100 pt-6">
            <div className="flex justify-between text-2xl font-black text-[#111]">
              <span>Total</span>
              <span>LKR {subtotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            className="w-full cursor-pointer rounded-full bg-[#111] py-4 text-base font-bold tracking-wide text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98]"
            onClick={() => (window.location.href = "/checkout")}
          >
            Proceed to checkout
          </button>
        </div>
      </div>
    </div>
  );
}

// Updated skeleton to span the full width of its new container perfectly
function SkeletonCartItems({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          className="pointer-events-none flex w-full items-center gap-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm max-[600px]:flex-col max-[600px]:items-start"
          key={idx}
        >
          {/* SKELETON: IMAGE */}
          <div className="h-[100px] w-[100px] shrink-0 animate-pulse rounded-xl bg-gray-100 max-[600px]:h-[120px] max-[600px]:w-[120px]" />

          {/* SKELETON: INFO */}
          <div className="flex w-full flex-1 flex-col justify-center gap-3">
            <div className="h-5 w-3/4 max-w-[300px] animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-1/4 min-w-[100px] animate-pulse rounded-md bg-gray-100" />
          </div>

          {/* SKELETON: CONTROLS & SUBTOTAL */}
          <div className="flex items-center gap-10 max-[600px]:w-full max-[600px]:justify-between max-[600px]:gap-4">
            <div className="h-11 w-[104px] animate-pulse rounded-full bg-gray-100" />
            <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
          </div>
        </div>
      ))}
    </>
  );
}