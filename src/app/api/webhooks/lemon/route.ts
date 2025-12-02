import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { verifyLemonWebhookSignature } from "@/lib/lemonsqueezy";
import Order from "@/models/Order";
import User from "@/models/User";
import Subscription from "@/models/Subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const config = {
  api: {
    bodyParser: false,
  },
};

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, string>;
  };
  data?: {
    id: string;
    type: string;
    attributes?: {
      status?: string;
      renews_at?: string | null;
      ends_at?: string | null;
      cancelled_at?: string | null;
      customer_id?: string | number | null;
      checkout_data?: { custom?: Record<string, string> };
    };
    relationships?: {
      order?: { data?: { id?: string | null } };
    };
  };
}

const ACTIVE_STATUS = new Set(["active", "on_trial", "past_due"]);

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSubscriptionActive(status?: string | null): boolean {
  if (!status) return false;
  return ACTIVE_STATUS.has(status.toLowerCase());
}

function getCustomData(payload: LemonWebhookPayload): Record<string, string> {
  return (
    payload.meta?.custom_data ||
    payload.data?.attributes?.checkout_data?.custom ||
    {}
  );
}

async function resolveSubscriptionContext(
  subscriptionId: string,
  fallbackOrderId?: string | null,
  fallbackUserId?: string | null
) {
  let orderId = fallbackOrderId || null;
  let userId = fallbackUserId || null;

  if (orderId && userId) {
    return { orderId, userId };
  }

  const record = await Subscription.findOne({
    lemonSubscriptionId: subscriptionId,
  })
    .select("order user")
    .lean();

  if (record) {
    if (!orderId && record.order) {
      orderId = record.order.toString();
    }
    if (!userId && record.user) {
      userId = record.user.toString();
    }
  }

  return { orderId, userId };
}

async function updateUserSubscription({
  userId,
  subscriptionId,
  status,
  nextBillingDate,
  customerId,
  cancelledAt,
  activeOverride,
}: {
  userId: string | null;
  subscriptionId: string;
  status?: string | null;
  nextBillingDate?: Date | null;
  customerId?: string | null;
  cancelledAt?: Date | null;
  activeOverride?: boolean;
}) {
  if (!userId) return;

  const active =
    typeof activeOverride === "boolean"
      ? activeOverride
      : isSubscriptionActive(status);

  await User.findByIdAndUpdate(userId, {
    $set: {
      "subscription.id": subscriptionId,
      "subscription.status": status ?? null,
      "subscription.active": active,
      "subscription.nextBillingDate": nextBillingDate ?? null,
      "subscription.lemonCustomerId": customerId ?? null,
      "subscription.cancelledAt": cancelledAt ?? null,
    },
  });
}

async function upsertSubscription({
  subscriptionId,
  userId,
  orderId,
  customerId,
  status,
  renewsAt,
  endsAt,
  cancelledAt,
}: {
  subscriptionId: string;
  userId: string | null;
  orderId: string | null;
  customerId?: string | null;
  status?: string | null;
  renewsAt?: Date | null;
  endsAt?: Date | null;
  cancelledAt?: Date | null;
}) {
  if (!userId || !orderId) return;

  await Subscription.findOneAndUpdate(
    { lemonSubscriptionId: subscriptionId },
    {
      user: userId,
      order: orderId,
      lemonSubscriptionId: subscriptionId,
      lemonCustomerId: customerId ?? "",
      status: status ?? "",
      renewsAt: renewsAt ?? null,
      endsAt: endsAt ?? null,
      cancelledAt: cancelledAt ?? null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function markOrderPaid({
  orderId,
  provider,
  reference,
  subscriptionId,
  nextBillingDate,
}: {
  orderId: string | null;
  provider: "lemon_one_time" | "lemon_subscription";
  reference: string;
  subscriptionId?: string;
  nextBillingDate?: Date | null;
}) {
  if (!orderId) return;

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      status: "paid",
      paymentProvider: provider,
      paymentReference: reference,
      subscriptionId: subscriptionId ?? undefined,
      nextBillingDate: nextBillingDate ?? null,
    },
  });
}

