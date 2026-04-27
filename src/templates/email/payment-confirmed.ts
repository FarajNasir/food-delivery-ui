import { renderEmailLayout } from "./layout";
import type { EmailBrand, OrderTemplateData } from "./types";
import { escapeHtml, formatCurrency, resolveEmailBrand } from "./utils";

function buildPaymentSummaryHtml(order: OrderTemplateData, body: string, brand: EmailBrand) {
  const accent = brand.accent;
  const createdAt = order.createdAt
    ? new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(order.createdAt)
    : null;

  const itemsHtml = order.items
    .map(
      (item) => `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:14px;color:#374151;">
        <div style="flex:1;">
          <span style="font-weight:600;color:#111827;">${item.quantity}x</span> ${escapeHtml(item.name)}
        </div>
        <div style="margin-left:12px;font-weight:500;">${escapeHtml(formatCurrency(item.price, order.currency))}</div>
      </div>
    `
    )
    .join("");

  return `
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <div style="padding:24px; border-bottom:1px dashed #e5e7eb; background:#fafafa;">
        <div style="display:flex; align-items:center; margin-bottom:16px;">
          <div style="background:${accent}20; color:${accent}; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:20px; margin-right:12px;">💰</div>
          <div>
            <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; font-weight:600;">Payment Successful</div>
            <div style="font-size:16px; font-weight:700; color:#111827;">Order #${escapeHtml(order.orderId.slice(0, 8).toUpperCase())}</div>
          </div>
        </div>
        <div style="font-size:14px; line-height:1.6; color:#4b5563;">${escapeHtml(body)}</div>
      </div>
      
      <div style="padding:24px;">
        <div style="margin-bottom:20px;">
          <div style="font-size:14px; font-weight:700; color:#111827; margin-bottom:12px; display:flex; align-items:center;">
            <span style="margin-right:8px;">🏪</span> ${escapeHtml(order.restaurantName)}
          </div>
          <div style="font-size:13px; color:#6b7280;">
            ${createdAt ? `<div>📅 ${escapeHtml(createdAt)}</div>` : ""}
            ${order.restaurantLocation ? `<div style="margin-top:4px;">📍 ${escapeHtml(order.restaurantLocation)}</div>` : ""}
          </div>
        </div>

        <div style="margin-bottom:24px;">
          <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:#9ca3af; font-weight:700; margin-bottom:12px;">Order Summary</div>
          ${itemsHtml}
        </div>

        <div style="background:#f9fafb; border-radius:12px; padding:16px;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#4b5563;">
            <div>Item Total</div>
            <div>${escapeHtml(formatCurrency(order.totalAmount, order.currency))}</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:14px; color:#4b5563;">
            <div>Delivery Fee</div>
            <div style="color:#d97706; font-weight:600;">${escapeHtml(formatCurrency(order.deliveryFee, order.currency))} (Cash at Door)</div>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:12px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:18px; font-weight:800; color:#111827;">
            <div>Total Paid</div>
            <div style="color:${accent};">${escapeHtml(formatCurrency(order.totalAmount, order.currency))}</div>
          </div>
        </div>
      </div>
      
      <div style="padding:16px 24px; background:${accent}08; text-align:center;">
        <div style="font-size:13px; color:#4b5563;">Need help with this order?</div>
        <div style="margin-top:4px; font-size:14px; font-weight:700; color:${accent};">Contact Support: ${brand.supportEmail}</div>
      </div>
    </div>
  `;
}

export function buildPaymentConfirmedEmailTemplate(subject: string, body: string, order: OrderTemplateData) {
  const brand = resolveEmailBrand(order.restaurantLocation);

  return renderEmailLayout({
    brand,
    preheader: `Success! Payment received for your order at ${brand.siteName}`,
    title: "Payment Received",
    intro: "Great news! Your payment has been confirmed. The restaurant has been notified and will start preparing your delicious meal right away.",
    summaryHtml: buildPaymentSummaryHtml(order, body, brand),
    footerNote: "This is an automated payment confirmation for your records.",
  });
}
