type EmailDetail = {
  label: string;
  value: string;
};

type EmailSummaryItem = {
  name: string;
  quantity: string;
  total: string;
};

type EmailTemplateInput = {
  eyebrow: string;
  title: string;
  lead: string;
  actionLabel: string;
  actionUrl: string;
  details?: EmailDetail[];
  statusLabel?: string;
  waybillLabel?: string;
  waybillNumber?: string;
  summaryItems?: EmailSummaryItem[];
  subtotal?: string;
  shipping?: string;
  grandTotal?: string;
  grandTotalLabel?: string;
  footerNote: string;
  year?: number;
};

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderDetails = (details: EmailDetail[] = []) => {
  if (details.length === 0) return "";

  return `
        <div class="sl-grid">
          ${details
            .map(
              ({ label, value }) => `
          <div class="sl-grid-item">
            <p class="sl-grid-label">${escapeHtml(label)}</p>
            <p class="sl-grid-value">${escapeHtml(value)}</p>
          </div>
          `
            )
            .join("")}
        </div>
  `;
};

const renderStatus = (statusLabel?: string) => {
  if (!statusLabel) return "";

  return `
        <div class="sl-section">
          <p class="sl-section-label">Current Status</p>
          <span class="sl-status">${escapeHtml(statusLabel)}</span>
        </div>
  `;
};

const renderWaybill = (waybillLabel?: string, waybillNumber?: string) => {
  if (!waybillNumber) return "";

  return `
        <div class="sl-section">
          <p class="sl-section-label">${escapeHtml(waybillLabel || "Waybill Number")}</p>
          <p class="sl-waybill">${escapeHtml(waybillNumber)}</p>
        </div>
  `;
};

const renderSummary = ({
  summaryItems,
  subtotal,
  shipping,
  grandTotal,
  grandTotalLabel,
}: Pick<
  EmailTemplateInput,
  "summaryItems" | "subtotal" | "shipping" | "grandTotal" | "grandTotalLabel"
>) => {
  if (!summaryItems?.length) return "";

  return `
        <div class="sl-section">
          <p class="sl-section-label">Order Summary</p>

          <table class="sl-summary">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${summaryItems
                .map(
                  (item) => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.quantity)}</td>
                <td>${escapeHtml(item.total)}</td>
              </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="sl-totals">
            ${
              subtotal
                ? `
            <div class="sl-total-row">
              <span>Subtotal</span>
              <span>${escapeHtml(subtotal)}</span>
            </div>
            `
                : ""
            }

            ${
              shipping
                ? `
            <div class="sl-total-row">
              <span>Shipping</span>
              <span>${escapeHtml(shipping)}</span>
            </div>
            `
                : ""
            }

            ${
              grandTotal
                ? `
            <div class="sl-total-row grand">
              <span>${escapeHtml(grandTotalLabel || "Grand Total")}</span>
              <span>${escapeHtml(grandTotal)}</span>
            </div>
            `
                : ""
            }
          </div>
        </div>
  `;
};

