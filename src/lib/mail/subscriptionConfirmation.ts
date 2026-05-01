import type { IOrder } from "@/models/Order";
import { renderOrderStatusEmail } from "@/lib/mail/emailTemplate";

type SubscriptionConfirmationInput = Pick<
  IOrder,
  | "_id"
  | "items"
  | "subtotal"
  | "shippingCost"
  | "total"
  | "billingDetails"
  | "createdAt"
> & {
  subscriptionId: string;
  recurrence: string;
  nextBillingDate: Date;
};

const formatDate = (date?: Date | string | null) => {
  if (!date) return "Today";

  return new Date(date).toLocaleDateString("en-LK", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function getSubscriptionConfirmationHtml({
  _id,
  items,
  subtotal,
  shippingCost,
  total,
  billingDetails,
  createdAt,
  subscriptionId,
  recurrence,
  nextBillingDate,
}: SubscriptionConfirmationInput) {
  const customerName = `${billingDetails?.firstName ?? ""} ${
    billingDetails?.lastName ?? ""
  }`.trim();

  return renderOrderStatusEmail({
    eyebrow: "Subscription active",
    title: "Your subscription is now active",
    lead: "We have received your first payment and will continue processing this order on your selected billing cycle.",
    orderCode: String(_id).toUpperCase().slice(-8),
    statusLabel: "Active",
    statusTone: "success",
    detailItems: [
      { label: "Customer", value: customerName || "Customer" },
      { label: "Payment", value: "PayHere" },
      { label: "Date", value: formatDate(createdAt) },
      { label: "Subscription", value: `#${subscriptionId}` },
      { label: "Billing Cycle", value: recurrence },
      { label: "Next Billing Date", value: formatDate(nextBillingDate) },
    ],
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.lineTotal ?? item.price * item.quantity,
    })),
    subtotal,
    shippingCost,
    total,
    footerNote: "We will email you again when future subscription payments are processed. If you have any questions, simply reply to this email.",
  });
}
