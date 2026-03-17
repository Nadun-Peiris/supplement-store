"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { CreditCard, Calendar, CheckCircle, XCircle, RefreshCw, AlertCircle, ArrowLeft, Ban } from "lucide-react";
import toast from "react-hot-toast";

interface SubscriptionItem {
  name: string;
  quantity: number;
  price: number;
}

interface Subscription {
  _id: string;
  subscriptionId: string;
  status: "active" | "cancelled" | "completed";
  createdAt: string;
  nextBillingDate?: string;
  lastPaymentDate?: string;
  recurrence: string;
  totalInstallmentsPaid: number;
  items: SubscriptionItem[];
}

const LoadingSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-[#d9f6ff] bg-white p-5">
        <div className="flex flex-col gap-2">
          <div className="h-2.5 w-[140px] animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-[240px] animate-pulse rounded-full bg-gray-100" />
        </div>
        <div className="h-8 w-[100px] animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="rounded-2xl border border-[#e8ecf2] bg-white p-5">
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[1.4fr_1fr]">
          <div className="h-[300px] animate-pulse rounded-xl bg-gray-50" />
          <div className="h-[300px] animate-pulse rounded-xl bg-gray-50" />
        </div>
      </div>
    </div>
  );
};

export default function SubscriptionDetailsPage() {
  const { subscriptionId } = useParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const formatBillingCycle = (recurrence?: string) => {
    if (!recurrence) return "Recurring plan";

    const normalized = recurrence.trim().toLowerCase();

    if (normalized === "1 month") return "Monthly plan";
    if (normalized === "1 week") return "Weekly plan";
    if (normalized === "1 year") return "Yearly plan";

    return `Renews every ${recurrence}`;
  };

  useEffect(() => {
    const id = Array.isArray(subscriptionId) ? subscriptionId[0] : subscriptionId;
    if (!id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();

        const res = await fetch(`/api/subscriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error("Subscription detail error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [subscriptionId]);

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel this subscription? This action cannot be undone.")) return;
    
    setCancelling(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/subscriptions/${subscription?._id}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success("Subscription cancelled successfully.");
        setSubscription((prev) => prev ? { ...prev, status: "cancelled" } : null);
      } else {
        toast.error("Failed to cancel subscription.");
      }
    } catch {
      toast.error("An error occurred.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "bg-[#e8f9ef]", text: "text-[#2ecc71]", border: "border-[#2ecc71]/20", icon: RefreshCw, label: "Active" };
      case "cancelled":
        return { bg: "bg-[#ffe6e6]", text: "text-[#e74c3c]", border: "border-[#e74c3c]/20", icon: XCircle, label: "Cancelled" };
      case "completed":
        return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: CheckCircle, label: "Completed" };
      default:
        return { bg: "bg-[#fff6d6]", text: "text-[#d4a800]", border: "border-[#f1c40f]/20", icon: AlertCircle, label: status };
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!subscription) return <p className="mt-10 text-center text-base text-gray-500">Subscription not found.</p>;

  const statusConfig = getStatusConfig(subscription.status);
  const StatusIcon = statusConfig.icon;
  const cycleTotal = subscription.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8">
      {/* BACK BUTTON */}
      <button 
        className="inline-flex items-center self-start gap-1.5 rounded-[10px] border border-[#d9f6ff] bg-[#f0fbff] px-3 py-2 text-sm font-semibold text-[#0f172a] transition-all duration-200 hover:border-[#00c7fc] hover:shadow-[0_6px_14px_rgba(0,199,252,0.16)]"
        onClick={() => window.history.back()}
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* HERO SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#d9f6ff] bg-[linear-gradient(135deg,#f5fcff_0%,#eaf9ff_100%)] p-5 px-6">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#5f89a1]">
            Subscription #{subscription._id.slice(-6)}
          </p>
          <h1 className="text-[26px] font-bold text-[#0f172a]">Subscription Details</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <span className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
            <StatusIcon size={14} className={subscription.status === "active" ? "animate-spin-slow" : ""} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="rounded-2xl border border-[#d9f6ff] bg-white p-5 shadow-[0_10px_30px_rgba(9,30,66,0.04)]">
        <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-[1.4fr_1fr]">
          
          {/* LEFT BLOCK (Items & Totals) */}
          <div className="flex flex-col gap-3 rounded-[14px] border border-[#d9f6ff] bg-[#f9feff] p-4">
            <div className="flex items-center gap-3 border-b border-[#d9f6ff] pb-4">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#e6faff] text-[#00c7fc]">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#0f172a]">Your Plan</p>
                <p className="text-xs font-medium text-[#6e7c90]">
                  {formatBillingCycle(subscription.recurrence)}
                </p>
              </div>
            </div>

            {/* Item List */}
            <div className="mt-2">
              <div className="flex flex-col gap-2">
                {subscription.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-xl border border-[#e9eff7] bg-white px-3 py-2.5">
                    <div>
                      <p className="font-semibold text-[#0f172a]">{item.name}</p>
                      <p className="text-[13px] text-[#6e7c90]">Qty: {item.quantity}</p>
                    </div>
                    <strong className="text-[#0f172a]">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Row */}
            <div className="mt-4 flex items-center justify-between rounded-xl bg-[#e6faff] p-4">
              <p className="font-bold text-[#0f172a]">Total per cycle</p>
              <p className="text-[20px] font-extrabold text-[#00c7fc]">
                LKR {cycleTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* RIGHT BLOCK (Details & Actions) */}
          <div className="flex flex-col justify-between gap-4 rounded-[14px] border border-[#d9f6ff] bg-white p-4">
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-1 text-xs text-[#6e7c90]">Payments Made</p>
                <p className="text-lg font-bold text-[#0f172a]">{subscription.totalInstallmentsPaid}</p>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-1 text-xs text-[#6e7c90]">Started On</p>
                <p className="text-[14px] font-bold text-[#0f172a]">
                  {new Date(subscription.createdAt).toLocaleDateString()}
                </p>
              </div>

              {subscription.lastPaymentDate && (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="mb-1 text-xs text-[#6e7c90]">Last Payment</p>
                  <p className="text-[14px] font-bold text-[#0f172a]">
                    {new Date(subscription.lastPaymentDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.status === "active" && subscription.nextBillingDate && (
                <div className="rounded-xl border border-[#2ecc71]/30 bg-[#e8f9ef] p-3">
                  <p className="mb-1 text-xs font-bold text-[#2ecc71]">Next Billing Date</p>
                  <p className="flex items-center gap-1.5 text-[14px] font-bold text-[#0f172a]">
                    <Calendar size={14} className="text-[#2ecc71]" />
                    {new Date(subscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Cancel Action */}
            {subscription.status === "active" && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e74c3c] bg-white py-3 text-sm font-bold text-[#e74c3c] transition-all hover:bg-[#ffe6e6] disabled:opacity-50"
                >
                  <Ban size={16} />
                  {cancelling ? "Cancelling..." : "Cancel Subscription"}
                </button>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
