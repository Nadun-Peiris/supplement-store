import type { IOrder } from "@/models/Order";

export function getOrderConfirmationHtml(order: Pick<IOrder, "_id" | "items" | "subtotal" | "shippingCost" | "total">) {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; width: 100%;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <tr>
          <td style="background-color: #1a1a1a; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px;">ORDER CONFIRMED</h1>
            <p style="color: #999; margin-top: 10px; font-size: 14px;">Order ID: #${String(order._id).toUpperCase().slice(-8)}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 40px 20px 40px;">
            <h2 style="margin: 0; color: #333; font-size: 20px;">Thank you for your order!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-top: 15px;">
              Your payment has been confirmed and we are now processing your order.
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
                    (item) => `
                  <tr>
                    <td style="padding: 15px 0; border-top: 1px solid #fafafa;">
                      <span style="font-weight: 600; color: #333; display: block;">${item.name}</span>
                    </td>
                    <td align="center" style="padding: 15px 0; border-top: 1px solid #fafafa; color: #666;">
                      ${item.quantity}
                    </td>
                    <td align="right" style="padding: 15px 0; border-top: 1px solid #fafafa; font-weight: 600; color: #333;">
                      LKR ${(item.lineTotal ?? item.price * item.quantity).toLocaleString()}
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
                <td align="right" style="padding: 5px 0; width: 100px; color: #333;">LKR ${order.subtotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td align="right" style="padding: 5px 0; color: #666;">Shipping</td>
                <td align="right" style="padding: 5px 0; color: #333;">LKR ${order.shippingCost.toLocaleString()}</td>
              </tr>
              <tr>
                <td align="right" style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #333;">Grand Total</td>
                <td align="right" style="padding: 15px 0; font-size: 18px; font-weight: bold; color: #1a1a1a;">LKR ${order.total.toLocaleString()}</td>
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
  `;
}
