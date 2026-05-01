import type { IOrder } from "@/models/Order";
import { getSupplementLankaEmailHtml } from "@/lib/mail/emailTemplate";

type OrderConfirmationInput = Pick<
  IOrder,
  | "_id"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "total"
  | "orderType"
  | "billingDetails"
  | "createdAt"
> & {
  subscriptionId?: string | null;
  paymentMethod?: string | null;
  fulfillmentStatus?: string | null;
  trackingNumber?: string | null;
  actionUrl?: string;
};

const formatCurrency = (amount: number) =>
  `LKR ${Number(amount || 0).toLocaleString("en-LK")}`;

const formatDate = (date?: Date | string | null) => {
  if (!date) return "Today";

  return new Date(date).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatLabel = (value?: string | null) => {
  if (!value) return "Pending";

  return value
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export function getOrderConfirmationHtml(order: OrderConfirmationInput) {
  const isSubscriptionOrder = order.orderType === "subscription";
  const orderCode = String(order._id).toUpperCase().slice(-8);
  const customerName = `${order.billingDetails?.firstName ?? ""} ${
    order.billingDetails?.lastName ?? ""
  }`.trim();

  return getSupplementLankaEmailHtml({
    eyebrow: isSubscriptionOrder ? "Subscription order" : "Order confirmed",
    title: isSubscriptionOrder
      ? "Your subscription order is confirmed"
      : "Your order is confirmed",
    lead: isSubscriptionOrder
      ? "Your payment has been confirmed and we are now processing your subscription order."
      : "Your payment has been confirmed and we are now processing your order.",
    actionLabel: "View Order",
    actionUrl: order.actionUrl || "#",
    details: [
      { label: "Order", value: `#${orderCode}` },
      { label: "Customer", value: customerName || "Customer" },
      { label: "Payment", value: order.paymentMethod || "PayHere" },
      { label: "Date", value: formatDate(order.createdAt) },
      ...(isSubscriptionOrder && order.subscriptionId
        ? [{ label: "Subscription", value: `#${order.subscriptionId}` }]
        : []),
    ],
    statusLabel: formatLabel(order.fulfillmentStatus || "unfulfilled"),
    waybillNumber: order.trackingNumber || undefined,
    summaryItems: order.items.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      total: formatCurrency(item.lineTotal ?? item.price * item.quantity),
    })),
    subtotal: formatCurrency(order.subtotal),
    shipping: formatCurrency(order.shippingCost),
    grandTotal: formatCurrency(order.total),
    footerNote: "We will notify you when your order is shipped. If you have any questions, simply reply to this email.",
  });
}
