"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const router = useRouter();

  const [step1, setStep1] = useState<any>(null);
  const [step2, setStep2] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);

  const [submitting, setSubmitting] = useState(false);

  // Load steps
  useEffect(() => {
    // If user already completed registration → redirect to success
    if (typeof window !== "undefined" && localStorage.getItem("registration_complete")) {
      router.replace("/register/success");
      return;
    }

    const s1 = localStorage.getItem("register_step1");
    const s2 = localStorage.getItem("register_step2");
    const b = localStorage.getItem("register_billing");

    if (!s1) return router.push("/register/step1");
    if (!s2) return router.push("/register/step2");
    if (!b) return router.push("/register/billing-details");

    setStep1(JSON.parse(s1));
    setStep2(JSON.parse(s2));
    setBilling(JSON.parse(b));
  }, [router]);


  if (!step1 || !step2 || !billing) return null;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      ...step1,
      ...step2,
      ...billing,
      createdAt: new Date().toISOString(),
    };

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.error || "Registration failed");
      setSubmitting(false);
      return;
    }

    // Mark as completed + clear temp
    localStorage.setItem("registration_complete", "1");

    localStorage.removeItem("register_step1");
    localStorage.removeItem("register_step2");
    localStorage.removeItem("register_billing");

    router.replace("/register/success");
  };

  return (
    <div className="register-container">
      <div className="register-card fade-in">

        <h2 className="register-title">Review Your Information</h2>
        <p className="register-sub">Step 4 of 4 — Confirm & Create Account</p>

        <div className="review-box">

          {/* PERSONAL INFO */}
          <h3 className="review-heading">Personal Information</h3>

          <div className="review-row"><span>Name:</span> {step1.fullName}</div>
          <div className="review-row"><span>Email:</span> {step1.email}</div>
          <div className="review-row"><span>Phone:</span> {step1.phone}</div>
          <div className="review-row"><span>Age:</span> {step1.age}</div>
          <div className="review-row"><span>Gender:</span> {step1.gender}</div>

          <hr className="review-divider" />

          {/* HEALTH INFO */}
          <h3 className="review-heading">Health Information</h3>

          <div className="review-row"><span>Height:</span> {step2.height} cm</div>
          <div className="review-row"><span>Weight:</span> {step2.weight} kg</div>
          <div className="review-row"><span>BMI:</span> {step2.bmi}</div>
          <div className="review-row"><span>Goal:</span> {step2.goal}</div>
          <div className="review-row"><span>Activity:</span> {step2.activity}</div>
          <div className="review-row"><span>Medical Conditions:</span> {step2.conditions || "None"}</div>
          <div className="review-row"><span>Diet Preference:</span> {step2.diet || "Normal"}</div>
          <div className="review-row"><span>Sleep:</span> {step2.sleepHours} hours</div>
          <div className="review-row"><span>Water Intake:</span> {step2.waterIntake} L/day</div>

          <hr className="review-divider" />

          {/* BILLING INFO */}
          <h3 className="review-heading">Billing & Shipping</h3>

          <div className="review-row"><span>Address Line 1:</span> {billing.addressLine1}</div>
          <div className="review-row"><span>Address Line 2:</span> {billing.addressLine2 || "—"}</div>
          <div className="review-row"><span>City:</span> {billing.city}</div>
          <div className="review-row"><span>Postal Code:</span> {billing.postalCode}</div>
          <div className="review-row"><span>Country:</span> {billing.country}</div>

        </div>

        <div className="review-btn-row">

          <button 
            className="reg-back-btn"
            onClick={() => router.push("/register/billing-details")}
          >
            ← Back
          </button>

          <button
            className="register-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Creating Account..." : "Create Account →"}
          </button>
        </div>

      </div>
    </div>
  );
}
