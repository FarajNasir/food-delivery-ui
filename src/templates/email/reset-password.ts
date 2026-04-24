import { renderEmailLayout } from "./layout";
import type { ResetPasswordTemplateData } from "./types";
import { escapeHtml, resolveEmailBrand } from "./utils";

export function buildResetPasswordEmailTemplate(data: ResetPasswordTemplateData) {
  const brand = resolveEmailBrand(data.brandLocation);
  const expiresText = data.expiresInMinutes
    ? `This link expires in ${data.expiresInMinutes} minutes.`
    : "For security, please use the link as soon as possible.";
  const nameLine = data.customerName ? `Hello ${data.customerName},` : "Hello,";

  return renderEmailLayout({
    brand,
    preheader: `${brand.siteName}: reset your password`,
    title: "Reset your password",
    intro: "We received a request to reset your password.",
    summaryHtml: `
      <div style="font-size:15px;line-height:1.8;color:#374151;">
        <p style="margin:0 0 14px;">${escapeHtml(nameLine)}</p>
        <p style="margin:0 0 14px;">Use the secure link below to set a new password for your ${escapeHtml(brand.siteName)} account.</p>
        <p style="margin:0 0 18px;"><a href="${escapeHtml(data.resetUrl)}" style="display:inline-block;padding:12px 18px;background:${brand.primary};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;">Reset password</a></p>
        <p style="margin:0 0 14px;">${escapeHtml(expiresText)}</p>
        <p style="margin:0;color:#6b7280;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
