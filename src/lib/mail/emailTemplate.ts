export type EmailTone = "accent" | "success" | "info" | "neutral";

export type EmailDetail = {
  label: string;
  value: string;
};

export type EmailOrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
  lineTotal?: number;
};

type EmailLayoutOptions = {
  preheader?: string;
  eyebrow: string;
  title: string;
  lead: string;
  bodyHtml: string;
  actionLabel?: string;
  actionHref?: string;
  footerNote?: string;
};

type PasswordResetEmailOptions = {
  resetLink: string;
};

type OrderStatusEmailOptions = {
  eyebrow: string;
  title: string;
  lead: string;
  orderCode: string;
  statusLabel: string;
  statusTone: EmailTone;
  detailItems?: EmailDetail[];
  trackingNumber?: string | null;
  items?: EmailOrderItem[];
  subtotal?: number | null;
  shippingCost?: number | null;
  total?: number | null;
  footerNote: string;
};

type SubscriptionReminderEmailOptions = {
  customerName: string;
  subscriptionCode: string;
  formattedBillingDate: string;
  formattedAmount: string;
  recurrence: string;
};

const BRAND_NAME = "Supplement Lanka";
const COLOR_ACCENT = "#03c7fe";
const COLOR_ACCENT_DARK = "#02a9d8";
const COLOR_BG = "#f2fbff";
const COLOR_SURFACE = "#ffffff";
const COLOR_SURFACE_SOFT = "#fbfdff";
const COLOR_BORDER = "#d8eef6";
const COLOR_TEXT = "#111111";
const COLOR_MUTED = "#6b7280";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value?: number | null) {
  const normalized = Number(value || 0);
  return `LKR ${Math.round(normalized).toLocaleString()}`;
}

function getToneStyles(tone: EmailTone) {
  switch (tone) {
    case "success":
      return {
        background: "#ecfdf3",
        border: "#bbf7d0",
        text: "#047857",
      };
    case "info":
      return {
        background: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };
    case "neutral":
      return {
        background: "#f5f5f5",
        border: "#e5e7eb",
        text: "#4b5563",
      };
    default:
      return {
        background: "#ecfeff",
        border: "#bae6fd",
        text: "#0891b2",
      };
  }
}

function renderCard(title: string, contentHtml: string) {
  return `
    <div style="margin-top: 18px; border: 1px solid ${COLOR_BORDER}; border-radius: 20px; background: ${COLOR_SURFACE_SOFT}; padding: 18px;">
      <p style="margin: 0 0 12px 0; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: ${COLOR_ACCENT_DARK};">
        ${escapeHtml(title)}
      </p>
      ${contentHtml}
    </div>
  `;
}

function renderDetailGrid(items: EmailDetail[] = []) {
  if (items.length === 0) {
    return "";
  }

  const rows: string[] = [];

  for (let index = 0; index < items.length; index += 2) {
    const pair = items.slice(index, index + 2);
    rows.push(`
      <tr>
        ${pair
          .map(
            (item) => `
              <td style="width: 50%; vertical-align: top; padding: 0 ${pair.length === 1 ? "0" : "6px"} 12px 0;">
                <div style="border: 1px solid ${COLOR_BORDER}; border-radius: 18px; background: ${COLOR_SURFACE}; padding: 16px;">
                  <p style="margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #9ca3af;">
                    ${escapeHtml(item.label)}
                  </p>
                  <p style="margin: 8px 0 0 0; font-size: 15px; font-weight: 800; color: ${COLOR_TEXT};">
                    ${escapeHtml(item.value)}
                  </p>
                </div>
              </td>
            `
          )
          .join("")}
        ${
          pair.length === 1
            ? '<td style="width: 50%; vertical-align: top; padding: 0 0 12px 6px;"></td>'
            : ""
        }
      </tr>
    `);
  }

  return `
    <table role="presentation" width="100%" style="border-collapse: collapse; margin-top: 18px;">
      ${rows.join("")}
    </table>
  `;
}

function renderStatusBadge(label: string, tone: EmailTone) {
  const toneStyles = getToneStyles(tone);

  return `
    <span style="display: inline-block; border-radius: 999px; border: 1px solid ${toneStyles.border}; background: ${toneStyles.background}; color: ${toneStyles.text}; padding: 8px 14px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase;">
      ${escapeHtml(label)}
    </span>
  `;
}

function renderTrackingCard(trackingNumber?: string | null) {
  if (!trackingNumber?.trim()) {
    return "";
  }

  return renderCard(
    "Waybill Number",
    `<p style="margin: 0; font-size: 18px; font-weight: 800; color: ${COLOR_TEXT}; word-break: break-all;">${escapeHtml(
      trackingNumber
    )}</p>`
  );
}

