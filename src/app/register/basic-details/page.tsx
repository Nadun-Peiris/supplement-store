"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash, FaChevronDown } from "react-icons/fa";
import { HEALTH_OPTIONS } from "@/lib/constants";

export default function Step1() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryCode: "+94",
    phoneLocal: "",
    age: "",
    gender: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("registration_complete")) {
      router.replace("/dashboard");
    }
    const saved = localStorage.getItem("register_step1");
    if (saved) {
      setForm(JSON.parse(saved));
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const digitsOnly = form.phoneLocal.replace(/\D/g, "");
    const trimmedPhone = `${form.countryCode}${digitsOnly}`;
    if (!/^\+94\d{9}$/.test(trimmedPhone)) {
      alert("Please enter a valid Sri Lankan phone number (e.g., 771234567).");
      return;
    }

    localStorage.setItem("register_step1", JSON.stringify({ ...form, phone: trimmedPhone }));
    router.push("/register/health-info");
  };

  // Reusable Tailwind classes for the "Sync" Look
  const inputClass = "w-full rounded-xl border border-[#cfeef7] bg-[#fbfdff] p-3 text-sm outline-none transition-all focus:border-[#31D7FF] focus:ring-2 focus:ring-[#31D7FF]/20 placeholder:text-gray-300";
  const labelClass = "text-sm font-bold text-[#111] mb-1.5 block";
  const selectWrapper = "relative flex items-center";
  const selectIcon = "pointer-events-none absolute right-4 text-gray-400 group-focus-within:text-[#31D7FF] transition-colors";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
      <div className="w-full max-w-[480px] rounded-[22px] border border-[#e6faff] bg-white p-8 shadow-xl animate-in fade-in slide-in-from-bottom-2">
        
        <h2 className="text-center text-3xl font-black text-[#111]">Create Account</h2>
        <p className="mb-8 text-center text-sm font-medium text-gray-500">Step 1 of 3 — Basic Information</p>

        <form onSubmit={handleNext} className="space-y-5">
          {/* FULL NAME */}
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              name="fullName"
              className={inputClass}
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              type="email"
              name="email"
              className={inputClass}
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
            />
          </div>

          {/* PASSWORD GRID */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={inputClass}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 6 chars"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#31D7FF] transition-colors"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Confirm</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  className={inputClass}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#31D7FF] transition-colors"
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* PHONE (Sri Lanka Only) */}
          <div>
            <label className={labelClass}>Phone Number</label>
            <div className="flex gap-2">
              <div className="flex w-[100px] items-center justify-center rounded-xl border border-[#cfeef7] bg-gray-50 text-sm font-bold text-gray-500">
                🇱🇰 +94
              </div>
              <input
                type="tel"
                name="phoneLocal"
                className={inputClass}
                value={form.phoneLocal}
                onChange={handleChange}
                placeholder="771234567"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* AGE */}
            <div>
              <label className={labelClass}>Age</label>
              <input
                type="number"
                name="age"
                className={inputClass}
                value={form.age}
                onChange={handleChange}
                placeholder="Years"
                required
              />
            </div>

            {/* GENDER CUSTOM DROPDOWN */}
            <div className="group flex flex-col">
              <label className={labelClass}>Gender</label>
              <div className={selectWrapper}>
                <select
                  name="gender"
                  className={`${inputClass} appearance-none cursor-pointer pr-10`}
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled className="text-gray-300">Select</option>
                  {HEALTH_OPTIONS.gender.map(g => (
                    <option key={g} value={g} className="text-[#111]">{g}</option>
                  ))}
                </select>
                <FaChevronDown className={selectIcon} size={12} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-[#262626] py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-[#111] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
          >
            Continue to Health Info →
          </button>
        </form>
      </div>
    </div>
  );
}