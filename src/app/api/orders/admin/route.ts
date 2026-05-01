import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/mail/nodemailer";
import { getSupplementLankaEmailHtml } from "@/lib/mail/emailTemplate";

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
        const formatCurrency = (amount: number) =>
          `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;
        const formatLabel = (value: string) =>
          value
            .replace(/[-_]/g, " ")
            .split(" ")
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

        try {
          await sendEmail({
            to: recipientEmail,
            subject: message,
            html: getSupplementLankaEmailHtml({
              eyebrow: "Order update",
              title: message,
              lead: "There has been an update to your Supplement Lanka order.",
              actionLabel: "View Order",
              actionUrl: "#",
              details: [
                {
                  label: "Order",
                  value: `#${String(order._id).toUpperCase().slice(-8)}`,
                },
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
              statusLabel: formatLabel(status),
              waybillNumber: order.trackingNumber || undefined,
              summaryItems: order.items.map((item) => ({
                name: item.name,
                quantity: String(item.quantity),
                total: formatCurrency(
                  item.lineTotal ?? item.price * item.quantity
                ),
              })),
              subtotal: formatCurrency(order.subtotal),
              shipping: formatCurrency(order.shippingCost),
              grandTotal: formatCurrency(order.total),
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
