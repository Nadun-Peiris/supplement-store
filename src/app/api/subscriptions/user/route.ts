import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin"; 

export async function GET(req: Request) {
  try {
    await connectDB();

    // 1. Verify Firebase Token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    const user = await User.findOne({ firebaseId: decodedToken.uid }).select("_id");

    if (!user) {
      return NextResponse.json({ subscriptions: [] });
    }

    // 2. Fetch the recurring Subscription documents for the authenticated user
    const subscriptions = await Subscription.find({ 
      user: user._id
    }) 
      .sort({ createdAt: -1 }) 
      .lean();

    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error("FETCH USER SUBSCRIPTIONS ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
