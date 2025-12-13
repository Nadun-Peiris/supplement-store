"use client";

import { useEffect, useState } from "react";
import "./UserSummary.css";
import { auth } from "@/lib/firebase";

const UserSummarySkeleton = () => {
  return (
    <div className="dashboard-card user-summary skeleton">
      <div className="user-left">
        <div className="skeleton-line skeleton-kicker" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-subtitle" />

        <div className="user-info-row">
          {[1, 2, 3].map((key) => (
            <div key={key} className="info-item">
              <div className="skeleton-line skeleton-label" />
              <div className="skeleton-line skeleton-value" />
            </div>
          ))}
        </div>
      </div>

      <div className="user-right">
        <div className="stat-card">
          <div className="skeleton-line skeleton-label" />
          <div className="skeleton-line skeleton-stat" />
          <div className="skeleton-line skeleton-subtitle" />
        </div>
      </div>
    </div>
  );
};

export default function UserSummary() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const formatText = (value?: string) => {
    if (!value) return "Not set";
    const trimmed = value.trim();
    if (!trimmed) return "Not set";
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await user.getIdToken();
        const res = await fetch("/api/dashboard/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setProfile(data.user);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <UserSummarySkeleton />;
  if (!profile) return null;

  return (
    <div className="dashboard-card user-summary">
      <div className="user-left">
        <p className="user-kicker">Dashboard overview</p>
        <h2 className="user-name">Welcome back, {profile.fullName}</h2>
        <p className="user-email">{profile.email}</p>

        <div className="user-info-row">
          <div className="info-item">
            <label>BMI</label>
            <span>{profile.bmi || "--"}</span>
          </div>

          <div className="info-item">
            <label>Goal</label>
            <span>{formatText(profile.goal)}</span>
          </div>

          <div className="info-item">
            <label>Activity</label>
            <span>{formatText(profile.activity)}</span>
          </div>
        </div>
      </div>

      <div className="user-right">
        <div className="stat-card">
          <p className="stat-label">Primary Goal</p>
          <h3 className="stat-value">{formatText(profile.goal)}</h3>
          <p className="stat-hint">Stay consistent and keep tracking.</p>
        </div>
      </div>
    </div>
  );
}
