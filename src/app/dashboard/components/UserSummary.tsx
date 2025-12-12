"use client";

import { useEffect, useState } from "react";
import "./UserSummary.css";
import { auth } from "@/lib/firebase";


export default function UserSummary() {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await fetch("/api/dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setProfile(data.user);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    }

    loadProfile();
  }, []);

  if (!profile)
    return <div className="dashboard-card">Loading profile...</div>;

  return (
    <div className="dashboard-card user-summary">
      <div className="user-left">
        <h2 className="user-name">👋 Hello, {profile.fullName}</h2>
        <p className="user-email">{profile.email}</p>

        <div className="user-info-row">
          <div className="info-item">
            <label>BMI</label>
            <span>{profile.bmi || "--"}</span>
          </div>

          <div className="info-item">
            <label>Goal</label>
            <span>{profile.goal || "Not set"}</span>
          </div>

          <div className="info-item">
            <label>Activity</label>
            <span>{profile.activity || "Not set"}</span>
          </div>
        </div>
      </div>

      <div className="user-right">
        <div className="circle-highlight">
          <span className="highlight-text">Your Health</span>
        </div>
      </div>
    </div>
  );
}
