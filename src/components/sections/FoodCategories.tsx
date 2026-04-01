"use client";

import Image from "next/image";
import { useSite } from "@/context/SiteContext";
import {
  Pizza,
  Beef,
  Soup,
  Flame,
  Fish,
  Salad,
  Drumstick,
  Cookie,
  Star,
  Clock,
  Truck,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Category {
  icon: LucideIcon;
  name: string;
  count: number;
}

const categories: Category[] = [
  { icon: Pizza,    name: "Pizza",    count: 12 },
  { icon: Beef,     name: "Burgers",  count: 18 },
  { icon: Soup,     name: "Asian",    count: 9  },
  { icon: Flame,    name: "Mexican",  count: 7  },
  { icon: Fish,     name: "Sushi",    count: 5  },
  { icon: Salad,    name: "Healthy",  count: 14 },
  { icon: Drumstick,name: "Chicken",  count: 11 },
  { icon: Cookie,   name: "Desserts", count: 8  },
];

interface MockRestaurant {
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: string;
  promo?: string;
  image: string;
}

// Unsplash images — free to use (no attribution required for display)
const MOCK_RESTAURANTS: MockRestaurant[] = [
  {
    name: "The Pizza Palace",
    cuisine: "Pizza · Italian",
    rating: 4.8,
    deliveryTime: "20-30 min",
    deliveryFee: "Free delivery",
    promo: "20% OFF",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80",
  },
  {
    name: "Burger Barn",
    cuisine: "Burgers · American",
    rating: 4.6,
    deliveryTime: "15-25 min",
    deliveryFee: "£1.99 delivery",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
  },
  {
    name: "Dragon Noodles",
    cuisine: "Asian · Chinese",
    rating: 4.7,
    deliveryTime: "25-35 min",
    deliveryFee: "Free delivery",
    promo: "New",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80",
  },
  {
    name: "Taco Fiesta",
    cuisine: "Mexican · Tex-Mex",
    rating: 4.5,
    deliveryTime: "20-30 min",
    deliveryFee: "£0.99 delivery",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&q=80",
  },
  {
    name: "Sushi Zen",
    cuisine: "Sushi · Japanese",
    rating: 4.9,
    deliveryTime: "30-40 min",
    deliveryFee: "Free delivery",
    promo: "Popular",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80",
  },
  {
    name: "Green Garden",
    cuisine: "Salads · Healthy",
    rating: 4.6,
    deliveryTime: "15-20 min",
    deliveryFee: "Free delivery",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  },
];

export default function FoodCategories() {
  const { site } = useSite();

  return (
    <section id="restaurants" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-3"
              style={{
                background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
              }}
            >
              Browse {site.location}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900">
              What Are You Craving?
            </h2>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: site.theme.primary }}
          >
            View all <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Category chips */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-14">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <button
                key={i}
                className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-1 border border-gray-100"
              >
                <span
                  className="w-12 h-12 flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${site.theme.gradientFrom}15, ${site.theme.gradientTo}25)`,
                  }}
                >
                  <Icon
                    className="w-6 h-6"
                    style={{ color: site.theme.gradientFrom }}
                    strokeWidth={1.75}
                  />
                </span>
                <span className="text-xs font-semibold text-gray-700 leading-tight text-center">
                  {c.name}
                </span>
                <span className="text-[10px] text-gray-400">{c.count}</span>
              </button>
            );
          })}
        </div>

        {/* Restaurant cards */}
        <h3 className="font-heading text-2xl font-bold text-gray-900 mb-6">
          Top Restaurants in {site.location}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_RESTAURANTS.map((r, i) => (
            <RestaurantCard key={i} restaurant={r} siteTheme={site.theme} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RestaurantCard({
  restaurant,
  siteTheme,
}: {
  restaurant: MockRestaurant;
  siteTheme: {
    gradientFrom: string;
    gradientVia: string;
    gradientTo: string;
    primary: string;
    accent: string;
  };
}) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 cursor-pointer">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {restaurant.promo && (
          <span
            className="absolute top-3 left-3 text-xs font-bold text-white px-2.5 py-1 rounded-full shadow"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            {restaurant.promo}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-heading font-bold text-gray-900">{restaurant.name}</h4>
          <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full shrink-0">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {restaurant.rating}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">{restaurant.cuisine}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {restaurant.deliveryTime}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              {restaurant.deliveryFee}
            </span>
          </div>
          <button
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${siteTheme.gradientFrom}, ${siteTheme.accent})`,
            }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}
