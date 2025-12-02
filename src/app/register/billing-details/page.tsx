"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingDetailsPage() {
  const router = useRouter();

  const [step1, setStep1] = useState<any>(null);
  const [step2, setStep2] = useState<any>(null);

  // Load previous steps
  useEffect(() => {
    const s1 = localStorage.getItem("register_step1");
    const s2 = localStorage.getItem("register_step2");

    if (!s1) return router.push("/register/basic-details");
    if (!s2) return router.push("/register/health-info");

    setStep1(JSON.parse(s1));
    setStep2(JSON.parse(s2));
  }, [router]);

  const [form, setForm] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    postalCode: "",
    country: "Sri Lanka",
  });

  // Load saved if user pressed back
  useEffect(() => {
    const saved = localStorage.getItem("register_billing");
    if (saved) {
      setForm(JSON.parse(saved));
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleNext = (e: any) => {
    e.preventDefault();

    if (!form.addressLine1 || !form.city || !form.postalCode) {
      alert("Please fill all required fields.");
      return;
    }

    localStorage.setItem("register_billing", JSON.stringify(form));
    router.push("/register/review");
  };

  if (!step1 || !step2) return null;

  return (
    <div className="register-container">
      <div className="register-card fade-in">

        <h2 className="register-title">Billing & Shipping Details</h2>
        <p className="register-sub">Step 3 of 4 — Address Information</p>

        <form onSubmit={handleNext} className="register-form">

          {/* ADDRESS LINE 1 */}
          <div className="input-group">
            <label>Address Line 1 *</label>
            <input
              type="text"
              name="addressLine1"
              value={form.addressLine1}
              onChange={handleChange}
              placeholder="House number, street name"
              required
            />
          </div>

          {/* ADDRESS LINE 2 */}
          <div className="input-group">
            <label>Address Line 2 (optional)</label>
            <input
              type="text"
              name="addressLine2"
              value={form.addressLine2}
              onChange={handleChange}
              placeholder="Apartment, building"
            />
          </div>

          {/* CITY */}
          <div className="input-group">
            <label>City *</label>
            <input
              type="text"
              name="city"
              value={form.city}
              onChange={handleChange}
              placeholder="Colombo"
              required
            />
          </div>

          {/* POSTAL CODE */}
          <div className="input-group">
            <label>Postal Code *</label>
            <input
              type="text"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              placeholder="e.g., 10100"
              required
            />
          </div>

          {/* COUNTRY */}
          <div className="input-group">
            <label>Country *</label>
            <input
              type="text"
              name="country"
              value={form.country}
              onChange={handleChange}
              placeholder="Sri Lanka"
              required
            />
          </div>

          <div className="register-actions">
            <button
              type="button"
              className="reg-back-btn"
              onClick={() => router.push("/register/health-info")}
            >
              ← Back
            </button>
            <button className="register-btn" type="submit">
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
