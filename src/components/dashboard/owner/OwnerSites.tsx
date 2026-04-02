"use client";

import { useState } from "react";
import { Globe, Pencil, X, Save, Plus, Users, Store, ShoppingBag } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";

interface Site {
  id:          string;
  name:        string;
  domain:      string;
  city:        string;
  status:      "active" | "inactive";
  restaurants: number;
  users:       number;
  ordersToday: number;
  color:       string;
}

const INITIAL_SITES: Site[] = [
  { id: "1", name: "Kilkeel Eats",     domain: "kilkeeleats.co.uk",     city: "Kilkeel",     status: "active",   restaurants: 30, users: 420, ordersToday: 142, color: "#ef4444" },
  { id: "2", name: "Newcastle Eats",   domain: "newcastleeats.co.uk",   city: "Newcastle",   status: "active",   restaurants: 35, users: 510, ordersToday: 98,  color: "#22c55e" },
  { id: "3", name: "Downpatrick Eats", domain: "downpatrickeats.co.uk", city: "Downpatrick", status: "active",   restaurants: 45, users: 310, ordersToday: 175, color: "#3b82f6" },
  { id: "4", name: "Newry Eats",       domain: "newryeats.co.uk",       city: "Newry",       status: "inactive", restaurants: 0,  users: 0,   ordersToday: 0,   color: "#a855f7" },
];

export default function OwnerSites() {
  const [sites,     setSites]     = useState<Site[]>(INITIAL_SITES);
  const [editId,    setEditId]    = useState<string | null>(null);
  const [editForm,  setEditForm]  = useState<Partial<Site>>({});
  const [saving,    setSaving]    = useState(false);

  const startEdit = (site: Site) => {
    setEditId(site.id);
    setEditForm({ name: site.name, domain: site.domain, city: site.city, status: site.status });
  };

  const cancelEdit = () => { setEditId(null); setEditForm({}); };

  const saveEdit = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSites((prev) => prev.map((s) => s.id === editId ? { ...s, ...editForm } : s));
    setSaving(false);
    setEditId(null);
    toast.success("Site updated.");
  };

  return (
    <div>
      <PageHeader
        title="Sites"
        subtitle="Manage all platform sites"
        action={
          <button
            onClick={() => toast.info("Add site — coming soon.")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Site
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {sites.map((site) => {
          const isEditing = editId === site.id;
          return (
            <div key={site.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: site.color }} />
                {isEditing ? (
                  <input
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="flex-1 text-sm font-semibold text-gray-900 border-b border-gray-300 outline-none bg-transparent"
                  />
                ) : (
                  <p className="flex-1 text-sm font-semibold text-gray-900 truncate">{site.name}</p>
                )}
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                  style={{
                    color: site.status === "active" ? "#22c55e" : "#6b7280",
                    background: site.status === "active" ? "#f0fdf4" : "#f3f4f6",
                  }}
                >
                  {site.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <EditField label="Domain" value={editForm.domain ?? ""} onChange={(v) => setEditForm((f) => ({ ...f, domain: v }))} />
                    <EditField label="City"   value={editForm.city ?? ""}   onChange={(v) => setEditForm((f) => ({ ...f, city: v }))} />
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Status</p>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Site["status"] }))}
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none bg-white"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{site.domain}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat icon={Store} label="Restaurants" value={site.restaurants} />
                      <Stat icon={Users} label="Users"       value={site.users} />
                      <Stat icon={ShoppingBag} label="Orders today" value={site.ordersToday} />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
                      >
                        {saving
                          ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                          : <Save className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(site)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2.5">
      <Icon className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
      <p className="text-base font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white"
      />
    </div>
  );
}
