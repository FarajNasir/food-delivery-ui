import { renderEmailLayout } from "./layout";
import type { OrderTemplateData } from "./types";
import { escapeHtml, formatCurrency, resolveEmailBrand } from "./utils";

function buildPaymentSummaryHtml(order: OrderTemplateData, body: string, accent: string) {
  const createdAt = order.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(order.createdAt)
    : null;

  return `
    <div style="border:1px solid #e5ebf2;border-radius:16px;padding:18px 20px;background:#fbfcfe;">
      <div style="font-size:14px;line-height:1.7;color:#4b5563;">${escapeHtml(body)}</div>
      <div style="margin-top:18px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${accent};">Payment details</div>
      <div style="margin-top:8px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(order.restaurantName)}</div>
      <div style="margin-top:6px;font-size:14px;color:#4b5563;">Order #${escapeHtml(order.orderId.slice(0, 8).toUpperCase())}</div>
      ${createdAt ? `<div style="margin-top:6px;font-size:14px;color:#4b5563;">Placed on ${escapeHtml(createdAt)}</div>` : ""}
      <div style="margin-top:6px;font-size:14px;color:#4b5563;">Total paid: ${escapeHtml(formatCurrency(order.totalAmount, order.currency))}</div>
    </div>
  `;
}

export function buildPaymentConfirmedEmailTemplate(subject: string, body: string, order: OrderTemplateData) {
  const brand = resolveEmailBrand(order.restaurantLocation);

  return renderEmailLayout({
    brand,
    preheader: `${brand.siteName}: payment confirmed`,
    title: "Your payment has been received",
    intro: "Payment is complete and the restaurant can move ahead with your order.",
    summaryHtml: buildPaymentSummaryHtml(order, body, brand.accent),
    footerNote: subject,
  });
}
