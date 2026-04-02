"use client";

import { useState } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, Eye,
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

type OrderStatus = "pending" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
type SortField = "id" | "createdAt" | "total";
type SortOrder = "asc" | "desc";

interface Order {
  id:         string;
  customer:   string;
  restaurant: string;
  items:      number;
  total:      string;
  status:     OrderStatus;
  createdAt:  string;
  address:    string;
}

const MOCK_ORDERS: Order[] = [
  { id: "#1042", customer: "John Mullan",        restaurant: "The Anchor Bar",   items: 3, total: "£18.50", status: "delivered",        createdAt: "Today 14:32",  address: "12 Castle St, Kilkeel" },
  { id: "#1041", customer: "Sarah Quinn",         restaurant: "Pizza Palace",      items: 2, total: "£24.00", status: "preparing",        createdAt: "Today 14:15",  address: "7 Shore Rd, Kilkeel" },
  { id: "#1040", customer: "Peter Fitzpatrick",   restaurant: "Burger Barn",       items: 1, total: "£15.99", status: "out_for_delivery", createdAt: "Today 13:50",  address: "4 Mourne View, Newcastle" },
  { id: "#1039", customer: "Marie O'Brien",       restaurant: "Sushi Station",     items: 5, total: "£31.00", status: "delivered",        createdAt: "Today 13:20",  address: "19 Main St, Downpatrick" },
  { id: "#1038", customer: "Conor McAlister",     restaurant: "Noodle House",      items: 2, total: "£22.50", status: "confirmed",        createdAt: "Today 12:45",  address: "3 Bridge Rd, Kilkeel" },
  { id: "#1037", customer: "Siobhan Murphy",      restaurant: "The Anchor Bar",    items: 4, total: "£42.00", status: "delivered",        createdAt: "Today 12:10",  address: "88 Sea Rd, Newcastle" },
  { id: "#1036", customer: "Declan Walsh",        restaurant: "Pizza Palace",      items: 1, total: "£11.99", status: "cancelled",        createdAt: "Today 11:55",  address: "5 Hill View, Kilkeel" },
  { id: "#1035", customer: "Aoife Brennan",       restaurant: "Burger Barn",       items: 3, total: "£29.50", status: "delivered",        createdAt: "Today 11:30",  address: "22 Church St, Downpatrick" },
  { id: "#1034", customer: "Niall O'Connor",      restaurant: "Sushi Station",     items: 2, total: "£18.00", status: "pending",          createdAt: "Today 11:05",  address: "10 Park Ave, Newcastle" },
  { id: "#1033", customer: "Fiona McGrath",       restaurant: "Noodle House",      items: 6, total: "£55.00", status: "delivered",        createdAt: "Today 10:40",  address: "33 Lough Rd, Kilkeel" },
];

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:          { label: "Pending",          color: "#6b7280", bg: "#f3f4f6" },
  confirmed:        { label: "Confirmed",        color: "#3b82f6", bg: "#eff6ff" },
  preparing:        { label: "Preparing",        color: "#f59e0b", bg: "#fffbeb" },
  out_for_delivery: { label: "Out for Delivery", color: "#8b5cf6", bg: "#f5f3ff" },
  delivered:        { label: "Delivered",        color: "#22c55e", bg: "#f0fdf4" },
  cancelled:        { label: "Cancelled",        color: "#ef4444", bg: "#fef2f2" },
};

const ALL_STATUSES: { value: string; label: string }[] = [
  { value: "all",              label: "All Orders" },
  { value: "pending",          label: "Pending" },
  { value: "confirmed",        label: "Confirmed" },
  { value: "preparing",        label: "Preparing" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered",        label: "Delivered" },
  { value: "cancelled",        label: "Cancelled" },
];

const PAGE_SIZE = 8;

export default function AdminOrders() {
  const [search,    setSearch]    = useState("");
  const [status,    setStatus]    = useState("all");
  const [sort,      setSort]      = useState<SortField>("createdAt");
  const [order,     setOrder]     = useState<SortOrder>("desc");
  const [page,      setPage]      = useState(1);
  const [detailRow, setDetailRow] = useState<Order | null>(null);

  /* ── Filter + sort (client-side with mock data) ── */
  const filtered = MOCK_ORDERS
    .filter((o) => {
      const q = search.toLowerCase();
      const matchSearch = !q || o.id.toLowerCase().includes(q)
        || o.customer.toLowerCase().includes(q)
        || o.restaurant.toLowerCase().includes(q);
      const matchStatus = status === "all" || o.status === status;
      return matchSearch && matchStatus;
    });

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
                  <button className="flex items-center gap-1 ml-auto" onClick={() => toggleSort("total")}>
                    Total <SortIcon field="total" />
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
                const meta = STATUS_META[o.status];
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-800">{o.id}</td>
                    <td className="px-5 py-3.5 text-gray-900">{o.customer}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{o.restaurant}</td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{o.createdAt}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{o.total}</td>
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
                <p className="font-bold text-gray-900">{detailRow.id}</p>
                <p className="text-xs text-gray-500">{detailRow.createdAt}</p>
              </div>
              <button onClick={() => setDetailRow(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="text-gray-500 text-lg leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <Detail label="Customer"   value={detailRow.customer} />
              <Detail label="Restaurant" value={detailRow.restaurant} />
              <Detail label="Address"    value={detailRow.address} />
              <Detail label="Items"      value={String(detailRow.items)} />
              <Detail label="Total"      value={detailRow.total} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ color: STATUS_META[detailRow.status].color, background: STATUS_META[detailRow.status].bg }}
                >
                  {STATUS_META[detailRow.status].label}
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
