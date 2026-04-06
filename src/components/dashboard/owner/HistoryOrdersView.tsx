"use client";

import React, { useState, useMemo } from "react";
import {
  History, CheckCircle2, AlertCircle, Store,
  Calendar, Clock, Filter, ArrowUpDown, ChevronDown,
  Search, Download, TrendingUp
} from "lucide-react";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });

type FilterStatus = "ALL" | "DELIVERED" | "CANCELLED";
type SortOption = "LATEST" | "OLDEST" | "REVENUE_DESC";

export default function HistoryOrdersView() {
  const { orders, loading } = useOwnerOrders();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("LATEST");

  const filteredAndSortedOrders = useMemo(() => {
    let result = orders.filter((o) => o.status === "DELIVERED" || o.status === "CANCELLED");

    if (statusFilter !== "ALL") {
      result = result.filter((o) => o.status === statusFilter);
    }

    return result.sort((a, b) => {
      if (sortBy === "LATEST") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === "OLDEST") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === "REVENUE_DESC") return parseFloat(b.totalAmount) - parseFloat(a.totalAmount);
      return 0;
    });
  }, [orders, statusFilter, sortBy]);

  const stats = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "DELIVERED");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");
    const revenue = delivered.reduce((s, o) => s + parseFloat(o.totalAmount), 0);
    return { delivered: delivered.length, cancelled: cancelled.length, revenue };
  }, [orders]);

  return (
    <div className="w-full space-y-8 pb-12 selection:bg-primary/20">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/40">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-border/40 flex items-center justify-center shadow-sm">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Order Archive</h1>
          </div>
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest ml-1">Historical Records & Analytics</p>
        </div>

        {!loading && (
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100/50">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Total Yield: £{stats.revenue.toLocaleString()}</span>
             </div>
             <button className="p-2.5 bg-white border border-border/40 rounded-2xl shadow-soft hover:shadow-elevated transition-all active:scale-95">
                <Download className="w-4 h-4 text-muted-foreground" />
             </button>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Sorting */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-full border border-border/40">
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-border/40 shadow-sm w-full sm:w-auto">
          {[
            { id: "ALL", label: "All Records" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as FilterStatus)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                statusFilter === f.id 
                  ? "bg-gray-900 text-white shadow-lg" 
                  : "text-muted-foreground hover:text-gray-900 hover:bg-slate-50"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto pr-1">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-48 h-10 pl-10 pr-8 bg-white border border-border/40 rounded-full text-[10px] font-black uppercase tracking-widest outline-none appearance-none shadow-sm cursor-pointer hover:border-gray-900 transition-colors"
            >
              <option value="LATEST">Latest First</option>
              <option value="OLDEST">Oldest First</option>
              <option value="REVENUE_DESC">Highest Revenue</option>
            </select>
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Accessing Archives...</p>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="py-32 text-center bg-white/40 glass-premium border border-dashed border-border rounded-[3rem]">
            <div className="w-20 h-20 bg-muted/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inset">
              <History className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">No matching records</h3>
            <p className="text-sm text-muted-foreground font-medium mt-2">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedOrders.map((order) => {
                const isDelivered = order.status === "DELIVERED";
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="group bg-white rounded-3xl border border-border/40 p-6 hover:shadow-soft transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      {/* Identification & Info */}
                      <div className="flex items-start gap-5 min-w-0">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 shadow-sm",
                          isDelivered ? "bg-emerald-50 border-emerald-100/50 text-emerald-500" : "bg-red-50 border-red-100/50 text-red-500"
                        )}>
                          {isDelivered ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-sm font-black text-gray-900 tracking-tight uppercase">
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <span className={cn(
                              "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm",
                              isDelivered ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                            )}>
                              {order.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-700">
                             <Store className="w-3.5 h-3.5 text-muted-foreground/40" />
                             <p className="text-sm font-black tracking-tight">{order.restaurant.name}</p>
                          </div>
                          
                          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-md">
                            {order.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(", ")}
                          </p>
                        </div>
                      </div>

                      {/* Timeline & Value */}
                      <div className="flex items-center justify-between sm:justify-end gap-10 shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                        <div className="space-y-1 text-right">
                          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {formatDate(order.createdAt)}
                            <Calendar className="w-3 h-3 opacity-40" />
                          </div>
                          <div className="flex items-center justify-end gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Closed {formatTime(order.updatedAt)}
                            <Clock className="w-3 h-3 opacity-40" />
                          </div>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">
                            £{parseFloat(order.totalAmount).toFixed(2)}
                          </p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                            {order.items.length} Item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
