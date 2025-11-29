import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

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

    const {
      fullName,
      email,
      password,
      phone,
      age,
      gender,
      height,
      weight,
      bmi,
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
    if (typeof phone !== "string" || !/^\+[1-9]\d{6,14}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: "phone must be a non-empty E.164 compliant string" },
        { status: 400 }
      );
    }

    // Prevent duplicate accounts
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 400 }
      );
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number is already registered." },
        { status: 400 }
      );
    }

    // Create Firebase Auth User
    const firebaseUser = await adminAuth().createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phone.trim(),
    });

    // Save to MongoDB
    const newUser = await User.create({
      firebaseId: firebaseUser.uid,
      fullName,
      email,
      phone: phone.trim(),
      age,
      gender,

      height,
      weight,
      bmi,
      goal,
      activity,
      conditions,
      diet,
      sleepHours,
      waterIntake,

      // Billing
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
  } catch (err: any) {
    console.error("REGISTER ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
