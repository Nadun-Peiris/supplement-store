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

    const profile = {
      fullName: user.fullName || "",
      email: user.email || "",
      phone: user.phone || "",
      age: user.age ?? "",
      gender: user.gender || "",
      height: user.height ?? "",
      weight: user.weight ?? "",
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
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
