"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  paymentStatus: string;       // FIXED: Matched to your DB model
  fulfillmentStatus: string;   // FIXED: Added to track shipping state
  orderType: string;
  subscriptionId?: string | null;
  total: number;
  paymentProvider: string;
  items: OrderItem[];
}

const LoadingSkeleton = () => {
  const placeholders = Array.from({ length: 3 });

  return (
    <div className="grid gap-4">
      {placeholders.map((_, idx) => (
        <div
          key={idx}
          className="pointer-events-none rounded-[14px] border border-[#eee] bg-white p-[18px]"
        >
          {/* HEADER SKELETON */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-32 animate-pulse rounded-full bg-gray-100" />
                <div className="h-2 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-16 animate-pulse rounded-md bg-gray-100" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
            </div>
          </div>

          {/* ITEMS SKELETON */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="h-3 w-3/4 max-w-[260px] animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-1/2 max-w-[140px] animate-pulse rounded-full bg-gray-100" />
          </div>

          {/* FOOTER SKELETON */}
          <div className="mt-5 flex items-center justify-between">
            <div className="h-6 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-20 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to format labels like "standard_shipping" to "Standard Shipping"
  const formatLabel = (value?: string) => {
    if (!value) return "--";
    return value
      .toString()
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;

      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();

        const res = await fetch("/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (isMounted) setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="text-[#2ecc71]" size={16} />;
      case "pending":
        return <Clock className="text-[#f1c40f]" size={16} />;
      case "failed":
        return <XCircle className="text-[#e74c3c]" size={16} />;
      default:
        return <Clock className="text-[#f1c40f]" size={16} />;
    }
  };

  const getFulfillmentStyle = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "unfulfilled":
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="mb-6 text-[22px] font-bold text-[#111]">Your Orders</h2>

      {loading ? (
        <LoadingSkeleton />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-16 text-center">
          <p className="text-[15px] font-medium text-gray-500">
            You haven’t placed any orders yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="group cursor-pointer rounded-[14px] border border-[#eee] bg-white p-[18px] transition-all duration-200 hover:border-[#03c7fe] hover:shadow-[0_4px_14px_rgba(3,199,254,0.12)]"
              onClick={() =>
                (window.location.href = `/dashboard/orders/${order._id}`)
              }
            >
              {/* HEADER */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#03c7fe]/10 text-[#03c7fe] transition-colors group-hover:bg-[#03c7fe] group-hover:text-white">
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 className="text-[16px] font-extrabold text-[#111]">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </h4>
                    <p className="text-[13px] font-medium text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {order.orderType === "subscription" && order.subscriptionId && (
                      <p className="mt-1 text-[12px] font-semibold text-[#03c7fe]">
                        Subscription ID: {order.subscriptionId}
                      </p>
                    )}
                  </div>
                </div>

                {/* BADGES: Payment & Fulfillment */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${
                      order.paymentStatus === "paid"
                        ? "border-[#2ecc71]/20 bg-[#e8f9ef] text-[#2ecc71]"
                        : order.paymentStatus === "failed"
                        ? "border-[#e74c3c]/20 bg-[#ffe6e6] text-[#e74c3c]"
                        : "border-[#f1c40f]/20 bg-[#fff6d6] text-[#d4a800]"
                    }`}
                  >
                    {getPaymentIcon(order.paymentStatus)}
                    {formatLabel(order.paymentStatus)}
                  </span>
                  
                  <span
                    className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${getFulfillmentStyle(
                      order.fulfillmentStatus
                    )}`}
                  >
                    {order.fulfillmentStatus === "shipped" && <Truck size={14} />}
                    {formatLabel(order.fulfillmentStatus || "unfulfilled")}
                  </span>
                </div>
              </div>

              {/* ITEMS */}
              <div className="mt-5 flex flex-col gap-1.5 text-[14px] font-medium text-[#444]">
                {order.items.slice(0, 2).map((item, idx) => (
                  <p key={idx} className="flex justify-between sm:justify-start sm:gap-4">
                    <span>{item.name}</span>
                    <span className="text-gray-400">× {item.quantity}</span>
                  </p>
                ))}

                {order.items.length > 2 && (
                  <p className="mt-1 text-[12px] font-bold text-[#03c7fe]">
                    + {order.items.length - 2} more items
                  </p>
                )}
              </div>

              {/* FOOTER */}
              <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-gray-600">
                  {formatLabel(order.orderType)}
                </span>
                <strong className="text-[18px] font-black text-[#111]">
                  LKR {order.total.toLocaleString()}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
