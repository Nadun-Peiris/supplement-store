"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";

export default function Step2() {
  const router = useRouter();

  const [step1, setStep1] = useState<any>(null);

  useEffect(() => {
    if (localStorage.getItem("registration_complete")) {
      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    const saved = localStorage.getItem("register_step1");
    if (!saved) router.push("/register/basic-details");
    else setStep1(JSON.parse(saved));
  }, [router]);

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

  useEffect(() => {
    if (form.height && form.weight) {
      const h = Number(form.height) / 100;
      const w = Number(form.weight);
      const bmiCalc = (w / (h * h)).toFixed(1);
      setForm((prev) => ({ ...prev, bmi: bmiCalc }));
    }
  }, [form.height, form.weight]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: any) => {
    handleChange(e);
    e.target.blur();
  };

  const handleNext = (e: any) => {
    e.preventDefault();
    localStorage.setItem("register_step2", JSON.stringify(form));
    router.push("/register/review");
  };

  if (!step1) return null;

  return (
    <div className="register-container">
      <div className="register-card fade-in">
        <h2 className="register-title">Your Health Information</h2>
        <p className="register-sub">Step 2 of 3 — Health & Lifestyle</p>

        <form onSubmit={handleNext} className="register-form">
          {/* HEIGHT */}
          <div className="input-group">
            <label>Height (cm)</label>
            <input
              type="number"
              name="height"
              value={form.height}
              onChange={handleChange}
              placeholder="Enter height"
              required
              min={0}
            />
          </div>

          {/* WEIGHT */}
          <div className="input-group">
            <label>Weight (kg)</label>
            <input
              type="number"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="Enter weight"
              required
            />
          </div>

          {/* BMI */}
          <div className="input-group">
            <label>BMI (Auto)</label>
            <input type="text" value={form.bmi} disabled />
          </div>

          {/* GOAL */}
          <div className="input-group">
            <label>Your Goal</label>
            <div className="select-wrapper">
              <select
                name="goal"
                value={form.goal}
                onChange={handleSelectChange}
                required
              >
                <option value="" disabled>
                  Select your goal
                </option>
                <option value="weight-loss">Lose Weight</option>
                <option value="muscle-gain">Gain Muscle</option>
                <option value="maintain">Maintain Health</option>
                <option value="transform">Body Transformation</option>
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>

          {/* ACTIVITY */}
          <div className="input-group">
            <label>Activity Level</label>
            <div className="select-wrapper">
              <select
                name="activity"
                value={form.activity}
                onChange={handleSelectChange}
                required
              >
                <option value="" disabled>
                  Select activity
                </option>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light Activity</option>
                <option value="moderate">Moderately Active</option>
                <option value="heavy">Very Active</option>
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>

          {/* CONDITIONS */}
          <div className="input-group">
            <label>Medical Conditions</label>
            <input
              type="text"
              name="conditions"
              value={form.conditions}
              onChange={handleChange}
              placeholder="e.g., diabetes, asthma"
            />
          </div>

          {/* DIET */}
          <div className="input-group">
            <label>Diet Type</label>
            <div className="select-wrapper">
              <select
                name="diet"
                value={form.diet}
                onChange={handleSelectChange}
              >
                <option value="" disabled>
                  Select diet
                </option>
                <option value="normal">Normal</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>

          {/* SLEEP */}
          <div className="input-group">
            <label>Daily Sleep Hours</label>
            <input
              type="number"
              name="sleepHours"
              value={form.sleepHours}
              onChange={handleChange}
              placeholder="e.g., 7"
              min={0}
            />
          </div>

          {/* WATER */}
          <div className="input-group">
            <label>Water Intake (L/day)</label>
            <input
              type="number"
              name="waterIntake"
              value={form.waterIntake}
              onChange={handleChange}
              placeholder="e.g., 2.5"
              min={0}
            />
          </div>

          <div className="register-actions">
            <button
              type="button"
              className="reg-back-btn"
            onClick={() => router.push("/register/basic-details")}
            >
              ← Back
            </button>
            <button type="submit" className="register-btn">
              Continue →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
