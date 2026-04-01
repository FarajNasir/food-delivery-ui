"use client";

import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { ALL_SITES, SiteKey } from "@/config/sites";
import { MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthCard({ children, title, subtitle }: AuthCardProps) {
  const { site, setSite } = useSite();
  const [locationOpen, setLocationOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col theme-transition"
      style={{
        background: `linear-gradient(135deg, ${site.theme.gradientFrom} 0%, ${site.theme.gradientVia} 55%, ${site.theme.gradientTo} 100%)`,
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 pt-5">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-heading font-black text-sm shadow"
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "2px solid rgba(255,255,255,0.4)",
            }}
          >
            {site.name.charAt(0)}
          </div>
          <span className="font-heading font-bold text-white text-lg hidden sm:inline">
            {site.name}
          </span>
        </Link>

        {/* Location switcher */}
        <div className="relative">
          <button
            onClick={() => setLocationOpen(!locationOpen)}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors border border-white/20"
          >
            <MapPin className="w-3.5 h-3.5" />
            {site.location}
            <ChevronDown className={`w-3 h-3 transition-transform ${locationOpen ? "rotate-180" : ""}`} />
          </button>

          {locationOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-100">
              <div className="p-2">
                <p className="text-[10px] font-bold text-gray-400 px-3 py-1.5 uppercase tracking-widest">
                  Switch location
                </p>
                {ALL_SITES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSite(s.key as SiteKey);
                      setLocationOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      s.key === site.key ? "text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={
                      s.key === site.key
                        ? { background: `linear-gradient(135deg, ${s.theme.gradientFrom}, ${s.theme.gradientTo})` }
                        : {}
                    }
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Heading above card */}
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white mb-2">
              {title}
            </h1>
            <p className="text-white/75 text-sm sm:text-base">{subtitle}</p>
          </div>

          {/* White card */}
          <div className="bg-white rounded-3xl shadow-2xl px-6 sm:px-8 py-8">
            {children}
          </div>

          {/* Back to home */}
          <p className="text-center text-white/60 text-sm mt-6">
            <Link href="/" className="hover:text-white transition-colors underline underline-offset-2">
              ← Back to {site.name}
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative blobs */}
      <div
        className="fixed top-[-15%] right-[-15%] w-[450px] h-[450px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientTo }}
      />
      <div
        className="fixed bottom-[-15%] left-[-15%] w-[380px] h-[380px] rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: site.theme.gradientFrom }}
      />
    </div>
  );
}
