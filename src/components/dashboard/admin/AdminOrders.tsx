"use client";

import React, { useState, useMemo } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, ShoppingBag, DollarSign, Clock
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";
import { useAdminOrders, type AdminOrder } from "@/context/AdminOrderContext";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type SortField = "id" | "createdAt" | "totalAmount";
type SortOrder = "asc" | "desc";

export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  PENDING_CONFIRMATION: { label: "Pending",          color: "#6b7280", bg: "#f3f4f6" },
  CONFIRMED:            { label: "Confirmed",        color: "#3b82f6", bg: "#eff6ff" },
  PAID:                 { label: "Paid",             color: "#3b82f6", bg: "#eff6ff" },
  PREPARING:            { label: "Preparing",        color: "#f59e0b", bg: "#fffbeb" },
  OUT_FOR_DELIVERY:     { label: "Out for Delivery", color: "#8b5cf6", bg: "#f5f3ff" },
  DELIVERED:            { label: "Delivered",        color: "#22c55e", bg: "#f0fdf4" },
  CANCELLED:            { label: "Cancelled",        color: "#ef4444", bg: "#fef2f2" },
};

const ALL_STATUSES = [
  { value: "all",                  label: "All Orders" },
  { value: "PENDING_CONFIRMATION", label: "Pending" },
  { value: "CONFIRMED",            label: "Confirmed" },
  { value: "PAID",                 label: "Paid" },
  { value: "PREPARING",            label: "Preparing" },
  { value: "OUT_FOR_DELIVERY",     label: "Out for Delivery" },
  { value: "DELIVERED",            label: "Delivered" },
  { value: "CANCELLED",            label: "Cancelled" },
];

const PAGE_SIZE = 8;

export default function AdminOrders() {
  const { orders, stats, loading } = useAdminOrders();
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [sort,      setSort]      = useState<SortField>("createdAt");
  const [order,     setOrder]     = useState<SortOrder>("desc");
  const [page,      setPage]      = useState(1);
  const [detailRow, setDetailRow] = useState<AdminOrder | null>(null);

  /* ── Filter + sort ── */
  const filtered = useMemo(() => {
    return orders
      .filter((o) => {
        const q = search.toLowerCase();
        const matchSearch = !q || o.id.toLowerCase().includes(q)
          || o.user.name.toLowerCase().includes(q)
          || o.restaurant.name.toLowerCase().includes(q);
        const matchStatus = status === "all" || o.status === status;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const factor = order === "asc" ? 1 : -1;
        if (sort === "totalAmount") {
          return (parseFloat(a.totalAmount) - parseFloat(b.totalAmount)) * factor;
        }
        const valA = a[sort] || "";
        const valB = b[sort] || "";
        return valA < valB ? -1 * factor : valA > valB ? 1 * factor : 0;
      });
  }, [orders, search, status, sort, order]);

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sort === field) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSort(field); setOrder("asc"); }
    setPage(1);
  };

  function SortIcon({ field }: { field: SortField }) {
    if (sort !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return order === "asc"
      ? <ChevronUp   className="w-3.5 h-3.5 text-gray-700" />
      : <ChevronDown className="w-3.5 h-3.5 text-gray-700" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Monitor and manage all platform orders" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Revenue"
          value={`£${parseFloat(stats.totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          label="Total Orders"
          value={String(stats.totalOrders)}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          label="Pending Units"
          value={String(stats.pendingOrders)}
          icon={Clock}
          color="amber"
          trend={stats.pendingOrders > 0 ? { value: "Needs attention", positive: false } : undefined}
        />
      </div>

      {/* Filters & Pagination */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none bg-white focus:ring-2 ring-primary/5"
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none lg:w-48">
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-black text-gray-300 w-10 text-center uppercase tracking-tighter">
              {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table & Cards */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/30">
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("id")}>
                    Order <SortIcon field="id" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Customer</th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 hidden md:table-cell">Restaurant</th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Added <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-6 py-4 text-left font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Status</th>
                <th className="px-6 py-4 text-right font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("totalAmount")}>
                    Total <SortIcon field="totalAmount" />
                  </button>
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6 text-slate-200" />
                      </div>
                      <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No matching orders</p>
                    </div>
                  </td>
                </tr>
              ) : sliced.map((o) => {
                const isExpanded = detailRow?.id === o.id;
                const isTimeout = o.status === 'CANCELLED' && 
                  (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime() >= 290000);
                const meta = isTimeout ? { label: "Timed Out", color: "#ef4444", bg: "#fef2f2" } : (STATUS_META[o.status] || { label: o.status, color: "#000", bg: "#f3f4f6" });

                return (
                  <React.Fragment key={o.id}>
                    {/* Desktop View */}
                    <tr className={cn(
                      "hover:bg-slate-50/50 transition-colors hidden md:table-row cursor-pointer",
                      isExpanded && "bg-slate-50/80"
                    )} onClick={() => setDetailRow(isExpanded ? null : o)}>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 text-[11px]">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-gray-900 font-bold">{o.user.name}</td>
                      <td className="px-6 py-4 text-gray-500 font-bold hidden md:table-cell">{o.restaurant.name}</td>
                      <td className="px-6 py-4 text-gray-400 font-bold hidden lg:table-cell text-[11px]">
                        {format(new Date(o.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tight"
                          style={{ color: meta.color, background: meta.bg }}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        £{parseFloat(o.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all ml-auto",
                          isExpanded ? "bg-gray-900 text-white rotate-180" : "bg-slate-50 text-gray-400"
                        )}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </td>
                    </tr>

                    {/* Mobile View */}
                    <tr className="md:hidden">
                      <td colSpan={7} className="p-3">
                        <div 
                          onClick={() => setDetailRow(isExpanded ? null : o)}
                          className={cn(
                            "p-5 rounded-3xl border transition-all active:scale-[0.98]",
                            isExpanded ? "border-gray-900 bg-white shadow-xl ring-4 ring-slate-50" : "border-gray-50 bg-white"
                          )}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-mono font-black text-gray-300">#{o.id.slice(0, 8).toUpperCase()}</span>
                            <span
                              className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                              style={{ color: meta.color, background: meta.bg }}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="space-y-1">
                              <p className="text-sm font-black text-gray-900 leading-tight">{o.user.name}</p>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{o.restaurant.name}</p>
                            </div>
                            <p className="text-xl font-black text-gray-900">£{parseFloat(o.totalAmount).toFixed(2)}</p>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Detail Expander */}
                    <AnimatePresence>
                      {isExpanded && (
                        <tr className="border-none">
                          <td colSpan={7} className="px-6 py-0 overflow-hidden bg-slate-50/50">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
                            >
                              <Detail label="Order ID" value={o.id} />
                              <Detail label="Contact Detail" value={`${o.user.email} • ${o.user.phone}`} />
                              <Detail label="Fulfilled By" value={o.restaurant.name} />
                              <Detail label="Shipping To" value={o.deliveryAddress || "N/A"} />
                              <Detail label="Ordered On" value={format(new Date(o.createdAt), "pppp")} />
                              <Detail label="Update On" value={o.updatedAt ? format(new Date(o.updatedAt), "pppp") : "N/A"} />
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
      <p className="font-bold text-gray-900 text-sm leading-relaxed">{value}</p>
    </div>
  );
}
