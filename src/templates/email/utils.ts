import { SITES, DEFAULT_SITE, type SiteConfig } from "@/config/sites";
import type { EmailBrand } from "./types";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatCurrency(amount: string | number, currency = "GBP") {
  const numeric = typeof amount === "number" ? amount : Number(amount);
  const safeAmount = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `£${safeAmount.toFixed(2)}`;
  }
}

function findSiteByLocation(location: string | null | undefined): SiteConfig {
  if (!location) return SITES[DEFAULT_SITE];

  const normalized = location.trim().toLowerCase();
  const exactMatch = Object.values(SITES).find(
    (site) => site.location.trim().toLowerCase() === normalized
  );

  if (exactMatch) return exactMatch;

  const partialMatch = Object.values(SITES).find((site) =>
    normalized.includes(site.location.trim().toLowerCase())
  );

  return partialMatch ?? SITES[DEFAULT_SITE];
}

export function resolveEmailBrand(location: string | null | undefined): EmailBrand {
  const site = findSiteByLocation(location);
  return {
    siteKey: site.key,
    siteName: site.name,
    location: site.location,
    supportEmail: site.contact.email,
    primary: site.theme.primary,
    accent: site.theme.accent,
    notice: site.contact.notice,
  };
}
