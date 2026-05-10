"use client";

import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  Activity,
  ArrowRight,
  Calendar,
  CreditCard,
  Droplets,
  Package,
  RefreshCw,
  Scale,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface DashboardOrderItem {
  name?: string;
  quantity?: number;
}

interface DashboardOrder {
  _id?: string;
  createdAt?: string;
  fulfillmentStatus?: string;
  total?: number;
  orderType?: "normal" | "subscription";
  subscriptionId?: string | null;
  items?: DashboardOrderItem[];
}

interface DashboardSubscriptionItem {
  name?: string;
  quantity?: number;
}

interface DashboardSubscription {
  _id?: string;
  subscriptionId?: string;
  status?: string;
  createdAt?: string;
  nextBillingDate?: string;
  recurrence?: string;
  totalInstallmentsPaid?: number;
  items?: DashboardSubscriptionItem[];
}

type DashboardHealthResponse = {
  logs?: Array<{
    weight?: string;
    waterIntake?: number;
  }>;
};

interface DashboardData {
  fullName: string;
  weight: string;
  waterIntake: number;
  totalOrders: number;
  recentOrders: DashboardOrder[];
  subscriptions: DashboardSubscription[];
}

const emptyData: DashboardData = {
  fullName: "User",
  weight: "--",
  waterIntake: 0,
  totalOrders: 0,
  recentOrders: [],
  subscriptions: [],
};

