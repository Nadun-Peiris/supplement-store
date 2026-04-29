"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import {
  Activity, Droplets, Moon, Scale,
  Dumbbell, Pill, Plus, Save, Ruler,
  TrendingUp, CheckCircle2, AlertCircle,
  Trash2, Settings2, CalendarDays
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScheduledSupplement {
  id: string;
  name: string;
  dose: string;
  frequency: "Daily" | "Weekly" | "Alternate";
  daysOfWeek?: number[]; 
  startDate: string; 
}

interface SupplementEntry {
  masterId: string;
  name: string;
  dose: string;
  taken: boolean;
}

interface WorkoutEntry {
  type: string;
  duration: number;
  notes: string;
}

interface DayLog {
  date: string;
  weight?: number;
  waterIntake?: number;
  sleepHours?: number;
  bmi?: number;
  height?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  workout?: WorkoutEntry;
  supplements: SupplementEntry[];
}

interface FormState {
  weight: string;
  height: string;
  waterIntake: string;
  sleepHours: string;
  bodyFat: string;
  chest: string;
  waist: string;
  hips: string;
  workoutType: string;
  workoutDuration: string;
  workoutNotes: string;
  supplements: SupplementEntry[];
}

const WORKOUT_TYPES = ["Gym", "Cardio", "Yoga", "Swimming", "Cycling", "Rest", "Other"];
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const today = () => new Date().toISOString().split("T")[0];

