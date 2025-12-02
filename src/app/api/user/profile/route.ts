import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import UserProfile from "@/models/User";
import { adminAuth } from "@/lib/firebaseAdmin";

async function fetchProfile(req: Request) {
  await connectDB();

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const decoded = await adminAuth().verifyIdToken(token);

  const profile = await UserProfile.findOne({ firebaseId: decoded.uid });
  if (!profile) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const [firstName = "", ...rest] = (profile.fullName || "").trim().split(" ");
  const lastName = rest.join(" ");

  return NextResponse.json({
    user: {
      firstName,
      lastName,
      email: profile.email,
      phone: profile.phone,
      billingAddress: {
        street: profile.addressLine1 || "",
        city: profile.city || "",
        country: profile.country || "Sri Lanka",
        postcode: profile.postalCode || "",
        apartment: profile.addressLine2 || "",
      },
    },
  });
}

export async function GET(req: Request) {
  try {
    return await fetchProfile(req);
  } catch (err) {
    console.error("PROFILE GET ERROR", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    return await fetchProfile(req);
  } catch (err) {
    console.error("PROFILE POST ERROR", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
