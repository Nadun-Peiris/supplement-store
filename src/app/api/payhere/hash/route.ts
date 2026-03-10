import { NextResponse } from "next/server";
import CryptoJS from "crypto-js";

export async function POST(req: Request) {
  const { orderId, amount, currency } = await req.json();

  const merchantId = process.env.PAYHERE_MERCHANT_ID!;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET!;

  const formattedAmount = Number(amount).toFixed(2);

  const hashedSecret = CryptoJS.MD5(merchantSecret)
    .toString()
    .toUpperCase();

  const hash = CryptoJS.MD5(
    merchantId +
      orderId +
      formattedAmount +
      currency +
      hashedSecret
  )
    .toString()
    .toUpperCase();

  return NextResponse.json({ hash });
}