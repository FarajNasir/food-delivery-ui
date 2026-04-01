"use client";

import { useEffect } from "react";
import { useSite } from "@/context/SiteContext";

/**
 * Keeps the browser <title> in sync with the active location.
 * Drop this anywhere inside SiteProvider.
 */
export default function SiteTitle() {
  const { site } = useSite();

  useEffect(() => {
    document.title = `${site.name} — Fast Food Delivery in ${site.location}`;
  }, [site]);

  return null;
}
