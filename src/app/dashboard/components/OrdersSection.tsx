"use client";

import { useEffect, useState } from "react";
import "./OrdersSection.css";
import { auth } from "@/lib/firebase";

export default function OrdersSection() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const token = await auth.currentUser?.getIdToken();

        const res = await fetch("/api/dashboard/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Orders load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card orders-section">
        <h3 className="orders-title">Latest Orders</h3>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-card orders-section">
      <h3 className="orders-title">Latest Orders</h3>

      {orders.length === 0 && <p>No orders found.</p>}

      <div className="orders-list">
        {orders.slice(0, 5).map((order) => (
          <div key={order._id} className="order-item">
            <div className="order-left">
              <p className="order-id">#{order._id.slice(-6)}</p>
              <p className="order-type">
                {order.orderType === "subscription"
                  ? "Subscription"
                  : "One-Time Purchase"}
              </p>
            </div>

            <div className="order-middle">
              <span className="order-total">LKR {order.total}</span>
            </div>

            <div className="order-right">
              <span className={`order-status ${order.status}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
