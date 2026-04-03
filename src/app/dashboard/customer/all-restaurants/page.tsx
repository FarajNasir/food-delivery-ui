"use client";

import { useState, useEffect } from "react";
import { useSite } from "@/context/SiteContext";
import { featuredApi, type PublicFeaturedRestaurant } from "@/lib/api";
import { getRestaurants, type Restaurant } from "@/data/restaurants";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";
import { Sparkles, Utensils, Search, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function AllRestaurantsPage() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const allMock = getRestaurants(site.key);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const res = await featuredApi.listRestaurants(site.location);
      if (res.success && res.data) {
        setFeatured(res.data.items);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, [site.location]);

  // Combine and de-duplicate (if a restaurant is featured, don't show it again in "normal" if IDs match)
  // Note: entityId from API vs id from mock might be different, but let's assume if names match or we just show them separately as requested.
  // The user specifically said "first show all featured... then all normal".
  
  const filteredNormal = allMock.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFeatured = featured.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--dash-bg)] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/customer"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900">Explore Restaurants</h1>
              <p className="text-xs text-gray-400 font-medium">Discover the best eats in {site.location}</p>
            </div>
          </div>

          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ "--tw-ring-color": `${site.theme.accent}40` } as any}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Featured Section */}
        {(loading || filteredFeatured.length > 0) && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Handpicked Favourites</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                [1, 2, 3, 4].map(n => <SkeletonCard key={n} />)
              ) : (
                filteredFeatured.map(r => (
                  <RestaurantCard 
                    key={r.id} 
                    restaurant={r} 
                    theme={site.theme} 
                    featured={true}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {/* Normal Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Utensils className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">All Restaurants</h2>
          </div>

          {filteredNormal.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNormal.map(r => (
                <RestaurantCard 
                  key={r.id} 
                  restaurant={r} 
                  theme={site.theme} 
                />
              ))}
            </div>
          ) : !loading && (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
               <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
               <h3 className="text-gray-900 font-bold">No restaurants found</h3>
               <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-48 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 bg-gray-100 rounded-lg" />
        <div className="h-3 w-1/4 bg-gray-50 rounded-lg" />
        <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
           <div className="h-4 w-1/3 bg-gray-50 rounded-lg" />
           <div className="h-8 w-20 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}
