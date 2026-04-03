"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Clock, Truck, Sparkles, Store } from "lucide-react";
import type { Restaurant } from "@/data/restaurants";
import type { PublicFeaturedRestaurant } from "@/lib/api";

interface RestaurantCardProps {
  restaurant: Restaurant | PublicFeaturedRestaurant;
  theme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
  };
  featured?: boolean;
  priority?: boolean;
}

export default function RestaurantCard({
  restaurant,
  theme,
  featured = false,
  priority = false,
}: RestaurantCardProps) {
  const router = useRouter();

  // Handle both mock and API types
  const id = "entityId" in restaurant ? restaurant.entityId : restaurant.id;
  const name = restaurant.name;
  const image = "logoUrl" in restaurant ? restaurant.logoUrl : restaurant.image;
  const location = "location" in restaurant ? restaurant.location : "";
  
  // Mock-only fields (or future DB fields)
  const cuisine = "cuisine" in restaurant ? restaurant.cuisine : "";
  const description = "description" in restaurant ? restaurant.description : "";
  const rating = "rating" in restaurant ? restaurant.rating : null;
  const reviews = "reviews" in restaurant ? restaurant.reviews : null;
  const deliveryTime = "deliveryTime" in restaurant ? restaurant.deliveryTime : null;
  const deliveryFee = "deliveryFee" in restaurant ? restaurant.deliveryFee : null;
  const promo = "promo" in restaurant ? restaurant.promo : null;

  return (
    <div
      onClick={() => router.push(`/dashboard/customer/restaurant/${id}`)}
      className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer h-full flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Store className="w-12 h-12 text-gray-200" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {(featured || ("type" in restaurant && restaurant.type === "restaurant")) && (
          <div
            className="absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-bold text-white px-2.5 py-1 rounded-full shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            <Sparkles className="w-3 h-3" />
            Featured
          </div>
        )}

        {promo && (
          <div className="absolute top-3 right-3 text-[11px] font-bold bg-white text-gray-800 px-2.5 py-1 rounded-full shadow-sm">
            {promo}
          </div>
        )}

        {rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-[11px] font-bold">{rating}</span>
            {reviews !== null && <span className="text-white/60 text-[10px]">({reviews})</span>}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-2">
          <h3 className="font-heading font-bold text-gray-900 mb-0.5 line-clamp-1">{name}</h3>
          {cuisine && (
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: theme.accent }}>
              {cuisine}
            </p>
          )}
          {location && !cuisine && (
             <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-gray-400">
               {location}
             </p>
          )}
          {description && <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{description}</p>}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
            {deliveryTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {deliveryTime}
              </span>
            )}
            {deliveryFee && (
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                {deliveryFee}
              </span>
            )}
            {!deliveryTime && !deliveryFee && (
               <span className="text-gray-300 italic flex items-center gap-1">
                 <Store className="w-3 h-3" />
                 View Store
               </span>
            )}
          </div>
          <div
            className="text-white text-[11px] font-black px-3 py-1.5 rounded-full transition-all group-hover:scale-105 shadow-sm uppercase tracking-tight"
            style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent})` }}
          >
            Explore
          </div>
        </div>
      </div>
    </div>
  );
}
