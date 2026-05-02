import Subscription from "@/models/Subscription";
import { syncUserSubscriptionState } from "@/lib/subscriptions/syncUserSubscription";

const isTruthy = (value: string | undefined) =>
  value === "true" || value === "1" || value === "yes";

async function getPayHereAccessToken() {
  const appId = process.env.PAYHERE_APP_ID;
  const appSecret = process.env.PAYHERE_APP_SECRET;
  const useSandbox = isTruthy(process.env.PAYHERE_SANDBOX);

  if (!appId || !appSecret) {
    throw new Error("PAYHERE_OAUTH_MISSING");
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
    throw new Error("PAYHERE_OAUTH_FAILED");
  }

  return {
    accessToken,
    payHereBaseUrl,
  };
}

export async function cancelSubscriptionAndSync(
  subscription: InstanceType<typeof Subscription>
) {
  if (!subscription.subscriptionId) {
    throw new Error("SUBSCRIPTION_ID_MISSING");
  }

  if (subscription.status === "cancelled") {
    return subscription;
  }

  const { accessToken, payHereBaseUrl } = await getPayHereAccessToken();

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
    throw new Error("PAYHERE_CANCEL_FAILED");
  }

  subscription.status = "cancelled";
  await subscription.save();

  await syncUserSubscriptionState({
    userId: String(subscription.user),
    subscriptionId: subscription.subscriptionId,
    status: "cancelled",
    nextBillingDate: null,
    lastPaymentDate: subscription.lastPaymentDate ?? null,
  });

  return subscription;
}
