"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Utensils, Search, Filter } from "lucide-react";
import { useSite } from "@/context/SiteContext";
import { useSearchParams } from "next/navigation";
import { dishesApi, type AdminMenuItemResponse } from "@/lib/api";
import DishCard, { SkeletonDishCard } from "@/components/dashboard/customer/DishCard";

interface CategoryDishesProps {
  category: string;
}

export default function CategoryDishes({ category }: CategoryDishesProps) {
  const { site } = useSite();
  const searchParams = useSearchParams();
  const [dishes, setDishes] = useState<AdminMenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const search = searchParams.get("search") || "";

  const { gradientFrom, accent } = site.theme;

  useEffect(() => {
    const fetchDishes = async () => {
      setLoading(true);
      try {
        const res = await dishesApi.list({ 
          location: site.location, 
          category, 
          limit: 100 
        });
        if (res.success && res.data) {
          setDishes(res.data.items);
        }
      } catch (err) {
        console.error("Failed to fetch category dishes:", err);
      }
      setLoading(false);
    };
    fetchDishes();
  }, [site.location, category]);

  const filteredDishes = dishes.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.restaurantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--dash-bg)]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/customer"
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="font-heading font-black text-xl text-gray-900 leading-tight">
                {category}
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {loading ? "Discovering..." : `${dishes.length} matches in ${site.location}`}
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonDishCard key={n} />)}
          </div>
        ) : filteredDishes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredDishes.map(dish => (
              <DishCard key={dish.id} dish={dish} theme={site.theme} />
            ))}
          </div>
        ) : (
          <div className="relative text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            {/* Playful decorative gradient bar at top */}
            <div 
              className="absolute top-0 left-0 w-full h-1.5 opacity-50" 
              style={{ background: `linear-gradient(to right, transparent, ${gradientFrom}, ${accent}, transparent)` }}
            />
            
            <div 
              className="w-24 h-24 rounded-[2rem] rotate-3 flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-gray-50/50"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}15, ${accent}10)` }}
            >
              <Utensils className="w-10 h-10 -rotate-3" style={{ color: accent }} />
            </div>
            
            <h3 className="font-heading font-black text-2xl text-gray-900 tracking-tight">Looks a bit empty here!</h3>
            <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto leading-relaxed">
              {search 
                ? `We couldn't find any ${category.toLowerCase()} items matching "${search}" in ${site.location}.`
                : `We couldn't find any ${category.toLowerCase()} options right now in ${site.location}.`}
            </p>
            
            {search ? (
              <Link 
                href={`/dashboard/customer/category/${category}`}
                className="mt-8 text-sm font-bold transition-all px-8 py-3 rounded-full border border-gray-100 hover:shadow-lg hover:bg-gray-50 active:scale-95 inline-block"
                style={{ color: accent }}
              >
                Clear search
              </Link>
            ) : (
              <div className="mt-10 flex flex-col items-center gap-5">
                 <div className="flex items-center gap-3 w-full max-w-sm mx-auto">
                   <div className="h-px bg-gray-100 flex-1" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Explore Instead</p>
                   <div className="h-px bg-gray-100 flex-1" />
                 </div>
                 <div className="flex flex-wrap justify-center gap-2.5 max-w-md">
                    {['Pizza', 'Burger', 'Sushi', 'Dessert', 'Healthy'].filter(c => c.toLowerCase() !== category.toLowerCase()).slice(0, 4).map(c => (
                      <Link 
                        key={c}
                        href={`/dashboard/customer/category/${c}`}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-md text-gray-700 transition-all duration-300 flex items-center gap-2"
                      >
                        {c}
                      </Link>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
