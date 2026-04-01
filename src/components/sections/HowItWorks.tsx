"use client";

import { useSite } from "@/context/SiteContext";
import { MapPin, UtensilsCrossed, CreditCard, Bike } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    icon: MapPin,
    title: "Choose Your Location",
    desc: "Select from Kilkeel, Newcastle or Downpatrick and browse restaurants near you.",
  },
  {
    icon: UtensilsCrossed,
    title: "Pick Your Favourites",
    desc: "Browse menus, explore cuisines, and add delicious items to your cart.",
  },
  {
    icon: CreditCard,
    title: "Pay Securely",
    desc: "Checkout easily with card, Apple Pay, or Google Pay — all fully encrypted.",
  },
  {
    icon: Bike,
    title: "Fast Delivery",
    desc: "Your food is picked up and delivered hot to your door in as little as 25 minutes.",
  },
];

export default function HowItWorks() {
  const { site } = useSite();

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full text-white mb-4"
            style={{
              background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
            }}
          >
            Simple &amp; Fast
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl font-black text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Getting great food delivered has never been easier. Four simple steps to your next meal.
          </p>
        </div>

        {/* Steps grid — no connecting line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="flex flex-col items-center text-center group"
              >
                {/* Icon circle */}
                <div className="relative mb-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${site.theme.gradientFrom}18, ${site.theme.gradientTo}28)`,
                      border: `2px solid ${site.theme.accent}30`,
                    }}
                  >
                    <Icon
                      className="w-8 h-8"
                      style={{ color: site.theme.gradientFrom }}
                      strokeWidth={1.75}
                    />
                  </div>

                  {/* Step badge */}
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shadow"
                    style={{
                      background: `linear-gradient(135deg, ${site.theme.gradientFrom}, ${site.theme.accent})`,
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-gray-900 text-lg mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[220px]">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
