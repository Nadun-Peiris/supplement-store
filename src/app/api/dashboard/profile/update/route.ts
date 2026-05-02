import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const GENDER_OPTIONS = new Set(["Male", "Female", "Other"]);
const GOAL_OPTIONS = new Set([
  "Weight Loss",
  "Muscle Gain",
  "Maintenance",
  "Body Transformation",
]);
const ACTIVITY_OPTIONS = new Set([
  "Sedentary",
  "Light",
  "Moderate",
  "Active",
  "Very Active",
]);
const PHONE_REGEX = /^[+\d][\d\s()-]{6,20}$/;

const numberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
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

    if (
      body.email !== undefined ||
      body.role !== undefined ||
      body.isBlocked !== undefined ||
      body.firebaseId !== undefined ||
      body.subscription !== undefined
    ) {
      return NextResponse.json(
        { error: "Restricted fields cannot be changed here." },
        { status: 400 }
      );
    }

    const requiredStringFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "postalCode",
      "country",
    ] as const;
    const setData: Record<string, unknown> = {};
    const unsetData: Record<string, ""> = {};

    for (const field of requiredStringFields) {
      const value = body[field];
      if (typeof value !== "string" || !value.trim()) {
        return NextResponse.json(
          { error: `${field} is required.` },
          { status: 400 }
        );
      }
      setData[field] = value.trim();
    }

    if (!PHONE_REGEX.test(String(setData.phone))) {
      return NextResponse.json(
        { error: "Invalid phone number." },
        { status: 400 }
      );
    }

    if (typeof body.addressLine2 === "string") {
      const trimmed = body.addressLine2.trim();
      if (trimmed) {
        setData.addressLine2 = trimmed;
      } else {
        unsetData.addressLine2 = "";
      }
    }

    if (!GENDER_OPTIONS.has(String(body.gender))) {
      return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
    }
    if (body.goal !== "" && body.goal !== undefined && !GOAL_OPTIONS.has(String(body.goal))) {
      return NextResponse.json({ error: "Invalid goal value." }, { status: 400 });
    }
    if (
      body.activity !== "" &&
      body.activity !== undefined &&
      !ACTIVITY_OPTIONS.has(String(body.activity))
    ) {
      return NextResponse.json(
        { error: "Invalid activity value." },
        { status: 400 }
      );
    }

    setData.gender = body.gender;

    if (typeof body.goal === "string") {
      const trimmed = body.goal.trim();
      if (trimmed) setData.goal = trimmed;
      else unsetData.goal = "";
    }

    if (typeof body.activity === "string") {
      const trimmed = body.activity.trim();
      if (trimmed) setData.activity = trimmed;
      else unsetData.activity = "";
    }

    const age = numberOrNull(body.age);
    const height = numberOrNull(body.height);
    const weight = numberOrNull(body.weight);

    if (age === null) {
      return NextResponse.json(
        { error: "Age must be a valid number." },
        { status: 400 }
      );
    }

    setData.age = age;
    if (height === null) unsetData.height = "";
    else setData.height = height;

    if (weight === null) unsetData.weight = "";
    else setData.weight = weight;

    if (height !== null && weight !== null && height > 0) {
      setData.bmi = Number((weight / Math.pow(height / 100, 2)).toFixed(1));
    } else {
      unsetData.bmi = "";
    }

    await User.updateOne(
      { _id: user._id },
      {
        ...(Object.keys(setData).length ? { $set: setData } : {}),
        ...(Object.keys(unsetData).length ? { $unset: unsetData } : {}),
      },
      { runValidators: true }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Profile update error:", err);
    const status =
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      typeof err.status === "number"
        ? err.status
        : 500;
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Failed to update profile" },
      { status }
    );
  }
}
