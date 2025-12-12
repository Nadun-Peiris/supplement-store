import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid }).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const baseWater =
      typeof user.waterIntake === "number" && user.waterIntake > 0
        ? user.waterIntake
        : 2.5;

    const history = Array.from({ length: 7 }).map((_, idx) => {
      const dayOffset = 6 - idx;
      const date = new Date();
      date.setDate(date.getDate() - dayOffset);

      const value = Math.max(0, baseWater + (idx - 3) * 0.1);

      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: Number(value.toFixed(1)),
      };
    });

    return NextResponse.json({ history });
  } catch (err) {
    console.error("Water history API error:", err);
    return NextResponse.json(
      { error: "Failed to load water history" },
      { status: 500 }
    );
  }
}
