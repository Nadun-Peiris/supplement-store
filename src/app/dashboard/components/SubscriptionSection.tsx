"use client";

import { useEffect, useState } from "react";
import "./SubscriptionSection.css";
import { auth } from "@/lib/firebase";

export default function SubscriptionSection() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/dashboard/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSubscription(data.subscription || null);
      } catch (err) {
        console.error("Failed to load subscription", err);
      } finally {
        setLoading(false);
      }
    }

    loadSubscription();
  }, []);

  async function cancelSubscription() {
    if (!subscription?.id) return;

    try {
      setCancelLoading(true);
      const token = await auth.currentUser?.getIdToken();

      const res = await fetch("/api/dashboard/subscription/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscriptionId: subscription.id }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Subscription cancelled successfully.");
        window.location.reload();
      } else {
        alert("Failed to cancel subscription.");
      }
    } catch (err) {
      console.error("Cancel subscription error:", err);
      alert("Error cancelling subscription.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return <div className="dashboard-card sub-card">Loading...</div>;
  }

  return (
    <div className="dashboard-card sub-card">
      <h3 className="sub-title">Subscription Status</h3>

      {!subscription?.id ? (
        <p className="sub-none">You do not have an active subscription.</p>
      ) : (
        <div className="sub-content">
          <div className="sub-row">
            <span>Status:</span>
            <span
              className={`sub-badge ${
                subscription.active ? "active" : "inactive"
              }`}
            >
              {subscription.active ? "Active" : "Inactive"}
            </span>
          </div>

          <div className="sub-row">
            <span>Next Billing:</span>
            <strong>
              {subscription.nextBillingDate
                ? new Date(subscription.nextBillingDate).toLocaleDateString()
                : "N/A"}
            </strong>
          </div>

          <div className="sub-row">
            <span>Subscription ID:</span>
            <strong>{subscription.id}</strong>
          </div>

          {subscription.active && (
            <button
              className="cancel-btn"
              onClick={cancelSubscription}
              disabled={cancelLoading}
            >
              {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
