import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Subscription from "@/models/Subscription";
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

  // -------------------------
  // FIRST PAYMENT SUCCESS
  // -------------------------

  if (message_type === "AUTHORIZATION_SUCCESS") {

    await Order.findByIdAndUpdate(order_id, {
      paymentStatus: "paid",
      paymentReference: payment_id,
    });

    if (subscription_id) {

      await Subscription.create({
        orderId: order_id,
        subscriptionId: subscription_id,
        status: "active",
        nextBillingDate,
        totalInstallmentsPaid: 1
      });

    }

  }

  // -------------------------
  // MONTHLY PAYMENT SUCCESS
  // -------------------------

  if (message_type === "RECURRING_INSTALLMENT_SUCCESS") {

    await Subscription.updateOne(
      { subscriptionId: subscription_id },
      {
        nextBillingDate,
        totalInstallmentsPaid: installmentPaid,
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