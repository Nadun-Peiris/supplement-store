"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { 
  Activity, Package, CreditCard, User, 
  Droplets, TrendingUp, Calendar, ArrowRight,
  ChevronRight, Loader2, Zap, Weight, Star
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
          fetch(`/api/health?userId=${user.uid}&days=1`)
        ]);

        const [prof, orders, subs, health] = await Promise.all([
          profRes.json(), orderRes.json(), subRes.json(), healthRes.json()
        ]);

        setData({
          fullName: prof.user?.fullName || "User",
          weight: health.logs?.[0]?.weight || prof.user?.weight || "--",
          waterIntake: health.logs?.[0]?.waterIntake || 0,
          activeSubCount: subs.subscriptions?.filter((s: any) => s.status === "active").length || 0,
          nextBillingDate: subs.subscriptions?.find((s: any) => s.status === "active")?.nextBillingDate,
          recentOrderStatus: orders.orders?.[0]?.fulfillmentStatus,
          recentOrderId: orders.orders?.[0]?._id,
          recentTotal: orders.orders?.[0]?.total
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
    <div className="w-full space-y-10">
      {/* Header with quick status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#111] tracking-tight">
            Welcome back, <span className="text-[#03c7fe]">{data?.fullName.split(" ")[0]}</span>
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Your account summary for {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-[#f0fbff] border border-[#d9f6ff] rounded-xl text-xs font-bold text-[#03c7fe] uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} fill="#03c7fe" /> Premium Account
           </div>
        </div>
      </div>

      {/* FULL WIDTH BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        
        {/* HEALTH METRICS - Takes 3 columns on XL */}
        <div className="xl:col-span-3 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#e6faff] rounded-2xl text-[#03c7fe]">
                <Activity size={24} />
              </div>
              <h3 className="font-bold text-xl text-[#111]">Health & Wellness</h3>
            </div>
            <Link href="/dashboard/health" className="text-xs font-bold text-[#03c7fe] flex items-center gap-1 hover:underline">
               OPEN LOGS <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Water Goal (3L)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#111]">{data?.waterIntake}</span>
                <span className="text-gray-400 font-bold text-xl">L</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-[#03c7fe] h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(((data?.waterIntake || 0) / 3) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Body Weight</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-[#111]">{data?.weight}</span>
                <span className="text-gray-400 font-bold text-xl">kg</span>
              </div>
              <p className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full w-fit flex items-center gap-1">
                <TrendingUp size={14} /> On Track
              </p>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION CARD - Takes 1.5 columns on XL */}
        <div className="xl:col-span-2 bg-[#111] rounded-[32px] p-8 text-white flex flex-col justify-between hover:bg-black transition-all shadow-xl">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/10 rounded-2xl text-[#03c7fe]">
              <CreditCard size={24} />
            </div>
            <span className="px-3 py-1 bg-[#03c7fe] rounded-lg text-[10px] font-black uppercase tracking-tighter">Active</span>
          </div>
          
          <div>
            <h3 className="font-bold text-3xl mb-1">{data?.activeSubCount}</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Active Plans</p>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Upcoming Renewal</p>
            <p className="text-lg font-bold flex items-center gap-2">
              <Calendar size={18} className="text-[#03c7fe]" />
              {data?.nextBillingDate ? new Date(data.nextBillingDate).toLocaleDateString() : "No active cycle"}
            </p>
          </div>
        </div>

        {/* PROFILE CARD - 1 Column */}
        <div className="xl:col-span-1 bg-white rounded-[32px] border border-gray-100 p-8 flex flex-col items-center justify-between text-center shadow-sm">
          <div className="relative">
            <div className="w-20 h-20 bg-[#f8f8f8] rounded-3xl flex items-center justify-center border border-gray-100 overflow-hidden">
               <User size={40} className="text-gray-300" />
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

        {/* RECENT ORDER - Full Width bottom on smaller, 4 cols on XL */}
        <div className="xl:col-span-4 bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm group hover:border-[#03c7fe]/30 transition-all">
          <div className="flex items-center justify-between mb-6">
             <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Latest Transaction</p>
             <Link href="/dashboard/orders" className="p-2 rounded-full bg-gray-50 group-hover:bg-[#03c7fe] group-hover:text-white transition-all">
                <ArrowRight size={18} />
             </Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="p-4 bg-[#f0fbff] rounded-2xl text-[#03c7fe]">
              <Package size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-black text-2xl text-[#111]">
                    {data?.recentOrderId ? `#${data.recentOrderId.slice(-6).toUpperCase()}` : "No Orders"}
                  </h3>
                  <p className="text-sm font-bold text-[#03c7fe] mt-1 uppercase tracking-tighter">
                    {data?.recentOrderStatus || "Pending"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#111]">LKR {data?.recentTotal?.toLocaleString() || "0"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS - 2 Columns */}
        <div className="xl:col-span-2 grid grid-cols-2 gap-4">
           <Link href="/dashboard/health" className="bg-[#f0fbff] rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 hover:bg-[#03c7fe] hover:text-white transition-all group">
              <Droplets className="text-[#03c7fe] group-hover:text-white" />
              <span className="font-bold text-xs uppercase tracking-widest">Log Water</span>
           </Link>
           <Link href="/dashboard/orders" className="bg-gray-50 rounded-[32px] p-6 flex flex-col items-center justify-center gap-2 hover:bg-gray-900 hover:text-white transition-all">
              <Package className="text-gray-400" />
              <span className="font-bold text-xs uppercase tracking-widest">Orders</span>
           </Link>
        </div>

      </div>
    </div>
  );
}