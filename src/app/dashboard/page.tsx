"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import "./dashboard.css";

import UserSummary from "./components/UserSummary";
import HealthCards from "./components/HealthCards";
import WeightChart from "./components/WeightChart";
import WaterChart from "./components/WaterChart";
import OrdersSection from "./components/OrdersSection";
import SubscriptionSection from "./components/SubscriptionSection";
import AIWidget from "./components/AIWidget";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || "Guest User",
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Summary */}
      <UserSummary />

      {/* Health Cards */}
      <HealthCards />

      <div className="dashboard-grid">
        {/* Weight Chart */}
        <WeightChart />

        {/* Water Intake Chart */}
        <WaterChart />
      </div>

      {/* Orders Section */}
      <OrdersSection />

      {/* Subscription Status */}
      <SubscriptionSection />

      {/* AI Recommendation Widget */}
      <AIWidget />
    </div>
  );
}
