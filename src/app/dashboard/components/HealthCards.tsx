"use client";

import { useEffect, useState } from "react";
import "./HealthCards.css";
import { auth } from "@/lib/firebase";
import { FiActivity, FiDroplet } from "react-icons/fi";
import { PiScalesLight } from "react-icons/pi";

export default function HealthCards() {
  const [health, setHealth] = useState<any>(null);

  const formatLabel = (value?: string) => {
    if (!value) return "N/A";
    return value
      .toString()
      .replace(/[-_]/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  useEffect(() => {
    async function loadHealth() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setHealth(null);
          return;
        }

        const res = await fetch("/api/dashboard/health", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          setHealth(null);
          return;
        }

        const data = await res.json();
        setHealth(data.health);
      } catch (err) {
        console.error("Failed to load health data", err);
      }
    }

    loadHealth();
  }, []);

  if (!health) {
    return <div className="health-grid">Loading...</div>;
  }

  return (
    <div className="health-grid">
      {/* Weight */}
      <div className="health-card">
        <div className="health-icon weight">
          <PiScalesLight size={22} />
        </div>
        <div>
          <p className="health-label">Weight</p>
          <p className="health-value">{health.weight || "--"} kg</p>
        </div>
      </div>

      {/* Water Intake */}
      <div className="health-card">
        <div className="health-icon water">
          <FiDroplet size={22} />
        </div>
        <div>
          <p className="health-label">Water Intake</p>
          <p className="health-value">
            {health.waterIntake || "--"} L / day
          </p>
        </div>
      </div>

      {/* Activity Level */}
      <div className="health-card">
        <div className="health-icon activity">
          <FiActivity size={22} />
        </div>
        <div>
          <p className="health-label">Activity Level</p>
          <p className="health-value">{formatLabel(health.activity)}</p>
        </div>
      </div>
    </div>
  );
}
