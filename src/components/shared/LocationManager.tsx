"use client";

import React, { useEffect, useState } from "react";
import { useSite } from "@/context/SiteContext";
import { useConfigStore } from "@/store/useConfigStore";
import LocationPermissionModal from "./LocationPermissionModal";

export default function LocationManager() {
  const { site, siteKey } = useSite();
  const { userCoords, locationDismissed } = useConfigStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Check if we should show the modal
    const needsLocation = siteKey === "downpatrickeats" || siteKey === "kilkeeleats";
    const hasLocation = !!userCoords;
    const isDismissed = locationDismissed;

    if (needsLocation && !hasLocation && !isDismissed) {
      // Delay slightly for better UX (let page settle)
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [siteKey, userCoords, locationDismissed]);

  return (
    <LocationPermissionModal 
      site={site} 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />
  );
}
