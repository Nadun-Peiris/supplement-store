import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import UserProfile from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // BMI Calculation
    const heightM = body.height / 100;
    const bmi = Number((body.weight / (heightM * heightM)).toFixed(1));

    const profile = await UserProfile.create({
      ...body,
      bmi,
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    console.log("PROFILE ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