export function getSupplementLankaEmailHtml({
  eyebrow,
  title,
  lead,
  actionLabel,
  actionUrl,
  details,
  statusLabel,
  waybillLabel,
  waybillNumber,
  summaryItems,
  subtotal,
  shipping,
  grandTotal,
  grandTotalLabel,
  footerNote,
  year = new Date().getFullYear(),
}: EmailTemplateInput) {
  return `
<div class="sl-email-ui">
  <style>
    .sl-email-ui,
    .sl-email-ui * {
      box-sizing: border-box;
    }

    .sl-email-ui {
      background: #f2fbff;
      padding: 32px 16px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111111;
    }

    .sl-email-wrap {
      max-width: 640px;
      margin: 0 auto;
    }

    .sl-eyebrow {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #dff7ff;
      color: #02a9d8;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .sl-card {
      overflow: hidden;
      border: 1px solid #d8eef6;
      border-radius: 28px;
      background: #ffffff;
      box-shadow: 0 20px 50px rgba(3, 199, 254, 0.1);
    }

    .sl-card-head {
      padding: 28px 28px 0 28px;
    }

    .sl-brand {
      display: inline-block;
      padding: 12px 16px;
      border-radius: 20px;
      background: #03c7fe;
      color: #ffffff;
      font-size: 14px;
      font-weight: 900;
    }

    .sl-title {
      margin: 16px 0 0 0;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 900;
      color: #111111;
    }

    .sl-lead {
      margin: 14px 0 0 0;
      color: #6b7280;
      font-size: 15px;
      line-height: 1.8;
    }

    .sl-button {
      display: inline-block;
      margin-top: 24px;
      padding: 14px 22px;
      border-radius: 18px;
      background: #03c7fe;
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
      font-weight: 800;
      box-shadow: 0 10px 25px rgba(3, 199, 254, 0.24);
    }

    .sl-card-body {
      padding: 28px;
    }

    .sl-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }

    .sl-grid-item {
      border: 1px solid #d8eef6;
      border-radius: 18px;
      background: #ffffff;
      padding: 16px;
    }

    .sl-grid-label {
      margin: 0;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #9ca3af;
    }

    .sl-grid-value {
      margin: 8px 0 0 0;
      font-size: 15px;
      font-weight: 800;
      color: #111111;
    }

    .sl-section {
      margin-top: 18px;
      border: 1px solid #d8eef6;
      border-radius: 20px;
      background: #fbfdff;
      padding: 18px;
    }

    .sl-section-label {
      margin: 0 0 12px 0;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: #02a9d8;
    }

    .sl-status {
      display: inline-block;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid #bae6fd;
      background: #ecfeff;
      color: #0891b2;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    .sl-waybill {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: #111111;
      word-break: break-word;
    }

    .sl-summary {
      width: 100%;
      border-collapse: collapse;
    }

    .sl-summary th {
      padding: 0 0 10px 0;
      text-align: left;
      color: #9ca3af;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .sl-summary th:nth-child(2),
    .sl-summary td:nth-child(2) {
      text-align: center;
    }

    .sl-summary th:last-child,
    .sl-summary td:last-child {
      text-align: right;
    }

    .sl-summary td {
      padding: 12px 0;
      border-bottom: 1px solid #e8f4f8;
      font-size: 14px;
    }

    .sl-summary td:first-child {
      color: #111111;
      font-weight: 700;
    }

    .sl-summary td:nth-child(2) {
      color: #6b7280;
      font-size: 13px;
      font-weight: 700;
    }

    .sl-summary td:last-child {
      color: #111111;
      font-weight: 800;
    }

    .sl-totals {
      margin-top: 16px;
    }

    .sl-total-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 10px;
      font-size: 14px;
    }

    .sl-total-row span:first-child {
      color: #6b7280;
      font-weight: 700;
    }

    .sl-total-row span:last-child {
      color: #111111;
      font-weight: 800;
    }

    .sl-total-row.grand {
      margin-top: 14px;
      font-size: 18px;
    }

    .sl-total-row.grand span:first-child {
      color: #111111;
      font-weight: 900;
    }

    .sl-total-row.grand span:last-child {
      color: #02a9d8;
      font-weight: 900;
    }

    .sl-footer-note {
      margin: 24px 0 0 0;
      color: #6b7280;
      font-size: 14px;
      line-height: 1.7;
    }

    .sl-card-foot {
      border-top: 1px solid #d8eef6;
      background: #fbfdff;
      padding: 18px 28px;
    }

    .sl-card-foot p {
      margin: 0;
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.6;
    }

    @media (max-width: 640px) {
      .sl-title {
        font-size: 24px;
      }

      .sl-card-head,
      .sl-card-body,
      .sl-card-foot {
        padding-left: 20px;
        padding-right: 20px;
      }

      .sl-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>

  <div class="sl-email-wrap">
    <div class="sl-eyebrow">${escapeHtml(eyebrow)}</div>

    <div class="sl-card">
      <div class="sl-card-head">
        <div class="sl-brand">Supplement Lanka</div>
        <h1 class="sl-title">${escapeHtml(title)}</h1>
        <p class="sl-lead">${escapeHtml(lead)}</p>

        <a class="sl-button" href="${escapeHtml(actionUrl)}">
          ${escapeHtml(actionLabel)}
        </a>
      </div>

      <div class="sl-card-body">
        ${renderDetails(details)}
        ${renderStatus(statusLabel)}
        ${renderWaybill(waybillLabel, waybillNumber)}
        ${renderSummary({
          summaryItems,
          subtotal,
          shipping,
          grandTotal,
          grandTotalLabel,
        })}

        <p class="sl-footer-note">
          ${escapeHtml(footerNote)}
        </p>
      </div>

      <div class="sl-card-foot">
        <p>&copy; ${escapeHtml(year)} Supplement Lanka. All rights reserved.</p>
      </div>
    </div>
  </div>
</div>
  `;
}
