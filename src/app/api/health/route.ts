import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import HealthLog from "@/models/HealthLog";

// GET /api/health?userId=xxx&days=30
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const days = parseInt(searchParams.get("days") || "30");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Efficient date range query: Get logs from the last X days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateString = startDate.toISOString().split("T")[0];

    const logs = await HealthLog.find({
      userId,
      date: { $gte: startDateString }, // More efficient than $in: [array_of_dates]
    })
      .sort({ date: 1 })
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Health log fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch health logs" },
      { status: 500 }
    );
  }
}

// POST /api/health — create or update today's log
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId, date, ...data } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "Missing userId or date" },
        { status: 400 }
      );
    }

    // 1. BMI Calculation: Keeping it here ensures the latest weight/height 
    // impacts the BMI field even if the frontend calculation fails.
    if (data.weight && data.height && data.height > 0) {
      const heightM = data.height / 100;
      data.bmi = parseFloat((data.weight / (heightM * heightM)).toFixed(1));
    }

    // 2. Data Cleaning: Ensure workout is formatted correctly if sent empty
    if (!data.workout || !data.workout.type) {
      data.workout = { type: "Rest", duration: 0, notes: "" };
    }

    // 3. The Upsert: Using $set ensures we overwrite only the fields sent,
    // but because the frontend sends the full state, this handles supplements perfectly.
    const log = await HealthLog.findOneAndUpdate(
      { userId, date },
      { $set: { userId, date, ...data } },
      { 
        upsert: true, 
        new: true, 
        runValidators: true,
        setDefaultsOnInsert: true 
      }
    );

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Health log save error:", error);
    return NextResponse.json(
      { error: "Failed to save health log" },
      { status: 500 }
    );
  }
}