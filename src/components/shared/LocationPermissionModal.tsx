"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, ShieldCheck } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { toast } from "sonner";
import { SiteConfig } from "@/config/sites";

interface LocationPermissionModalProps {
  site: SiteConfig;
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

export default function LocationPermissionModal({
  site,
  isOpen,
  onClose,
  isMandatory = false,
}: LocationPermissionModalProps) {
  const setUserCoords = useConfigStore((state) => state.setUserCoords);
  const setLocationDismissed = useConfigStore((state) => state.setLocationDismissed);

  const handleAllow = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      onClose();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        toast.success("Location access granted!");
        onClose();
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Could not get your location. Please check browser permissions.");
        onClose();
      }
    );
  };

  const handleDecline = () => {
    setLocationDismissed(true);
    toast.info("You can always set your location later at checkout.");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isMandatory ? undefined : onClose}
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${isMandatory ? "cursor-default" : "cursor-pointer"}`}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 text-center bg-gray-50/50 border-b border-gray-100 relative">
              {!isMandatory && (
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-600 shadow-sm transition-all focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div
                className="w-16 h-16 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
              >
                <MapPin className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Enable Location for {site.location}
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                {isMandatory ? "Location access required" : "For the best nearby deals"}
              </p>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <p className="text-sm font-medium text-gray-500 text-center leading-relaxed">
                {isMandatory
                  ? `Location access is required for ${site.location} to ensure accurate delivery and the best local deals.`
                  : "We use your location to calculate accurate delivery fees and show you the best deals nearby."}
              </p>

              {/* Privacy badge */}
              <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl justify-center">
                <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Your privacy is our priority
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllow}
                  className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                  }}
                >
                  <Navigation className="w-4 h-4" />
                  Allow Location Access
                </button>

                {!isMandatory && (
                  <button
                    onClick={handleDecline}
                    className="w-full py-3 rounded-2xl text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Maybe Later
                  </button>
                )}
              </div>

              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center">
                You can change this in your browser settings anytime
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
