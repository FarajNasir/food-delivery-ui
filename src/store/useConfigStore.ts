import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SITES, type SiteConfig, DEFAULT_SITE, type SiteKey } from "@/config/sites";

/**
 * useConfigStore.ts - Manages site-wide configuration, themes, and location-based state.
 */

interface ConfigState {
  site: SiteConfig;
  isLoading: boolean;
  userCoords: { lat: number; lng: number } | null;
  locationDismissed: boolean;
  setSite: (siteKey: SiteKey) => void;
  updateLocation: (location: string) => void;
  setUserCoords: (coords: { lat: number; lng: number } | null) => void;
  setLocationDismissed: (dismissed: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      site: SITES[DEFAULT_SITE],
      isLoading: false,
      userCoords: null,
      locationDismissed: false,
      
      setSite: (siteKey: SiteKey) => {
        const newSite = SITES[siteKey];
        if (newSite) {
          set({ site: newSite });
        }
      },
      
      updateLocation: (location: string) => {
        set((state: ConfigState) => ({
          site: { ...state.site, location }
        }));
      },

      setUserCoords: (userCoords) => set({ userCoords }),
      setLocationDismissed: (locationDismissed) => set({ locationDismissed }),
    }),
    {
      name: "site-config",
      partialize: (state) => ({
        site: state.site,
        userCoords: state.userCoords,
        // locationDismissed is intentionally NOT persisted — re-ask each session
      }),
    }
  )
);
