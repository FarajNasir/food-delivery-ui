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
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#f3f4f6;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
        <div style="padding:40px 20px;">
          <div style="max-width:600px;margin:0 auto;">
            <!-- Header/Logo Area -->
            <div style="text-align:center;margin-bottom:32px;">
              <div style="display:inline-block;padding:12px 24px;background-color:${brand.primary};color:#ffffff;border-radius:12px;font-weight:800;font-size:20px;letter-spacing:-0.02em;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
                ${escapeHtml(brand.siteName).toUpperCase()}
              </div>
            </div>

            <!-- Main Content Card -->
            <div style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1),0 10px 10px -5px rgba(0,0,0,0.04);">
              <div style="padding:40px;background-image:linear-gradient(to bottom right, ${brand.primary}, ${brand.accent});color:#ffffff;text-align:center;">
                <h1 style="margin:0;font-size:32px;font-weight:800;line-height:1.2;letter-spacing:-0.04em;">${escapeHtml(title)}</h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;opacity:0.9;max-width:400px;margin-left:auto;margin-right:auto;">${escapeHtml(intro)}</p>
              </div>
              
              <div style="padding:32px;">
                ${summaryHtml}
                ${detailsHtml}
              </div>
            </div>

            <!-- Footer Area -->
            <div style="margin-top:40px;text-align:center;padding:0 20px;">
              <div style="color:#6b7280;font-size:14px;line-height:1.6;">
                <div>Questions? We're here to help!</div>
                <div style="margin-top:4px;">Email us at <a href="mailto:${brand.supportEmail}" style="color:${brand.primary};font-weight:600;text-decoration:none;">${escapeHtml(brand.supportEmail)}</a></div>
              </div>
              <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">
                <div style="font-weight:600;margin-bottom:8px;">${escapeHtml(brand.siteName)}</div>
                <div>${escapeHtml(brand.notice)}</div>
                ${footerNote ? `<div style="margin-top:16px;font-style:italic;">${escapeHtml(footerNote)}</div>` : ""}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
