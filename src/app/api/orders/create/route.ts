import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Cart from "@/models/Cart";
import "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { sendEmail } from "@/lib/mail/nodemailer";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      items,
      billingDetails,
      subtotal,
      shippingCost,
      total,
      purchaseType,
    } = body;

    if (!items || !items.length) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!billingDetails) {
      return NextResponse.json(
        { error: "Billing details missing" },
        { status: 400 }
      );
    }

    const mappedItems = items.map(
      (item: {
        productId: string;
        name?: string;
        price?: number;
        quantity?: number;
      }) => {
        const quantity = Math.max(1, Number(item.quantity) || 1);
        const price = Number(item.price) || 0;

        return {
          product: item.productId,
          name: item.name || "",
          price,
          quantity,
          lineTotal: price * quantity,
        };
      }
    );

    const authHeader = req.headers.get("authorization");
    const guestId = req.headers.get("guest-id");

    let userObjectId: string | null = null;
    let cartOwnerUserId: string | null = null;
    const cartOwnerGuestId: string | null = guestId || null;

    let userEmail: string | null = billingDetails.email || null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      if (token && token !== "undefined") {
        try {
          const decoded = await getAuth().verifyIdToken(token);
          const user = await User.findOne({ firebaseId: decoded.uid }).select(
            "_id firebaseId email"
          );

          if (user) {
            userObjectId = String(user._id);
            cartOwnerUserId = user.firebaseId;
            userEmail = user.email || billingDetails.email;
          }
        } catch {
          // continue as guest
        }
      }
    }

    const order = await Order.create({
      orderType: purchaseType === "subscription" ? "subscription" : "normal",
      user: userObjectId,
      cartOwnerUserId,
      cartOwnerGuestId,

      items: mappedItems,
      subtotal,
      shippingCost,
      total,
      shippingMethod: "standard_shipping",

      paymentProvider: "payhere",
      paymentStatus: "pending",
      fulfillmentStatus: "unfulfilled",

      billingDetails,
    });

    // 🧹 Clear carts
    if (cartOwnerUserId) {
      await Cart.deleteMany({ userId: cartOwnerUserId });
    }
    if (cartOwnerGuestId) {
      await Cart.deleteMany({ guestId: cartOwnerGuestId });
    }

    // 📧 SEND EMAIL
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: `Order Confirmation - Order #${String(order._id).toUpperCase().slice(-8)}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e1e1e1;">
                
                <div style="background-color: #01C7FE; padding: 40px 20px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 26px; text-transform: uppercase; letter-spacing: 2px;">Order Confirmed</h1>
                </div>

                <div style="padding: 30px;">
                  <p style="font-size: 16px; color: #333;">Dear ${billingDetails.firstName || 'Customer'},</p>
                  <p style="font-size: 14px; color: #555; line-height: 1.6;">
                    Thank you for your purchase. We have received your order and are currently processing it. Below are your order details and shipping information.
                  </p>

                  <table width="100%" style="border-collapse: collapse; margin-top: 25px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #01C7FE;">
                        <th align="left" style="padding: 10px 0; font-size: 12px; color: #888; text-transform: uppercase;">Description</th>
                        <th align="center" style="padding: 10px 0; font-size: 12px; color: #888; text-transform: uppercase;">Qty</th>
                        <th align="right" style="padding: 10px 0; font-size: 12px; color: #888; text-transform: uppercase;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${order.items.map((item: any) => `
                        <tr style="border-bottom: 1px solid #eee;">
                          <td style="padding: 15px 0; font-size: 14px; color: #333;">${item.name}</td>
                          <td align="center" style="padding: 15px 0; font-size: 14px; color: #666;">${item.quantity}</td>
                          <td align="right" style="padding: 15px 0; font-size: 14px; color: #333; font-weight: bold;">LKR ${item.lineTotal.toLocaleString()}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>

                  <div style="margin-top: 20px; background-color: #fcfcfc; padding: 15px; border-radius: 4px;">
                    <table width="100%">
                      <tr>
                        <td style="font-size: 14px; color: #666;">Subtotal</td>
                        <td align="right" style="font-size: 14px; color: #333;">LKR ${subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #666;">Shipping Cost</td>
                        <td align="right" style="font-size: 14px; color: #333;">LKR ${shippingCost.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; font-weight: bold; color: #01C7FE; padding-top: 10px;">Total</td>
                        <td align="right" style="font-size: 18px; font-weight: bold; color: #01C7FE; padding-top: 10px;">LKR ${total.toLocaleString()}</td>
                      </tr>
                    </table>
                  </div>

                  <div style="margin-top: 30px; display: flex; gap: 20px;">
                    <div style="flex: 1;">
                      <h4 style="font-size: 12px; color: #01C7FE; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #01C7FE; display: inline-block;">Shipping Address</h4>
                      <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">
                        ${billingDetails.firstName} ${billingDetails.lastName}<br>
                        ${billingDetails.address}<br>
                        ${billingDetails.city}, ${billingDetails.postalCode}<br>
                        ${billingDetails.phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #999; margin: 0;">
                    This is an automated message. Please do not reply to this email.<br>
                    Order ID: ${order._id}
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      _id: order._id,
      total: order.total,
      billingDetails: order.billingDetails,
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);

    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    );
  }
}