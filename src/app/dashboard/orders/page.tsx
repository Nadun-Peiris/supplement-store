"use client";

import { useEffect, useState } from "react";
import "./orders.css";
import { auth } from "@/lib/firebase";
import { Package, Clock, CheckCircle, XCircle } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  orderType: string;
  total: number;
  paymentProvider: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();

        const res = await fetch("/api/orders/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="status-icon success" size={18} />;
      case "pending":
        return <Clock className="status-icon pending" size={18} />;
      case "failed":
        return <XCircle className="status-icon failed" size={18} />;
      default:
        return <Clock className="status-icon pending" size={18} />;
    }
  };

  return (
    <div className="orders-container">
      <h2 className="orders-title">Your Orders</h2>

      {loading ? (
        <p className="loading-text">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="empty-text">You haven’t placed any orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div
              key={order._id}
              className="order-card"
              onClick={() =>
                (window.location.href = `/dashboard/orders/${order._id}`)
              }
            >
              <div className="order-card-header">
                <Package size={20} className="order-icon" />
                <div className="order-info">
                  <h4>Order #{order._id.slice(-6)}</h4>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="order-status">
                  {statusIcon(order.status)}
                  <span className={`status-badge ${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items.slice(0, 2).map((item, idx) => (
                  <p key={idx}>
                    {item.name} × {item.quantity}
                  </p>
                ))}

                {order.items.length > 2 && (
                  <p className="more-items">
                    + {order.items.length - 2} more items
                  </p>
                )}
              </div>

              <div className="order-footer">
                <span className="order-type">{order.orderType}</span>
                <strong>LKR {order.total.toLocaleString()}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
