"use client";

import { useEffect, useState } from "react";
import "./subscription.css";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

interface SubscriptionData {
  id: string | null;
  active: boolean;
  status: string | null;
  nextBillingDate: string | null;
  lemonCustomerId: string | null;
  cancelledAt: string | null;
}

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch("/api/dashboard/subscription", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setSubscription(data.subscription ?? null);
      } catch (err) {
        console.error("Failed to load subscription", err);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function cancelSubscription() {
    if (!confirm("Are you sure you want to cancel your subscription?")) return;

    setCancelling(true);

    const user = auth.currentUser;
    const token = await user?.getIdToken();

    const res = await fetch("/api/dashboard/subscription/cancel", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setCancelling(false);

    if (data.success) {
      alert("Subscription canceled.");
      window.location.reload();
    } else {
      alert("Failed to cancel subscription.");
    }
  }

  if (loading) return <p className="sub-loading">Loading...</p>;

  return (
    <div className="sub-container">
      <h1 className="sub-title">Subscription</h1>

      <div className="sub-card">
        {/* Status */}
        <div className="sub-status">
          <span>Status:</span>

          <strong
            className={
              subscription?.active
                ? "sub-active"
                : subscription?.status === "cancelled"
                ? "sub-cancelled"
                : "sub-inactive"
            }
          >
            {subscription?.active
              ? "Active"
              : subscription?.status === "cancelled"
              ? "Cancelled"
              : "Inactive"}
          </strong>
        </div>

        {/* Next Billing */}
        <div className="sub-row">
          <span>Next Billing Date:</span>
          <strong>
            {subscription?.nextBillingDate
              ? new Date(subscription.nextBillingDate).toLocaleDateString()
              : "—"}
          </strong>
        </div>

        {/* Plan ID */}
        <div className="sub-row">
          <span>Plan ID:</span>
          <strong>{subscription?.id ?? "—"}</strong>
        </div>

        {/* Lemon Customer ID */}
        <div className="sub-row">
          <span>Lemon Customer:</span>
          <strong>{subscription?.lemonCustomerId ?? "—"}</strong>
        </div>

        {/* Cancel Button */}
        {subscription?.active && (
          <button
            className="sub-cancel-btn"
            disabled={cancelling}
            onClick={cancelSubscription}
          >
            {cancelling ? "Cancelling..." : "Cancel Subscription"}
          </button>
        )}
      </div>
    </div>
  );
}
