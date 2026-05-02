"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";
import { Activity, ArrowLeft, Loader2 } from "lucide-react";
import { HEALTH_OPTIONS } from "@/lib/constants"; // Import your fixed enums

type HealthForm = {
  height: string;
  weight: string;
  goal: string;
  activity: string;
  conditions: string;
  diet: string;
  sleepHours: string;
  waterIntake: string;
};

const getStoredHealthForm = (): HealthForm => {
  if (typeof window === "undefined") {
    return {
      height: "",
      weight: "",
      goal: "",
      activity: "",
      conditions: "",
      diet: "",
      sleepHours: "",
      waterIntake: "",
    };
  }

  const savedStep = localStorage.getItem("register_step2");
  if (!savedStep) {
    return {
      height: "",
      weight: "",
      goal: "",
      activity: "",
      conditions: "",
      diet: "",
      sleepHours: "",
      waterIntake: "",
    };
  }

  try {
    const parsed = JSON.parse(savedStep) as Partial<HealthForm>;
    return {
      height: parsed.height || "",
      weight: parsed.weight || "",
      goal: parsed.goal || "",
      activity: parsed.activity || "",
      conditions: parsed.conditions || "",
      diet: parsed.diet || "",
      sleepHours: parsed.sleepHours || "",
      waterIntake: parsed.waterIntake || "",
    };
  } catch {
    return {
      height: "",
      weight: "",
      goal: "",
      activity: "",
      conditions: "",
      diet: "",
      sleepHours: "",
      waterIntake: "",
    };
  }
};

export default function Step2() {
  const router = useRouter();
  const [form, setForm] = useState<HealthForm>(getStoredHealthForm);

  // Authorization and Data Loading
  useEffect(() => {
    const s1 = localStorage.getItem("register_step1");
    if (!s1) {
      router.push("/register");
      return;
    }

  }, [router]);

  const calculatedBmi = useMemo(() => {
    const heightMeters = Number(form.height) / 100;
    const weight = Number(form.weight);

    if (!heightMeters || heightMeters <= 0 || !weight || weight <= 0) {
      return "";
    }

    return (weight / (heightMeters * heightMeters)).toFixed(1);
  }, [form.height, form.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      "register_step2",
      JSON.stringify({
        ...form,
        bmi: calculatedBmi,
      })
    );
    router.push("/register/billing-details"); // Updated to match your step order
  };

  if (typeof window === "undefined") {
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
            <span className={`text-lg font-black ${Number(calculatedBmi) > 25 ? 'text-orange-500' : 'text-[#03c7fe]'}`}>
              {calculatedBmi || "--"}
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
