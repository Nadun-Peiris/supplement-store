import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const numberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    const updates: Record<string, unknown> = {
      fullName: body.fullName,
      phone: body.phone,
      gender: body.gender,
      goal: body.goal,
      activity: body.activity,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      city: body.city,
      postalCode: body.postalCode,
      country: body.country,
    };

    const age = numberOrUndefined(body.age);
    if (age !== undefined) updates.age = age;

    const height = numberOrUndefined(body.height);
    if (height !== undefined) updates.height = height;

    const weight = numberOrUndefined(body.weight);
    if (weight !== undefined) updates.weight = weight;

    Object.assign(user, updates);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
