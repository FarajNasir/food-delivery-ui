"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Star, Clock, Truck, Sparkles, Store, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RestaurantItem, FeaturedItem } from "@/types/api.types";

interface RestaurantCardProps {
  restaurant: RestaurantItem | FeaturedItem | any; // Keep any for mock compatibility during transition
  theme: {
    gradientFrom: string;
    primary: string;
    accent: string;
  };
  featured?: boolean;
}

export default function RestaurantCard({
  restaurant,
  theme,
  featured = false,
}: RestaurantCardProps) {
  const router = useRouter();

  // Unified mapping for both API and older Mock data
  const id = "entityId" in restaurant ? restaurant.entityId : restaurant.id;
  const name = restaurant.name;
  const image = "logoUrl" in restaurant ? restaurant.logoUrl : (restaurant as any).image;
  const cuisine = (restaurant as any).cuisine || "";
  const rating = (restaurant as any).rating || null;
  const deliveryTime = (restaurant as any).deliveryTime || null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, transition: { duration: 0.3, ease: "easeOut" } }}
      onClick={() => router.push(`/dashboard/customer/restaurant/${id}`)}
      className={cn(
        "group relative flex flex-col h-full cursor-pointer overflow-hidden rounded-[2rem] border border-border/40 bg-white transition-all duration-500",
        "hover:shadow-elevated hover:border-primary/20 shadow-soft transform-gpu"
      )}
    >
      {/* Visual Depth Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Image Container */}
      <div className={cn(
        "relative w-full overflow-hidden shrink-0 bg-muted/20",
        featured ? "h-56 sm:h-64" : "h-48"
      )}>
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/30">
            <Store className="h-12 w-12" />
          </div>
        )}

        {/* Glass Badge - Top Left */}
        {(featured || (restaurant as any).type === "restaurant") && (
          <div className="absolute left-4 top-4 z-10">
            <div 
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold tracking-tight text-white shadow-lg backdrop-blur-xl"
              style={{ background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.accent}cc)` }}
            >
              <Sparkles className="h-3.5 w-3.5 fill-white/80" />
              <span>HANDPICKED</span>
            </div>
          </div>
        )}

        {/* Glass Rating - Bottom Left */}
        {rating && (
          <div className="absolute bottom-4 left-4 z-10">
            <div className="glass-premium flex items-center gap-1 rounded-full px-3 py-1.5 shadow-xl">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[12px] font-black text-gray-900">{rating}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading text-lg font-black leading-tight text-gray-900 line-clamp-1 group-hover:text-primary transition-colors duration-300">
              {name}
            </h3>
          </div>
          
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
              {cuisine || "Global Dining"}
            </span>
          </div>
        </div>

        {/* Separator / Metrics */}
        <div className="mt-auto flex items-center justify-between pt-5 border-t border-border/40">
          <div className="flex items-center gap-4 text-[12px] font-bold text-muted-foreground">
            {deliveryTime && (
              <div className="flex items-center gap-1.5 group-hover:text-gray-900 transition-colors">
                <Clock className="h-4 w-4 text-primary" />
                <span>{deliveryTime} mins</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 group-hover:text-gray-900 transition-colors">
              <Truck className="h-4 w-4 text-primary" />
              <span>Fast Refill</span>
            </div>
          </div>

          <motion.div
            whileHover={{ x: 4 }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 transition-all duration-300 group-hover:bg-primary group-hover:text-white"
          >
            <ArrowRight className="h-5 w-5" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