function renderOrderItemsTable(
  items: EmailOrderItem[] = [],
  subtotal?: number | null,
  shippingCost?: number | null,
  total?: number | null
) {
  const bodyRows =
    items.length > 0
      ? items
          .map((item) => {
            const quantity = Number(item.quantity || 0);
            const lineTotal =
              typeof item.lineTotal === "number"
                ? item.lineTotal
                : Number(item.price || 0) * quantity;

            return `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8f4f8; color: ${COLOR_TEXT}; font-size: 14px; font-weight: 700;">
                  ${escapeHtml(item.name || "Item")}
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8f4f8; text-align: center; color: ${COLOR_MUTED}; font-size: 13px; font-weight: 700;">
                  ${escapeHtml(quantity)}
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e8f4f8; text-align: right; color: ${COLOR_TEXT}; font-size: 14px; font-weight: 800;">
                  ${escapeHtml(formatCurrency(lineTotal))}
                </td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="3" style="padding: 12px 0; color: ${COLOR_MUTED}; font-size: 14px;">
              Item details unavailable
            </td>
          </tr>
        `;

  return renderCard(
    "Order Summary",
    `
      <table role="presentation" width="100%" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 0 0 10px 0; text-align: left; color: #9ca3af; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">Product</th>
            <th style="padding: 0 0 10px 0; text-align: center; color: #9ca3af; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">Qty</th>
            <th style="padding: 0 0 10px 0; text-align: right; color: #9ca3af; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 0 0 0; color: ${COLOR_MUTED}; font-size: 13px; font-weight: 700;">Subtotal</td>
            <td style="padding: 16px 0 0 0; text-align: right; color: ${COLOR_TEXT}; font-size: 14px; font-weight: 800;">
              ${escapeHtml(formatCurrency(subtotal ?? total))}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 10px 0 0 0; color: ${COLOR_MUTED}; font-size: 13px; font-weight: 700;">Shipping</td>
            <td style="padding: 10px 0 0 0; text-align: right; color: ${COLOR_TEXT}; font-size: 14px; font-weight: 800;">
              ${escapeHtml(formatCurrency(shippingCost))}
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding: 14px 0 0 0; color: ${COLOR_TEXT}; font-size: 15px; font-weight: 900;">Grand Total</td>
            <td style="padding: 14px 0 0 0; text-align: right; color: ${COLOR_ACCENT_DARK}; font-size: 18px; font-weight: 900;">
              ${escapeHtml(formatCurrency(total))}
            </td>
          </tr>
        </tfoot>
      </table>
    `
  );
}

function renderEmailLayout({
  preheader,
  eyebrow,
  title,
  lead,
  bodyHtml,
  actionLabel,
  actionHref,
  footerNote,
}: EmailLayoutOptions) {
  const actionHtml =
    actionLabel && actionHref
      ? `
          <div style="margin-top: 24px;">
            <a href="${escapeHtml(
              actionHref
            )}" style="display: inline-block; border-radius: 18px; background: ${COLOR_ACCENT}; color: #ffffff; padding: 14px 22px; text-decoration: none; font-size: 14px; font-weight: 800; box-shadow: 0 10px 25px rgba(3,199,254,0.24);">
              ${escapeHtml(actionLabel)}
            </a>
          </div>
        `
      : "";

  const footerHtml = footerNote
    ? `
        <p style="margin: 24px 0 0 0; color: ${COLOR_MUTED}; font-size: 14px; line-height: 1.7;">
          ${escapeHtml(footerNote)}
        </p>
      `
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
  <body style="margin: 0; padding: 0; background: ${COLOR_BG}; color: ${COLOR_TEXT}; font-family: Arial, Helvetica, sans-serif;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
      ${escapeHtml(preheader || title)}
    </div>
    <table role="presentation" width="100%" style="border-collapse: collapse; background: ${COLOR_BG};">
      <tr>
        <td style="padding: 32px 16px;">
          <div style="max-width: 640px; margin: 0 auto;">
            <div style="margin-bottom: 12px;">
              <span style="display: inline-block; border-radius: 999px; background: #dff7ff; color: ${COLOR_ACCENT_DARK}; padding: 8px 12px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase;">
                ${escapeHtml(eyebrow)}
              </span>
            </div>

            <div style="border: 1px solid ${COLOR_BORDER}; border-radius: 28px; background: ${COLOR_SURFACE}; overflow: hidden; box-shadow: 0 20px 50px rgba(3,199,254,0.1);">
              <div style="padding: 28px 28px 0 28px;">
                <div style="display: inline-block; border-radius: 20px; background: ${COLOR_ACCENT}; color: #ffffff; padding: 12px 16px; font-size: 14px; font-weight: 900;">
                  ${escapeHtml(BRAND_NAME)}
                </div>
                <h1 style="margin: 16px 0 0 0; font-size: 30px; line-height: 1.2; font-weight: 900; color: ${COLOR_TEXT};">
                  ${escapeHtml(title)}
                </h1>
                <p style="margin: 14px 0 0 0; color: ${COLOR_MUTED}; font-size: 15px; line-height: 1.8;">
                  ${escapeHtml(lead)}
                </p>
                ${actionHtml}
              </div>

              <div style="padding: 28px;">
                ${bodyHtml}
                ${footerHtml}
              </div>

              <div style="border-top: 1px solid ${COLOR_BORDER}; background: ${COLOR_SURFACE_SOFT}; padding: 18px 28px;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                  &copy; ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

export function getOrderStatusTone(status: string): EmailTone {
  switch (status.trim().toLowerCase()) {
    case "completed":
      return "success";
    case "shipped":
      return "info";
    case "fulfilled":
      return "accent";
    default:
      return "neutral";
  }
}

export function getOrderStatusSubject({
  orderCode,
  status,
  isSubscriptionOrder = false,
}: {
  orderCode: string;
  status: string;
  isSubscriptionOrder?: boolean;
}) {
  const normalizedStatus = status.trim().toLowerCase();
  const prefix = isSubscriptionOrder ? "Subscription Order" : "Order";

  switch (normalizedStatus) {
    case "fulfilled":
      return isSubscriptionOrder
        ? `${prefix} Confirmed: #${orderCode}`
        : `${prefix} Packed: #${orderCode}`;
    case "shipped":
      return `${prefix} Shipped: #${orderCode}`;
    case "completed":
      return `${prefix} Delivered: #${orderCode}`;
    default:
      return `${prefix} Status Updated: #${orderCode}`;
  }
}

export function renderPasswordResetEmail({
  resetLink,
}: PasswordResetEmailOptions) {
  return renderEmailLayout({
    preheader: "Reset your admin password",
    eyebrow: "Admin Access",
    title: "Reset your password",
    lead: "We received a request to reset the password for your admin account.",
    actionLabel: "Reset Password",
    actionHref: resetLink,
    bodyHtml: [
      renderCard(
        "Security Note",
        `<p style="margin: 0; color: ${COLOR_MUTED}; font-size: 14px; line-height: 1.7;">
          This link opens the secure password reset flow for your Supplement Lanka admin account.
        </p>`
      ),
      renderCard(
        "Manual Link",
        `<p style="margin: 0; color: ${COLOR_MUTED}; font-size: 14px; line-height: 1.7;">
          If the button does not work, copy and paste this URL into your browser.
        </p>
        <p style="margin: 12px 0 0 0; color: ${COLOR_ACCENT_DARK}; font-size: 13px; line-height: 1.7; word-break: break-all; font-weight: 700;">
          ${escapeHtml(resetLink)}
        </p>`
      ),
    ].join(""),
    footerNote:
      "If you did not request a password reset, you can safely ignore this email.",
  });
}

export function renderOrderStatusEmail({
  eyebrow,
  title,
  lead,
  orderCode,
  statusLabel,
  statusTone,
  detailItems = [],
  trackingNumber,
  items = [],
  subtotal,
  shippingCost,
  total,
  footerNote,
}: OrderStatusEmailOptions) {
  return renderEmailLayout({
    preheader: `${title} for order #${orderCode}`,
    eyebrow,
    title,
    lead,
    bodyHtml: [
      renderDetailGrid([
        { label: "Order", value: `#${orderCode}` },
        ...detailItems,
      ]),
      renderCard(
        "Current Status",
        `<div>${renderStatusBadge(statusLabel, statusTone)}</div>`
      ),
      renderTrackingCard(trackingNumber),
      renderOrderItemsTable(items, subtotal, shippingCost, total),
    ].join(""),
    footerNote,
  });
}

export function renderSubscriptionReminderEmail({
  customerName,
  subscriptionCode,
  formattedBillingDate,
  formattedAmount,
  recurrence,
}: SubscriptionReminderEmailOptions) {
  return renderEmailLayout({
    preheader: `Subscription #${subscriptionCode} renews on ${formattedBillingDate}`,
    eyebrow: "Subscription Renewal",
    title: "Renewal due soon",
    lead: `Hi ${customerName}, your subscription #${subscriptionCode} is scheduled to renew on ${formattedBillingDate}.`,
    bodyHtml: [
      renderDetailGrid([
        { label: "Subscription", value: `#${subscriptionCode}` },
        { label: "Renewal Amount", value: `LKR ${formattedAmount}` },
        { label: "Recurrence", value: recurrence },
        { label: "Renewal Date", value: formattedBillingDate },
      ]),
      renderCard(
        "Reminder",
        `<p style="margin: 0; color: ${COLOR_MUTED}; font-size: 14px; line-height: 1.7;">
          Please make sure your payment method is ready so the renewal can be processed without interruption.
        </p>`
      ),
    ].join(""),
    footerNote:
      "If you have any questions, reply to this email and our team will assist you.",
  });
}
