"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Lottie from "lottie-react";

interface Order {
  _id: string;
  paymentStatus: string;
  orderType: string;
  subscriptionId?: string | null;
  paymentProvider: string;
  total: number;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] w-full items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#111]" />
            <p className="text-[15px] font-medium text-gray-500">Loading your order...</p>
          </div>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("orderId") || params.get("order");

  const [animationData, setAnimationData] = useState<object | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const orderNumber = order?._id || orderId;

  // Load animation
  useEffect(() => {
    fetch("/lottie/success.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) =>
        console.error("Failed to load success animation", err)
      );
  }, []);

  // Load the order details
  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (cancelled) return;

        const nextOrder = data.order || null;
        setOrder(nextOrder);

        const shouldPoll =
          nextOrder &&
          nextOrder.paymentProvider === "payhere" &&
          nextOrder.paymentStatus === "pending";

        if (shouldPoll) {
          timeoutId = setTimeout(fetchOrder, 2500);
          return;
        }
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchOrder();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId]);

  const isSubscription = order?.orderType === "subscription";

  const getMessage = () => {
    if (!order) return "Processing...";

    if (order.paymentProvider === "bank_transfer") {
      return "Your order has been placed. Please complete your bank transfer.";
    }

    if (order.paymentProvider === "payhere") {
      if (order.orderType === "subscription") {
        if (order.paymentStatus === "paid") {
          return "Your subscription is active! 🎉";
        }
        return "Your subscription payment is processing...";
      }

      if (order.paymentStatus === "paid") {
        return "Your payment was successful! 🎉";
      }
      return "Your card payment is processing...";
    }

    return "Thank you for your purchase!";
  };

  return (
    <div className="flex min-h-[75vh] w-full items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-lg animate-[fadeIn_0.5s_ease-out] rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-10">
        
        {/* LOTTIE ANIMATION WRAPPER */}
        <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center">
          {animationData ? (
            <Lottie animationData={animationData} loop={false} />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gray-50" /> // Placeholder while lottie loads
          )}
        </div>

        <h2 className="mb-3 text-3xl font-black tracking-tight text-[#111]">
          {isSubscription ? "Subscription Active" : "Order Received"}
        </h2>

        <p className="mb-6 text-[15px] font-medium text-gray-500">{getMessage()}</p>

        <div className="mb-8 flex flex-col gap-2 text-[14px]">
          <p className="text-gray-500">
            Order No: <strong className="text-[#111]">{orderNumber}</strong>
          </p>

          <p className="text-gray-500">
            Order ID: <strong className="text-[#111]">{orderId}</strong>
          </p>

          {!loading && order && (
            <p className="text-gray-500">
              Order type:{" "}
              <strong className="text-[#111]">
                {order.orderType === "subscription"
                  ? "Subscription Order"
                  : "Normal Order"}
              </strong>
            </p>
          )}

          {!loading && order?.orderType === "subscription" && order.subscriptionId && (
            <p className="text-gray-500">
              Subscription ID:{" "}
              <strong className="text-[#111]">{order.subscriptionId}</strong>
            </p>
          )}

          {!loading && order && (
            <p className="text-gray-500">
              Payment status:{" "}
              <strong className="capitalize text-[#111]">
                {order.paymentStatus}
              </strong>
            </p>
          )}

          {!loading && order && (
            <p className="text-gray-500">
              Paid via:{" "}
              <strong className="capitalize text-[#111]">
                {order.paymentProvider.replace("_", " ")}
              </strong>
            </p>
          )}
        </div>

        {/* ORDER SUMMARY BOX */}
        {!loading && order && (
          <div className="mt-8 rounded-2xl border border-gray-100 bg-[#f8f8f8] p-6 text-left">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
              Order Summary
            </h4>
            
            <div className="flex flex-col gap-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-[14px] font-medium text-gray-600">
                  <span className="flex-1 pr-4">
                    {item.name} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="text-[#111]">
                    LKR {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-gray-200 pt-4 text-lg font-black text-[#111]">
              <span>Total</span>
              <span>LKR {order.total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* DASHBOARD BUTTON */}
        <a 
          href="/dashboard" 
          className="mt-8 block w-full rounded-full bg-[#111] py-4 text-center text-[15px] font-bold tracking-wide text-white transition-all duration-200 hover:bg-black hover:shadow-md active:scale-[0.98]"
        >
          Go to dashboard →
        </a>
      </div>
    </div>
  );
}
