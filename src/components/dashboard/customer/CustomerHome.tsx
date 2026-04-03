"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Flame,
  Pizza, Beef, Fish, Salad, Drumstick, Cookie, Soup, ArrowRight,
} from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { getRestaurants } from "@/data/restaurants";
import type { SessionUser } from "@/lib/auth";
import FeaturedRestaurants from "@/components/sections/FeaturedRestaurants";
import RestaurantCard from "@/components/dashboard/customer/RestaurantCard";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const CATEGORIES = [
  { label: "Pizza", icon: Pizza },
  { label: "Burgers", icon: Beef },
  { label: "Sushi", icon: Fish },
  { label: "Healthy", icon: Salad },
  { label: "Chicken", icon: Drumstick },
  { label: "Desserts", icon: Cookie },
  { label: "Asian", icon: Soup },
  { label: "Hot", icon: Flame },
];

export default function CustomerHome({ user }: { user: SessionUser }) {
  const { site } = useSite();
  const router = useRouter();

  const all = getRestaurants(site.key);

  const { gradientFrom, gradientVia, gradientTo, accent } = site.theme;

  return (
    <div>
      {/* ── Hero ── */}
      <section
        className="relative py-10 sm:py-14 px-4 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientVia} 55%, ${gradientTo} 100%)`,
        }}
      >
        {/* blobs */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: gradientTo }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: gradientFrom }}
        />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <p className="text-white/70 text-sm font-medium mb-1">{greeting()}, {user.name.split(" ")[0]} 👋</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-white mb-6 leading-tight">
            What are you craving<br className="hidden sm:block" /> in {site.location} today?
          </h1>

          {/* Search CTA — navigates to dedicated search page */}
          <Link
            href="/dashboard/customer/search"
            className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl px-4 py-3.5 max-w-xl mx-auto hover:shadow-3xl transition-shadow"
          >
            <Search className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="flex-1 text-sm text-gray-400">Search restaurants or dishes…</span>
            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" className="w-full">
            <path
              d="M0 48L60 41.3C120 35 240 21 360 16C480 11 600 16 720 21.3C840 27 960 27 1080 21.3C1200 16 1320 11 1380 8L1440 5V48H0Z"
              fill="var(--dash-bg)"
            />
          </svg>
        </div>
      </section>

      {/* Live Featured Section (Auto-scrolling Carousel) */}
      <FeaturedRestaurants />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Category chips ── */}
        <section>
          <h2 className="font-heading font-black text-xl mb-6 flex items-center gap-2 text-gray-900">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
            What are you in the mood for?
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {CATEGORIES.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => { }}
                className="group flex flex-col items-center gap-2 p-3 sm:p-4 bg-white rounded-3xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 border border-gray-100"
              >
                <span
                  className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                  style={{ background: `${gradientFrom}15` }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: gradientFrom }} strokeWidth={1.75} />
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 text-center leading-tight">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── All restaurants ── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-black text-xl text-gray-900">
              All Restaurants in {site.location}
            </h2>
            <Link 
              href="/dashboard/customer/all-restaurants"
              className="text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: accent }}
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {all.slice(0, 6).map((r, i) => (
              <RestaurantCard key={r.id} restaurant={r} theme={site.theme} priority={i < 3} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
