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

    // 📧 SEND PROFESSIONAL EMAIL
    if (userEmail) {
      try {
        const orderIdString = (order._id as any).toString().toUpperCase().slice(-8);

        await sendEmail({
          to: userEmail,
          subject: `Order Confirmation - Order #${orderIdString}`,
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 40px 0; width: 100%;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-top: 6px solid #01C7FE; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                
                <tr>
                  <td style="padding: 30px 40px; text-align: left;">
                    <h1 style="color: #333333; margin: 0; font-size: 22px;">Order Received</h1>
                    <p style="color: #666666; font-size: 14px; margin-top: 5px;">Order Reference: #${orderIdString}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px 20px 40px;">
                    <p style="font-size: 15px; color: #444; line-height: 1.6;">
                      Dear ${billingDetails.firstName || 'Customer'},<br><br>
                      Thank you for your purchase. We are pleased to confirm that your order has been successfully placed and is currently being processed.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #fcfcfc; border: 1px solid #eeeeee; border-radius: 4px;">
                      <tr>
                        <td style="padding: 20px;">
                          <h3 style="margin: 0 0 10px 0; font-size: 13px; color: #01C7FE; text-transform: uppercase; letter-spacing: 1px;">Delivery Details</h3>
                          <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.5;">
                            <strong>${billingDetails.firstName} ${billingDetails.lastName}</strong><br>
                            ${billingDetails.addressLine1}${billingDetails.addressLine2 ? ', ' + billingDetails.addressLine2 : ''}<br>
                            ${billingDetails.city}, ${billingDetails.state || ''} ${billingDetails.postalCode || ''}<br>
                            ${billingDetails.phone}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 0 40px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-bottom: 2px solid #f4f4f4;">
                      <thead>
                        <tr>
                          <th align="left" style="padding-bottom: 10px; font-size: 12px; color: #999; text-transform: uppercase;">Item</th>
                          <th align="right" style="padding-bottom: 10px; font-size: 12px; color: #999; text-transform: uppercase;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${order.items.map((item: any) => `
                          <tr>
                            <td style="padding: 12px 0; border-top: 1px solid #f9f9f9;">
                              <span style="font-size: 14px; color: #333; font-weight: 500;">${item.name}</span><br>
                              <span style="font-size: 12px; color: #888;">Quantity: ${item.quantity}</span>
                            </td>
                            <td align="right" style="padding: 12px 0; border-top: 1px solid #f9f9f9; font-size: 14px; color: #333;">
                              LKR ${item.lineTotal?.toLocaleString()}
                            </td>
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 40px;">
                    <table width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td align="right" style="padding: 5px 0; font-size: 14px; color: #777;">Subtotal</td>
                        <td align="right" style="padding: 5px 0 0 20px; font-size: 14px; color: #333; width: 100px;">LKR ${subtotal.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 5px 0; font-size: 14px; color: #777;">Shipping</td>
                        <td align="right" style="padding: 5px 0 0 20px; font-size: 14px; color: #333;">LKR ${shippingCost.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td align="right" style="padding: 15px 0; font-size: 16px; font-weight: bold; color: #333;">Total Paid</td>
                        <td align="right" style="padding: 15px 0 0 20px; font-size: 16px; font-weight: bold; color: #01C7FE;">LKR ${total.toLocaleString()}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 30px 40px; background-color: #333; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #bbb;">You will receive a shipping notification once your order is dispatched.</p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #888;">&copy; ${new Date().getFullYear()} Your Brand Name. All rights reserved.</p>
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