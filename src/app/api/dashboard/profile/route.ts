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

    const profile = {
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      age: user.age ?? "",
      gender: user.gender || "",
      height: user.height ?? "",
      weight: user.weight ?? "",
      bmi:
        user.bmi ??
        (user.height && user.weight
          ? Number((user.weight / Math.pow(user.height / 100, 2)).toFixed(1))
          : ""),
      goal: user.goal ?? "",
      activity: user.activity ?? "",
      addressLine1: user.addressLine1 || "",
      addressLine2: user.addressLine2 || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
      country: user.country || "",
    };

    return NextResponse.json({ user: profile });
  } catch (err) {
    console.error("Profile API error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to load profile" },
      { status }
    );
  }
}
