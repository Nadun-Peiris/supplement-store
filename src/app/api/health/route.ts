import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import HealthLog from "@/models/HealthLog";
import { verifyRequestToken } from "@/lib/requestAuth";

export async function GET(req: Request) {
  try {
    await connectDB();
    const decoded = await verifyRequestToken(req);

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Efficient date range query: Get logs from the last X days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateString = startDate.toISOString().split("T")[0];

    const logs = await HealthLog.find({
      userId: decoded.uid,
      date: { $gte: startDateString }, // More efficient than $in: [array_of_dates]
    })
      .sort({ date: 1 })
      .lean();

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Health log fetch error:", error);
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to fetch health logs" },
      { status }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const decoded = await verifyRequestToken(req);

    const body = await req.json();
    const { date, ...data } = body;

    if (!date) {
      return NextResponse.json(
        { error: "Missing date" },
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
      { userId: decoded.uid, date },
      { $set: { userId: decoded.uid, date, ...data } },
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
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to save health log" },
      { status }
    );
  }
}
