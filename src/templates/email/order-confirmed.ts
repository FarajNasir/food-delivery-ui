import { renderEmailLayout } from "./layout";
import type { OrderTemplateData } from "./types";
import { escapeHtml, formatCurrency, resolveEmailBrand } from "./utils";

function buildOrderSummaryHtml(order: OrderTemplateData, body: string, accent: string) {
  const createdAt = order.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(order.createdAt)
    : null;

  const itemsHtml = order.items
    .map((item) => {
      const total = Number(item.price) * item.quantity;
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #edf1f5;font-size:14px;color:#1f2937;">
            <strong>${escapeHtml(item.name)}</strong><br />
            <span style="color:#6b7280;">Qty ${item.quantity}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #edf1f5;font-size:14px;text-align:right;color:#1f2937;">
            ${escapeHtml(formatCurrency(total, order.currency))}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div style="border:1px solid #e5ebf2;border-radius:16px;padding:18px 20px;background:#fbfcfe;">
      <div style="font-size:14px;line-height:1.7;color:#4b5563;">${escapeHtml(body)}</div>
      <div style="margin-top:18px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${accent};">Order details</div>
      <div style="margin-top:8px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(order.restaurantName)}</div>
      <div style="margin-top:6px;font-size:14px;color:#4b5563;">Order #${escapeHtml(order.orderId.slice(0, 8).toUpperCase())}</div>
      ${createdAt ? `<div style="margin-top:6px;font-size:14px;color:#4b5563;">Placed on ${escapeHtml(createdAt)}</div>` : ""}
      ${order.deliveryAddress ? `<div style="margin-top:6px;font-size:14px;color:#4b5563;">Delivery address: ${escapeHtml(order.deliveryAddress)}</div>` : ""}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;border-collapse:collapse;">
      <tr>
        <td colspan="2" style="padding-bottom:10px;font-size:18px;font-weight:700;color:#111827;">Order summary</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td style="padding-top:14px;font-size:14px;color:#6b7280;">Delivery fee</td>
        <td style="padding-top:14px;text-align:right;font-size:14px;color:#111827;">${escapeHtml(formatCurrency(order.deliveryFee, order.currency))}</td>
      </tr>
      <tr>
        <td style="padding-top:10px;font-size:16px;font-weight:700;color:#111827;">Total</td>
        <td style="padding-top:10px;text-align:right;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(formatCurrency(order.totalAmount, order.currency))}</td>
      </tr>
    </table>
  `;
}

export function buildOrderConfirmedEmailTemplate(subject: string, body: string, order: OrderTemplateData) {
  const brand = resolveEmailBrand(order.restaurantLocation);

  return renderEmailLayout({
    brand,
    preheader: `${brand.siteName}: your order has been accepted`,
    title: "Your order has been accepted",
    intro: "The restaurant has confirmed your order and will prepare it soon.",
    summaryHtml: buildOrderSummaryHtml(order, body, brand.accent),
    footerNote: subject,
  });
}
