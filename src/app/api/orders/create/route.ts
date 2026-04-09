import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Cart from "@/models/Cart";
import "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { sendEmail } from "@/lib/mail/nodemailer"; // ✅ NEW

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

    let userEmail: string | null = null; // ✅ NEW

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
            userEmail = user.email; // ✅ get email
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

    // 📧 SEND EMAIL (only if user has email)
    if (userEmail) {
      try {
        await sendEmail({
          to: userEmail,
          subject: "Order Confirmation 🛒",
          html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; width: 100%;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #1a1a1a; padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">ORDER CONFIRMED</h1>
                    <p style="color: #999; margin-top: 10px; font-size: 14px;">Order ID: #${(order._id as any).toString().toUpperCase().slice(-8)}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 40px 20px 40px;">
                    <h2 style="margin: 0; color: #333; font-size: 20px;">Thank you for your order!</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.5; margin-top: 15px;">
                      We've received your request and are working on getting your items to you as quickly as possible.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
                      <thead>
                        <tr>
                          <th align="left" style="padding: 15px 0; color: #888; font-size: 12px; text-transform: uppercase;">Product</th>
                          <th align="center" style="padding: 15px 0; color: #888; font-size: 12px; text-transform: uppercase;">Qty</th>
                          <th align="right" style="padding: 15px 0; color: #888; font-size: 12px; text-transform: uppercase;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items
                          .map(
                            (item: any) => `
                          <tr>
                            <td style="padding: 15px 0; border-top: 1px solid #fafafa;">
                              <span style="font-weight: 600; color: #333; display: block;">${item.name}</span>
                            </td>
                            <td align="center" style="padding: 15px 0; border-top: 1px solid #fafafa; color: #666;">
                              ${item.quantity}
                            </td>
                            <td align="right" style="padding: 15px 0; border-top: 1px solid #fafafa; font-weight: 600; color: #333;">
                              LKR ${item.lineTotal?.toLocaleString() || item.price * item.quantity}
                            </td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 40px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="right" style="padding: 5px 0; color: #666;">Subtotal</td>
                        <td align="right" style="padding: 5px 0; width: 100px; color: #333;">LKR ${subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 5px 0; color: #666;">Shipping</td>
                        <td align="right" style="padding: 5px 0; color: #333;">LKR ${shippingCost.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #333;">Grand Total</td>
                        <td align="right" style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">LKR ${total.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 40px 40px 40px; text-align: center; background-color: #fafafa;">
                    <p style="margin: 0; color: #999; font-size: 14px;">We will notify you when your order is shipped.</p>
                    <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">If you have any questions, simply reply to this email.</p>
                  </td>
                </tr>
              </table>
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