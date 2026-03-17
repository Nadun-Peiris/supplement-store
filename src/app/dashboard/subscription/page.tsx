"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { CreditCard, Calendar, CheckCircle, XCircle, RefreshCw, AlertCircle } from "lucide-react";

interface SubscriptionItem {
  name: string;
  quantity: number;
  price: number;
}

interface Subscription {
  _id: string;
  subscriptionId: string;
  status: string;
  createdAt: string;
  nextBillingDate?: string;
  lastPaymentDate?: string;
  recurrence: string;
  totalInstallmentsPaid: number;
  items: SubscriptionItem[];
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
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="flex flex-col gap-2">
                <div className="h-3 w-32 animate-pulse rounded-full bg-gray-100" />
                <div className="h-2 w-20 animate-pulse rounded-full bg-gray-100" />
              </div>
            </div>
            <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
          </div>

          {/* ITEMS SKELETON */}
          <div className="mt-5 flex flex-col gap-2">
            <div className="h-3 w-3/4 max-w-[260px] animate-pulse rounded-full bg-gray-100" />
          </div>

          {/* FOOTER SKELETON */}
          <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
            <div className="h-4 w-24 animate-pulse rounded-md bg-gray-100" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const formatBillingCycle = (recurrence?: string) => {
    if (!recurrence) return "Recurring plan";

    const normalized = recurrence.trim().toLowerCase();

    if (normalized === "1 month") return "Monthly plan";
    if (normalized === "1 week") return "Weekly plan";
    if (normalized === "1 year") return "Yearly plan";

    return `Renews every ${recurrence}`;
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return;

      if (!user) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();

        // This assumes you will create an API route at this endpoint
        const res = await fetch("/api/subscriptions/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (isMounted) setSubscriptions(data.subscriptions || []);
      } catch (err) {
        console.error("Failed to load subscriptions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h2 className="mb-6 text-[22px] font-bold text-[#111]">Your Subscriptions</h2>

      {loading ? (
        <LoadingSkeleton />
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 py-16 text-center">
          <p className="text-[15px] font-medium text-gray-500">
            You don&apos;t have any active subscriptions.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => {
            const statusConfig = getStatusConfig(sub.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={sub._id}
                className="group cursor-pointer rounded-[14px] border border-[#eee] bg-white p-[18px] transition-all duration-200 hover:border-[#03c7fe] hover:shadow-[0_4px_14px_rgba(3,199,254,0.12)]"
                onClick={() =>
                  (window.location.href = `/dashboard/subscription/${sub._id}`)
                }
              >
                {/* HEADER */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#03c7fe]/10 text-[#03c7fe] transition-colors group-hover:bg-[#03c7fe] group-hover:text-white">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h4 className="text-[16px] font-extrabold text-[#111]">
                        Subscription #{sub._id.slice(-6).toUpperCase()}
                      </h4>
                      <p className="text-[13px] font-medium text-gray-500">
                        Started {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* STATUS BADGE */}
                  <span
                    className={`flex w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                  >
                    <StatusIcon size={14} className={sub.status === "active" ? "animate-spin-slow" : ""} />
                    {statusConfig.label}
                  </span>
                </div>

                {/* ITEMS */}
                <div className="mt-5 flex flex-col gap-1.5 text-[14px] font-medium text-[#444]">
                  {sub.items.slice(0, 2).map((item, idx) => (
                    <p key={idx} className="flex justify-between sm:justify-start sm:gap-4">
                      <span>{item.name}</span>
                      <span className="text-gray-400">× {item.quantity}</span>
                    </p>
                  ))}
                  {sub.items.length > 2 && (
                    <p className="mt-1 text-[12px] font-bold text-[#03c7fe]">
                      + {sub.items.length - 2} more items
                    </p>
                  )}
                </div>

                {/* FOOTER - NEXT BILLING INFO */}
                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-4">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[12px] font-bold uppercase tracking-wide text-gray-600">
                      {formatBillingCycle(sub.recurrence)}
                    </span>
                    <span className="text-[13px] font-medium text-gray-500">
                      {sub.totalInstallmentsPaid} Payments Made
                    </span>
                  </div>
                  
                  {sub.status === "active" && sub.nextBillingDate && (
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#111]">
                      <Calendar size={16} className="text-[#03c7fe]" />
                      Next Charge: {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
