"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Lottie from "lottie-react";
import "../../register/success/success.css";

interface Order {
  _id: string;
  status: string;
  orderType: string;
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
        <div className="success-container">
          <div className="success-card fade-in">
            <p className="success-sub">Loading your order...</p>
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

  const [animationData, setAnimationData] = useState<any>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        setOrder(data.order || null);
      } catch (err) {
        console.error("Error loading order:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId]);

  // Clear cart ONLY IF Lemon + payment confirmed
  useEffect(() => {
    if (!order) return; // ⛔ prevents null access

    const isLemon =
        order.paymentProvider === "lemon_one_time" ||
        order.paymentProvider === "lemon_subscription";

    if (isLemon && order.status === "paid") {
        const guestId = localStorage.getItem("guestId") || "";

        fetch("/api/cart", {
        method: "DELETE",
        headers: { "guest-id": guestId },
        });

        if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        }
    }
  }, [order]);

  const getMessage = () => {
    if (!order) return "Processing...";

    if (order.paymentProvider === "bank_transfer") {
      return "Your order has been placed. Please complete your bank transfer.";
    }

    if (order.paymentProvider === "lemon_one_time") {
      if (order.status === "paid") {
        return "Your payment was successful! 🎉";
      }
      return "Your card payment is processing...";
    }

    if (order.paymentProvider === "lemon_subscription") {
      if (order.status === "paid") {
        return "Your subscription is active! 🎉";
      }
      return "Your subscription payment is processing...";
    }

    return "Thank you for your purchase!";
  };

  return (
    <div className="success-container">
      <div className="success-card fade-in">
        <div className="lottie-wrapper">
          {animationData && (
            <Lottie animationData={animationData} loop={false} />
          )}
        </div>

        <h2 className="success-title">Order Received 🎉</h2>

        <p className="success-sub">{getMessage()}</p>

        <p className="success-sub">
          Order ID: <strong>{orderId}</strong>
        </p>

        {!loading && order && (
          <p className="success-sub">
            Status:{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {order.status}
            </strong>
          </p>
        )}

        {!loading && order && (
          <p className="success-sub">
            Paid via:{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {order.paymentProvider.replace("_", " ")}
            </strong>
          </p>
        )}

        {!loading && order && (
          <div className="order-summary-box">
            <h4>Order Summary</h4>
            {order.items.map((item, index) => (
              <p key={index} className="success-sub">
                {item.name} × {item.quantity} — LKR{" "}
                {item.price * item.quantity}
              </p>
            ))}

            <p className="success-sub total-line">
              Total: <strong>LKR {order.total}</strong>
            </p>
          </div>
        )}

        <a href="/dashboard" className="success-btn">
          Go to dashboard →
        </a>
      </div>
    </div>
  );
}
