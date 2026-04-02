"use client";

import { useState } from "react";
import {
  Search, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUpDown, ChevronUp,
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";

type UserRole   = "customer" | "driver" | "owner" | "admin";
type UserStatus = "active" | "banned";
type SortField  = "name" | "createdAt";
type SortOrder  = "asc" | "desc";

interface User {
  id:        string;
  name:      string;
  email:     string;
  phone:     string;
  role:      UserRole;
  status:    UserStatus;
  site:      string;
  createdAt: string;
}

const MOCK_USERS: User[] = [
  { id: "1",  name: "John Mullan",      email: "john@example.com",    phone: "+44 7700 900001", role: "customer", status: "active", site: "Kilkeel Eats",     createdAt: "2025-11-02" },
  { id: "2",  name: "Sarah Quinn",      email: "sarah@example.com",   phone: "+44 7700 900002", role: "driver",   status: "active", site: "Newcastle Eats",   createdAt: "2025-10-18" },
  { id: "3",  name: "Peter Fitzpatrick",email: "peter@example.com",   phone: "+44 7700 900003", role: "customer", status: "active", site: "Downpatrick Eats", createdAt: "2025-09-30" },
  { id: "4",  name: "Marie O'Brien",    email: "marie@example.com",   phone: "+44 7700 900004", role: "admin",    status: "active", site: "Kilkeel Eats",     createdAt: "2025-08-14" },
  { id: "5",  name: "Conor McAlister",  email: "conor@example.com",   phone: "+44 7700 900005", role: "driver",   status: "active", site: "Newcastle Eats",   createdAt: "2025-07-22" },
  { id: "6",  name: "Siobhan Murphy",   email: "siobhan@example.com", phone: "+44 7700 900006", role: "customer", status: "banned", site: "Kilkeel Eats",     createdAt: "2025-06-05" },
  { id: "7",  name: "Declan Walsh",     email: "declan@example.com",  phone: "+44 7700 900007", role: "owner",    status: "active", site: "Downpatrick Eats", createdAt: "2025-05-11" },
  { id: "8",  name: "Aoife Brennan",    email: "aoife@example.com",   phone: "+44 7700 900008", role: "customer", status: "active", site: "Newcastle Eats",   createdAt: "2025-04-28" },
  { id: "9",  name: "Niall O'Connor",   email: "niall@example.com",   phone: "+44 7700 900009", role: "driver",   status: "active", site: "Kilkeel Eats",     createdAt: "2025-03-15" },
  { id: "10", name: "Fiona McGrath",    email: "fiona@example.com",   phone: "+44 7700 900010", role: "customer", status: "active", site: "Downpatrick Eats", createdAt: "2025-02-09" },
];

const ROLE_META: Record<UserRole, { label: string; color: string; bg: string }> = {
  customer: { label: "Customer", color: "#3b82f6", bg: "#eff6ff" },
  driver:   { label: "Driver",   color: "#8b5cf6", bg: "#f5f3ff" },
  owner:    { label: "Owner",    color: "#f59e0b", bg: "#fffbeb" },
  admin:    { label: "Admin",    color: "#ef4444", bg: "#fef2f2" },
};

const STATUS_META: Record<UserStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#22c55e", bg: "#f0fdf4" },
  banned: { label: "Banned", color: "#ef4444", bg: "#fef2f2" },
};

const PAGE_SIZE = 8;

export default function OwnerUsers() {
  const [search, setSearch] = useState("");
  const [role,   setRole]   = useState("all");
  const [status, setStatus] = useState("all");
  const [sort,   setSort]   = useState<SortField>("name");
  const [order,  setOrder]  = useState<SortOrder>("asc");
  const [page,   setPage]   = useState(1);

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = role   === "all" || u.role   === role;
    const matchStatus = status === "all" || u.status === status;
    return matchSearch && matchRole && matchStatus;
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
      <PageHeader title="User Management" subtitle="View and manage all users across all sites" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
          />
        </div>
        <Dropdown value={role} onChange={(v) => { setRole(v); setPage(1); }}
          options={[
            { value: "all",      label: "All Roles" },
            { value: "customer", label: "Customer" },
            { value: "driver",   label: "Driver" },
            { value: "owner",    label: "Owner" },
            { value: "admin",    label: "Admin" },
          ]}
        />
        <Dropdown value={status} onChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: "all",    label: "All Status" },
            { value: "active", label: "Active" },
            { value: "banned", label: "Banned" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("name")}>
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden md:table-cell">Email</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">Site</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Role</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 hidden lg:table-cell">
                  <button className="flex items-center gap-1" onClick={() => toggleSort("createdAt")}>
                    Joined <SortIcon field="createdAt" />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sliced.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">No users found.</td>
                </tr>
              ) : sliced.map((u) => {
                const roleMeta   = ROLE_META[u.role];
                const statusMeta = STATUS_META[u.status];
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: roleMeta.color }}
                        >
                          {u.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 truncate">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden md:table-cell">{u.email}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{u.site}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: roleMeta.color, background: roleMeta.bg }}>
                        {roleMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ color: statusMeta.color, background: statusMeta.bg }}>
                        {statusMeta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden lg:table-cell">{u.createdAt}</td>
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

function Dropdown({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 rounded-xl border border-gray-200 text-sm outline-none bg-white appearance-none cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}
