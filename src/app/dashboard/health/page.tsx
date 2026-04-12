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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SupplementEntry {
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

  const [form, setForm] = useState<FormState>({
    weight: "", height: "", waterIntake: "", sleepHours: "",
    bodyFat: "", chest: "", waist: "", hips: "",
    workoutType: "", workoutDuration: "", workoutNotes: "",
    supplements: [],
  });

  const [newSupp, setNewSupp] = useState({ name: "", dose: "" });

  // ── Fetch logs ──────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/health?userId=${user.uid}&days=30`);
      const data = await res.json();
      const fetchedLogs: DayLog[] = data.logs || [];
      setLogs(fetchedLogs);

      const todayLog = fetchedLogs.find((l) => l.date === today());
      if (todayLog) {
        setForm({
          weight:          todayLog.weight?.toString()           || "",
          height:          todayLog.height?.toString()           || "",
          waterIntake:     todayLog.waterIntake?.toString()      || "",
          sleepHours:      todayLog.sleepHours?.toString()       || "",
          bodyFat:         todayLog.bodyFat?.toString()          || "",
          chest:           todayLog.chest?.toString()            || "",
          waist:           todayLog.waist?.toString()            || "",
          hips:            todayLog.hips?.toString()             || "",
          workoutType:     todayLog.workout?.type                || "",
          workoutDuration: todayLog.workout?.duration?.toString()|| "",
          workoutNotes:    todayLog.workout?.notes               || "",
          supplements:     todayLog.supplements                  || [],
        });
      }
    } catch {
      setError("Failed to load health data.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // ── Save today's log ────────────────────────────────────────────────────────
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
      setTimeout(() => setSaved(false), 3000);
      fetchLogs();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Supplement helpers ──────────────────────────────────────────────────────
  const addSupplement = () => {
    if (!newSupp.name.trim() || !newSupp.dose.trim()) return;
    setForm((f) => ({
      ...f,
      supplements: [...f.supplements, { ...newSupp, taken: false }],
    }));
    setNewSupp({ name: "", dose: "" });
  };

  const toggleSupplement = (i: number) => {
    setForm((f) => ({
      ...f,
      supplements: f.supplements.map((s, idx) =>
        idx === i ? { ...s, taken: !s.taken } : s
      ),
    }));
  };

  const removeSupplement = (i: number) => {
    setForm((f) => ({
      ...f,
      supplements: f.supplements.filter((_, idx) => idx !== i),
    }));
  };

  // ── Chart data ──────────────────────────────────────────────────────────────
  const chartData = logs.map((l) => ({
    date:  l.date.slice(5),
    weight: l.weight      ?? null,
    water:  l.waterIntake ?? null,
    sleep:  l.sleepHours  ?? null,
    bmi:    l.bmi         ?? null,
  }));

  // ── Latest BMI ──────────────────────────────────────────────────────────────
  const latestBMI = [...logs].reverse().find((l) => l.bmi)?.bmi;
  const bmiCategory = latestBMI ? getBMICategory(latestBMI) : null;

  const tabs = [
    { key: "log",         label: "Today's Log",  icon: Plus },
    { key: "weight",      label: "Weight",        icon: Scale },
    { key: "water",       label: "Water",         icon: Droplets },
    { key: "sleep",       label: "Sleep",         icon: Moon },
    { key: "body",        label: "Body",          icon: Ruler },
    { key: "supplements", label: "Supplements",   icon: Pill },
  ];

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-gray-500">Loading health data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health Tracking</h1>
          <p className="text-sm text-gray-500">Log and monitor your daily health metrics.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#01C7FE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00b3e6] disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Today"}
        </button>
      </div>

      {/* Toast */}
      {saved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white">
          <CheckCircle2 size={16} /> Today&apos;s log saved successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Scale,
            label: "Weight",
            value: form.weight ? `${form.weight} kg` : "—",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            icon: Droplets,
            label: "Water",
            value: form.waterIntake ? `${form.waterIntake} L` : "—",
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            icon: Moon,
            label: "Sleep",
            value: form.sleepHours ? `${form.sleepHours} hrs` : "—",
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            icon: Activity,
            label: "BMI",
            value: latestBMI ? `${latestBMI}` : "—",
            color: bmiCategory?.color || "text-gray-600",
            bg: "bg-gray-50",
            sub: bmiCategory?.label,
          },
        ].map(({ icon: Icon, label, value, color, bg, sub }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className={`mb-2 inline-flex rounded-lg p-2 ${bg}`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-gray-500">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === key
                ? "bg-white text-[#01C7FE] shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Today's Log ── */}
      {activeTab === "log" && (
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Weight & Height */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Scale size={16} className="text-purple-500" /> Weight & Height
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Weight (kg)", key: "weight", placeholder: "e.g. 72" },
                { label: "Height (cm)", key: "height", placeholder: "e.g. 175" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                  <input
                    type="number"
                    value={form[key as keyof FormState] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                  />
                </div>
              ))}
            </div>
            {form.weight && form.height && (
              <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">Calculated BMI</p>
                <p className={`text-2xl font-bold ${getBMICategory(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).color}`}>
                  {(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)}
                </p>
                <p className={`text-xs font-semibold ${getBMICategory(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).color}`}>
                  {getBMICategory(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).label}
                </p>
              </div>
            )}
          </div>

          {/* Water & Sleep */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Droplets size={16} className="text-blue-500" /> Water & Sleep
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Water Intake (litres)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.waterIntake}
                  onChange={(e) => setForm((f) => ({ ...f, waterIntake: e.target.value }))}
                  placeholder="e.g. 2.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                />
                <div className="mt-2 flex gap-2">
                  {[0.25, 0.5, 1].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          waterIntake: (parseFloat(f.waterIntake || "0") + v).toFixed(2),
                        }))
                      }
                      className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                    >
                      +{v}L
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Sleep (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.sleepHours}
                  onChange={(e) => setForm((f) => ({ ...f, sleepHours: e.target.value }))}
                  placeholder="e.g. 7.5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                />
              </div>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Ruler size={16} className="text-rose-500" /> Body Measurements
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Body Fat (%)", key: "bodyFat", placeholder: "e.g. 18" },
                { label: "Chest (cm)",   key: "chest",   placeholder: "e.g. 95" },
                { label: "Waist (cm)",   key: "waist",   placeholder: "e.g. 80" },
                { label: "Hips (cm)",    key: "hips",    placeholder: "e.g. 90" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
                  <input
                    type="number"
                    value={form[key as keyof FormState] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Workout */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Dumbbell size={16} className="text-emerald-500" /> Workout
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Workout Type</label>
                <div className="flex flex-wrap gap-2">
                  {WORKOUT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, workoutType: t }))}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        form.workoutType === t
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Duration (minutes)</label>
                <input
                  type="number"
                  value={form.workoutDuration}
                  onChange={(e) => setForm((f) => ({ ...f, workoutDuration: e.target.value }))}
                  placeholder="e.g. 60"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Notes (optional)</label>
                <textarea
                  value={form.workoutNotes}
                  onChange={(e) => setForm((f) => ({ ...f, workoutNotes: e.target.value }))}
                  placeholder="e.g. Chest and triceps day"
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Supplements ── */}
      {activeTab === "supplements" && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Pill size={16} className="text-[#01C7FE]" /> Today&apos;s Supplements
          </h3>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newSupp.name}
              onChange={(e) => setNewSupp((s) => ({ ...s, name: e.target.value }))}
              placeholder="Supplement name"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
            />
            <input
              type="text"
              value={newSupp.dose}
              onChange={(e) => setNewSupp((s) => ({ ...s, dose: e.target.value }))}
              placeholder="Dose (e.g. 1 scoop)"
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#01C7FE] focus:ring-1 focus:ring-[#01C7FE]"
            />
            <button
              type="button"
              onClick={addSupplement}
              className="rounded-lg bg-[#01C7FE] px-3 py-2 text-white hover:bg-[#00b3e6]"
            >
              <Plus size={16} />
            </button>
          </div>

          {form.supplements.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              No supplements added yet. Add one above.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {form.supplements.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition-colors ${
                    s.taken ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={s.taken}
                      onChange={() => toggleSupplement(i)}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    <div>
                      <p className={`text-sm font-semibold ${s.taken ? "text-emerald-700 line-through" : "text-gray-900"}`}>
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500">{s.dose}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSupplement(i)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Charts ── */}
      {["weight", "water", "sleep", "body"].map((tab) => {
        if (activeTab !== tab) return null;

        const configs: Record<string, { title: string; icon: React.ElementType; color: string; dataKey: string; unit: string }> = {
          weight: { title: "Weight Progress (kg)", icon: Scale,     color: "#8b5cf6", dataKey: "weight", unit: "kg"  },
          water:  { title: "Daily Water Intake (L)", icon: Droplets, color: "#3b82f6", dataKey: "water",  unit: "L"   },
          sleep:  { title: "Sleep Duration (hours)", icon: Moon,     color: "#6366f1", dataKey: "sleep",  unit: "hrs" },
          body:   { title: "BMI Over Time",          icon: TrendingUp, color: "#01C7FE", dataKey: "bmi",   unit: ""   },
        };

        const cfg = configs[tab];
        const Icon = cfg.icon;

        const vals = chartData
          .map((d) => d[cfg.dataKey as keyof typeof d] as number)
          .filter((v) => v !== null && v !== undefined);

        return (
          <div key={tab} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-900">
              <Icon size={16} style={{ color: cfg.color }} />
              {cfg.title}
            </h3>

            {vals.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400">
                No data yet. Start logging to see your progress.
              </p>
            ) : tab === "water" ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} ${cfg.unit}`, cfg.title]} />
                  <Bar dataKey={cfg.dataKey} fill={cfg.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} ${cfg.unit}`, cfg.title]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={cfg.dataKey}
                    stroke={cfg.color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            )}

            {vals.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Latest</p>
                  <p className="font-bold text-gray-900">{vals[vals.length - 1]} {cfg.unit}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Average</p>
                  <p className="font-bold text-gray-900">
                    {(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)} {cfg.unit}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Best</p>
                  <p className="font-bold text-gray-900">
                    {tab === "weight" ? Math.min(...vals) : Math.max(...vals)} {cfg.unit}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}