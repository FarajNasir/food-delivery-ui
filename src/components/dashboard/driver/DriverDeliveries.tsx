"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, Clock, ChevronDown, Search } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

type DeliveryStatus = "picking_up" | "delivering" | "delivered" | "cancelled";

interface Delivery {
  id:         string;
  customer:   string;
  address:    string;
  restaurant: string;
  items:      number;
  total:      string;
  status:     DeliveryStatus;
  eta:        string;
  time:       string;
}

const MOCK_DELIVERIES: Delivery[] = [
  { id: "#1042", customer: "John Mullan",      address: "12 Castle St, Kilkeel",    restaurant: "The Anchor Bar",  items: 3, total: "£18.50", status: "delivering",  eta: "4 min",  time: "14:32" },
  { id: "#1041", customer: "Sarah Quinn",       address: "7 Shore Rd, Kilkeel",      restaurant: "Pizza Palace",    items: 2, total: "£24.00", status: "picking_up",  eta: "12 min", time: "14:15" },
  { id: "#1040", customer: "Peter Fitzpatrick", address: "4 Mourne View, Newcastle", restaurant: "Burger Barn",     items: 1, total: "£15.99", status: "delivered",   eta: "—",      time: "13:50" },
  { id: "#1039", customer: "Marie O'Brien",     address: "19 Main St, Downpatrick",  restaurant: "Sushi Station",   items: 5, total: "£31.00", status: "delivered",   eta: "—",      time: "13:20" },
  { id: "#1038", customer: "Conor McAlister",   address: "3 Bridge Rd, Kilkeel",     restaurant: "Noodle House",    items: 2, total: "£22.50", status: "delivered",   eta: "—",      time: "12:45" },
  { id: "#1037", customer: "Siobhan Murphy",    address: "88 Sea Rd, Newcastle",     restaurant: "The Anchor Bar",  items: 4, total: "£42.00", status: "cancelled",   eta: "—",      time: "12:10" },
];

const STATUS_META: Record<DeliveryStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  picking_up: { label: "Picking Up",  color: "#f59e0b", bg: "#fffbeb", icon: Clock },
  delivering: { label: "Delivering",  color: "#3b82f6", bg: "#eff6ff", icon: MapPin },
  delivered:  { label: "Delivered",   color: "#22c55e", bg: "#f0fdf4", icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",   color: "#ef4444", bg: "#fef2f2", icon: CheckCircle2 },
};

export default function DriverDeliveries() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = MOCK_DELIVERIES.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = !q || d.customer.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.restaurant.toLowerCase().includes(q);
    const matchFilter = filter === "all" || d.status === filter;
    return matchSearch && matchFilter;
  });

  const active    = MOCK_DELIVERIES.filter((d) => d.status === "picking_up" || d.status === "delivering");
  const completed = MOCK_DELIVERIES.filter((d) => d.status === "delivered").length;

  return (
    <div>
      <PageHeader title="Deliveries" subtitle="Your delivery queue and history" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{active.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{completed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed today</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">22m</p>
          <p className="text-xs text-gray-500 mt-0.5">Avg. time</p>
        </div>
      </div>

      {/* Active deliveries highlight */}
      {active.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Active Now</h2>
          <div className="space-y-3">
            {active.map((d) => {
              const meta = STATUS_META[d.status];
              const Icon = meta.icon;
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-start gap-3">
                  <div className="p-2 rounded-xl shrink-0" style={{ background: meta.bg }}>
                    <Icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{d.customer}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{d.address}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.restaurant} · ETA {d.eta}</p>
                  </div>
                  <button className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors shrink-0">
                    Done
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deliveries…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div className="relative">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer">
            <option value="all">All</option>
            <option value="picking_up">Picking Up</option>
            <option value="delivering">Delivering</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* All deliveries table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Order</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Restaurant</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Address</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">No deliveries found.</td>
                </tr>
              ) : filtered.map((d) => {
                const meta = STATUS_META[d.status];
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-800">{d.id}</td>
                    <td className="px-5 py-3.5 text-gray-900">{d.customer}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{d.restaurant}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell truncate max-w-[200px]">{d.address}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{d.total}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
