"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, ArrowLeft, Loader2 } from "lucide-react";

export default function BillingDetailsPage() {
  const router = useRouter();

  const [step1, setStep1] = useState<any>(null);
  const [step2, setStep2] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load previous steps and check authorization
  useEffect(() => {
    const s1 = localStorage.getItem("register_step1");
    const s2 = localStorage.getItem("register_step2");
    const savedBilling = localStorage.getItem("register_billing");

    if (!s1) {
      router.push("/register");
      return;
    }
    if (!s2) {
      router.push("/register/health-info");
      return;
    }

    setStep1(JSON.parse(s1));
    setStep2(JSON.parse(s2));
    
    if (savedBilling) {
      setForm(JSON.parse(savedBilling));
    }
    
    setLoading(false);
  }, [router]);

  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "Sri Lanka",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.addressLine1 || !form.city || !form.postalCode) {
      alert("Please fill all required fields.");
      return;
    }

    localStorage.setItem("register_billing", JSON.stringify(form));
    router.push("/register/review");
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
      <div className="w-full max-w-[480px] rounded-[18px] border border-[#e6faff] bg-white p-8 shadow-lg animate-in fade-in slide-in-from-bottom-2">
        
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#31D7FF]/10 text-[#31D7FF]">
            <MapPin size={24} />
          </div>
          <h2 className="text-center text-3xl font-extrabold text-[#111]">Billing Details</h2>
          <p className="text-center text-sm font-medium text-gray-500">Step 3 of 4 — Address Information</p>
        </div>

        <form onSubmit={handleNext} className="space-y-5">

          {/* ADDRESS LINE 1 */}
          <div>
            <label className={labelClass}>Address Line 1 *</label>
            <input
              type="text"
              name="addressLine1"
              className={inputClass}
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="House number, street name"
              required
            />
          </div>

          {/* ADDRESS LINE 2 */}
          <div>
            <label className={labelClass}>Address Line 2 (optional)</label>
            <input
              type="text"
              name="addressLine2"
              className={inputClass}
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, building, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CITY */}
            <div>
              <label className={labelClass}>City *</label>
              <input
                type="text"
                name="city"
                className={inputClass}
                value={form.city}
                onChange={handleChange}
                placeholder="Colombo"
                required
              />
            </div>

            {/* POSTAL CODE */}
            <div>
              <label className={labelClass}>Postal Code *</label>
              <input
                type="text"
                name="postalCode"
                className={inputClass}
                value={form.postalCode}
                onChange={handleChange}
                placeholder="10100"
                required
              />
            </div>
          </div>

          {/* COUNTRY */}
          <div>
            <label className={labelClass}>Country *</label>
            <input
              type="text"
              name="country"
              className={`${inputClass} bg-gray-50`}
              value={form.country}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
              onClick={() => router.push("/register/health-info")}
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