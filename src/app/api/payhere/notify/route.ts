import CryptoJS from "crypto-js";
import type { Types } from "mongoose";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import type { IOrder } from "@/models/Order";
import Subscription from "@/models/Subscription";
import PayHereWebhookEvent from "@/models/PayHereWebhookEvent";
import Cart from "@/models/Cart";
import User from "@/models/User";
import Product from "@/models/Product";
import { sendEmail } from "@/lib/mail/nodemailer";
import { getOrderConfirmationHtml } from "@/lib/mail/orderConfirmation";
import { getSubscriptionConfirmationHtml } from "@/lib/mail/subscriptionConfirmation";

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

type CheckoutRecord = {
  _id?: string;
  user?: IOrder["user"];
  orderType?: "normal" | "subscription";
  items?: IOrder["items"];
  subtotal?: number;
  shippingCost?: number;
  total?: number;
  billingDetails?: IOrder["billingDetails"];
  cartOwnerUserId?: string | null;
  cartOwnerGuestId?: string | null;
  paymentStatus?: IOrder["paymentStatus"];
  fulfillmentStatus?: IOrder["fulfillmentStatus"];
  subscriptionId?: string | null;
};

const syncUserSubscriptionState = async ({
  userId,
  subscriptionId,
  status,
  nextBillingDate,
  cancelledAt,
}: {
  userId: IOrder["user"] | null | undefined;
  subscriptionId: string | null;
  status: "active" | "cancelled" | "completed" | "failed";
  nextBillingDate?: Date | null;
  cancelledAt?: Date | null;
}) => {
  if (!userId) return;

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        "subscription.subscriptionId": subscriptionId,
        "subscription.active": status === "active",
        "subscription.status": ["active", "cancelled", "completed"].includes(
          status
        )
          ? status
          : null,
        "subscription.nextBillingDate":
          status === "active" ? nextBillingDate ?? null : null,
        "subscription.cancelledAt":
          status === "cancelled" ? cancelledAt ?? new Date() : null,
      },
    }
  );
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

    const checkoutOrderDoc = (await Order.findById(order_id).select(
      "user orderType items subtotal shippingCost total billingDetails cartOwnerUserId cartOwnerGuestId paymentStatus fulfillmentStatus subscriptionId"
    )) as CheckoutRecord | null;

    const clearCartForCheckout = async (checkout: CheckoutRecord | null) => {
      if (!checkout) return;

      let userCartId: string | null = checkout.cartOwnerUserId ?? null;
      const guestCartId = checkout.cartOwnerGuestId ?? null;

      if (!userCartId && checkout.user) {
        const user = await User.findById(checkout.user).select("firebaseId");
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

    const sendOrderConfirmationEmail = async (order: IOrder | null) => {
      const recipientEmail = order?.billingDetails?.email;
      if (!order || !recipientEmail) return;

      try {
        await sendEmail({
          to: recipientEmail,
          subject:
            order.orderType === "subscription"
              ? "Subscription Order Confirmation"
              : "Order Confirmation 🛒",
          html: getOrderConfirmationHtml({
            _id: String(order._id),
            items: order.items,
            subtotal: Number(order.subtotal) || 0,
            shippingCost: Number(order.shippingCost) || 0,
            total: Number(order.total) || 0,
            orderType: order.orderType,
            billingDetails: order.billingDetails,
            createdAt: order.createdAt,
            subscriptionId: order.subscriptionId ?? null,
            fulfillmentStatus: order.fulfillmentStatus,
            trackingNumber: order.trackingNumber ?? null,
          }),
        });
      } catch (emailError) {
        console.error("Order confirmation email failed:", emailError);
      }
    };

    const sendSubscriptionConfirmationEmail = async ({
      order,
      subscriptionId,
      recurrence,
      nextBillingDate,
    }: {
      order: IOrder | null;
      subscriptionId: string;
      recurrence: string;
      nextBillingDate: Date;
    }) => {
      const recipientEmail = order?.billingDetails?.email;
      if (!order || !recipientEmail) return;

      try {
        await sendEmail({
          to: recipientEmail,
          subject: "Subscription Activated",
          html: getSubscriptionConfirmationHtml({
            _id: String(order._id),
            items: order.items,
            subtotal: Number(order.subtotal) || 0,
            shippingCost: Number(order.shippingCost) || 0,
            total: Number(order.total) || 0,
            billingDetails: order.billingDetails,
            createdAt: order.createdAt,
            subscriptionId,
            recurrence,
            nextBillingDate,
          }),
        });
      } catch (emailError) {
        console.error("Subscription confirmation email failed:", emailError);
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

    const linkOrderToSubscription = async ({
      orderId,
      subscriptionDocId,
      subscriptionId,
    }: {
      orderId: string;
      subscriptionDocId: string;
      subscriptionId: string;
    }) => {
      await Order.updateOne(
        { _id: orderId },
        {
          $set: {
            subscription: subscriptionDocId,
            subscriptionId,
          },
        }
      );
    };

    const finalizeOrderById = async (targetOrderId: string) => {
      const targetOrderDoc = (await Order.findById(targetOrderId).select(
        "user orderType items subtotal shippingCost total billingDetails cartOwnerUserId cartOwnerGuestId paymentStatus fulfillmentStatus subscriptionId"
      )) as CheckoutRecord | null;

      if (!targetOrderDoc) return null;

      if (targetOrderDoc.paymentStatus === "paid") {
        return Order.findById(targetOrderId);
      }

      const finalizedOrder = await Order.findOneAndUpdate(
        { _id: targetOrderId, paymentStatus: "pending" },
        {
          $set: {
            orderType: subscription_id
              ? "subscription"
              : targetOrderDoc.orderType === "subscription"
              ? "subscription"
              : "normal",
            subscriptionId:
              subscription_id ?? targetOrderDoc.subscriptionId ?? null,
            paymentStatus: "paid",
            paymentReference: payment_id,
            fulfillmentStatus:
              targetOrderDoc.fulfillmentStatus ?? "unfulfilled",
          },
        },
        { new: true }
      );

      if (!finalizedOrder) {
        return Order.findById(targetOrderId);
      }

      await decrementStockForItems(finalizedOrder.items);
      await clearCartForCheckout(targetOrderDoc);
      await sendOrderConfirmationEmail(finalizedOrder);

      return finalizedOrder;
    };

    const finalizeCheckoutOrder = async () => {
      if (!checkoutOrderDoc) return null;
      return finalizeOrderById(order_id);
    };

    const markCheckoutFailed = async () => {
      await Order.updateOne(
        { _id: order_id, paymentStatus: "pending" },
        {
          $set: {
            paymentStatus: "failed",
            paymentReference: payment_id,
          },
        }
      );
    };

    if (
      message_type === "AUTHORIZATION_SUCCESS" &&
      status_code === PAYHERE_SUCCESS_STATUS
    ) {
      // PayHere webhook: initial authorization callback.
      // For subscription checkout we only provision/link the subscription here.
      // We do not mark the first subscription order as paid in this branch.
      processingNotes.push("Handled AUTHORIZATION_SUCCESS.");

      const paidAmount = Number(payhere_amount);
      const expectedAmount = Number(checkoutOrderDoc?.total);
      const isAmountValid =
        Number.isFinite(paidAmount) &&
        Number.isFinite(expectedAmount) &&
        amountsMatch(paidAmount, expectedAmount);
      const isCurrencyValid = payhere_currency === STORE_CURRENCY;

      if (!checkoutOrderDoc || !isAmountValid || !isCurrencyValid) {
        processingNotes.push(
          `Rejected AUTHORIZATION_SUCCESS due to invalid amount/currency. paid=${payhere_amount} expected=${checkoutOrderDoc?.total ?? "n/a"} currency=${payhere_currency}`
        );
        await finalizeWebhookEvent("rejected");
        return NextResponse.json(
          { error: "Invalid payment amount or currency" },
          { status: 400 }
        );
      }

      const isSubscriptionAuthorization =
        Boolean(subscription_id) || checkoutOrderDoc.orderType === "subscription";

      if (isSubscriptionAuthorization) {
        if (!subscription_id) {
          processingNotes.push(
            "AUTHORIZATION_SUCCESS did not include a subscription_id for a subscription checkout."
          );
          await finalizeWebhookEvent("error");
          return NextResponse.json(
            { error: "Missing subscription id for subscription checkout" },
            { status: 400 }
          );
        }

        const existing = await Subscription.findOne({
          subscriptionId: subscription_id,
        }).select("_id recurrence");
        const recurrenceValue =
          recurrenceFromPayload ?? existing?.recurrence ?? "1 Month";
        const resolvedNextBillingDate = addDays(latestPaymentDate, 30);

        const payload = {
          user: checkoutOrderDoc.user ?? null,
          orderId: order_id,
          subscriptionId: subscription_id,
          items: checkoutOrderDoc.items ?? [],
          status: "active",
          lastPaymentDate: null,
          nextBillingDate: resolvedNextBillingDate,
          recurrence: recurrenceValue,
          totalInstallmentsPaid:
            await countSuccessfulSubscriptionPayments(subscription_id),
        };

        if (existing) {
          await Subscription.updateOne(
            { subscriptionId: subscription_id },
            { $set: payload }
          );
          await linkOrderToSubscription({
            orderId: order_id,
            subscriptionDocId: String(existing._id),
            subscriptionId: subscription_id,
          });
        } else {
          const createdSubscription = await Subscription.create(payload);
          await linkOrderToSubscription({
            orderId: order_id,
            subscriptionDocId: String(createdSubscription._id),
            subscriptionId: subscription_id,
          });
        }

        await syncUserSubscriptionState({
          userId: checkoutOrderDoc.user ?? null,
          subscriptionId: subscription_id,
          status: "active",
          nextBillingDate: resolvedNextBillingDate,
        });

        processingNotes.push(
          `Subscription provisioned for AUTHORIZATION_SUCCESS (${subscription_id}); awaiting recurring installment webhook to finalize the order.`
        );
      } else {
        // Non-subscription checkout is finalized here because there is no later recurring webhook.
        await finalizeCheckoutOrder();
        processingNotes.push("Finalized non-subscription order on AUTHORIZATION_SUCCESS.");
      }
    }

    if (
      message_type === "AUTHORIZATION_SUCCESS" &&
      status_code !== PAYHERE_SUCCESS_STATUS
    ) {
      await markCheckoutFailed();
      processingNotes.push(
        `Ignored AUTHORIZATION_SUCCESS with non-success status_code=${status_code}.`
      );
    }

    if (!message_type && status_code === PAYHERE_SUCCESS_STATUS) {
      const paidAmount = Number(payhere_amount);
      const expectedAmount = Number(checkoutOrderDoc?.total);
      const isAmountValid =
        Number.isFinite(paidAmount) &&
        Number.isFinite(expectedAmount) &&
        amountsMatch(paidAmount, expectedAmount);
      const isCurrencyValid = payhere_currency === STORE_CURRENCY;

      if (!checkoutOrderDoc || !isAmountValid || !isCurrencyValid) {
        processingNotes.push(
          `Rejected success callback due to invalid amount/currency. paid=${payhere_amount} expected=${checkoutOrderDoc?.total ?? "n/a"} currency=${payhere_currency}`
        );
        await finalizeWebhookEvent("rejected");
        return NextResponse.json(
          { error: "Invalid payment amount or currency" },
          { status: 400 }
        );
      }

      const isSubscriptionCallback =
        Boolean(subscription_id) || checkoutOrderDoc.orderType === "subscription";

      if (isSubscriptionCallback) {
        processingNotes.push(
          "Ignored success callback without message_type for subscription checkout; waiting for recurring installment webhook."
        );
      } else {
        await finalizeCheckoutOrder();
        processingNotes.push("Handled success callback without message_type.");
      }
    }

    if (!message_type && status_code !== PAYHERE_SUCCESS_STATUS) {
      await markCheckoutFailed();
      processingNotes.push(
        `Ignored callback without message_type and non-success status_code=${status_code}.`
      );
    }

    if (
      message_type === "RECURRING_INSTALLMENT_SUCCESS" &&
      status_code === PAYHERE_SUCCESS_STATUS
    ) {
      // PayHere webhook: recurring installment success.
      // We use this for subscription orders:
      // 1. first installment -> finalize the original pending checkout order
      // 2. later installments -> create fresh recurring renewal orders
      processingNotes.push("Handled RECURRING_INSTALLMENT_SUCCESS.");

      type SubscriptionWithOrder = {
        _id?: Types.ObjectId;
        recurrence?: string | null;
        status?: string | null;
        lastPaymentDate?: Date | null;
        nextBillingDate?: Date | null;
        orderId?: {
          _id?: Types.ObjectId;
          user?: IOrder["user"];
          items?: IOrder["items"];
          subtotal?: number;
          shippingCost?: number;
          total?: number;
          billingDetails?: IOrder["billingDetails"];
          paymentStatus?: IOrder["paymentStatus"];
        } | null;
      };

      const subscription = (await Subscription.findOne({
        subscriptionId: subscription_id,
      }).populate("orderId")) as SubscriptionWithOrder | null;

      const recurrenceValue =
        recurrenceFromPayload ?? subscription?.recurrence ?? "1 Month";
      const normalizedSubscriptionStatus =
        subscription?.status?.toLowerCase() ?? null;
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
          const isInitialInstallment =
            baseOrder.paymentStatus !== "paid" && Boolean(baseOrder._id);

          if (isInitialInstallment && baseOrder._id) {
            // First successful subscription installment:
            // convert the original checkout order from pending -> paid.
            const finalizedInitialOrder = await finalizeOrderById(
              String(baseOrder._id)
            );

            if (finalizedInitialOrder) {
              await Subscription.updateOne(
                { subscriptionId: subscription_id },
                {
                  status: "active",
                  lastPaymentDate: latestPaymentDate,
                  nextBillingDate: resolvedNextBillingDate,
                  recurrence: recurrenceValue,
                  totalInstallmentsPaid:
                    await countSuccessfulSubscriptionPayments(subscription_id),
                }
              );

              await sendSubscriptionConfirmationEmail({
                order: finalizedInitialOrder,
                subscriptionId: subscription_id ?? "",
                recurrence: recurrenceValue,
                nextBillingDate: resolvedNextBillingDate,
              });

              processingNotes.push(
                `Finalized initial subscription order ${String(finalizedInitialOrder._id)} from RECURRING_INSTALLMENT_SUCCESS for subscription ${subscription_id}.`
              );
            }
          } else {
          // Later successful subscription installments:
          // create a new renewal order unless the same payment reference was already processed.
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
                    subscription: subscription._id,
                    subscriptionId: subscription_id,
                  },
                }
            );

            await Subscription.updateOne(
              { subscriptionId: subscription_id },
              {
                status: "active",
                lastPaymentDate: latestPaymentDate,
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
              user: baseOrder.user ?? null,
              orderType: "subscription",
              subscription: subscription._id,
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
            await sendOrderConfirmationEmail(recurringOrder);
            processingNotes.push(
              `Created recurring order ${String(recurringOrder._id)} for subscription ${subscription_id}.`
            );

            await Subscription.updateOne(
              { subscriptionId: subscription_id },
              {
                lastPaymentDate: latestPaymentDate,
                totalInstallmentsPaid:
                  await countSuccessfulSubscriptionPayments(subscription_id),
              }
            );
          }
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
            lastPaymentDate: latestPaymentDate,
            nextBillingDate: resolvedNextBillingDate,
            recurrence: recurrenceValue,
            totalInstallmentsPaid:
              await countSuccessfulSubscriptionPayments(subscription_id),
          }
        );

        await syncUserSubscriptionState({
          userId: subscription?.orderId?.user ?? null,
          subscriptionId: subscription_id ?? null,
          status: "active",
          nextBillingDate: resolvedNextBillingDate,
        });
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
      const existingSubscription = await Subscription.findOne({
        subscriptionId: subscription_id,
      }).select("user subscriptionId");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "failed" }
      );
      await syncUserSubscriptionState({
        userId: existingSubscription?.user ?? null,
        subscriptionId: existingSubscription?.subscriptionId ?? null,
        status: "failed",
      });
    }

    if (message_type === "RECURRING_STOPPED") {
      processingNotes.push("Handled RECURRING_STOPPED.");
      const existingSubscription = await Subscription.findOne({
        subscriptionId: subscription_id,
      }).select("user subscriptionId");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "cancelled" }
      );
      await syncUserSubscriptionState({
        userId: existingSubscription?.user ?? null,
        subscriptionId: existingSubscription?.subscriptionId ?? null,
        status: "cancelled",
      });
    }

    if (message_type === "RECURRING_COMPLETE") {
      processingNotes.push("Handled RECURRING_COMPLETE.");
      const existingSubscription = await Subscription.findOne({
        subscriptionId: subscription_id,
      }).select("user subscriptionId");
      await Subscription.updateOne(
        { subscriptionId: subscription_id },
        { status: "completed" }
      );
      await syncUserSubscriptionState({
        userId: existingSubscription?.user ?? null,
        subscriptionId: existingSubscription?.subscriptionId ?? null,
        status: "completed",
      });
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
