"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  Activity, Package, CreditCard, User, 
  Droplets, TrendingUp, Calendar, ArrowRight,
  ChevronRight, Loader2, Zap, Star
} from "lucide-react";
import Link from "next/link";

// --- Types ---
interface DashSummary {
  fullName: string;
  weight?: string;
  waterIntake?: number;
  activeSubCount: number;
  nextBillingDate?: string;
  recentOrderStatus?: string;
  recentOrderId?: string;
  recentTotal?: number;
}

type DashboardSubscription = {
  status?: string;
  nextBillingDate?: string;
};

type DashboardOrder = {
  _id?: string;
  fulfillmentStatus?: string;
  total?: number;
};

type DashboardHealthResponse = {
  logs?: Array<{
    weight?: string;
    waterIntake?: number;
  }>;
};

export default function DashboardLanding() {
  const [data, setData] = useState<DashSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const token = await user.getIdToken();
        
        // Parallel fetching from your existing endpoints
        const [profRes, orderRes, subRes, healthRes] = await Promise.all([
          fetch("/api/dashboard/profile", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/orders/user", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/subscriptions/user", { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/health?days=1`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        const [prof, orders, subs, health] = await Promise.all([
          profRes.json(), orderRes.json(), subRes.json(), healthRes.json()
        ]);

        const subscriptions = (subs.subscriptions as DashboardSubscription[]) || [];
        const orderList = (orders.orders as DashboardOrder[]) || [];
        const healthData = health as DashboardHealthResponse;

        setData({
          fullName: prof.user?.fullName || "User",
          weight: healthData.logs?.[0]?.weight || prof.user?.weight || "--",
          waterIntake: healthData.logs?.[0]?.waterIntake || 0,
          activeSubCount:
            subscriptions.filter((subscription) => subscription.status === "active")
              .length || 0,
          nextBillingDate: subscriptions.find(
            (subscription) => subscription.status === "active"
          )?.nextBillingDate,
          recentOrderStatus: orderList[0]?.fulfillmentStatus,
          recentOrderId: orderList[0]?._id,
          recentTotal: orderList[0]?.total
        });
      } catch (err) {
        console.error("Dashboard Sync Error", err);
      } finally {
        setLoading(false);
      }
    };

    const unsub = auth.onAuthStateChanged((u) => { if (u) fetchData(); else setLoading(false); });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#03c7fe]" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* Header with quick status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#111] tracking-tight">
            Welcome back, <span className="text-[#03c7fe]">{data?.fullName.split(" ")[0]}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">Your account summary for {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-2 sm:px-4 sm:py-2 bg-[#f0fbff] border border-[#d9f6ff] rounded-xl text-[10px] sm:text-xs font-bold text-[#03c7fe] uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} fill="#03c7fe" /> Premium Account
           </div>
        </div>
      </div>

      {/* FULL WIDTH BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        
        {/* HEALTH METRICS */}
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-3 bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-[#e6faff] rounded-2xl text-[#03c7fe]">
                <Activity size={20} className="sm:h-6 sm:w-6" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-[#111]">Health & Wellness</h3>
            </div>
            <Link href="/dashboard/health" className="text-[10px] sm:text-xs font-bold text-[#03c7fe] flex items-center gap-1 hover:underline tracking-widest">
               OPEN LOGS <ChevronRight size={14} />
            </Link>
          </div>
          
          {/* Stacks on very small screens, side-by-side on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Water Goal (3L)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#111]">{data?.waterIntake}</span>
                <span className="text-gray-400 font-bold text-lg sm:text-xl">L</span>
              </div>
              <div className="w-full bg-gray-100 h-2 sm:h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-[#03c7fe] h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((data?.waterIntake || 0) / 3) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Body Weight</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#111]">{data?.weight}</span>
                <span className="text-gray-400 font-bold text-lg sm:text-xl">kg</span>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-500 bg-emerald-50 px-2 sm:px-3 py-1 rounded-full w-fit flex items-center gap-1">
                <TrendingUp size={14} /> On Track
              </p>
            </div>
          </div>
        </div>

        {/* PROFILE CARD */}
        <div className="md:col-span-1 lg:col-span-1 xl:col-span-1 bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-6 sm:p-8 flex flex-col items-center justify-between text-center shadow-sm">
          <div className="relative mb-4 sm:mb-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#f8f8f8] rounded-3xl flex items-center justify-center border border-gray-100 overflow-hidden">
               <User size={32} className="sm:h-10 sm:w-10 text-gray-300" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#03c7fe] p-1.5 rounded-lg text-white">
              <Star size={12} fill="currentColor" />
            </div>
          </div>
          <div>
            <h4 className="font-black text-[#111] text-sm truncate w-full">{data?.fullName}</h4>
            <Link href="/dashboard/profile" className="text-[10px] font-bold text-[#03c7fe] uppercase mt-1 block hover:underline tracking-widest">
              View Profile
            </Link>
          </div>
        </div>

        {/* SUBSCRIPTION CARD */}
        <div className="md:col-span-1 lg:col-span-2 xl:col-span-2 bg-[#111] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 text-white flex flex-col justify-between hover:bg-black transition-all shadow-xl min-h-[200px]">
          <div className="flex justify-between items-start mb-6">
            <div className="p-2 sm:p-3 bg-white/10 rounded-2xl text-[#03c7fe]">
              <CreditCard size={20} className="sm:h-6 sm:w-6" />
            </div>
            <span className="px-2 sm:px-3 py-1 bg-[#03c7fe] rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-tighter">Active</span>
          </div>
          
          <div className="mb-6 sm:mb-0">
            <h3 className="font-bold text-2xl sm:text-3xl mb-1">{data?.activeSubCount}</h3>
            <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Active Plans</p>
          </div>
          
          <div className="pt-4 sm:pt-6 border-t border-white/10 mt-auto">
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase mb-1">Upcoming Renewal</p>
            <p className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Calendar size={16} className="text-[#03c7fe] sm:h-[18px] sm:w-[18px]" />
              {data?.nextBillingDate ? new Date(data.nextBillingDate).toLocaleDateString() : "No active cycle"}
            </p>
          </div>
        </div>

        {/* RECENT ORDER */}
        <div className="md:col-span-2 lg:col-span-4 xl:col-span-4 bg-white rounded-[24px] sm:rounded-[32px] border border-gray-100 p-6 sm:p-8 shadow-sm group hover:border-[#03c7fe]/30 transition-all">
          <div className="flex items-center justify-between mb-6">
             <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Transaction</p>
             <Link href="/dashboard/orders" className="p-2 rounded-full bg-gray-50 group-hover:bg-[#03c7fe] group-hover:text-white transition-all">
                <ArrowRight size={16} className="sm:h-[18px] sm:w-[18px]" />
             </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="p-3 sm:p-4 bg-[#f0fbff] rounded-2xl text-[#03c7fe] w-fit">
              <Package size={24} className="sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 sm:gap-0">
                <div>
                  <h3 className="font-black text-xl sm:text-2xl text-[#111]">
                    {data?.recentOrderId ? `#${data.recentOrderId.slice(-6).toUpperCase()}` : "No Orders"}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#03c7fe] mt-1 uppercase tracking-tighter">
                    {data?.recentOrderStatus || "Pending"}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-black text-[#111]">LKR {data?.recentTotal?.toLocaleString() || "0"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="md:col-span-2 lg:col-span-4 xl:col-span-2 grid grid-cols-2 gap-4">
           <Link href="/dashboard/health" className="bg-[#f0fbff] rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 flex flex-col items-center justify-center gap-2 hover:bg-[#03c7fe] hover:text-white transition-all group min-h-[120px]">
              <Droplets className="text-[#03c7fe] group-hover:text-white" />
              <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">Log Water</span>
           </Link>
           <Link href="/dashboard/orders" className="bg-gray-50 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all min-h-[120px]">
              <Package className="text-gray-400" />
              <span className="font-bold text-[10px] sm:text-xs uppercase tracking-widest text-center">Orders</span>
           </Link>
        </div>

      </div>
    </div>
  );
}