import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import HealthLog from "@/models/HealthLog";
import User from "@/models/User";
import { calculateHealth } from "@/lib/health";

/* ----------------------------------------
   CREATE NEW LOG (ALWAYS)
---------------------------------------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { userId } = body;

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const mergedData = {
      ...body,
      age: user.age,
      gender: user.gender,
      height: user.height,
      goal: user.goal,
      activityLevel: user.activity,
    };

    const results = calculateHealth(mergedData);

    const log = await HealthLog.create({
      userId,
      date: new Date(), // 🔥 exact timestamp
      ...mergedData,
      ...results,
    });

    return NextResponse.json(log);
  } catch (err) {
    console.error("HEALTH POST ERROR", err);
    return NextResponse.json(
      { error: "Failed to save log" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------
   GET LOGS
---------------------------------------- */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const logs = await HealthLog.find({ userId })
      .sort({ date: 1 })
      .limit(100); // increased for charts

    return NextResponse.json(logs);
  } catch (err) {
    console.error("HEALTH GET ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}