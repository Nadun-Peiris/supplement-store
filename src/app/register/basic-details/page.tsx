"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChevronDown } from "react-icons/fa";

export default function Step1() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    countryCode: "+94",
    phoneLocal: "",
    phone: "",
    age: "",
    gender: "",
  });

  useEffect(() => {
    if (localStorage.getItem("registration_complete")) {
      router.replace("/dashboard");
    }
  }, [router]);

  // Load saved data (back button)
  useEffect(() => {
    const saved = localStorage.getItem("register_step1");
    if (saved) {
      const parsed = JSON.parse(saved);
      const savedCountry = parsed.countryCode || "+94";
      let localPart = parsed.phoneLocal || "";
      if (!localPart && typeof parsed.phone === "string") {
        localPart = parsed.phone.replace(savedCountry, "");
      }
      setForm((prev) => ({
        ...prev,
        ...parsed,
        countryCode: savedCountry,
        phoneLocal: localPart,
        phone: parsed.phone || `${savedCountry}${localPart}`,
      }));
    }
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: any) => {
    handleChange(e);
    e.target.blur();
  };

  const countryOptions = [
    { code: "+94", label: "Sri Lanka (+94)", flag: "🇱🇰" },
    { code: "+1", label: "United States (+1)", flag: "🇺🇸" },
    { code: "+44", label: "United Kingdom (+44)", flag: "🇬🇧" },
    { code: "+61", label: "Australia (+61)", flag: "🇦🇺" },
  ];

  const handleNext = (e: any) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const digitsOnly = form.phoneLocal.replace(/\D/g, "");
    const trimmedPhone = `${form.countryCode}${digitsOnly}`;
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(trimmedPhone)) {
      alert("Please enter a valid phone number (include area code).");
      return;
    }

    const payload = {
      ...form,
      phone: trimmedPhone,
      phoneLocal: digitsOnly,
    };
    localStorage.setItem("register_step1", JSON.stringify(payload));
    router.push("/register/health-info");
  };

  return (
    <div className="register-container">
      <div className="register-card fade-in">

        <h2 className="register-title">Create Your Account</h2>
        <p className="register-sub">Step 1 of 3 — Basic Information</p>

        <form onSubmit={handleNext} className="register-form">

          {/* FULL NAME */}
          <div className="input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* EMAIL */}
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="input-group">
            <label>Re-enter Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          {/* PHONE NUMBER */}
          <div className="input-group">
            <label>Phone Number</label>
            <div className="phone-input">
              <select
                name="countryCode"
                value={form.countryCode}
                onChange={handleChange}
                required
              >
                {countryOptions.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                name="phoneLocal"
                value={form.phoneLocal}
                onChange={handleChange}
                placeholder="771234567"
                pattern="\d{6,14}"
                title="Enter digits only"
                required
              />
            </div>
          </div>

          {/* AGE */}
          <div className="input-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              placeholder="Your age"
              required
            />
          </div>

          {/* GENDER SELECT */}
          <div className="input-group">
            <label>Gender</label>
            <div className="select-wrapper">
              <select
                name="gender"
                value={form.gender}
                onChange={handleSelectChange}
                required
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <FaChevronDown className="select-icon" />
            </div>
          </div>

          <button className="register-btn" type="submit">
            Continue →
          </button>

        </form>
      </div>
    </div>
  );
}
