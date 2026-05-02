import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

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
const DIET_OPTIONS = new Set([
  "Standard",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseNumber = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
};

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const requiredFields = [
      "fullName",
      "email",
      "password",
      "phone",
      "age",
      "gender",
      "height",
      "weight",
      "goal",
      "activity",
      "addressLine1",
      "city",
      "postalCode",
      "country",
    ] as const;

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const normalizedEmail =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const normalizedPhone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!GENDER_OPTIONS.has(String(body.gender))) {
      return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
    }

    if (!GOAL_OPTIONS.has(String(body.goal))) {
      return NextResponse.json({ error: "Invalid goal value." }, { status: 400 });
    }

    if (!ACTIVITY_OPTIONS.has(String(body.activity))) {
      return NextResponse.json(
        { error: "Invalid activity value." },
        { status: 400 }
      );
    }

    if (body.diet !== undefined && body.diet !== "" && !DIET_OPTIONS.has(String(body.diet))) {
      return NextResponse.json({ error: "Invalid diet value." }, { status: 400 });
    }

    const age = parseNumber(body.age);
    const height = parseNumber(body.height);
    const weight = parseNumber(body.weight);
    const bmi =
      body.bmi === undefined || body.bmi === null || body.bmi === ""
        ? null
        : parseNumber(body.bmi);

    if (age === null || height === null || weight === null) {
      return NextResponse.json(
        { error: "Age, height, and weight must be valid numbers." },
        { status: 400 }
      );
    }

    const {
      fullName,
      password,
      gender,
      goal,
      activity,
      conditions,
      diet,
      sleepHours,
      waterIntake,

      // Billing Details
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
    } = body;

    // Validate phone format
    if (!/^\+[1-9]\d{6,14}$/.test(normalizedPhone)) {
      return NextResponse.json(
        { error: "phone must be a non-empty E.164 compliant string" },
        { status: 400 }
      );
    }

    // Prevent duplicate accounts
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 400 }
      );
    }

    const existingPhone = await User.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number is already registered." },
        { status: 400 }
      );
    }

    // Create Firebase Auth User
    let firebaseUserId: string | null = null;

    try {
      const firebaseUser = await adminAuth().createUser({
        email: normalizedEmail,
        password,
        displayName: fullName,
        phoneNumber: normalizedPhone,
      });
      firebaseUserId = firebaseUser.uid;

      const newUser = await User.create({
        firebaseId: firebaseUser.uid,
        role: "customer",
        fullName: String(fullName).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        age,
        gender,
        height,
        weight,
        bmi: bmi ?? undefined,
        goal,
        activity,
        conditions,
        diet,
        sleepHours,
        waterIntake,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country,
      });

      return NextResponse.json(
        {
          success: true,
          userId: firebaseUser.uid,
          mongoId: newUser._id,
        },
        { status: 200 }
      );
    } catch (error) {
      if (firebaseUserId) {
        try {
          await adminAuth().deleteUser(firebaseUserId);
        } catch (rollbackError) {
          console.error("REGISTER ROLLBACK ERROR:", rollbackError);
        }
      }

      throw error;
    }
  } catch (err: unknown) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 400 }
    );
  }
}
