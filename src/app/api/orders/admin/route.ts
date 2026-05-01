import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/nodemailer";
import {
  getOrderStatusSubject,
  getOrderStatusTone,
  renderOrderStatusEmail,
} from "@/lib/mail/emailTemplate";

// 🔍 GET ORDERS (existing)
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const filter: Partial<{ orderType: "normal" | "subscription" }> = {};

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
    if (order.user || order.billingDetails?.email) {
      const user = order.user ? await User.findById(order.user) : null;
      const recipientEmail = user?.email || order.billingDetails?.email;

      if (recipientEmail) {
        let message = "";

        switch (status) {
          case "shipped":
            message = "Your order has been shipped";
            break;
          case "delivered":
          case "completed":
            message = "Your order has been delivered";
            break;
          case "cancelled":
            message = "Your order has been cancelled";
            break;
          default:
            message = "Your order status has been updated";
        }

        const customerName = `${order.billingDetails?.firstName ?? ""} ${
          order.billingDetails?.lastName ?? ""
        }`.trim();
        const formatLabel = (value: string) =>
          value
            .replace(/[-_]/g, " ")
            .split(" ")
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        const orderCode = String(order._id).toUpperCase().slice(-8);
        const statusLabel = formatLabel(status);

        try {
          await sendEmail({
            to: recipientEmail,
            subject: getOrderStatusSubject({
              orderCode,
              status,
              isSubscriptionOrder: order.orderType === "subscription",
            }),
            html: renderOrderStatusEmail({
              eyebrow: "Order update",
              title: message,
              lead: "There has been an update to your Supplement Lanka order.",
              orderCode,
              statusLabel,
              statusTone: getOrderStatusTone(status),
              detailItems: [
                { label: "Customer", value: customerName || "Customer" },
                { label: "Payment", value: "PayHere" },
                {
                  label: "Date",
                  value: new Date(order.createdAt).toLocaleDateString("en-LK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }),
                },
              ],
              trackingNumber: order.trackingNumber || undefined,
              items: order.items.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                lineTotal: item.lineTotal ?? item.price * item.quantity,
              })),
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              total: order.total,
              footerNote: "Thank you for shopping with us. If you have any questions, simply reply to this email.",
            }),
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
