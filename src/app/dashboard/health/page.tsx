"use client";

import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { 
  Activity, 
  Loader2, 
  TrendingUp,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { 
  FaWeightScale, 
  FaDrumstickBite, 
  FaFire, 
  FaGlassWater, 
  FaBed,
  FaCalendarCheck
} from "react-icons/fa6";
import toast from "react-hot-toast";

export default function HealthPage() {
  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false); // NEW: Track if logged today

  const [form, setForm] = useState({
    weight: "",
    proteinIntake: "",
    caloriesIntake: "",
    waterIntake: "",
    sleepHours: "",
  });

  /* ----------------------------------------
     1. Fetch User + Logs
  ---------------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const firebaseUser = auth.currentUser;

        if (!firebaseUser) {
          setLoading(false);
          return;
        }

        const token = await firebaseUser.getIdToken();

        // USER
        const userRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userRes.json();
        setUser(userData.user);

        // LOGS
        const logRes = await fetch(`/api/health?userId=${userData.user._id}`);
        const logsData = await logRes.json();
        setLogs(logsData);

        // Check if user has already logged today
        const todayStr = new Date().toDateString();
        const todayLog = logsData.find((log: any) => new Date(log.date).toDateString() === todayStr);

        if (todayLog) {
          setHasLoggedToday(true);
          setResult(todayLog);
        } else if (logsData.length > 0) {
          // If not logged today, autofill with the most recent previous data to save them time
          const latest = logsData[logsData.length - 1];
          setForm({
            weight: latest.weight || "",
            proteinIntake: latest.proteinIntake || "",
            caloriesIntake: latest.caloriesIntake || "",
            waterIntake: latest.waterIntake || "",
            sleepHours: latest.sleepHours || "",
          });
          setResult(latest);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load health data.");
      } finally {
        setLoading(false);
      }
    };

    setTimeout(() => fetchData(), 500);
  }, []);

  /* ----------------------------------------
     2. Handle Input
  ---------------------------------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ----------------------------------------
     3. Submit
  ---------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          weight: Number(form.weight),
          proteinIntake: Number(form.proteinIntake),
          caloriesIntake: Number(form.caloriesIntake),
          waterIntake: Number(form.waterIntake),
          sleepHours: Number(form.sleepHours),
        }),
      });

      if (!res.ok) throw new Error("Failed to save log");

      const data = await res.json();

      setResult(data);
      setHasLoggedToday(true); // Lock the form
      setLogs((prev) => [...prev, data]); // Add to charts

      toast.success("Today's log saved successfully!");

      // Smooth scroll down to the charts so they see the result immediately
      setTimeout(() => {
        document
          .getElementById("charts")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------------------------------
     UI Variables
  ---------------------------------------- */
  const inputClass = "w-full rounded-xl border border-[#cfeef7] bg-[#fbfdff] p-3 pl-10 text-sm outline-none transition-all focus:border-[#03c7fe] focus:ring-2 focus:ring-[#03c7fe]/20 placeholder:text-gray-300";
  const labelClass = "text-sm font-bold text-[#111] mb-1.5 block";
  const cardClass = "rounded-[32px] border border-white bg-white/80 p-8 shadow-[0_20px_50px_rgba(3,199,254,0.08)] backdrop-blur-xl";

  /* ----------------------------------------
     Render Setup
  ---------------------------------------- */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2fbff]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
          <Loader2 className="h-10 w-10 animate-spin text-[#03c7fe]" />
          <p className="text-sm font-bold text-gray-500">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const chartData = logs.map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    }),
    weight: log.weight,
    protein: log.proteinIntake,
  }));

  return (
    <main className="min-h-screen bg-[#f2fbff] px-4 py-12">
      <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Header */}
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#03c7fe] text-white shadow-[0_8px_20px_rgba(3,199,254,0.3)]">
            <TrendingUp size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#111]">Health Dashboard</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Track your daily health & nutrition progress
            </p>
          </div>
        </div>

        {/* Top Section: Form/Status */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          
          {/* LEFT: FORM OR COMPLETED STATE */}
          <div className={`lg:col-span-7 ${cardClass}`}>
            {!hasLoggedToday ? (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-black text-[#111]">Today's Log</h2>
                  <p className="mt-1 text-sm font-medium text-gray-500">Record today's metrics to unlock your insights.</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Weight (kg)</label>
                      <div className="relative group">
                        <FaWeightScale className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
                        <input type="number" step="0.1" name="weight" placeholder="e.g. 75.5" className={inputClass} value={form.weight} onChange={handleChange} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Protein (g)</label>
                      <div className="relative group">
                        <FaDrumstickBite className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
                        <input type="number" name="proteinIntake" placeholder="e.g. 150" className={inputClass} value={form.proteinIntake} onChange={handleChange} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Calories (kcal)</label>
                      <div className="relative group">
                        <FaFire className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
                        <input type="number" name="caloriesIntake" placeholder="e.g. 2500" className={inputClass} value={form.caloriesIntake} onChange={handleChange} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Water (Liters)</label>
                      <div className="relative group">
                        <FaGlassWater className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
                        <input type="number" step="0.1" name="waterIntake" placeholder="e.g. 3.5" className={inputClass} value={form.waterIntake} onChange={handleChange} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Sleep (Hours)</label>
                      <div className="relative group">
                        <FaBed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#03c7fe] transition-colors" size={14} />
                        <input type="number" step="0.5" name="sleepHours" placeholder="e.g. 8" className={inputClass} value={form.sleepHours} onChange={handleChange} required />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="submit" disabled={submitting} className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#03c7fe] to-[#0099ff] py-4 text-sm font-black text-white shadow-[0_10px_25px_rgba(3,199,254,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(3,199,254,0.4)] active:scale-[0.98] disabled:opacity-50">
                      <div className="relative z-10 flex items-center justify-center gap-2">
                        {submitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /><span>Saving...</span></>
                        ) : (
                          <><FaCalendarCheck size={16}/><span>Save Today's Log</span></>
                        )}
                      </div>
                      <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-green-50/80 to-emerald-50/30 rounded-2xl border border-green-100/50">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-500 shadow-sm animate-in zoom-in duration-500">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-black text-[#111]">You're all set!</h2>
                <p className="mt-2 max-w-[250px] text-sm font-medium text-gray-500">
                  Today's log is completed. Come back tomorrow to keep your health streak alive.
                </p>
                <button 
                  onClick={() => document.getElementById("charts")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="mt-6 flex items-center gap-2 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
                >
                  View your charts <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: STATUS CARDS */}
          <div className="lg:col-span-5 flex flex-col gap-4 justify-center">
            {result ? (
              <>
                <StatusCard icon={FaDrumstickBite} title="Protein" value={result.status?.protein || "N/A"} />
                <StatusCard icon={FaFire} title="Calories" value={result.status?.calories || "N/A"} />
                <div className="rounded-2xl border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-md flex items-center justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-[#03c7fe]">
                      <FaWeightScale size={16} />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Current BMI</h3>
                    </div>
                    <p className="text-3xl font-black text-[#111]">{result.bmi ? result.bmi.toFixed(1) : "--"}</p>
                    <p className="text-sm font-medium text-gray-400 capitalize">{result.bmiCategory || "Unknown"}</p>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-[#03c7fe]">
                    <Activity size={28} />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-[32px] border border-dashed border-[#cfeef7] bg-white/40 p-8 text-center backdrop-blur-sm">
                <Activity size={24} className="text-[#03c7fe] mb-3" />
                <h3 className="text-lg font-bold text-[#111]">Awaiting Data</h3>
                <p className="text-sm text-gray-500">Fill out your daily log to see your latest insights.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: CHARTS */}
        <div id="charts" className="space-y-6 pt-4 scroll-mt-8">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-[#111]">Your Progress</h2>
          </div>

          {logs.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <ChartCard title="Weight Trend">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} domain={['dataMin - 2', 'auto']} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#03c7fe' }}
                  />
                  <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#03c7fe" strokeWidth={4} dot={{ r: 4, fill: '#03c7fe', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartCard>

              <ChartCard title="Protein Intake">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#0099ff' }}
                  />
                  <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#0099ff" strokeWidth={4} dot={{ r: 4, fill: '#0099ff', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ChartCard>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ----------------------------------------
   Helper Components
---------------------------------------- */

function StatusCard({ icon: Icon, title, value }: any) {
  return (
    <div className="rounded-2xl border border-white bg-white/60 p-5 shadow-sm backdrop-blur-md transition-all hover:shadow-md">
      <div className="mb-2 flex items-center gap-2 text-[#03c7fe]">
        <Icon size={16} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
      </div>
      <p className="text-2xl font-black capitalize text-[#111]">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: any) {
  return (
    <div className="rounded-[32px] border border-white bg-white/80 p-6 shadow-[0_20px_50px_rgba(3,199,254,0.06)] backdrop-blur-xl">
      <h3 className="mb-6 text-lg font-bold text-[#111]">{title}</h3>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-[32px] border border-dashed border-[#cfeef7] bg-white/40 p-8 text-center backdrop-blur-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#03c7fe]">
        <TrendingUp size={24} />
      </div>
      <h3 className="text-lg font-bold text-[#111]">No Chart Data Yet</h3>
      <p className="mt-2 text-sm text-gray-500">
        Start logging your metrics to visualize your progress over time.
      </p>
    </div>
  );
}