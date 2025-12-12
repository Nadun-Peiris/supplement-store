"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./orderDetails.css";
import { auth } from "@/lib/firebase";
import { Package, CheckCircle, XCircle, Clock } from "lucide-react";

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
  shippingMethod: string;
  paymentProvider: string;
  billingDetails: any;
  items: OrderItem[];
  nextBillingDate?: string;
}

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setOrder(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();

        const res = await fetch(`/api/dashboard/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setOrder(null);
        } else {
          const data = await res.json();
          setOrder(data.order || null);
        }
      } catch (err) {
        console.error("Order detail error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  const renderStatus = () => {
    if (!order) return null;

    switch (order.status) {
      case "paid":
        return (
          <>
            <CheckCircle className="status-icon success" size={20} />
            <span className="status success">Paid</span>
          </>
        );
      case "pending":
        return (
          <>
            <Clock className="status-icon pending" size={20} />
            <span className="status pending">Pending</span>
          </>
        );
      default:
        return (
          <>
            <XCircle className="status-icon failed" size={20} />
            <span className="status failed">Failed</span>
          </>
        );
    }
  };

  if (loading) return <p className="order-loading">Loading...</p>;
  if (!order) return <p className="order-empty">Order not found.</p>;

  return (
    <div className="orderDetails-container">

      <h1 className="order-title">
        Order #{order._id.slice(-6)}
      </h1>

      <div className="order-card">

        <div className="order-header">
          <Package className="order-icon" size={22} />

          <div className="order-info">
            <h3>Order Summary</h3>
            <p>{new Date(order.createdAt).toLocaleString()}</p>
          </div>

          <div className="order-status-wrapper">
            {renderStatus()}
          </div>
        </div>

        {/* Items */}
        <div className="order-section">
          <h4>Items</h4>

          {order.items.map((item, idx) => (
            <div key={idx} className="item-row">
              <span>{item.name} × {item.quantity}</span>
              <strong>LKR {item.price * item.quantity}</strong>
            </div>
          ))}
        </div>

        <div className="divider"></div>

        {/* Details Grid */}
        <div className="details-grid">
          <div>
            <h4>Order Type</h4>
            <p className="badge">{order.orderType}</p>
          </div>

          <div>
            <h4>Shipping</h4>
            <p className="badge">{order.shippingMethod}</p>
          </div>

          <div>
            <h4>Payment</h4>
            <p className="badge">{order.paymentProvider}</p>
          </div>

          {order.orderType === "subscription" && order.nextBillingDate && (
            <div>
              <h4>Next Billing</h4>
              <p>{new Date(order.nextBillingDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        <div className="divider"></div>

        {/* Billing Details */}
        <div className="billing-section">
          <h4>Billing Details</h4>
          <p>{order.billingDetails.firstName} {order.billingDetails.lastName}</p>
          <p>{order.billingDetails.email}</p>
          <p>{order.billingDetails.phone}</p>
          <p>
            {order.billingDetails.street}, {order.billingDetails.city},{" "}
            {order.billingDetails.country}
          </p>
        </div>

        <div className="divider"></div>

        {/* Total */}
        <div className="total-row">
          <span>Total</span>
          <strong>LKR {order.total.toLocaleString()}</strong>
        </div>

      </div>

    </div>
  );
}
