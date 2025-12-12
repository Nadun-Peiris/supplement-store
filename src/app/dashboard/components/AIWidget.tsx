"use client";

import { useEffect, useState } from "react";
import "./AIWidget.css";
import { auth } from "@/lib/firebase";

type Tip = {
  title: string;
  body: string;
};

const fallbackTips: Tip[] = [
  {
    title: "Keep your bottle close",
    body: "Sip 200–300ml every hour to comfortably hit your daily hydration target.",
  },
  {
    title: "Plan tomorrow now",
    body: "Prep a high-protein breakfast tonight so you start the day on track.",
  },
  {
    title: "Micro-movement wins",
    body: "Stand, stretch, or walk for 3 minutes every hour to bump up activity.",
  },
];

function buildTips(health: any): Tip[] {
  const tips: Tip[] = [];
  const { weight, waterIntake, activity, goal } = health || {};

  if (typeof waterIntake === "number" && waterIntake < 2.3) {
    tips.push({
      title: "Nudge hydration upward",
      body: `You're around ${waterIntake}L/day. Add one extra glass with each meal to reach 2.5–3L.`,
    });
  }

  if (activity === "sedentary" || activity === "light") {
    tips.push({
      title: "Light movement streak",
      body: "Stack two 10-minute walks after meals today. It boosts NEAT and keeps blood sugar steady.",
    });
  }

  if (goal === "weight-loss" || goal === "maintain") {
    tips.push({
      title: "Evening protein anchor",
      body: "Aim for ~25g protein at dinner to support recovery and reduce late-night snacking.",
    });
  }

  if (typeof weight === "number" && weight > 0 && tips.length < 3) {
    tips.push({
      title: "Track one habit",
      body: "Log weight weekly at the same time of day to spot trends—not day-to-day noise.",
    });
  }

  if (tips.length === 0) return fallbackTips;
  return tips.slice(0, 3);
}

export default function AIWidget() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setTips(fallbackTips);
          return;
        }
        const res = await fetch("/api/dashboard/health", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          setTips(fallbackTips);
          return;
        }

        if (!res.ok) throw new Error(`Health fetch failed: ${res.status}`);

        const data = await res.json();
        if (!cancelled) {
          setTips(buildTips(data.health));
        }
      } catch (err) {
        console.error("AI widget health load failed:", err);
        if (!cancelled) {
          setTips(fallbackTips);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="dashboard-card ai-widget">
      <div className="ai-header">
        <div>
          <p className="ai-eyebrow">Smart Coach</p>
          <h3 className="ai-title">Personalized nudges</h3>
        </div>
        <span className="ai-pill">Beta</span>
      </div>

      {loading ? (
        <p className="ai-loading">Finding the next best actions...</p>
      ) : (
        <ul className="ai-list">
          {tips.map((tip) => (
            <li key={tip.title} className="ai-item">
              <span className="ai-dot" />
              <div>
                <p className="ai-item-title">{tip.title}</p>
                <p className="ai-item-body">{tip.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
