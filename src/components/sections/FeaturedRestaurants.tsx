"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSite } from "@/context/SiteContext";
import { Star, Clock, Truck, Sparkles, ChevronRight, X, Utensils, Store } from "lucide-react";
import { featuredApi, type PublicFeaturedRestaurant, type PublicFeaturedDish } from "@/lib/api";

interface SiteTheme {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  primary: string;
  accent: string;
  badge: string;
}

export default function FeaturedRestaurants() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<PublicFeaturedRestaurant | null>(null);

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

  if (!loading && featured.length === 0) return null;

  return (
    <section key={site.key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-lg flex items-center gap-2" style={{ color: "var(--dash-text-primary)" }}>
          <Sparkles className="w-5 h-5" style={{ color: site.theme.accent }} />
          Handpicked Favourites in {site.location}
        </h2>
        <a
          href="#all-restaurants"
          className="text-sm font-semibold flex items-center gap-1.5 transition-all hover:gap-2.5"
          style={{ color: site.theme.accent }}
        >
          See all <ChevronRight className="w-4 h-4" />
        </a>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((n) => <SkeletonCard key={n} />)
        ) : (
          featured.map((restaurant, i) => (
            <FeaturedCard
              key={restaurant.id}
              restaurant={restaurant}
              siteTheme={site.theme}
              priority={i < 2}
              onClick={() => setSelectedRestaurant(restaurant)}
            />
          ))
        )}
      </div>

      {/* Featured Dishes Modal (Themed) */}
      {selectedRestaurant && (
        <FeaturedDishesModal 
          restaurant={selectedRestaurant} 
          location={site.location}
          siteTheme={site.theme}
          onClose={() => setSelectedRestaurant(null)} 
        />
      )}
    </section>
  );
}

function FeaturedCard({
  restaurant,
  siteTheme,
  priority,
  onClick
}: {
  restaurant: PublicFeaturedRestaurant;
  siteTheme: SiteTheme;
  priority?: boolean;
  onClick: () => void;
}) {
  const router = useRouter();

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {restaurant.logoUrl ? (
          <Image
            src={restaurant.logoUrl}
            alt={restaurant.name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
             <Store className="w-12 h-12 text-gray-200" />
          </div>
        )}
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Featured badge (Synced with site theme) */}
        <div
          className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-white px-3 py-1 rounded-full shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
          }}
        >
          <Sparkles className="w-3 h-3" />
          Featured
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          <span className="text-white text-[11px] font-bold">4.9</span>
          <span className="text-white/70 text-[10px]">(Featured)</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-heading font-bold text-gray-900 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
          {restaurant.name}
        </h3>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: siteTheme.accent }}>
          {restaurant.location}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
           <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
             <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 25-30m</span>
             <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> £1.50</span>
           </div>
           <button
            className="text-white text-xs font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            Explore Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-52 bg-gray-100" />
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

function FeaturedDishesModal({ restaurant, location, siteTheme, onClose }: { 
  restaurant: PublicFeaturedRestaurant; 
  location: string;
  siteTheme: SiteTheme;
  onClose: () => void; 
}) {
  const [dishes, setDishes] = useState<PublicFeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      const res = await featuredApi.listDishes(location, restaurant.entityId);
      if (res.success && res.data) {
        setDishes(res.data.items);
      }
      setLoading(false);
    };
    fetchDishes();
  }, [restaurant.entityId, location]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-gray-100 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Restaurant Info */}
        <div 
          className="w-full md:w-1/3 p-8 flex flex-col items-center text-center justify-center border-b md:border-b-0 md:border-r border-gray-100"
          style={{ background: `${siteTheme.gradientFrom}05` }}
        >
           <div className="w-24 h-24 rounded-3xl bg-white relative overflow-hidden mb-4 shadow-lg border border-gray-50">
             {restaurant.logoUrl ? (
                <Image src={restaurant.logoUrl} alt={restaurant.name} fill className="object-cover" />
             ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-gray-100">{restaurant.name[0]}</div>
             )}
           </div>
           <h2 className="text-xl font-black text-gray-900 mb-2">{restaurant.name}</h2>
           <div className="h-1 w-12 rounded-full mb-4" style={{ background: siteTheme.accent }} />
           <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Featured Dishes</p>
        </div>

        {/* Right Side: Dishes Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
           <button 
             onClick={onClose} 
             className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
           >
             <X className="w-5 h-5 text-gray-400" />
           </button>

           {loading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {[1, 2, 4].map(n => <div key={n} className="h-28 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
             </div>
           ) : dishes.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
                <Utensils className="w-12 h-12 text-gray-400" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Featured Dishes</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {dishes.map(dish => (
                 <div key={dish.id} className="group flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm bg-gray-50 flex items-center justify-center">
                      {dish.imageUrl ? (
                        <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <Utensils className="w-8 h-8 text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                       <div>
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{dish.category}</span>
                         <h4 className="text-xs font-black text-gray-900 mb-1 truncate">{dish.name}</h4>
                       </div>
                       <div className="flex items-center justify-between">
                          <span className="text-sm font-black" style={{ color: siteTheme.accent }}>£{dish.price.toFixed(2)}</span>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: siteTheme.accent }}>
                             <Plus className="w-3.5 h-3.5" />
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  );
}
