"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import UserSummary from "./components/UserSummary";
import HealthCards from "./components/HealthCards";
import WeightChart from "./components/WeightChart";
import WaterChart from "./components/WaterChart";
import OrdersSection from "./components/OrdersSection";
import SubscriptionSection from "./components/SubscriptionSection";
import AIWidget from "./components/AIWidget";

export default function Dashboard() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#03c7fe]" />
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
          Syncing Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 p-6 lg:p-8">

      {/* TOP SUMMARY (User stats, daily greeting) */}
      <UserSummary />

      {/* QUICK STAT CARDS (Height, Weight, BMI, Activity) */}
      <HealthCards />

      {/* ANALYTICS GRID */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Weight Progression Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
           <WeightChart />
        </div>

        {/* Water Intake Tracker */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <WaterChart />
        </div>
      </div>

      {/* BOTTOM SECTION GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders (Spans 2 columns on large screens) */}
        <div className="lg:col-span-2">
          <OrdersSection />
        </div>

        {/* Subscription Sidebar */}
        <div className="flex flex-col gap-6">
          <SubscriptionSection />
          {/* AI Insights Widget inside this column */}
          <AIWidget />
        </div>
      </div>
    </div>
  );
}
