import { renderEmailLayout } from "./layout";
import type { OrderTemplateData } from "./types";
import { escapeHtml, resolveEmailBrand } from "./utils";

export function buildOrderDeliveredEmailTemplate(subject: string, body: string, order: OrderTemplateData) {
  const brand = resolveEmailBrand(order.restaurantLocation);

  return renderEmailLayout({
    brand,
    preheader: `${brand.siteName}: your order has been delivered`,
    title: "Your order has been delivered",
    intro: "Your order has arrived. We hope everything was just right.",
    summaryHtml: `
      <div style="border:1px solid #e5ebf2;border-radius:16px;padding:18px 20px;background:#fbfcfe;">
        <div style="font-size:14px;line-height:1.7;color:#4b5563;">${escapeHtml(body)}</div>
        <div style="margin-top:18px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${brand.accent};">Delivered order</div>
        <div style="margin-top:8px;font-size:18px;font-weight:700;color:#111827;">${escapeHtml(order.restaurantName)}</div>
        <div style="margin-top:6px;font-size:14px;color:#4b5563;">Order #${escapeHtml(order.orderId.slice(0, 8).toUpperCase())}</div>
        ${order.deliveryAddress ? `<div style="margin-top:6px;font-size:14px;color:#4b5563;">Delivered to: ${escapeHtml(order.deliveryAddress)}</div>` : ""}
      </div>
    `,
    footerNote: subject,
  });
}