const getBMICategory = (bmi: number) => {
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-600" };
  if (bmi < 25)   return { label: "Normal",      color: "text-emerald-600" };
  if (bmi < 30)   return { label: "Overweight",  color: "text-amber-600" };
  return               { label: "Obese",         color: "text-red-600" };
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function HealthTrackingPage() {
  const { user } = useAuth();
  const [logs, setLogs]       = useState<DayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");
  const [activeTab, setActiveTab] = useState("log");
  
  // Section-specific states to collapse logged modules
  const [savedMetrics, setSavedMetrics] = useState({
    vitals: false,
    recovery: false,
    activity: false,
  });

  const [masterSchedule, setMasterSchedule] = useState<ScheduledSupplement[]>([]);
  const [newSupplement, setNewSupplement] = useState<Partial<ScheduledSupplement>>({
    frequency: "Daily",
    daysOfWeek: [],
  });

  const [form, setForm] = useState<FormState>({
    weight: "", height: "", waterIntake: "", sleepHours: "",
    bodyFat: "", chest: "", waist: "", hips: "",
    workoutType: "", workoutDuration: "", workoutNotes: "",
    supplements: [],
  });

  const shouldShowToday = useCallback((supp: ScheduledSupplement, dateStr: string) => {
    const d = new Date(dateStr);
    if (supp.frequency === "Daily") return true;
    if (supp.frequency === "Weekly") {
      return supp.daysOfWeek?.includes(d.getDay());
    }
    if (supp.frequency === "Alternate") {
      const diff = Math.floor(d.getTime() / 86400000);
      const startDiff = Math.floor(new Date(supp.startDate).getTime() / 86400000);
      return (diff - startDiff) % 2 === 0;
    }
    return false;
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const savedSchedule = localStorage.getItem(`schedule_${user.uid}`);
      const currentSchedule: ScheduledSupplement[] = savedSchedule ? JSON.parse(savedSchedule) : [];
      setMasterSchedule(currentSchedule);

      const res  = await fetch(`/api/health?userId=${user.uid}&days=30`);
      const data = await res.json();
      const fetchedLogs: DayLog[] = data.logs || [];
      setLogs(fetchedLogs);

      const todayLog = fetchedLogs.find((l) => l.date === today());
      
      let todaysSupps = todayLog?.supplements || [];
      if (!todayLog) {
        todaysSupps = currentSchedule
          .filter(s => shouldShowToday(s, today()))
          .map(s => ({ masterId: s.id, name: s.name, dose: s.dose, taken: false }));
      }

      if (todayLog) {
        setSavedMetrics({
          vitals: !!todayLog.weight,
          recovery: !!(todayLog.waterIntake && todayLog.sleepHours),
          activity: !!todayLog.workout?.type,
        });
      }

      setForm({
        weight:          todayLog?.weight?.toString()           || "",
        height:          todayLog?.height?.toString()           || "",
        waterIntake:     todayLog?.waterIntake?.toString()      || "",
        sleepHours:      todayLog?.sleepHours?.toString()       || "",
        bodyFat:         todayLog?.bodyFat?.toString()          || "",
        chest:           todayLog?.chest?.toString()            || "",
        waist:           todayLog?.waist?.toString()            || "",
        hips:            todayLog?.hips?.toString()             || "",
        workoutType:     todayLog?.workout?.type                || "",
        workoutDuration: todayLog?.workout?.duration?.toString()|| "",
        workoutNotes:    todayLog?.workout?.notes               || "",
        supplements:     todaysSupps,
      });
      
    } catch {
      setError("Failed to load health data.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid, shouldShowToday]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        userId:      user.uid,
        date:        today(),
        weight:      form.weight      ? parseFloat(form.weight)      : undefined,
        height:      form.height      ? parseFloat(form.height)      : undefined,
        waterIntake: form.waterIntake ? parseFloat(form.waterIntake) : undefined,
        sleepHours:  form.sleepHours  ? parseFloat(form.sleepHours)  : undefined,
        bodyFat:     form.bodyFat     ? parseFloat(form.bodyFat)     : undefined,
        chest:       form.chest       ? parseFloat(form.chest)       : undefined,
        waist:       form.waist       ? parseFloat(form.waist)       : undefined,
        hips:        form.hips        ? parseFloat(form.hips)        : undefined,
        workout:
          form.workoutType
            ? {
                type:     form.workoutType,
                duration: parseInt(form.workoutDuration) || 0,
                notes:    form.workoutNotes,
              }
            : undefined,
        supplements: form.supplements,
      };

      const res = await fetch("/api/health", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      setSaved(true);
      
      setSavedMetrics({
        vitals: !!form.weight,
        recovery: !!(form.waterIntake && form.sleepHours),
        activity: !!form.workoutType,
      });
      
      setTimeout(() => setSaved(false), 3000);
      fetchLogs();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addToSchedule = () => {
    if (!newSupplement.name?.trim() || !newSupplement.dose?.trim()) return;
    
    const supplement: ScheduledSupplement = {
      id: crypto.randomUUID(),
      name: newSupplement.name,
      dose: newSupplement.dose,
      frequency: newSupplement.frequency as "Daily" | "Weekly" | "Alternate",
      daysOfWeek: newSupplement.daysOfWeek,
      startDate: today()
    };

    const updatedSchedule = [...masterSchedule, supplement];
    setMasterSchedule(updatedSchedule);
    if (user?.uid) localStorage.setItem(`schedule_${user.uid}`, JSON.stringify(updatedSchedule));
    
    setNewSupplement({ frequency: "Daily", daysOfWeek: [] });
    
    if (shouldShowToday(supplement, today())) {
      setForm(f => ({
        ...f,
        supplements: [...f.supplements, { masterId: supplement.id, name: supplement.name, dose: supplement.dose, taken: false }]
      }));
    }
  };

  const removeFromSchedule = (id: string) => {
    const updatedSchedule = masterSchedule.filter(s => s.id !== id);
    setMasterSchedule(updatedSchedule);
    if (user?.uid) localStorage.setItem(`schedule_${user.uid}`, JSON.stringify(updatedSchedule));
    
    setForm(f => ({
      ...f,
      supplements: f.supplements.filter(s => s.masterId !== id || s.taken)
    }));
  };

  const toggleSupplement = (index: number) => {
    setForm((f) => ({
      ...f,
      supplements: f.supplements.map((s, idx) =>
        idx === index ? { ...s, taken: !s.taken } : s
      ),
    }));
  };

  const chartData = logs.map((l) => ({
    date:  l.date.slice(5),
    weight: l.weight      ?? null,
    water:  l.waterIntake ?? null,
    sleep:  l.sleepHours  ?? null,
    bmi:    l.bmi         ?? null,
  }));

  const latestBMI = [...logs].reverse().find((l) => l.bmi)?.bmi;
  const bmiCategory = latestBMI ? getBMICategory(latestBMI) : null;

  const tabs = [
    { key: "log",         label: "Today's Log",      icon: Plus },
    { key: "schedule",    label: "Supplement Schedule",  icon: CalendarDays },
    { key: "weight",      label: "Weight",           icon: Scale },
    { key: "water",       label: "Water",            icon: Droplets },
    { key: "sleep",       label: "Sleep",            icon: Moon },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-400 font-medium tracking-wide">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full pb-12">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Health Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track and optimize your daily metrics.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-all disabled:opacity-50 shadow-sm"
        >
          <Save size={16} />
          {saving ? "Syncing..." : "Save Log"}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-5 py-4 text-sm font-medium text-emerald-800 shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={18} className="text-emerald-500" /> Database synchronized successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-sm font-medium text-red-800 shadow-sm">
          <AlertCircle size={18} className="text-red-500" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Scale, label: "Weight", value: form.weight ? `${form.weight} kg` : "—", color: "text-gray-900" },
          { icon: Droplets, label: "Water", value: form.waterIntake ? `${form.waterIntake} L` : "—", color: "text-blue-600" },
          { icon: Moon, label: "Sleep", value: form.sleepHours ? `${form.sleepHours} h` : "—", color: "text-indigo-600" },
          { icon: Activity, label: "BMI", value: latestBMI ? `${latestBMI}` : "—", color: bmiCategory?.color || "text-gray-900", sub: bmiCategory?.label },
        ].map(({ icon: Icon, label, value, color, sub }) => (
          <div key={label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_2px_15px_rgb(0,0,0,0.04)]">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <Icon size={16} className="text-gray-300" />
            </div>
            <p className={`text-2xl font-semibold tracking-tight ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-gray-100 pb-px">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Today's Log ── */}
      {activeTab === "log" && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
             <div className="flex items-center justify-between mb-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <CheckCircle2 size={18} className="text-emerald-500" /> Today's Supplements
              </h3>
              <p className="text-xs text-gray-400 font-medium px-2.5 py-1 bg-gray-50 rounded-md">Auto-populated</p>
             </div>

            {form.supplements.length === 0 ? (
              <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">Your checklist is clear. Add items in the Master Schedule.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {form.supplements.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSupplement(i)}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      s.taken 
                        ? "border-emerald-100 bg-emerald-50/50" 
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${s.taken ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'}`}>
                      {s.taken && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${s.taken ? "text-emerald-900 line-through opacity-70" : "text-gray-900"}`}>
                        {s.name}
                      </p>
                      <p className={`text-xs ${s.taken ? "text-emerald-600/70" : "text-gray-500"}`}>{s.dose}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {savedMetrics.vitals ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                     <Scale size={18} className="text-emerald-600" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-emerald-900">Vitals Logged</p>
                     <p className="text-xs text-emerald-700/80 mt-0.5">{form.weight ? `${form.weight}kg` : ''} {form.height ? `• ${form.height}cm` : ''}</p>
                   </div>
                </div>
                <button onClick={() => setSavedMetrics(s => ({ ...s, vitals: false }))} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">Edit</button>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Scale size={16} className="text-gray-400" /> Vitals
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Weight (kg)", key: "weight", placeholder: "0.0" },
                    { label: "Height (cm)", key: "height", placeholder: "0.0" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500">{label}</label>
                      <input
                        type="number"
                        value={form[key as keyof FormState] as string}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedMetrics.recovery ? (
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                     <Moon size={18} className="text-emerald-600" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-emerald-900">Recovery Logged</p>
                     <p className="text-xs text-emerald-700/80 mt-0.5">{form.waterIntake ? `${form.waterIntake}L Water` : ''} {form.sleepHours ? `• ${form.sleepHours}h Sleep` : ''}</p>
                   </div>
                </div>
                <button onClick={() => setSavedMetrics(s => ({ ...s, recovery: false }))} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">Edit</button>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Moon size={16} className="text-gray-400" /> Recovery
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Water (L)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.waterIntake}
                      onChange={(e) => setForm((f) => ({ ...f, waterIntake: e.target.value }))}
                      placeholder="0.0"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500">Sleep (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.sleepHours}
                      onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))}
                      placeholder="0.0"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {savedMetrics.activity ? (
              <div className="sm:col-span-2 flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50/40 p-6 shadow-sm transition-all">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                     <Dumbbell size={18} className="text-emerald-600" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-emerald-900">Activity Logged</p>
                     <p className="text-xs text-emerald-700/80 mt-0.5">{form.workoutType} {form.workoutDuration ? `• ${form.workoutDuration} mins` : ''}</p>
                   </div>
                </div>
                <button onClick={() => setSavedMetrics(s => ({ ...s, activity: false }))} className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">Edit</button>
              </div>
            ) : (
              <div className="sm:col-span-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                 <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Dumbbell size={16} className="text-gray-400" /> Activity
                </h3>
                <div className="grid sm:grid-cols-3 gap-6">
                   <div className="sm:col-span-2">
                     <label className="mb-2 block text-xs font-medium text-gray-500">Training Modality</label>
                     <div className="flex flex-wrap gap-2">
                        {WORKOUT_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, workoutType: t }))}
                            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                              form.workoutType === t
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200/50"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500">Duration (mins)</label>
                      <input
                        type="number"
                        value={form.workoutDuration}
                        onChange={(e) => setForm((f) => ({ ...f, workoutDuration: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-gray-900 focus:bg-white"
                      />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Master Schedule ── */}
      {activeTab === "schedule" && (
        <div className="space-y-8 animate-in fade-in">
          
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-1">Add to Schedule</h3>
            <p className="text-xs text-gray-500 mb-5">Define your regimen to automatically populate the daily checklist.</p>
            
            <div className="grid gap-4 sm:grid-cols-4 items-end">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Supplement Name</label>
                <input
                  type="text"
                  value={newSupplement.name || ""}
                  onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                  placeholder="e.g. Omega 3"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:bg-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Dosage</label>
                <input
                  type="text"
                  value={newSupplement.dose || ""}
                  onChange={(e) => setNewSupplement({ ...newSupplement, dose: e.target.value })}
                  placeholder="e.g. 1000mg"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:bg-white"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-xs font-medium text-gray-500">Frequency</label>
                <select
                  value={newSupplement.frequency}
                  onChange={(e) => setNewSupplement({ ...newSupplement, frequency: e.target.value as any, daysOfWeek: [] })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2.5 text-sm outline-none focus:border-gray-900 focus:bg-white appearance-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly (Specific Days)</option>
                  <option value="Alternate">Alternate Days</option>
                </select>
              </div>
              <button
                onClick={addToSchedule}
                disabled={!newSupplement.name || !newSupplement.dose}
                className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-all sm:col-span-1"
              >
                Add to Schedule
              </button>
            </div>

            {newSupplement.frequency === "Weekly" && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="mb-2 block text-xs font-medium text-gray-500">Select active days</label>
                <div className="flex gap-2">
                  {DAYS_OF_WEEK.map((day, idx) => {
                    const isActive = newSupplement.daysOfWeek?.includes(idx);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          const current = newSupplement.daysOfWeek || [];
                          setNewSupplement({
                            ...newSupplement,
                            daysOfWeek: isActive ? current.filter(d => d !== idx) : [...current, idx]
                          });
                        }}
                        className={`h-9 w-9 rounded-full text-xs font-medium transition-all ${
                          isActive 
                            ? "bg-gray-900 text-white" 
                            : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200/50"
                        }`}
                      >
                        {day[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 px-1">Active Regimen</h3>
            {masterSchedule.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-10 text-center">
                <p className="text-sm text-gray-400">No supplements scheduled yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {masterSchedule.map((supp) => (
                  <div key={supp.id} className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all hover:shadow-md hover:border-gray-200">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{supp.name}</h4>
                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200/50 uppercase tracking-wider">
                          {supp.frequency}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">{supp.dose}</p>
                      
                      {supp.frequency === "Weekly" && supp.daysOfWeek && (
                        <div className="flex gap-1 mb-2">
                          {DAYS_OF_WEEK.map((day, idx) => (
                            <div key={day} className={`h-1.5 w-full rounded-full ${supp.daysOfWeek!.includes(idx) ? 'bg-gray-800' : 'bg-gray-100'}`} title={day} />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 mt-2 border-t border-gray-50 flex justify-end">
                      <button
                        onClick={() => removeFromSchedule(supp.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from Schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {["weight", "water", "sleep"].map((tab) => {
        if (activeTab !== tab) return null;

        const configs: Record<string, { title: string; color: string; dataKey: string; unit: string }> = {
          weight: { title: "Weight Progress", color: "#111827", dataKey: "weight", unit: "kg"  },
          water:  { title: "Hydration Trends", color: "#2563eb", dataKey: "water",  unit: "L"   },
          sleep:  { title: "Sleep Architecture", color: "#4f46e5", dataKey: "sleep",  unit: "hrs" },
        };

        const cfg = configs[tab];
        const vals = chartData.map((d) => d[cfg.dataKey as keyof typeof d] as number).filter((v) => v != null);

        return (
          <div key={tab} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-in fade-in">
            <h3 className="mb-6 text-base font-semibold text-gray-900">{cfg.title}</h3>

            {vals.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-400">Insufficient data points.</p>
            ) : tab === "water" ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey={cfg.dataKey} fill={cfg.color} radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey={cfg.dataKey} stroke={cfg.color} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        );
      })}
    </div>
  );
}