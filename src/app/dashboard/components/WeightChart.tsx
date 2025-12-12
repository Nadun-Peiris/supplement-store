"use client";

import { useEffect, useState } from "react";
import "./WeightChart.css";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { auth } from "@/lib/firebase";

export default function WeightChart() {
  const [weightData, setWeightData] = useState<any[]>([]);

  useEffect(() => {
    async function loadWeight() {
      try {
        const token = await auth.currentUser?.getIdToken();

        const res = await fetch("/api/dashboard/weight-history", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setWeightData(data.history || []);
      } catch (err) {
        console.error("Failed to load weight history", err);
      }
    }

    loadWeight();
  }, []);

  return (
    <div className="dashboard-card weight-chart-card">
      <h3 className="chart-title">Weight Progress</h3>

      <LineChart width={350} height={220} data={weightData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
        <XAxis dataKey="date" stroke="#777" />
        <YAxis stroke="#777" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#03C7FE"
          strokeWidth={3}
          dot={{ r: 4, stroke: "#03C7FE", strokeWidth: 2 }}
        />
      </LineChart>
    </div>
  );
}
