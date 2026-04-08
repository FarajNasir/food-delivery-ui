"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, X, ShieldCheck, ChevronRight } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { toast } from "sonner";
import { SiteConfig } from "@/config/sites";

interface LocationPermissionModalProps {
  site: SiteConfig;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationPermissionModal({ site, isOpen, onClose }: LocationPermissionModalProps) {
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header / Graphic */}
            <div 
              className="h-32 w-full flex items-center justify-center relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.gradientTo})` }}
            >
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
              </div>
              <div className="relative bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-white/80 hover:bg-black/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                  Enable Location for {site.location}?
                </h2>
                <p className="text-gray-500 font-medium">
                  We use your location to calculate accurate delivery fees and show you the best deals nearby.
                </p>
              </div>

              {/* Technical assurance */}
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl justify-center">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Your privacy is our priority
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAllow}
                  className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 group"
                  style={{ background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})` }}
                >
                  <Navigation className="w-5 h-5 group-hover:rotate-12 transition-all" />
                  Allow Location Access
                </button>
                <button
                  onClick={handleDecline}
                  className="w-full py-4 rounded-2xl text-gray-400 font-black text-sm uppercase tracking-widest hover:text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Maybe Later
                </button>
              </div>

              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                You can change this in your browser settings anytime
                <ChevronRight className="w-3 h-3" />
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
