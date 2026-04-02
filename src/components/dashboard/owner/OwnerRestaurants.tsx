"use client";

import { useState } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp, Store,
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

type RestaurantStatus = "active" | "inactive" | "suspended";
type SortField        = "name" | "createdAt";
type SortOrder        = "asc" | "desc";

interface Restaurant {
  id:           string;
  name:         string;
  contactEmail: string;
  contactPhone: string;
  site:         string;
  ownerName:    string;
  status:       RestaurantStatus;
  createdAt:    string;
}

const MOCK_RESTAURANTS: Restaurant[] = [
  { id: "1",  name: "The Anchor Bar",     contactEmail: "anchor@example.com",     contactPhone: "+44 28 4176 2345", site: "Kilkeel Eats",     ownerName: "Declan Walsh",     status: "active",    createdAt: "2024-03-10" },
  { id: "2",  name: "Pizza Palace",       contactEmail: "pizza@example.com",      contactPhone: "+44 28 4372 1234", site: "Newcastle Eats",   ownerName: "Marie O'Brien",   status: "active",    createdAt: "2024-04-15" },
  { id: "3",  name: "Burger Barn",        contactEmail: "burger@example.com",     contactPhone: "+44 28 4461 5678", site: "Downpatrick Eats", ownerName: "Conor McAlister", status: "active",    createdAt: "2024-05-20" },
  { id: "4",  name: "Sushi Station",      contactEmail: "sushi@example.com",      contactPhone: "+44 28 4176 9012", site: "Kilkeel Eats",     ownerName: "Aoife Brennan",   status: "active",    createdAt: "2024-06-01" },
  { id: "5",  name: "Noodle House",       contactEmail: "noodle@example.com",     contactPhone: "+44 28 4372 3456", site: "Newcastle Eats",   ownerName: "Fiona McGrath",   status: "inactive",  createdAt: "2024-07-14" },
  { id: "6",  name: "The Chippy",         contactEmail: "chippy@example.com",     contactPhone: "+44 28 4461 7890", site: "Downpatrick Eats", ownerName: "Niall O'Connor",  status: "active",    createdAt: "2024-08-22" },
  { id: "7",  name: "Curry Corner",       contactEmail: "curry@example.com",      contactPhone: "+44 28 4176 2345", site: "Kilkeel Eats",     ownerName: "Siobhan Murphy",  status: "suspended", createdAt: "2024-09-05" },
  { id: "8",  name: "Sandwich Co.",       contactEmail: "sandwich@example.com",   contactPhone: "+44 28 4372 6789", site: "Newcastle Eats",   ownerName: "Peter Fitzpatrick",status: "active",   createdAt: "2024-10-11" },
];

const STATUS_META: Record<RestaurantStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Active",    color: "#22c55e", bg: "#f0fdf4" },
  inactive:  { label: "Inactive",  color: "#6b7280", bg: "#f3f4f6" },
  suspended: { label: "Suspended", color: "#ef4444", bg: "#fef2f2" },
};

const PAGE_SIZE = 8;

export default function OwnerRestaurants() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort,   setSort]   = useState<SortField>("name");
  const [order,  setOrder]  = useState<SortOrder>("asc");
  const [page,   setPage]   = useState(1);

  const filtered = MOCK_RESTAURANTS.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.contactEmail.toLowerCase().includes(q) || r.site.toLowerCase().includes(q);
    const matchStatus = status === "all" || r.status === status;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const cmp = sort === "name"
      ? a.name.localeCompare(b.name)
      : a.createdAt.localeCompare(b.createdAt);
    return order === "asc" ? cmp : -cmp;
  });

  const total      = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const sliced     = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
      <PageHeader title="Restaurants" subtitle="View all restaurants across all sites" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, email or site…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
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
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Restaurant <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Owner</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Site</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Added <SortIcon field="createdAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">No restaurants found.</td>
                </tr>
              ) : sliced.map((r) => {
                const meta = STATUS_META[r.status];
                return (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400 truncate">{r.contactEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{r.ownerName}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{r.site}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: meta.color, background: meta.bg }}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{r.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {total === 0 ? "No results" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total}`}
          </p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
