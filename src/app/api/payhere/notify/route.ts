import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import type { IOrder } from "@/models/Order";
import Subscription from "@/models/Subscription";
import PayHereWebhookEvent from "@/models/PayHereWebhookEvent";
import Cart from "@/models/Cart";
import User from "@/models/User";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";

const PAYHERE_SUCCESS_STATUS = "2";
const STORE_CURRENCY = "LKR";

const amountsMatch = (a: number, b: number) =>
  Math.round(a * 100) === Math.round(b * 100);

const parsePayHerePaidAt = (value: string | null) => {
  if (!value) return null;
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (baseDate: Date, days: number) => {
  const nextDate = new Date(baseDate.getTime());
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);
  const rawPayload: Record<string, string> = {};
  params.forEach((value, key) => {
    rawPayload[key] = value;
  });

  const merchant_id = params.get("merchant_id")!;
  const order_id = params.get("order_id")!;
  const payhere_amount = params.get("payhere_amount")!;
  const payhere_currency = params.get("payhere_currency")!;
  const status_code = params.get("status_code")!;
  const md5sig = params.get("md5sig")!;

  const payment_id = params.get("payment_id");
  const subscription_id = params.get("subscription_id");
  const message_type = params.get("message_type");
  const payherePaidOn = params.get("payhere_paid_on");
  const recurrenceFromPayload =
    params.get("item_recurrence") ??
    params.get("item_rec_recurrence") ??
    params.get("recurrence");

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;

  const localMd5 = CryptoJS.MD5(
    merchant_id +
      order_id +
      payhere_amount +
      payhere_currency +
      status_code +
      CryptoJS.MD5(merchantSecret).toString().toUpperCase()
  )
    .toString()
    .toUpperCase();

  await connectDB();

  const signatureValid = localMd5 === md5sig;
  const processingNotes: string[] = [];

  const createdWebhookEvent = await PayHereWebhookEvent.create({
    merchantId: merchant_id ?? null,
    orderId: order_id ?? null,
    paymentId: payment_id ?? null,
    subscriptionId: subscription_id ?? null,
    messageType: message_type ?? null,
    statusCode: status_code ?? null,
    amount: payhere_amount ?? null,
    currency: payhere_currency ?? null,
    signatureValid,
    processingStatus: signatureValid ? "received" : "rejected",
    rawPayload,
  });

  const webhookEventId = String(createdWebhookEvent._id);
  const finalizeWebhookEvent = async (
    status: "processed" | "rejected" | "error"
  ) => {
    await PayHereWebhookEvent.updateOne(
      { _id: webhookEventId },
      {
        $set: {
          processingStatus: status,
          processingNotes,
        },
      }
    );
  };

  if (!signatureValid) {
    console.error("Invalid PayHere signature");
    processingNotes.push("Rejected callback due to invalid signature.");
    await finalizeWebhookEvent("rejected");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const latestPaymentDate = parsePayHerePaidAt(payherePaidOn) ?? new Date();
    type OrderForNotify = Pick<IOrder, "user" | "items"> & {
      _id?: string;
      subtotal?: number;
      shippingCost?: number;
      total?: number;
      billingDetails?: IOrder["billingDetails"];
      cartOwnerUserId?: string | null;
      cartOwnerGuestId?: string | null;
    };

    const orderDoc = (await Order.findById(order_id).select(
      "user items total cartOwnerUserId cartOwnerGuestId"
    )) as OrderForNotify | null;

    const clearCartForOrder = async (order: OrderForNotify | null) => {
      if (!order) return;

      let userCartId: string | null = order.cartOwnerUserId ?? null;
      const guestCartId: string | null = order.cartOwnerGuestId ?? null;

      if (!userCartId && order.user) {
        const user = await User.findById(order.user).select("firebaseId");
        userCartId = user?.firebaseId ?? null;
      }

      if (userCartId) {
        await Cart.deleteMany({ userId: userCartId });
      }

      if (guestCartId) {
        await Cart.deleteMany({ guestId: guestCartId });
      }
    };

    const decrementStockForItems = async (
      items:
        | {
            product: IOrder["items"][number]["product"];
            quantity: number;
          }[]
        | undefined
    ) => {
      if (!items?.length) return;

      const stockAdjustments = new Map<string, number>();

      for (const item of items) {
        const productId = String(item.product);
        const qty = Math.max(0, Number(item.quantity) || 0);
        if (!productId || qty <= 0) continue;
        stockAdjustments.set(
          productId,
          (stockAdjustments.get(productId) ?? 0) + qty
        );
      }

      if (stockAdjustments.size === 0) return;

      const operations = Array.from(stockAdjustments.entries()).map(
        ([productId, qty]) => ({
          updateOne: {
            filter: { _id: productId, stock: { $gte: qty } },
            update: { $inc: { stock: -qty } },
          },
        })
      );

      const result = await Product.bulkWrite(operations, { ordered: false });
      const matched = result.matchedCount ?? 0;

      if (matched < operations.length) {
        console.warn("Stock update partially applied", {
          expected: operations.length,
          matched,
          orderId: order_id,
        });
      }
    };

    const countSuccessfulSubscriptionPayments = async (
      activeSubscriptionId: string | null
    ) => {
      if (!activeSubscriptionId) return 0;

      return Order.countDocuments({
        orderType: "subscription",
        subscriptionId: activeSubscriptionId,
        paymentStatus: "paid",
      });
    };

    if (
      message_type === "AUTHORIZATION_SUCCESS" &&
      status_code === PAYHERE_SUCCESS_STATUS
    ) {
      processingNotes.push("Handled AUTHORIZATION_SUCCESS.");

      const paidAmount = Number(payhere_amount);
      const expectedAmount = Number(orderDoc?.total);
      const isAmountValid =
        Number.isFinite(paidAmount) &&
        Number.isFinite(expectedAmount) &&
        amountsMatch(paidAmount, expectedAmount);
      const isCurrencyValid = payhere_currency === STORE_CURRENCY;

      if (!orderDoc || !isAmountValid || !isCurrencyValid) {
        processingNotes.push(
          `Rejected AUTHORIZATION_SUCCESS due to invalid amount/currency. paid=${payhere_amount} expected=${orderDoc?.total ?? "n/a"} currency=${payhere_currency}`
        );
        await finalizeWebhookEvent("rejected");
        return NextResponse.json(
          { error: "Invalid payment amount or currency" },
          { status: 400 }
        );
      }

      const updatedOrder = (await Order.findOneAndUpdate(
        { _id: order_id, paymentStatus: { $ne: "paid" } },
        {
          paymentStatus: "paid",
          paymentReference: payment_id,
          ...(subscription_id
            ? {
                orderType: "subscription" as const,
                subscriptionId: subscription_id,
              }
            : {}),
        },
        { new: true }
      ).select(
        "user items subtotal shippingCost total billingDetails cartOwnerUserId cartOwnerGuestId"
      )) as
        | OrderForNotify
        | null;

      if (updatedOrder) {
        await decrementStockForItems(updatedOrder.items);
        await clearCartForOrder(updatedOrder);
      } else {
        await clearCartForOrder(orderDoc);
      }

      if (subscription_id) {
        const existing = await Subscription.findOne({
          subscriptionId: subscription_id,
        });
        const recurrenceValue =
          recurrenceFromPayload ?? existing?.recurrence ?? "1 Month";
        const resolvedNextBillingDate = addDays(latestPaymentDate, 30);

        const payload = {
          user: orderDoc?.user ?? null,
          orderId: order_id,
          subscriptionId: subscription_id,
          items: orderDoc?.items ?? [],
          status: "active",
          nextBillingDate: resolvedNextBillingDate,
          recurrence: recurrenceValue,
          totalInstallmentsPaid:
            (await countSuccessfulSubscriptionPayments(subscription_id)) || 1,
        };

        if (existing) {
          await Subscription.updateOne(
            { subscriptionId: subscription_id },
            { $set: payload }
          );
        } else {
          await Subscription.create(payload);
        }

        processingNotes.push(
          `Subscription upserted for AUTHORIZATION_SUCCESS (${subscription_id}).`
        );
      }
    }
    if (
      message_type === "AUTHORIZATION_SUCCESS" &&
      status_code !== PAYHERE_SUCCESS_STATUS
    ) {
      processingNotes.push(
        `Ignored AUTHORIZATION_SUCCESS with non-success status_code=${status_code}.`
      );
    }

    if (!message_type && status_code === "2") {
      const updatedOrder = (await Order.findOneAndUpdate(
        { _id: order_id, paymentStatus: { $ne: "paid" } },
        {
          paymentStatus: "paid",
          paymentReference: payment_id,
          ...(subscription_id
            ? {
                orderType: "subscription" as const,
                subscriptionId: subscription_id,
              }
            : {}),
        },
        { new: true }
      ).select(
        "user items subtotal shippingCost total billingDetails cartOwnerUserId cartOwnerGuestId"
      )) as
        | OrderForNotify
        | null;

      if (updatedOrder) {
        await decrementStockForItems(updatedOrder.items);
        await clearCartForOrder(updatedOrder);
      } else {
        await clearCartForOrder(orderDoc);
      }
    }

    if (
      message_type === "RECURRING_INSTALLMENT_SUCCESS" &&
      status_code === PAYHERE_SUCCESS_STATUS
    ) {
      processingNotes.push("Handled RECURRING_INSTALLMENT_SUCCESS.");

      type SubscriptionWithOrder = {
        recurrence?: string | null;
        status?: string | null;
        orderId?: {
          user?: IOrder["user"];
          items?: IOrder["items"];
          subtotal?: number;
          shippingCost?: number;
          total?: number;
          billingDetails?: IOrder["billingDetails"];
        } | null;
      };

      const subscription = (await Subscription.findOne({
        subscriptionId: subscription_id,
      }).populate("orderId")) as SubscriptionWithOrder | null;

      const recurrenceValue =
        recurrenceFromPayload ?? subscription?.recurrence ?? "1 Month";
      const normalizedSubscriptionStatus = subscription?.status?.toLowerCase() ?? null;
      const isDismissedSubscription =
        normalizedSubscriptionStatus !== null &&
        normalizedSubscriptionStatus !== "active";
      const resolvedNextBillingDate = addDays(latestPaymentDate, 30);

      if (isDismissedSubscription) {
        processingNotes.push(
          `Ignored RECURRING_INSTALLMENT_SUCCESS for dismissed subscription ${subscription_id ?? "n/a"} with status=${normalizedSubscriptionStatus}.`
        );
      } else if (subscription?.orderId) {
        const baseOrder = subscription.orderId;
        const paidAmount = Number(payhere_amount);
        const expectedAmount = Number(baseOrder.total);
        const isAmountValid =
          Number.isFinite(paidAmount) &&
          Number.isFinite(expectedAmount) &&
          amountsMatch(paidAmount, expectedAmount);
        const isCurrencyValid = payhere_currency === STORE_CURRENCY;

        if (!isAmountValid || !isCurrencyValid) {
          processingNotes.push(
            `Rejected RECURRING_INSTALLMENT_SUCCESS due to invalid amount/currency. paid=${payhere_amount} expected=${baseOrder.total ?? "n/a"} currency=${payhere_currency}`
          );
          await finalizeWebhookEvent("rejected");
          return NextResponse.json(
            { error: "Invalid recurring payment amount or currency" },
            { status: 400 }
          );
        }

        if (!baseOrder.billingDetails) {
          console.warn("Recurring order skipped: missing base order billingDetails");
        } else {
          const existingRecurringOrder = await Order.findOne({
            orderType: "subscription",
            subscriptionId: subscription_id,
            paymentReference: payment_id,
          }).select("_id");

          if (existingRecurringOrder) {
            await Order.updateOne(
              { _id: existingRecurringOrder._id },
              {
                $set: {
                  orderType: "subscription",
                  subscriptionId: subscription_id,
                },
              }
            );

            await Subscription.updateOne(
              { subscriptionId: subscription_id },
              {
                status: "active",
                nextBillingDate: resolvedNextBillingDate,
                recurrence: recurrenceValue,
                totalInstallmentsPaid:
                  await countSuccessfulSubscriptionPayments(subscription_id),
              }
            );
            processingNotes.push(
              `Skipped duplicate recurring order for payment ${payment_id ?? "n/a"}.`
            );
          } else {
            const recurringOrder = await Order.create({
              user: baseOrder?.user ?? null,
              orderType: "subscription",
              subscriptionId: subscription_id,
              items: baseOrder.items ?? [],
              subtotal: baseOrder.subtotal ?? 0,
              shippingCost: baseOrder.shippingCost ?? 0,
              total: baseOrder.total ?? 0,
              billingDetails: baseOrder.billingDetails,
              paymentProvider: "payhere",
              paymentStatus: "paid",
              paymentReference: payment_id,
              fulfillmentStatus: "unfulfilled",
            });

            await decrementStockForItems(recurringOrder.items);
            processingNotes.push(
              `Created recurring order ${String(recurringOrder._id)} for subscription ${subscription_id}.`
            );

            await Subscription.updateOne(
              { subscriptionId: subscription_id },
              {
                totalInstallmentsPaid:
                  await countSuccessfulSubscriptionPayments(subscription_id),
              }
            );
          }
        }
      } else {
        processingNotes.push(
          `No base subscription/order found for ${subscription_id ?? "n/a"}.`
        );
      }

      if (!isDismissedSubscription) {
        await Subscription.updateOne(
          { subscriptionId: subscription_id },
          {
            status: "active",
            nextBillingDate: resolvedNextBillingDate,
            recurrence: recurrenceValue,
            totalInstallmentsPaid:
              await countSuccessfulSubscriptionPayments(subscription_id),
          }
        );
      }
    }
    if (
      message_type === "RECURRING_INSTALLMENT_SUCCESS" &&
      status_code !== PAYHERE_SUCCESS_STATUS
    ) {
      processingNotes.push(
        `Ignored RECURRING_INSTALLMENT_SUCCESS with non-success status_code=${status_code}.`
      );
    }

    if (message_type === "RECURRING_INSTALLMENT_FAILED") {
      processingNotes.push("Handled RECURRING_INSTALLMENT_FAILED.");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "failed" }
      );
    }

    if (message_type === "RECURRING_STOPPED") {
      processingNotes.push("Handled RECURRING_STOPPED.");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "cancelled" }
      );
    }

    if (message_type === "RECURRING_COMPLETE") {
      processingNotes.push("Handled RECURRING_COMPLETE.");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "completed" }
      );
    }

    if (processingNotes.length === 0) {
      processingNotes.push("No matching webhook branch; acknowledged callback.");
    }
    await finalizeWebhookEvent("processed");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayHere notify processing failed:", error);
    processingNotes.push(
      `Unhandled processing error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    await finalizeWebhookEvent("error");
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
