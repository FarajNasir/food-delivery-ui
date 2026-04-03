"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSite } from "@/context/SiteContext";
import { ArrowRight, Utensils, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { dishesApi, featuredApi } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

export default function DishesGrid() {
  const { site } = useSite();
  const [featured, setFeatured] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      try {
        const [fRes, pRes] = await Promise.all([
          featuredApi.listDishes(site.location),
          dishesApi.list({ location: site.location, limit: 12 })
        ]);

        if (fRes.success && fRes.data) setFeatured(fRes.data.items);
        
        if (pRes.success && pRes.data) {
          const fIds = new Set(fRes.data?.items.map((i: any) => i.entityId || i.id) || []);
          setPopular(pRes.data.items.filter((i: any) => !fIds.has(i.id)));
        }
      } catch (err) {
        console.error("Dishes fetch error:", err);
      }
      setLoading(false);
    };
    fetchDishes();
  }, [site.location]);

  const getVisibleItems = () => {
     if (typeof window === "undefined") return 1;
     if (window.innerWidth >= 1024) return 3;
     if (window.innerWidth >= 640) return 2;
     return 1;
  };

  // Sync scroll position for manual carousel
  useEffect(() => {
    if (!scrollRef.current || isScrollingRef.current) return;
    
    const container = scrollRef.current;
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
    if (!scrollRef.current || isScrollingRef.current) return;
    
    const container = scrollRef.current;
    if (container.children.length === 0) return;

    const firstChild = container.children[0] as HTMLElement;
    const gap = parseInt(window.getComputedStyle(container).columnGap) || 0;
    const scrollStep = firstChild.offsetWidth + gap;
    
    const newIndex = Math.round(container.scrollLeft / scrollStep);
    const maxIndex = Math.max(0, (featured.length + 1) - getVisibleItems());
    const clampedIndex = Math.min(newIndex, maxIndex);
    
    if (clampedIndex !== currentIndex) {
      setCurrentIndex(clampedIndex);
    }
  };

  const prev = () => {
    if (isScrollingRef.current) return;
    setCurrentIndex((p) => Math.max(0, p - 1));
  };
  
  const next = () => {
    if (isScrollingRef.current) return;
    const maxIndex = Math.max(0, (featured.length + 1) - getVisibleItems());
    setCurrentIndex((p) => Math.min(maxIndex, p + 1));
  };

  if (!loading && featured.length === 0 && popular.length === 0) return null;

  const { gradientFrom, accent } = site.theme;

  return (
    <div className="space-y-12 sm:space-y-16 pb-8">
      {/* ── Featured Row (Carousel) ── */}
      {featured.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-heading font-black text-lg sm:text-xl flex items-center gap-2 text-gray-900 leading-tight">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                <span className="truncate">Spotlight Dishes in {site.location}</span>
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-1 ml-7">Handpicked favorites for a premium experience</p>
            </div>
          </div>

          <div className="relative group">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {loading ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0" style={{ scrollSnapAlign: "start" }}>
                    <SkeletonDishCard />
                  </div>
                ))
              ) : (
                <>
                  {featured.map((dish, i) => (
                    <div 
                      key={dish.entityId || dish.id}
                      className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0"
                      style={{ scrollSnapAlign: "start" }}
                    >
                      <DishCard 
                        dish={dish} 
                        theme={site.theme} 
                        featured 
                        priority={i < 3} 
                      />
                    </div>
                  ))}

                  {/* See All Bridge Card */}
                  <div 
                    className="min-w-[85vw] sm:min-w-[calc(50%-10px)] lg:min-w-[calc(33.333%-14px)] shrink-0"
                    style={{ scrollSnapAlign: "start" }}
                  >
                    <Link 
                      href="/dashboard/customer/all-dishes"
                      className="group/bridge flex flex-col items-center justify-center h-full min-h-[280px] sm:min-h-[320px] rounded-[2.5rem] border-2 border-dashed border-gray-200 hover:border-amber-300 bg-white hover:bg-amber-50/30 transition-all duration-300 p-8 text-center gap-4"
                    >
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover/bridge:scale-110 group-hover/bridge:rotate-6 transition-transform duration-300"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                      >
                        <ArrowRight className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-heading font-black text-lg text-gray-900">Explore All</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed mt-1">
                          See our full collection<br />in {site.location}
                        </p>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Overlay Navigation Arrows */}
            {!loading && featured.length > 0 && (
              <>
                <button
                  onClick={prev}
                  disabled={currentIndex === 0}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50`}
                  style={{ color: accent }}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={next}
                  disabled={currentIndex >= Math.max(0, (featured.length + 1) - getVisibleItems())}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center transition-all z-20 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none hover:bg-gray-50`}
                  style={{ color: accent }}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* ── Popular Grid ── */}
      {popular.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading font-black text-lg sm:text-xl text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500 shrink-0" />
                Popular in {site.location}
              </h2>
            </div>
            <Link
              href="/dashboard/customer/all-dishes"
              className="hidden sm:flex text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-full border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all items-center gap-2 group shrink-0"
              style={{ color: accent }}
            >
              See all dishes
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {loading ? (
              [1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => <SkeletonDishCard key={i} />)
            ) : (
              popular.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  theme={site.theme}
                  priority={false}
                />
              ))
            )}
          </div>
          
          {/* Mobile See All link */}
          <div className="sm:hidden flex justify-center mt-6">
            <Link
              href="/dashboard/customer/all-dishes"
              className="flex items-center gap-1.5 text-sm font-bold px-6 py-3 rounded-full bg-white shadow-sm border border-gray-100"
              style={{ color: accent }}
            >
              See all popular dishes <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