function formatCurrency(value?: number) {
  return `LKR ${(value ?? 0).toLocaleString()}`;
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLabel(value?: string) {
  if (!value) return "Unknown";
  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatBillingCycle(recurrence?: string) {
  if (!recurrence) return "Recurring plan";

  const normalized = recurrence.trim().toLowerCase();
  if (normalized === "1 month") return "Monthly plan";
  if (normalized === "1 week") return "Weekly plan";
  if (normalized === "1 year") return "Yearly plan";

  return `Renews every ${recurrence}`;
}

function getOrderStatusClasses(status?: string) {
  switch (status) {
    case "completed":
    case "fulfilled":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "shipped":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "unfulfilled":
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getSubscriptionStatusClasses(status?: string) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "completed":
      return "border-gray-200 bg-gray-100 text-gray-600";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function summarizeItems(items?: Array<{ name?: string; quantity?: number }>) {
  if (!items?.length) return "No items recorded";
  if (items.length === 1) {
    return `${items[0].name || "Item"} x${items[0].quantity || 1}`;
  }

  return `${items[0].name || "Item"} x${items[0].quantity || 1} + ${
    items.length - 1
  } more`;
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  iconClassName: string;
}) {
  return (
    <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            {title}
          </p>
          <p className="mt-3 text-2xl font-black tracking-tight text-[#111]">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${iconClassName}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500">{detail}</p>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="h-10 w-56 animate-pulse rounded-full bg-gray-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-full bg-gray-100" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
                <div className="mt-3 h-7 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
              <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-3 h-8 w-16 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-2 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, idx) => (
          <div key={idx} className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="h-5 w-40 animate-pulse rounded-full bg-gray-200" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((__, itemIdx) => (
                <div key={itemIdx} className="rounded-2xl border border-gray-100 p-4">
                  <div className="h-4 w-28 animate-pulse rounded-full bg-gray-200" />
                  <div className="mt-3 h-3 w-40 animate-pulse rounded-full bg-gray-100" />
                  <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardLanding() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const token = await user.getIdToken();
        const [profRes, orderRes, subRes, healthRes] = await Promise.all([
          fetch("/api/dashboard/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/orders/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/subscriptions/user", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/health?days=1", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [prof, orders, subs, health] = await Promise.all([
          profRes.json(),
          orderRes.json(),
          subRes.json(),
          healthRes.json(),
        ]);

        const subscriptions = ((subs.subscriptions as DashboardSubscription[]) || []).sort(
          (a, b) =>
            new Date(a.nextBillingDate || a.createdAt || 0).getTime() -
            new Date(b.nextBillingDate || b.createdAt || 0).getTime()
        );
        const orderList = (orders.orders as DashboardOrder[]) || [];
        const healthData = health as DashboardHealthResponse;

        setData({
          fullName: prof.user?.fullName || "User",
          weight: healthData.logs?.[0]?.weight || prof.user?.weight || "--",
          waterIntake: healthData.logs?.[0]?.waterIntake || 0,
          totalOrders: orderList.length,
          recentOrders: orderList.slice(0, 4),
          subscriptions,
        });
      } catch (err) {
        console.error("Dashboard Sync Error", err);
      } finally {
        setLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        setData(emptyData);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const activeSubscriptions = useMemo(
    () => data.subscriptions.filter((subscription) => subscription.status === "active"),
    [data.subscriptions]
  );
  const featuredSubscriptions = activeSubscriptions.slice(0, 3);
  const latestOrder = data.recentOrders[0];
  const nextRenewal = activeSubscriptions[0]?.nextBillingDate;
  const firstName = data.fullName.split(" ")[0] || "User";
  const waterProgress = Math.min((data.waterIntake / 3) * 100, 100);

  if (loading) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[32px] border border-[#d8f3fb] bg-[linear-gradient(135deg,#f8fdff_0%,#eefaff_55%,#ffffff_100%)] p-6 shadow-sm sm:p-8">
          <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-[#03c7fe]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[#111]/[0.03] blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#cdefff] bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#03c7fe]">
                  <Sparkles size={14} />
                  Overview
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-[#111] sm:text-4xl">
                  Welcome back, <span className="text-[#03c7fe]">{firstName}</span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm font-medium text-gray-600 sm:text-base">
                  Your latest dashboard summary for{" "}
                  {new Date().toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                  })}
                  . Orders, subscriptions, and wellness signals are all in one view.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/dashboard/orders"
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#111] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-black"
                >
                  View Orders
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard/subscription"
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#cfeffc] bg-white px-4 py-3 text-sm font-bold text-[#111] transition-all hover:border-[#03c7fe] hover:text-[#03c7fe]"
                >
                  Manage Plans
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Active Subscriptions
                </p>
                <p className="mt-3 text-3xl font-black text-[#111]">{activeSubscriptions.length}</p>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {nextRenewal
                    ? `Next renewal ${formatDate(nextRenewal)}`
                    : "No active billing cycle scheduled"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Paid Orders
                </p>
                <p className="mt-3 text-3xl font-black text-[#111]">{data.totalOrders}</p>
                <p className="mt-2 text-sm font-medium text-gray-500">
                  {latestOrder?._id
                    ? `Latest order #${latestOrder._id.slice(-6).toUpperCase()}`
                    : "No completed orders yet"}
                </p>
              </div>

              <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
                  Hydration Today
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <p className="text-3xl font-black text-[#111]">{data.waterIntake}</p>
                  <span className="pb-1 text-sm font-bold text-gray-400">L</span>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#dff6fd]">
                  <div
                    className="h-full rounded-full bg-[#03c7fe] transition-all duration-700"
                    style={{ width: `${waterProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <MetricCard
            title="Body Weight"
            value={`${data.weight} kg`}
            detail="Pulled from your latest health log."
            icon={Scale}
            iconClassName="bg-gray-100 text-gray-700"
          />
          <MetricCard
            title="Latest Order"
            value={latestOrder ? formatCurrency(latestOrder.total) : "LKR 0"}
            detail={
              latestOrder?.createdAt
                ? `Placed ${formatDate(latestOrder.createdAt)}`
                : "No paid orders recorded yet."
            }
            icon={Package}
            iconClassName="bg-[#eefaff] text-[#03c7fe]"
          />
          <MetricCard
            title="Renewal Window"
            value={nextRenewal ? formatDate(nextRenewal) : "No cycle"}
            detail={
              activeSubscriptions.length > 0
                ? `${activeSubscriptions.length} active plan${
                    activeSubscriptions.length > 1 ? "s" : ""
                  } currently running.`
                : "Start a subscription to track recurring orders here."
            }
            icon={RefreshCw}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                Recent Orders
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111]">
                Your latest purchases
              </h2>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all hover:bg-[#03c7fe] hover:text-white"
            >
              <ArrowRight size={18} />
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-500">
                No recent paid orders yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentOrders.map((order) => (
                <Link
                  key={order._id}
                  href={order._id ? `/dashboard/orders/${order._id}` : "/dashboard/orders"}
                  className="block rounded-[24px] border border-gray-100 p-4 transition-all hover:border-[#bfeefe] hover:bg-[#fbfeff] hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-[#eefaff] p-3 text-[#03c7fe]">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-[#111]">
                            #{order._id?.slice(-6).toUpperCase() || "ORDER"}
                          </h3>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getOrderStatusClasses(
                              order.fulfillmentStatus
                            )}`}
                          >
                            {formatLabel(order.fulfillmentStatus || "unfulfilled")}
                          </span>
                          {order.orderType === "subscription" && (
                            <span className="rounded-full border border-[#cfeffc] bg-[#f0fbff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#03c7fe]">
                              Subscription
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-gray-600">
                          {summarizeItems(order.items)}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="text-lg font-black text-[#111]">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        {order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                Active Subscriptions
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111]">
                Recurring plans at a glance
              </h2>
            </div>
            <Link
              href="/dashboard/subscription"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-gray-500 transition-all hover:bg-[#111] hover:text-white"
            >
              <ArrowRight size={18} />
            </Link>
          </div>

          {featuredSubscriptions.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
              <p className="text-sm font-medium text-gray-500">
                No active subscriptions right now.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {featuredSubscriptions.map((subscription) => (
                <Link
                  key={subscription._id}
                  href={
                    subscription._id
                      ? `/dashboard/subscription/${subscription._id}`
                      : "/dashboard/subscription"
                  }
                  className="block rounded-[24px] border border-gray-100 p-4 transition-all hover:border-[#111]/10 hover:bg-gray-50 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-2xl bg-[#111] p-3 text-[#03c7fe]">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-black text-[#111]">
                            {subscription.subscriptionId || "Recurring Plan"}
                          </h3>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getSubscriptionStatusClasses(
                              subscription.status
                            )}`}
                          >
                            {formatLabel(subscription.status || "active")}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-gray-500">
                          {formatBillingCycle(subscription.recurrence)}
                        </p>
                        <p className="mt-2 text-sm font-medium text-gray-600">
                          {summarizeItems(subscription.items)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 sm:text-right">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#f5fbff] px-3 py-1 text-xs font-bold text-[#03c7fe]">
                        <Calendar size={14} />
                        {formatDate(subscription.nextBillingDate)}
                      </div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">
                        {subscription.totalInstallmentsPaid || 0} payment
                        {(subscription.totalInstallmentsPaid || 0) === 1 ? "" : "s"} made
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-gray-100 bg-[#111] p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/45">
                Health Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Today&apos;s baseline
              </h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-white/65">
                Your latest weight and hydration values are surfaced here so the overview stays actionable, not just decorative.
              </p>
            </div>
            <Link
              href="/dashboard/health"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#111] transition-all hover:bg-[#03c7fe] hover:text-white"
            >
              Open Health Log
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                  Body Weight
                </p>
                <Scale size={18} className="text-[#03c7fe]" />
              </div>
              <p className="text-3xl font-black">{data.weight} kg</p>
              <p className="mt-2 text-sm font-medium text-white/55">Latest logged body weight.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                  Water Intake
                </p>
                <Droplets size={18} className="text-[#03c7fe]" />
              </div>
              <p className="text-3xl font-black">{data.waterIntake} L</p>
              <p className="mt-2 text-sm font-medium text-white/55">
                {waterProgress >= 100
                  ? "Daily target reached."
                  : `${Math.max(0, 3 - data.waterIntake).toFixed(1)} L left to hit 3L.`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
            Quick Links
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111]">
            Jump back into your account
          </h2>

          <div className="mt-6 grid gap-4">
            <Link
              href="/dashboard/profile"
              className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-gray-50 px-5 py-4 transition-all hover:border-[#03c7fe] hover:bg-[#f5fcff]"
            >
              <div>
                <p className="text-sm font-black text-[#111]">Profile settings</p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Update contact details and health profile.
                </p>
              </div>
              <ArrowRight size={18} className="text-gray-400" />
            </Link>

            <Link
              href="/dashboard/orders"
              className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-gray-50 px-5 py-4 transition-all hover:border-[#03c7fe] hover:bg-[#f5fcff]"
            >
              <div>
                <p className="text-sm font-black text-[#111]">Order history</p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Review recent purchases and delivery progress.
                </p>
              </div>
              <ArrowRight size={18} className="text-gray-400" />
            </Link>

            <Link
              href="/dashboard/subscription"
              className="flex items-center justify-between rounded-[24px] border border-gray-100 bg-gray-50 px-5 py-4 transition-all hover:border-[#03c7fe] hover:bg-[#f5fcff]"
            >
              <div>
                <p className="text-sm font-black text-[#111]">Subscription center</p>
                <p className="mt-1 text-sm font-medium text-gray-500">
                  Check renewals, payment cycles, and plan status.
                </p>
              </div>
              <ArrowRight size={18} className="text-gray-400" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
