import type { EmailBrand } from "./types";
import { escapeHtml } from "./utils";

export function renderEmailLayout(args: {
  brand: EmailBrand;
  preheader: string;
  title: string;
  intro: string;
  summaryHtml: string;
  detailsHtml?: string;
  footerNote?: string;
}) {
  const { brand, preheader, title, intro, summaryHtml, detailsHtml = "", footerNote } = args;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#f5f7fa;color:#1f2937;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
        <div style="padding:24px 12px;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe2ea;border-radius:20px;overflow:hidden;">
            <div style="padding:28px 28px 22px;background:${brand.primary};color:#ffffff;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.92;">${escapeHtml(brand.siteName)}</div>
              <h1 style="margin:10px 0 8px;font-size:30px;line-height:1.2;">${escapeHtml(title)}</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#eef5fb;">${escapeHtml(intro)}</p>
            </div>
            <div style="padding:28px;">
              ${summaryHtml}
              ${detailsHtml}
              <div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5ebf2;color:#52606d;font-size:13px;line-height:1.7;">
                <div>Support: ${escapeHtml(brand.supportEmail)}</div>
                <div style="margin-top:8px;">${escapeHtml(brand.notice)}</div>
                ${footerNote ? `<div style="margin-top:10px;">${escapeHtml(footerNote)}</div>` : ""}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
