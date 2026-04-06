import { useState, useEffect, useCallback, useMemo } from "react";
import { useConfigStore } from "@/store/useConfigStore";
import { customerService } from "@/services/customer.service";
import type { RestaurantItem, FeaturedItem } from "@/types/api.types";
import { getRestaurants, type Restaurant } from "@/data/restaurants";

/**
 * useRestaurants.ts - Unified hook for fetching and managing restaurant data.
 * Leverages the service layer and site config for robust performance.
 */

export function useRestaurants(searchQuery: string = "") {
  const { site } = useConfigStore();
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized local restaurants (mock data for now, or unified DB later)
  const localRestaurants = useMemo(() => getRestaurants(site.key), [site.key]);

  const fetchFeatured = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await customerService.getFeatured({ 
        location: site.location, 
        type: "restaurant" 
      });
      if (res.success && res.data) {
        setFeatured(res.data.items);
      } else {
        setError(res.error || "Failed to load featured restaurants");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [site.location]);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  // Filtering Logic
  const filteredFeatured = useMemo(() => {
    if (!searchQuery) return featured;
    return featured.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [featured, searchQuery]);

  const filteredNormal = useMemo(() => {
    if (!searchQuery) return localRestaurants;
    const query = searchQuery.toLowerCase();
    return localRestaurants.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.cuisine.toLowerCase().includes(query)
    );
  }, [localRestaurants, searchQuery]);

  return {
    featured: filteredFeatured,
    normal: filteredNormal,
    isLoading,
    error,
    refresh: fetchFeatured
  };
}
