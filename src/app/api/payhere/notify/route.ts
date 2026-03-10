import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import type { IOrder } from "@/models/Order";
import Subscription from "@/models/Subscription";
import Cart from "@/models/Cart";
import User from "@/models/User";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";

export async function POST(req: Request) {

  const body = await req.text();
  const params = new URLSearchParams(body);

  const merchant_id = params.get("merchant_id")!;
  const order_id = params.get("order_id")!;
  const payhere_amount = params.get("payhere_amount")!;
  const payhere_currency = params.get("payhere_currency")!;
  const status_code = params.get("status_code")!;
  const md5sig = params.get("md5sig")!;

  const payment_id = params.get("payment_id");
  const subscription_id = params.get("subscription_id");
  const message_type = params.get("message_type");

  const nextBillingDate = params.get("item_rec_date_next");
  const installmentPaid = params.get("item_rec_install_paid");

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;

  // -------------------------
  // VERIFY PAYHERE SIGNATURE
  // -------------------------

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

  if (localMd5 !== md5sig) {
    console.error("Invalid PayHere signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  const parsedNextBillingDate = nextBillingDate
    ? new Date(nextBillingDate)
    : null;

  const parsedInstallmentsPaidRaw = installmentPaid
    ? Number(installmentPaid)
    : undefined;

  const parsedInstallmentsPaid =
    parsedInstallmentsPaidRaw !== undefined &&
    Number.isFinite(parsedInstallmentsPaidRaw)
      ? parsedInstallmentsPaidRaw
      : undefined;

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
    "user items cartOwnerUserId cartOwnerGuestId"
  )) as OrderForNotify | null;

  const clearCartForOrder = async (order: OrderForNotify | null) => {
    if (!order) return;

    let userCartId: string | null = order.cartOwnerUserId ?? null;
    const guestCartId: string | null = order.cartOwnerGuestId ?? null;

    // Backward compatibility for older orders created before cart owner fields existed
    if (!userCartId && order.user) {
      const user = await User.findById(order.user).select("firebaseId");
      userCartId = user?.firebaseId ?? null;
    }

    if (userCartId) {
      await Cart.findOneAndDelete({ userId: userCartId });
      return;
    }

    if (guestCartId) {
      await Cart.findOneAndDelete({ guestId: guestCartId });
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

  // -------------------------
  // FIRST PAYMENT SUCCESS
  // -------------------------

  if (message_type === "AUTHORIZATION_SUCCESS") {

    const updatedOrder = (await Order.findOneAndUpdate(
      { _id: order_id, paymentStatus: { $ne: "paid" } },
      {
        paymentStatus: "paid",
        paymentReference: payment_id,
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

      const payload = {
        user: orderDoc?.user ?? null,
        orderId: order_id,
        subscriptionId: subscription_id,
        items: orderDoc?.items ?? [],
        status: "active",
        nextBillingDate: parsedNextBillingDate,
        totalInstallmentsPaid:
          parsedInstallmentsPaid && parsedInstallmentsPaid > 0
            ? parsedInstallmentsPaid
            : 1,
      };

      if (existing) {
        await Subscription.updateOne(
          { subscriptionId: subscription_id },
          { $set: payload }
        );
      } else {
        await Subscription.create(payload);
      }

    }

  }

  // Non-subscription one-time payment success fallback
  if (!message_type && status_code === "2") {
    const updatedOrder = (await Order.findOneAndUpdate(
      { _id: order_id, paymentStatus: { $ne: "paid" } },
      {
        paymentStatus: "paid",
        paymentReference: payment_id,
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

  // -------------------------
  // MONTHLY PAYMENT SUCCESS
  // -------------------------

  if (message_type === "RECURRING_INSTALLMENT_SUCCESS") {

    type SubscriptionWithOrder = {
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
      subscriptionId: subscription_id
    }).populate("orderId")) as SubscriptionWithOrder | null;

    if (subscription?.orderId) {

      const baseOrder = subscription.orderId;
      if (!baseOrder.billingDetails) {
        console.warn("Recurring order skipped: missing base order billingDetails");
      } else {
        const existingRecurringOrder = await Order.findOne({
          orderType: "subscription",
          subscriptionId: subscription_id,
          paymentReference: payment_id,
        }).select("_id");

        if (existingRecurringOrder) {
          await Subscription.updateOne(
            { subscriptionId: subscription_id },
            {
              status: "active",
              nextBillingDate: parsedNextBillingDate,
              totalInstallmentsPaid: parsedInstallmentsPaid,
            }
          );

          return NextResponse.json({ success: true });
        }

      // CREATE NEW ORDER FROM SUBSCRIPTION

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

        fulfillmentStatus: "unfulfilled"

        });

        await decrementStockForItems(recurringOrder.items);
      }

    }

    await Subscription.updateOne(
      { subscriptionId: subscription_id },
      {
        status: "active",
        nextBillingDate: parsedNextBillingDate,
        totalInstallmentsPaid: parsedInstallmentsPaid,
      }
    );

  }

  // -------------------------
  // PAYMENT FAILED
  // -------------------------

  if (message_type === "RECURRING_INSTALLMENT_FAILED") {

    await Subscription.updateOne(
      { subscriptionId: subscription_id },
      { status: "failed" }
    );

  }

  // -------------------------
  // SUBSCRIPTION CANCELLED
  // -------------------------

  if (message_type === "RECURRING_STOPPED") {

    await Subscription.updateOne(
      { subscriptionId: subscription_id },
      { status: "cancelled" }
    );

  }

  // -------------------------
  // SUBSCRIPTION COMPLETED
  // -------------------------

  if (message_type === "RECURRING_COMPLETE") {

    await Subscription.updateOne(
      { subscriptionId: subscription_id },
      { status: "completed" }
    );

  }

  return NextResponse.json({ success: true });
}
