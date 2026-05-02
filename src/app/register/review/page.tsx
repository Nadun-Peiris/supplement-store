"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Activity, MapPin, CheckCircle2, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  clearRegisterSecrets,
  getRegisterSecrets,
} from "@/lib/registerDraft";

type StepOneDraft = {
  fullName: string;
  email: string;
  phone: string;
  age: string;
  gender: string;
};

type StepTwoDraft = {
  height: string;
  weight: string;
  goal: string;
  activity: string;
  diet: string;
  bmi: string;
};

type BillingDraft = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
};

const parseStoredDraft = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export default function ReviewPage() {
  const router = useRouter();
  const [step1] = useState<StepOneDraft | null>(() =>
    parseStoredDraft<StepOneDraft>("register_step1")
  );
  const [step2] = useState<StepTwoDraft | null>(() =>
    parseStoredDraft<StepTwoDraft>("register_step2")
  );
  const [billing] = useState<BillingDraft | null>(() =>
    parseStoredDraft<BillingDraft>("register_billing")
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("registration_complete")) {
      router.replace("/register/success");
      return;
    }

    const s1 = localStorage.getItem("register_step1");
    const s2 = localStorage.getItem("register_step2");
    const b = localStorage.getItem("register_billing");
    const secrets = getRegisterSecrets();

    // Redirect to Step 1 if data is missing
    if (!s1) return router.push("/register");
    if (!s2) return router.push("/register/health-info");
    if (!b) return router.push("/register/billing-details");
    if (!secrets?.password) {
      toast.error("Please re-enter your password to complete registration.");
      return router.push("/register/basic-details");
    }
  }, [billing, router, step1, step2]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const secrets = getRegisterSecrets();
    if (!secrets?.password) {
      toast.error("Registration session expired. Please re-enter your password.");
      setSubmitting(false);
      router.push("/register/basic-details");
      return;
    }

    const payload = {
      ...step1,
      ...step2,
      ...billing,
      password: secrets.password,
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        setSubmitting(false);
        return;
      }

      // Success logic
      localStorage.setItem("registration_complete", "1");
      localStorage.removeItem("register_step1");
      localStorage.removeItem("register_step2");
      localStorage.removeItem("register_billing");
      clearRegisterSecrets();

      toast.success("Account created successfully!");
      router.replace("/register/success");
    } catch {
      toast.error("A network error occurred.");
      setSubmitting(false);
    }
  };

  if (!step1 || !step2 || !billing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2fbff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#03c7fe]" />
      </div>
    );
  }

  const sectionHeaderClass = "flex items-center gap-2 text-[#03c7fe] font-bold text-sm uppercase tracking-wider mb-4 border-b border-gray-100 pb-2";
  const rowClass = "flex justify-between py-1.5 text-sm border-b border-gray-50 last:border-0";
  const labelClass = "text-gray-500 font-medium";
  const valueClass = "text-[#111] font-bold text-right";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2fbff] px-4 py-12">
      <div className="w-full max-w-[550px] rounded-[22px] border border-[#e6faff] bg-white p-8 shadow-xl">
        
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-500">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-center text-3xl font-black text-[#111]">Review & Confirm</h2>
          <p className="text-center text-sm font-medium text-gray-400">Final Step — Please verify your details</p>
        </div>

        <div className="space-y-8 rounded-2xl bg-gray-50 p-6 border border-gray-100">
          
          {/* PERSONAL INFO */}
          <div>
            <h3 className={sectionHeaderClass}><User size={16}/> Personal Info</h3>
            <div className="space-y-1">
              <div className={rowClass}><span className={labelClass}>Name</span> <span className={valueClass}>{step1.fullName}</span></div>
              <div className={rowClass}><span className={labelClass}>Email</span> <span className={valueClass}>{step1.email}</span></div>
              <div className={rowClass}><span className={labelClass}>Phone</span> <span className={valueClass}>{step1.phone}</span></div>
              <div className={rowClass}><span className={labelClass}>Age / Gender</span> <span className={valueClass}>{step1.age} yrs / {step1.gender}</span></div>
            </div>
          </div>

          {/* HEALTH INFO */}
          <div>
            <h3 className={sectionHeaderClass}><Activity size={16}/> Health & Lifestyle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
               <div className={rowClass}><span className={labelClass}>Height</span> <span className={valueClass}>{step2.height} cm</span></div>
               <div className={rowClass}><span className={labelClass}>Weight</span> <span className={valueClass}>{step2.weight} kg</span></div>
               <div className={rowClass}><span className={labelClass}>Goal</span> <span className={valueClass}>{step2.goal}</span></div>
               <div className={rowClass}><span className={labelClass}>Activity</span> <span className={valueClass}>{step2.activity}</span></div>
               <div className={rowClass}><span className={labelClass}>Diet</span> <span className={valueClass}>{step2.diet}</span></div>
               <div className={rowClass}><span className={labelClass}>BMI</span> <span className={valueClass}>{step2.bmi}</span></div>
            </div>
          </div>

          {/* BILLING INFO */}
          <div>
            <h3 className={sectionHeaderClass}><MapPin size={16}/> Address</h3>
            <div className="text-sm leading-relaxed text-[#111] font-bold">
              {billing.addressLine1}<br/>
              {billing.addressLine2 && <>{billing.addressLine2}<br/></>}
              {billing.city}, {billing.postalCode}<br/>
              {billing.country}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-[#03c7fe]/10 p-3 text-[#03c7fe]">
            <ShieldCheck size={18} />
            <p className="text-[11px] font-bold leading-tight">By creating an account, you agree to our terms of service and privacy policy.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <button 
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-4 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
            onClick={() => router.push("/register/billing-details")}
          >
            <ArrowLeft size={16} /> Back
          </button>

          <button
            className="flex-[2] flex items-center justify-center gap-2 rounded-full bg-[#262626] py-4 text-sm font-bold text-white transition-all hover:bg-[#111] hover:shadow-lg disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Finalizing...
              </>
            ) : (
              "Confirm & Create Account →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
