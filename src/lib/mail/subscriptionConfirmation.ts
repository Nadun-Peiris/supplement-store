import type { IOrder } from "@/models/Order";
import { getSupplementLankaEmailHtml } from "@/lib/mail/emailTemplate";

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
  actionUrl,
}: SubscriptionConfirmationInput) {
  const customerName = `${billingDetails?.firstName ?? ""} ${
    billingDetails?.lastName ?? ""
  }`.trim();

  return getSupplementLankaEmailHtml({
    eyebrow: "Subscription active",
    title: "Your subscription is now active",
    lead: "We have received your first payment and will continue processing this order on your selected billing cycle.",
    actionLabel: "View Subscription",
    actionUrl: actionUrl || "#",
    details: [
      { label: "Order", value: `#${String(_id).toUpperCase().slice(-8)}` },
      { label: "Customer", value: customerName || "Customer" },
      { label: "Payment", value: "PayHere" },
      { label: "Date", value: formatDate(createdAt) },
      { label: "Subscription", value: `#${subscriptionId}` },
      { label: "Billing Cycle", value: recurrence },
    ],
    statusLabel: "Active",
    waybillLabel: "Next Billing Date",
    waybillNumber: formatDate(nextBillingDate),
    summaryItems: items.map((item) => ({
      name: item.name,
      quantity: String(item.quantity),
      total: formatCurrency(item.lineTotal ?? item.price * item.quantity),
    })),
    subtotal: formatCurrency(subtotal),
    shipping: formatCurrency(shippingCost),
    grandTotal: formatCurrency(total),
    grandTotalLabel: "First Payment Total",
    footerNote: "We will email you again when future subscription payments are processed. If you have any questions, simply reply to this email.",
  });
}
