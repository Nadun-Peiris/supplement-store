import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User, { type IUser } from "@/models/User";
import { requireMongoUser } from "@/lib/requestAuth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireMongoUser(req, "_id");
    const user = await User.findById(authUser._id).lean<IUser>();
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
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load water history" },
      { status }
    );
  }
}
