import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Subscription from "@/models/Subscription";
import { getAuth } from "firebase-admin/auth";
import "@/lib/firebaseAdmin";

export async function POST(
  req: Request,
  { params }: { params: { SubscriptionId: string } }
) {
  try {
    await connectDB();

    // 1. Authenticate User
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    await getAuth().verifyIdToken(token);

    // 2. Find Subscription in your DB
    const subscription = await Subscription.findById(params.SubscriptionId);
    if (!subscription || !subscription.subscriptionId) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({ message: "Already cancelled" });
    }

    // --- PAYHERE EXTERNAL API CALL ---
    
    // 3. Get Access Token from PayHere
    // PayHere requires a Base64 encoded string of AppID:AppSecret
    const appId = process.env.PAYHERE_APP_ID;
    const appSecret = process.env.PAYHERE_APP_SECRET;
    const base64Auth = Buffer.from(`${appId}:${appSecret}`).toString("base64");

    const tokenRes = await fetch("https://sandbox.payhere.lk/merchant/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${base64Auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error("Failed to retrieve PayHere access token");
    }

    // 4. Tell PayHere to Stop the Subscription
    // Note: Use 'https://www.payhere.lk/...' for production
    const cancelRes = await fetch("https://sandbox.payhere.lk/merchant/v1/subscription/retry", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription_id: subscription.subscriptionId,
        type: "CANCEL" // This tells PayHere to deactivate the recurring token
      }),
    });

    const cancelData = await cancelRes.json();

    if (cancelData.status !== 1) {
      console.error("PayHere API Cancellation Failed:", cancelData);
      return NextResponse.json({ error: "PayHere could not cancel the subscription" }, { status: 400 });
    }

    // --- DB UPDATE ---

    // 5. Update local database only if PayHere confirmed cancellation
    subscription.status = "cancelled";
    await subscription.save();

    return NextResponse.json({ 
      success: true, 
      message: "Subscription cancelled on PayHere and Database" 
    });

  } catch (error) {
    console.error("CANCEL SUBSCRIPTION ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}