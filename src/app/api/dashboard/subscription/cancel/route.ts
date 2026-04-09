import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

const isTruthy = (value: string | undefined) =>
  value === "true" || value === "1" || value === "yes";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer "))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(token);

    const user = await User.findOne({ firebaseId: decoded.uid });
    const subscriptionId = user?.subscription?.subscriptionId;

    if (!user || !subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription" },
        { status: 400 }
      );
    }

    const subscription = await Subscription.findOne({
      subscriptionId,
      user: user._id,
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status === "cancelled") {
      return NextResponse.json({ success: true, message: "Already cancelled" });
    }

    const appId = process.env.PAYHERE_APP_ID;
    const appSecret = process.env.PAYHERE_APP_SECRET;
    const useSandbox = isTruthy(process.env.PAYHERE_SANDBOX);

    if (!appId || !appSecret) {
      console.error(
        "Missing PayHere OAuth credentials for dashboard subscription cancel API"
      );
      return NextResponse.json(
        {
          error:
            "Server is missing PAYHERE_APP_ID and PAYHERE_APP_SECRET required for PayHere subscription cancellation.",
        },
        { status: 500 }
      );
    }

    const payHereBaseUrl = useSandbox
      ? "https://sandbox.payhere.lk"
      : "https://www.payhere.lk";
    const base64Auth = Buffer.from(`${appId}:${appSecret}`).toString("base64");

    const tokenRes = await fetch(`${payHereBaseUrl}/merchant/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${base64Auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error(
        `Failed to retrieve PayHere access token: ${tokenData?.msg ?? tokenData?.error ?? tokenRes.statusText}`
      );
    }

    const cancelRes = await fetch(
      `${payHereBaseUrl}/merchant/v1/subscription/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription_id: subscription.subscriptionId,
        }),
      }
    );

    const cancelData = await cancelRes.json();

    if (cancelData.status !== 1) {
      console.error("PayHere API Cancellation Failed:", cancelData);
      return NextResponse.json(
        { error: "PayHere could not cancel the subscription" },
        { status: 400 }
      );
    }

    subscription.status = "cancelled";
    await subscription.save();

    user.subscription.active = false;
    user.subscription.status = "cancelled";
    user.subscription.cancelledAt = new Date();
    user.subscription.nextBillingDate = null;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Cancel Subscription Error:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
