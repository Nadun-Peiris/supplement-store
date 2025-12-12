"use client";

import { useEffect, useState } from "react";
import "./WaterChart.css";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { auth } from "@/lib/firebase";

export default function WaterChart() {
  const [waterData, setWaterData] = useState<any[]>([]);

  useEffect(() => {
    async function loadWater() {
      try {
        const token = await auth.currentUser?.getIdToken();

        const res = await fetch("/api/dashboard/water-history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setWaterData(data.history || []);
      } catch (err) {
        console.error("Failed to load water history", err);
      }
    }

    loadWater();
  }, []);

  return (
    <div className="dashboard-card water-chart-card">
      <h3 className="chart-title">Water Intake</h3>

      <BarChart width={350} height={220} data={waterData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
        <XAxis dataKey="date" stroke="#777" />
        <YAxis stroke="#777" />
        <Tooltip />
        <Bar dataKey="value" fill="#03C7FE" radius={[5, 5, 0, 0]} />
      </BarChart>
    </div>
  );
}
