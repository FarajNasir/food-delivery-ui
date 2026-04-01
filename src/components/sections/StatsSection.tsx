"use client";

import { useSite } from "@/context/SiteContext";
import { Store, PackageCheck, Star, Timer } from "lucide-react";

export default function StatsSection() {
  const { site } = useSite();

  const stats = [
    { icon: Store,       value: site.stats.restaurants, label: "Local Restaurants" },
    { icon: PackageCheck,value: site.stats.deliveries,  label: "Happy Orders"      },
    { icon: Star,        value: `${site.stats.rating}★`, label: "Average Rating"  },
    { icon: Timer,       value: `${site.stats.minutes} min`, label: "Avg Delivery Time" },
  ];

  return (
    <section
      className="py-16 theme-transition"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 50%, ${site.theme.gradientTo} 100%)`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="text-center text-white">
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                  </div>
                </div>
                <p className="font-heading font-black text-4xl sm:text-5xl mb-1">{s.value}</p>
                <p className="text-white/70 text-sm">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
