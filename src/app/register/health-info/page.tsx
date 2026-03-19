"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import { Activity, Target, Utensils, ArrowLeft, Loader2 } from "lucide-react";
import { HEALTH_OPTIONS } from "@/lib/constants"; // Import your fixed enums

export default function Step2() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    height: "",
    weight: "",
    bmi: "",
    goal: "",
    activity: "",
    conditions: "",
    diet: "",
    sleepHours: "",
    waterIntake: "",
  });

  // Authorization and Data Loading
  useEffect(() => {
    const s1 = localStorage.getItem("register_step1");
    if (!s1) {
      router.push("/register");
      return;
    }

    const savedS2 = localStorage.getItem("register_step2");
    if (savedS2) {
      setForm(JSON.parse(savedS2));
    }
    setLoading(false);
  }, [router]);

  // Auto-calculate BMI
  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const w = Number(form.weight);
      if (h > 0) {
        const bmiCalc = (w / (h * h)).toFixed(1);
        setForm((prev) => ({ ...prev, bmi: bmiCalc }));
      }
    }
  }, [form.height, form.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("register_step2", JSON.stringify(form));
    router.push("/register/billing-details"); // Updated to match your step order
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2fbff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
      </div>
    );
  }

  const inputClass = "w-full rounded-xl border border-[#cfeef7] bg-[#fbfdff] p-3 text-sm outline-none transition-all focus:border-[#31D7FF] focus:ring-2 focus:ring-[#31D7FF]/20";
  const labelClass = "text-sm font-bold text-[#111] mb-1.5 block";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
      <div className="w-full max-w-[520px] rounded-[18px] border border-[#e6faff] bg-white p-8 shadow-lg animate-in fade-in slide-in-from-bottom-2">
        
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#31D7FF]/10 text-[#31D7FF]">
            <Activity size={24} />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-[#111]">Health & Lifestyle</h2>
          <p className="text-center text-sm font-medium text-gray-500">Step 2 of 4 — Physical Metrics</p>
        </div>

        <form onSubmit={handleNext} className="space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            {/* HEIGHT */}
            <div>
              <label className={labelClass}>Height (cm)</label>
              <input
                type="number"
                name="height"
                className={inputClass}
                value={form.height}
                onChange={handleChange}
                placeholder="175"
                required
              />
            </div>

            {/* WEIGHT */}
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                className={inputClass}
                value={form.weight}
                onChange={handleChange}
                placeholder="70"
                required
              />
            </div>
          </div>

          {/* BMI (Read Only) */}
          <div className="rounded-xl bg-gray-50 p-3 border border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-500">Calculated BMI:</span>
            <span className={`text-lg font-black ${Number(form.bmi) > 25 ? 'text-orange-500' : 'text-[#03c7fe]'}`}>
              {form.bmi || "--"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* GOAL */}
            <div>
              <label className={labelClass}>Your Goal</label>
              <div className="relative">
                <select
                  name="goal"
                  className={`${inputClass} appearance-none pr-10`}
                  value={form.goal}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select goal</option>
                  {HEALTH_OPTIONS.goals.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              </div>
            </div>

            {/* ACTIVITY */}
            <div>
              <label className={labelClass}>Activity Level</label>
              <div className="relative">
                <select
                  name="activity"
                  className={`${inputClass} appearance-none pr-10`}
                  value={form.activity}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Select level</option>
                  {HEALTH_OPTIONS.activityLevels.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
              </div>
            </div>
          </div>

          {/* DIET */}
          <div>
            <label className={labelClass}>Diet Type</label>
            <div className="relative">
              <select
                name="diet"
                className={`${inputClass} appearance-none pr-10`}
                value={form.diet}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select diet</option>
                {HEALTH_OPTIONS.diets.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
            </div>
          </div>

          {/* CONDITIONS */}
          <div>
            <label className={labelClass}>Medical Conditions</label>
            <input
              type="text"
              name="conditions"
              className={inputClass}
              value={form.conditions}
              onChange={handleChange}
              placeholder="None, or specify (e.g. Asthma)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* SLEEP */}
            <div>
              <label className={labelClass}>Sleep (Hrs)</label>
              <input
                type="number"
                name="sleepHours"
                className={inputClass}
                value={form.sleepHours}
                onChange={handleChange}
                placeholder="7"
              />
            </div>
            {/* WATER */}
            <div>
              <label className={labelClass}>Water (L/day)</label>
              <input
                type="number"
                name="waterIntake"
                className={inputClass}
                value={form.waterIntake}
                onChange={handleChange}
                placeholder="2.5"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
              onClick={() => router.push("/register")}
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <button
              type="submit"
              className="flex-[2] rounded-full bg-[#262626] py-4 text-sm font-bold text-white transition-all hover:bg-[#111] hover:shadow-lg active:scale-[0.98]"
            >
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}