"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Lottie from "lottie-react";
import "./success.css";

export default function SuccessPage() {
  const router = useRouter();
  const [animationData, setAnimationData] = useState<any>(null);

  // Ensure this page is only accessible after registration
  useEffect(() => {
    const flag = localStorage.getItem("registration_complete");
    if (!flag) {
      router.replace("/register/basic-details");
    }
  }, [router]);

  useEffect(() => {
    fetch("/lottie/Success.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load success animation", err));
  }, []);

  return (
    <div className="success-container">
      <div className="success-card fade-in">

        {/* LOTTIE ANIMATION */}
        <div className="lottie-wrapper">
          {animationData && <Lottie animationData={animationData} loop />}
        </div>

        {/* TITLE */}
        <h2 className="success-title">Registration Successful</h2>
        <p className="success-sub">Your account has been created successfully.</p>

        <button
          className="success-btn"
          onClick={() => {
            localStorage.removeItem("registration_complete");
            router.push("/dashboard");
          }}
        >
          Go to Dashboard →
        </button>

      </div>
    </div>
  );
}
