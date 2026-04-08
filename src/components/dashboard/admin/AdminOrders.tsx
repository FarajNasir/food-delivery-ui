"use client";

import { useState, useMemo } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, Eye, ShoppingBag, DollarSign, Clock
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";
import { useAdminOrders, type AdminOrder } from "@/context/AdminOrderContext";
import { format } from "date-fns";

type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled" | "paid";
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
    <div>
      <PageHeader title="Orders" subtitle="Monitor and manage all platform orders" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order, customer, restaurant…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer"
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("id")}>
                    Order <SortIcon field="id" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Customer</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Restaurant</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Time <SortIcon field="createdAt" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("totalAmount")}>
                    Total <SortIcon field="totalAmount" />
                  </button>
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No orders found.
                  </td>
                </tr>
              ) : sliced.map((o) => {
                const meta = STATUS_META[o.status] || { label: o.status, color: "#000", bg: "#f3f4f6" };
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-800 text-[10px] break-all max-w-[100px]">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-900">{o.user.name}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{o.restaurant.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">
                      {format(new Date(o.createdAt), "MMM d, HH:mm")}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                      £{parseFloat(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setDetailRow(o)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {total === 0 ? "No results" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Order detail drawer */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDetailRow(null)} />
          <div className="relative ml-auto w-full max-w-sm h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="font-bold text-gray-900 text-xs truncate max-w-[200px]">{detailRow.id}</p>
                <p className="text-[10px] text-gray-500">
                  {format(new Date(detailRow.createdAt), "pppp")}
                </p>
              </div>
              <button onClick={() => setDetailRow(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="text-gray-500 text-lg leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <Detail label="Customer"   value={detailRow.user.name} />
              <Detail label="Email"      value={detailRow.user.email} />
              <Detail label="Phone"      value={detailRow.user.phone} />
              <Detail label="Restaurant" value={detailRow.restaurant.name} />
              <Detail label="Address"    value={detailRow.deliveryAddress || "N/A"} />
              <Detail label="Total"      value={`£${parseFloat(detailRow.totalAmount).toFixed(2)}`} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ color: (STATUS_META[detailRow.status] || STATUS_META.PENDING_CONFIRMATION).color, background: (STATUS_META[detailRow.status] || STATUS_META.PENDING_CONFIRMATION).bg }}
                >
                  {(STATUS_META[detailRow.status] || { label: detailRow.status }).label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}