async function updateOrderNextBillingDate({
  orderId,
  nextBillingDate,
}: {
  orderId: string | null;
  nextBillingDate?: Date | null;
}) {
  if (!orderId) return;

  await Order.findByIdAndUpdate(orderId, {
    $set: {
      nextBillingDate: nextBillingDate ?? null,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const rawBody = Buffer.from(await req.arrayBuffer());
    const signature = req.headers.get("x-signature");

    if (!verifyLemonWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid Lemon Squeezy signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as LemonWebhookPayload;
    const event = payload.meta?.event_name;
    const resource = payload.data;

    if (!event || !resource) {
      return NextResponse.json({ received: true });
    }

    const customData = getCustomData(payload);
    const orderId =
      customData.orderId ||
      resource.relationships?.order?.data?.id ||
      null;
    const userId = customData.userId || null;
    const subscriptionId = resource.id;
    const status = resource.attributes?.status ?? null;
    const renewsAt = parseDate(resource.attributes?.renews_at);
    const customerId = resource.attributes?.customer_id
      ? String(resource.attributes.customer_id)
      : null;
    const endsAt = parseDate(resource.attributes?.ends_at);
    const cancelledAt = parseDate(resource.attributes?.cancelled_at);

    switch (event) {
      case "order_paid": {
        await markOrderPaid({
          orderId,
          provider: "lemon_one_time",
          reference: resource.id,
        });
        break;
      }

      case "subscription_created": {
        const context = await resolveSubscriptionContext(
          subscriptionId,
          orderId,
          userId
        );

        await markOrderPaid({
          orderId: context.orderId,
          provider: "lemon_subscription",
          reference: resource.id,
          subscriptionId,
          nextBillingDate: renewsAt ?? null,
        });

        await updateUserSubscription({
          userId: context.userId,
          subscriptionId,
          status,
          nextBillingDate: renewsAt,
          customerId,
        });

        await upsertSubscription({
          subscriptionId,
          userId: context.userId,
          orderId: context.orderId,
          customerId,
          status,
          renewsAt,
          endsAt,
          cancelledAt,
        });
        break;
      }

      case "subscription_payment_success":
      case "subscription_updated":
      case "subscription_resumed": {
        const context = await resolveSubscriptionContext(
          subscriptionId,
          orderId,
          userId
        );

        await updateOrderNextBillingDate({
          orderId: context.orderId,
          nextBillingDate: renewsAt ?? null,
        });

        await updateUserSubscription({
          userId: context.userId,
          subscriptionId,
          status,
          nextBillingDate: renewsAt,
          customerId,
        });

        await upsertSubscription({
          subscriptionId,
          userId: context.userId,
          orderId: context.orderId,
          customerId,
          status,
          renewsAt,
          endsAt,
          cancelledAt,
        });
        break;
      }

      case "subscription_payment_failed": {
        const context = await resolveSubscriptionContext(
          subscriptionId,
          orderId,
          userId
        );

        await updateUserSubscription({
          userId: context.userId,
          subscriptionId,
          status,
          nextBillingDate: renewsAt,
          customerId,
          activeOverride: false,
        });
        break;
      }

      case "subscription_cancelled":
      case "subscription_expired": {
        const context = await resolveSubscriptionContext(
          subscriptionId,
          orderId,
          userId
        );

        await updateOrderNextBillingDate({
          orderId: context.orderId,
          nextBillingDate: null,
        });

        await updateUserSubscription({
          userId: context.userId,
          subscriptionId,
          status,
          nextBillingDate: null,
          customerId,
          cancelledAt: cancelledAt || endsAt || new Date(),
          activeOverride: false,
        });

        await upsertSubscription({
          subscriptionId,
          userId: context.userId,
          orderId: context.orderId,
          customerId,
          status,
          renewsAt,
          endsAt,
          cancelledAt: cancelledAt || endsAt || null,
        });
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
