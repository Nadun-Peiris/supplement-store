// src/app/api/dashboard/health/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User, { IUser } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = adminAuth();

    // Check Firebase auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Verify Firebase token
    const decoded = await auth.verifyIdToken(token);

    // Find user in MongoDB
    const user = (await User.findOne({ firebaseId: decoded.uid }).lean()) as
      | IUser
      | null;

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

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
    return NextResponse.json(
      { error: "Failed to load health data" },
      { status: 500 }
    );
  }
}
