// src/app/api/dashboard/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { requireMongoUser } from "@/lib/requestAuth";

type DashboardHealthUser = {
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  goal?: string | null;
  activity?: string | null;
  conditions?: string | null;
  diet?: string | null;
  sleepHours?: number | null;
  waterIntake?: number | null;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = (await requireMongoUser(
      req,
      "height weight bmi goal activity conditions diet sleepHours waterIntake"
    )) as DashboardHealthUser;

    // Return only health tracking summary
    return NextResponse.json({
      success: true,
      health: {
        height: user.height ?? null,
        weight: user.weight ?? null,
        bmi: user.bmi ?? null,
        goal: user.goal ?? null,
        activity: user.activity ?? null,
        conditions: user.conditions ?? null,
        diet: user.diet ?? null,
        sleepHours: user.sleepHours ?? null,
        waterIntake: user.waterIntake ?? null,
      },
    });
  } catch (err) {
    console.error("Health API error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load health data" },
      { status }
    );
  }
}
