"use client";

import React, { useEffect, useState } from "react";
import { useSite } from "@/context/SiteContext";
import { useConfigStore } from "@/store/useConfigStore";
import { useAuthStore } from "@/store/useAuthStore";
import LocationPermissionModal from "./LocationPermissionModal";

export default function LocationManager() {
  const { site, siteKey } = useSite();
  const { userCoords, locationDismissed } = useConfigStore();
  const { role } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. If user is admin/owner/driver, never show location prompt
    const isRestrictedRole = role && ["admin", "owner", "driver"].includes(role);
    if (isRestrictedRole) {
      setIsModalOpen(false);
      return;
    }

    // 2. Check site requirements
    const isMandatorySite = siteKey === "downpatrickeats" || siteKey === "kilkeeleats";
    const needsLocation = isMandatorySite || siteKey === "newcastleeats"; // Newcastle might still want it but not mandatory?
    
    // Actually, following the user's logic: "only for the customer and in kill keel and dowanpatric location enabled is must"
    // So for other sites (like Newcastle if it exists), it's just regular (dismissable).
    
    const hasLocation = !!userCoords;
    const isDismissed = locationDismissed;

    // 3. Show modal if needed
    // If mandatory, we ignore isDismissed
    const shouldShow = needsLocation && !hasLocation && (isMandatorySite ? true : !isDismissed);

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setIsModalOpen(false);
    }
  }, [siteKey, userCoords, locationDismissed, role]);

  const isMandatory = siteKey === "downpatrickeats" || siteKey === "kilkeeleats";

  return (
    <LocationPermissionModal 
      site={site} 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      isMandatory={isMandatory}
    />
  );
}
