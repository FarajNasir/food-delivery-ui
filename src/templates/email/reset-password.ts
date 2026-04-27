import { renderEmailLayout } from "./layout";
import type { ResetPasswordTemplateData } from "./types";
import { escapeHtml, resolveEmailBrand } from "./utils";

/**
 * COPY THIS CODE AND PASTE IT INTO SUPABASE (AUTH > EMAIL TEMPLATES > RESET PASSWORD)
 * ----------------------------------------------------------------------------------
 */
export const SUPABASE_RESET_PASSWORD_HTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background-color:#f3f4f6;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="padding:40px 20px;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="display:inline-block;padding:12px 24px;background-color:#2980B9;color:#ffffff;border-radius:12px;font-weight:800;font-size:20px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);">
            YOUR LOCAL EATS
          </div>
        </div>
        <div style="background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
          <div style="padding:40px;background-image:linear-gradient(to bottom right, #2980B9, #1ABC9C);color:#ffffff;text-align:center;">
            <h1 style="margin:0;font-size:32px;font-weight:800;line-height:1.2;">Reset Password</h1>
            <p style="margin:16px 0 0;font-size:16px;opacity:0.9;">We received a request to reset your password.</p>
          </div>
          <div style="padding:32px; text-align:center;">
            <div style="background:#2980B920; color:#2980B9; width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 20px;">🔑</div>
            <p style="font-size:16px; line-height:1.6; color:#4b5563; margin-bottom:24px;">Click the button below to securely reset your password.</p>
            <a href="{{ .ConfirmationURL }}" style="display:inline-block; padding:16px 32px; background-color:#2980B9; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:700; font-size:16px; box-shadow:0 4px 10px #2980B940;">
              Reset My Password
            </a>
            <div style="margin-top:32px; padding-top:24px; border-top:1px solid #f3f4f6;">
              <p style="font-size:13px; color:#9ca3af; margin:0;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
        <div style="margin-top:40px;text-align:center;padding:0 20px;">
          <div style="color:#6b7280;font-size:14px;">Questions? Email us at <a href="mailto:hello@yourlocaleats.app" style="color:#2980B9;text-decoration:none;font-weight:600;">hello@yourlocaleats.app</a></div>
        </div>
      </div>
    </div>
  </body>
</html>
`;

export function buildResetPasswordEmailTemplate(data: ResetPasswordTemplateData) {
  const brand = resolveEmailBrand(data.brandLocation);
  const accent = brand.accent;
  const nameLine = data.customerName ? `Hello ${data.customerName},` : "Hello,";
  const expiresText = data.expiresInMinutes
    ? `For your security, this link will expire in ${data.expiresInMinutes} minutes.`
    : "For security, please use this link as soon as possible.";

  return renderEmailLayout({
    brand,
    preheader: `Action Required: Reset your password for ${brand.siteName}`,
    title: "Reset Password",
    intro: "We received a request to reset the password for your account. If you didn't make this request, you can safely ignore this email.",
    summaryHtml: `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="padding:32px; text-align:center;">
          <div style="background:${accent}20; color:${accent}; width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto 20px;">🔑</div>
          <div style="font-size:18px; font-weight:700; color:#111827; margin-bottom:12px;">${escapeHtml(nameLine)}</div>
          <p style="font-size:15px; line-height:1.6; color:#4b5563; margin-bottom:24px;">Click the button below to securely reset your password.</p>
          <a href="${escapeHtml(data.resetUrl)}" style="display:inline-block; padding:16px 32px; background-color:${brand.primary}; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:700; font-size:16px; box-shadow:0 4px 10px ${brand.primary}40;">
            Reset My Password
          </a>
          <div style="margin-top:32px; padding-top:24px; border-top:1px solid #f3f4f6;">
            <p style="font-size:13px; color:#9ca3af; margin:0;">${escapeHtml(expiresText)}</p>
          </div>
        </div>
      </div>
    `,
    footerNote: "This is an automated security email. Please do not reply directly to this message.",
  });
}
