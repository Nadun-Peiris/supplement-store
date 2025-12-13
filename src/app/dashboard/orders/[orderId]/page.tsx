"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./orderDetails.css";
import { auth } from "@/lib/firebase";
import { Package, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";

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

const LoadingSkeleton = () => {
  return (
    <div className="orderDetails-container">
      <div className="order-hero skeleton-hero">
        <div>
          <div className="skeleton-line skeleton-kicker" />
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
        </div>
        <div className="order-hero-right">
          <div className="skeleton-pill pill-wide" />
          <div className="status-chip">
            <div className="skeleton-circle small" />
            <div className="skeleton-line skeleton-short" />
          </div>
        </div>
      </div>

      <div className="order-card skeleton-card">
        <div className="order-grid">
          <div className="order-block">
            <div className="order-header">
              <div className="order-icon-wrap">
                <div className="skeleton-circle" />
              </div>
              <div>
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-medium" />
              </div>
              <div>
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-medium" />
              </div>
            </div>

            <div className="order-section">
              <div className="section-header">
                <div className="skeleton-line skeleton-medium" />
                <div className="skeleton-pill" />
              </div>

              <div className="item-list">
                {[1, 2, 3].map((idx) => (
                  <div key={idx} className="item-row card-row">
                    <div>
                      <div className="skeleton-line skeleton-medium" />
                      <div className="skeleton-line skeleton-short" />
                    </div>
                    <div className="skeleton-line skeleton-short" />
                  </div>
                ))}
              </div>
            </div>

            <div className="total-row total-card">
              <div>
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-medium" />
              </div>
              <div>
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-long" />
              </div>
            </div>
          </div>

          <div className="order-block detail-block">
            <div className="detail-grid">
              {[1, 2, 3].map((idx) => (
                <div key={idx}>
                  <div className="skeleton-line skeleton-label" />
                  <div className="skeleton-line skeleton-medium" />
                </div>
              ))}
            </div>

            <div className="billing-section card-row">
              <div>
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-medium" />
                <div className="skeleton-line skeleton-short" />
                <div className="skeleton-line skeleton-short" />
              </div>
              <div className="billing-address">
                <div className="skeleton-line skeleton-label" />
                <div className="skeleton-line skeleton-long" />
                <div className="skeleton-line skeleton-long" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingSkeleton />;
  if (!order) return <p className="order-empty">Order not found.</p>;

  return (
    <div className="orderDetails-container">

      <button className="back-button" onClick={() => window.history.back()}>
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="order-hero">
        <div>
          <p className="order-eyebrow">Order #{order._id.slice(-6)}</p>
          <h1 className="order-title">Order Details</h1>
          <p className="order-subtitle">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="order-hero-right">
          <span className="pill pill-muted">{formatLabel(order.orderType)}</span>
          <div className="status-chip">{renderStatus()}</div>
        </div>
      </div>

      <div className="order-card">
        <div className="order-grid">
          <div className="order-block">
            <div className="order-header">
              <div className="order-icon-wrap">
                <Package className="order-icon" size={20} />
              </div>
              <div>
                <p className="order-small">Shipping</p>
                <p className="order-strong">
                  {formatLabel(order.shippingMethod)}
                </p>
              </div>
              <div>
                <p className="order-small">Payment</p>
                <p className="order-strong">
                  {formatLabel(order.paymentProvider)}
                </p>
              </div>
            </div>

            <div className="order-section">
              <div className="section-header">
                <h4>Items</h4>
                <span className="pill">{order.items.length} items</span>
              </div>

              <div className="item-list">
                {order.items.map((item, idx) => (
                  <div key={idx} className="item-row card-row">
                    <div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-qty">Qty: {item.quantity}</p>
                    </div>
                    <strong>LKR {(item.price * item.quantity).toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="total-row total-card">
              <div>
                <p className="order-small">Order Type</p>
                <p className="order-strong">{formatLabel(order.orderType)}</p>
              </div>
              <div>
                <p className="order-small">Total</p>
                <p className="order-total">LKR {order.total.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="order-block detail-block">
            <div className="detail-grid">
              <div>
                <p className="order-small">Status</p>
                <div className="status-chip">{renderStatus()}</div>
              </div>

              {order.orderType === "subscription" && order.nextBillingDate && (
                <div>
                  <p className="order-small">Next Billing</p>
                  <p className="order-strong">
                    {new Date(order.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="order-small">Order ID</p>
                <p className="order-strong monospace">{order._id}</p>
              </div>
            </div>

            <div className="billing-section card-row">
              <div>
                <p className="order-small">Billing Contact</p>
                <p className="order-strong">
                  {order.billingDetails.firstName} {order.billingDetails.lastName}
                </p>
                <p className="order-muted">{order.billingDetails.email}</p>
                <p className="order-muted">{order.billingDetails.phone}</p>
              </div>
              <div className="billing-address">
                <p className="order-small">Address</p>
                <p className="order-muted">
                  {order.billingDetails.street}
                  <br />
                  {order.billingDetails.city}, {order.billingDetails.country}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
