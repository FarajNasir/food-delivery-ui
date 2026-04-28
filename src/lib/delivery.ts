import { SiteConfig } from "@/config/sites";

/**
 * Calculates the driving distance between two coordinates using OSRM API.
 * Returns distance in miles.
 */
export async function getOSRMDistance(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const meters = data.routes[0].distance;
      const miles = meters / 1609.34;
      return parseFloat(miles.toFixed(2));
    }
    return null;
  } catch (error) {
    console.error("OSRM Error:", error);
    return null;
  }
}

/**
 * Calculates the delivery fee based on the site's pricing rules.
 */
export function calculateDeliveryFee(
  site: SiteConfig,
  details: { miles?: number; area?: string; isMobileChef?: boolean }
): number {
  if (!site.deliveryPricing) return 0;

  const { type, rules, mobileChefRules } = site.deliveryPricing;

  if (type === "distance_slabs" && details.miles !== undefined) {
    const activeRules = (details.isMobileChef && mobileChefRules) ? mobileChefRules : rules;
    // Find the first slab where maxMiles is greater than or equal to current miles
    const slab = activeRules.find((s: any) => details.miles! <= s.maxMiles);
    return slab ? slab.fee : activeRules[activeRules.length - 1].fee;
  }

  if (type === "fixed_areas" && details.area) {
    // Find the specific area in the list
    const area = rules.find((a: any) => a.name === details.area);
    return area ? area.fee : 0;
  }

  if (type === "standard") {
    return rules.standardFee || 0;
  }

  return 0;
}

