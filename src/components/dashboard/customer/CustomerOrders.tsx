"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, RotateCcw, Package, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { useOrderStore } from "@/store/useOrderStore";
import { useCartStore } from "@/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";

/**
 * CustomerOrders.tsx - Premium order history and real-time tracking dashboard.
 * Refactored to use Zustand stores and layered architecture for high performance.
 */

const statusMeta: Record<string, { color: string; bg: string; icon: any }> = {
  DELIVERED: { color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  CANCELLED: { color: "#ef4444", bg: "#fef2f2", icon: XCircle },
  PENDING:   { color: "#F97316", bg: "#fff3e8", icon: Clock },
  CONFIRMED: { color: "#2563eb", bg: "#eff6ff", icon: Package },
  PROCESSING: { color: "#8b5cf6", bg: "#f5f3ff", icon: RotateCcw },
};

const TABS = ["All", "Active", "Delivered", "Cancelled"] as const;
type Tab = typeof TABS[number];

export default function CustomerOrders() {
  const { site } = useConfigStore();
  const { orders, isLoading, refreshOrders, subscribeToUpdates } = useOrderStore();
  const { addItem } = useCartStore();
  
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    refreshOrders();
    const unsubscribe = subscribeToUpdates();
    return () => unsubscribe();
  }, [refreshOrders, subscribeToUpdates]);

  const filtered = orders.filter((o) => {
    const status = o.status.toUpperCase();
    const isActive = ["PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY"].includes(status);
    
    const matchTab = 
      tab === "All" || 
      (tab === "Active" && isActive) || 
      (tab === "Delivered" && status === "DELIVERED") ||
      (tab === "Cancelled" && status === "CANCELLED");

    const matchSearch =
      !search ||
      o.restaurant?.name.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some(i => i.menuItem.name.toLowerCase().includes(search.toLowerCase()));
      
    return matchTab && matchSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8 pb-20">
      
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {orders.length} orders tracking in record
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by restaurant or item…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/50 border border-border/40 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/40 focus:bg-white transition-all shadow-inset"
            />
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex p-1 bg-muted/40 rounded-[1.5rem] border border-border/40 w-fit backdrop-blur-sm">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-6 py-2 rounded-[1.2rem] text-sm font-black transition-all duration-300",
              tab === t 
                ? "bg-white text-gray-900 shadow-elevated" 
                : "text-muted-foreground hover:text-gray-900"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Orders Grid/List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid gap-4"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[2rem] border border-border/40" />
            ))}
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-[3rem] p-16 flex flex-col items-center gap-6 text-center bg-white/40 glass-premium border border-dashed border-border"
          >
            <div className="w-20 h-20 rounded-[2rem] bg-muted/20 flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">No Orders Found</h3>
              <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                We couldn't find any orders matching your selection. Time to discover a new favorite?
              </p>
            </div>
            <button 
              onClick={() => { setTab("All"); setSearch(""); }}
              className="mt-4 px-8 py-3 bg-white border border-border/40 rounded-full text-xs font-black uppercase tracking-widest text-primary hover:shadow-elevated transition-all active:scale-95"
            >
              Clear All Filters
            </button>
          </motion.div>
        ) : (
          <motion.div 
            layout
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid gap-6"
          >
            {filtered.map((order) => {
              const status = order.status.toUpperCase();
              const meta = statusMeta[status] || statusMeta.DELIVERED;
              const StatusIcon = meta.icon;

              return (
                <motion.div
                  key={order.id}
                  layout
                  whileHover={{ scale: 1.01 }}
                  className="group rounded-[2.5rem] bg-white p-6 transition-all duration-300 hover:shadow-elevated border border-border/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Brand / Emoji Placeholder */}
                    <div className="w-20 h-20 rounded-[1.8rem] bg-dash-bg flex items-center justify-center text-3xl shadow-inset group-hover:rotate-3 transition-transform duration-500">
                      {order.restaurant?.name.charAt(0) || "🥣"}
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div>
                          <h3 className="font-heading text-xl font-black text-gray-900 group-hover:text-primary transition-colors">
                            {order.restaurant?.name}
                          </h3>
                          <p className="text-sm font-bold text-muted-foreground/60 mt-0.5 truncate">
                            {order.items?.map(i => `${i.quantity}x ${i.menuItem.name}`).join(" · ") || "Order Refreshing..."}
                          </p>
                        </div>
                        <div className="flex md:flex-col items-center md:items-end justify-between md:justify-start gap-2">
                          <span className="text-lg font-black text-gray-900 tracking-tight">
                            £{parseFloat(order.totalAmount).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                             Ref: {order.id.slice(-6)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all",
                            status === "DELIVERED" ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary"
                          )} style={{ color: meta.color, background: meta.bg }}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{order.status}</span>
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground/60 uppercase">
                            {format(new Date(order.createdAt), "MMM d, HH:mm")}
                          </span>
                        </div>

                        {status === "DELIVERED" && (
                          <button
                            onClick={() => {
                              order.items?.forEach(i => {
                                // Re-add items logic
                                toast.promise(addItem({
                                  menuItemId: i.menuItem.id as any,
                                  name: i.menuItem.name,
                                  price: parseFloat(i.price),
                                  imageUrl: i.menuItem.imageUrl || "",
                                  restaurantId: order.restaurantId,
                                  restaurantName: order.restaurant?.name || ""
                                }), {
                                  loading: "Adding to cart...",
                                  success: "Items added to cart",
                                  error: "Failed to reorder"
                                });
                              });
                            }}
                            className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary transition-colors shadow-soft"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reorder</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
