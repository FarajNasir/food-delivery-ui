import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SITES, type SiteConfig, DEFAULT_SITE, type SiteKey } from "@/config/sites";

/**
 * useConfigStore.ts - Manages site-wide configuration, themes, and location-based state.
 */

interface ConfigState {
  site: SiteConfig;
  isLoading: boolean;
  setSite: (siteKey: SiteKey) => void;
  updateLocation: (location: string) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      site: SITES[DEFAULT_SITE],
      isLoading: false,
      
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
    }),
    {
      name: "site-config",
      partialize: (state) => ({ site: state.site }),
    }
  )
);
