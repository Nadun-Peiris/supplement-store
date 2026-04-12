import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/nodemailer";

// 🔍 GET ORDERS (existing)
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  let filter: any = {};

  if (type === "normal") {
    filter.orderType = "normal";
  }

  if (type === "subscription") {
    filter.orderType = "subscription";
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  return NextResponse.json({ orders });
}

// 🔥 UPDATE ORDER STATUS + SEND EMAIL
export async function PATCH(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Missing orderId or status" },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { fulfillmentStatus: status },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 📧 SEND EMAIL
    if (order.user) {
      const user = await User.findById(order.user);

      if (user?.email) {
        let message = "";

        switch (status) {
          case "shipped":
            message = "Your order has been shipped 🚚";
            break;
          case "delivered":
            message = "Your order has been delivered 🎉";
            break;
          case "cancelled":
            message = "Your order has been cancelled ❌";
            break;
          default:
            message = "Your order status has been updated";
        }

        try {
          await sendEmail({
            to: user.email,
            subject: message,
            html: `
              <h2>Order Update</h2>
              <p>${message}</p>

              <p><strong>Status:</strong> ${status}</p>

              <p>Thank you for shopping with us!</p>
            `,
          });
        } catch (emailError) {
          console.error("Email failed:", emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("ORDER UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}