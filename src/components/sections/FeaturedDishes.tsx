"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { Sparkles, ChevronRight, ChevronLeft } from "lucide-react";
import { featuredApi, type PublicFeaturedDish } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

export default function FeaturedDishes() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<PublicFeaturedDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const res = await featuredApi.listDishes(site.location);
      if (res.success && res.data) {
        setFeatured(res.data.items);
      }
      setLoading(false);
    };
    fetchFeatured();
  }, [site.location]);

  const getVisibleItems = () => {
    if (typeof window === "undefined") return 1;
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  // Sync scroll position when currentIndex changes programmatically
  useEffect(() => {
    if (!scrollContainerRef.current || isScrollingRef.current) return;
    
    const container = scrollContainerRef.current;
    if (container.children.length === 0) return;

    const firstChild = container.children[0] as HTMLElement;
    const gap = parseInt(window.getComputedStyle(container).columnGap) || 0;
    const scrollStep = firstChild.offsetWidth + gap;

    isScrollingRef.current = true;
    container.scrollTo({
      left: currentIndex * scrollStep,
      behavior: "smooth",
    });

    const timer = setTimeout(() => {
      isScrollingRef.current = false;
    }, 500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleScroll = () => {
    if (!scrollContainerRef.current || isScrollingRef.current) return;
    
    const container = scrollContainerRef.current;
    if (container.children.length === 0) return;

    const firstChild = container.children[0] as HTMLElement;
    const gap = parseInt(window.getComputedStyle(container).columnGap) || 0;
    const scrollStep = firstChild.offsetWidth + gap;
    
    const newIndex = Math.round(container.scrollLeft / scrollStep);
    const maxIndex = Math.max(0, featured.length - getVisibleItems());
    const clampedIndex = Math.min(newIndex, maxIndex);
    
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  };

  // Navigate forward/backward
  const prev = () => {
    if (isScrollingRef.current) return;
    setCurrentIndex((p) => Math.max(0, p - 1));
  };
  
  const next = () => {
    if (isScrollingRef.current) return;
    const maxIndex = Math.max(0, featured.length - getVisibleItems());
    setCurrentIndex((p) => Math.min(maxIndex, p + 1));
  };

  if (!loading && featured.length === 0) return null;

  return (
    <section key={site.key} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="font-heading font-black text-lg sm:text-xl flex items-center gap-2 text-gray-900 leading-tight">
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="truncate">Spotlight Dishes in {site.location}</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium mt-1 ml-7">Our chef's top recommendations for you</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/customer/all-dishes"
            className="hidden sm:flex items-center gap-1.5 text-sm font-bold transition-all px-4 py-2 rounded-full bg-white shadow-sm border border-gray-100 hover:shadow-md whitespace-nowrap"
            style={{ color: site.theme.accent }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1"
          style={{ scrollSnapType: "x mandatory", scrollbarWidth: "none" }}
        >
          {loading ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="min-w-[85vw] sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] shrink-0" style={{ scrollSnapAlign: "start" }}>
                <SkeletonDishCard />
              </div>
            ))
          ) : (
            featured.map((dish, i) => (
              <div
                key={dish.id}
                className="min-w-[85vw] sm:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <DishCard
                  dish={dish}
                  theme={site.theme}
                  priority={i < 2}
                  featured={true}
                />
              </div>
            ))
          )}
        </div>

        {/* Overlay Navigation Arrows */}
        {!loading && featured.length > 1 && (
          <>
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50`}
              style={{ color: site.theme.accent }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              disabled={currentIndex >= Math.max(0, featured.length - getVisibleItems())}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50`}
              style={{ color: site.theme.accent }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Mobile See All link */}
      <div className="sm:hidden flex justify-center mt-5">
        <Link
          href="/dashboard/customer/all-dishes"
          className="flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-full bg-white shadow-sm border border-gray-100"
          style={{ color: site.theme.accent }}
        >
          See all dishes <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
