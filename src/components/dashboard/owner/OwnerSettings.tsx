"use client";

import { useState, useEffect } from "react";
import { 
  Save, Globe, Loader2, Store, MapPin, 
  Mail, Phone, ChevronDown, Clock, X, AlertTriangle 
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { ownerRestaurantApi, type AdminRestaurantItem, type OpeningHours, type DayKey } from "@/lib/api";
import { LOCATIONS } from "@/lib/locations";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import MenuEditor from "./MenuEditor";

/* ── Hours Types ── */
type DayHoursRow = { enabled: boolean; open: string; close: string };
type HoursForm   = Record<DayKey, DayHoursRow>;

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Monday",    short: "Mon" },
  { key: "tue", label: "Tuesday",   short: "Tue" },
  { key: "wed", label: "Wednesday", short: "Wed" },
  { key: "thu", label: "Thursday",  short: "Thu" },
  { key: "fri", label: "Friday",    short: "Fri" },
  { key: "sat", label: "Saturday",  short: "Sat" },
  { key: "sun", label: "Sunday",    short: "Sun" },
];

const DEFAULT_HOURS: HoursForm = Object.fromEntries(
  DAYS.map(({ key }) => [key, { enabled: false, open: "09:00", close: "22:00" }])
) as HoursForm;

function apiToHours(oh: OpeningHours | null | undefined): HoursForm {
  const f = structuredClone(DEFAULT_HOURS);
  if (!oh) return f;
  for (const { key } of DAYS) {
    const d = oh[key];
    f[key] = d ? { enabled: true, open: d.open, close: d.close } : { enabled: false, open: "09:00", close: "22:00" };
  }
  return f;
}

function hoursToApi(h: HoursForm): OpeningHours {
  return Object.fromEntries(
    DAYS.map(({ key }) => [key, h[key].enabled ? { open: h[key].open, close: h[key].close } : null])
  ) as OpeningHours;
}

/* ══════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════ */
export default function OwnerSettings() {
  const [restaurants, setRestaurants] = useState<AdminRestaurantItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [activeTab,   setActiveTab]   = useState<"profile" | "menu">("profile");

  // Form state
  const [form, setForm] = useState({
    name:         "",
    location:     "",
    logoUrl:      "",
    contactEmail: "",
    contactPhone: "",
    hours:        structuredClone(DEFAULT_HOURS),
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const selectedRestaurant = restaurants.find(r => r.id === selectedId);

  /* 1. Fetch restaurants on mount */
  useEffect(() => {
    ownerRestaurantApi.list().then((res) => {
      setLoading(false);
      if (res.success && res.data?.items.length) {
        setRestaurants(res.data.items);
        setSelectedId(res.data.items[0].id);
      }
    });
  }, []);

  /* 2. When selection changes, load that restaurant's details */
  useEffect(() => {
    if (!selectedId) return;
    const r = restaurants.find((item) => item.id === selectedId);
    if (r) {
      setForm({
        name:         r.name,
        location:     r.location || "",
        logoUrl:      r.logoUrl  || "",
        contactEmail: r.contactEmail,
        contactPhone: r.contactPhone,
        hours:        apiToHours(r.openingHours),
      });
    }
  }, [selectedId, restaurants]);

  const handleSave = async () => {
    if (!selectedId) return;
    setSaving(true);
    const res = await ownerRestaurantApi.update(selectedId, {
      name:         form.name,
      location:     form.location || undefined,
      logoUrl:      form.logoUrl  || undefined,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      openingHours: hoursToApi(form.hours),
    });
    setSaving(false);

    if (res.success) {
      toast.success("Restaurant settings updated.");
      // Update local item in list so if they switch back/forth it's fresh
      setRestaurants(prev => prev.map(r => r.id === selectedId ? { ...r, ...res.data! } : r));
    } else {
      toast.error(res.error || "Failed to save settings.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">Loading settings...</p>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return (
      <div className="text-center py-24 border-2 border-dashed border-gray-100 rounded-3xl">
        <Store className="w-12 h-12 mx-auto text-gray-200 mb-3" />
        <h2 className="text-lg font-bold text-gray-900">No restaurants found</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
          You don't have any restaurants assigned to your account yet. 
          Please contact administration to set up your business.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your restaurant profile and menu" />

      {/* Restaurant Selector */}
      {restaurants.length > 1 && (
        <div className="mb-8 p-1.5 bg-slate-50/8 rounded-2xl border border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 shadow-lg">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Active Property</p>
              <h3 className="text-sm font-black text-gray-900 truncate tracking-tight">{selectedRestaurant?.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-3 pl-3 sm:pl-0 pb-2 sm:pb-0">
            <div className="relative min-w-[200px]">
              <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-10 pl-4 pr-10 bg-white border border-border/40 rounded-xl text-xs font-black uppercase tracking-widest outline-none appearance-none cursor-pointer hover:border-gray-900 transition-colors shadow-sm"
              >
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-2xl mb-8 w-fit border border-gray-100">
        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "profile" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={cn(
            "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === "menu" 
              ? "bg-white text-gray-900 shadow-sm" 
              : "text-gray-400 hover:text-gray-600"
          )}
        >
          Menu & Prices
        </button>
      </div>

      {activeTab === "profile" ? (
        <div className="space-y-8">
          {/* Banner for pending deletion */}
          {selectedRestaurant?.deletionStatus === "PENDING_DELETION" && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Scheduled for Deletion</h3>
                  <p className="text-xs font-medium text-amber-700/80 mt-0.5">
                    This restaurant will be permanently removed on {new Date(selectedRestaurant.deletionScheduledAt!).toLocaleDateString()}.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const res = await ownerRestaurantApi.restore(selectedId);
                  if (res.success) {
                    toast.success("Restaurant restored successfully.");
                    // Refresh data
                    const updated = await ownerRestaurantApi.list();
                    if (updated.success) setRestaurants(updated.data!.items);
                  } else {
                    toast.error(res.error || "Failed to restore restaurant.");
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all active:scale-95 shadow-lg shadow-amber-200"
              >
                Restore Restaurant
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
            {/* Basic Information */}
            <div className="space-y-6">
              <Section icon={Store} title="Business Profile">
                <Field label="Restaurant Name">
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <Store className="w-4 h-4 text-gray-400" />
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </Field>

                <Field label="Location">
                  <div className="relative">
                    <select 
                      value={form.location}
                      onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full h-11 pl-10 pr-8 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none appearance-none"
                    >
                      <option value="">— Select Location —</option>
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </Field>

                <Field label="Logo URL">
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." className="flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </Field>
              </Section>

              <Section icon={Phone} title="Contact Details">
                 <Field label="Email Address">
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </Field>
                <Field label="Phone Number">
                  <div className="flex items-center gap-3 h-11 px-3 rounded-xl border border-gray-200 bg-gray-50/50">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className="flex-1 bg-transparent text-sm outline-none" />
                  </div>
                </Field>
              </Section>
            </div>

            {/* Operating Hours */}
            <div className="space-y-6">
              <Section icon={Clock} title="Operating Hours">
                <HoursEditor hours={form.hours} onChange={hours => setForm(f => ({ ...f, hours }))} />
              </Section>

              <div className="pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save All Changes
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-12 border-t border-gray-100">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-6">Danger Zone</h2>
            <div className="p-8 rounded-[2.5rem] bg-red-50/30 border border-red-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="max-w-md">
                <h3 className="text-base font-black text-gray-900 tracking-tight mb-2">Request Restaurant Deletion</h3>
                <p className="text-xs font-medium text-gray-500 leading-relaxed">
                  Your restaurant will be hidden from customers immediately. You have 14 days to cancel this by clicking Restore in your settings. After 14 days all data is permanently removed.
                </p>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={selectedRestaurant?.deletionStatus === "PENDING_DELETION"}
                className="whitespace-nowrap px-8 py-3.5 rounded-2xl border-2 border-red-200 text-red-600 text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request Deletion
              </button>
            </div>
          </div>

          {/* Deletion Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)} />
              <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <button onClick={() => setIsDeleteModalOpen(false)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Delete Restaurant?</h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                  Are you sure? Your restaurant will be hidden from customers immediately. 
                  You have <span className="text-red-600 font-bold">14 days</span> to cancel this by clicking Restore in your settings. 
                  After 14 days all data is permanently removed.
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      ownerRestaurantApi.requestDeletion(selectedId).then(res => {
                        if (res.success) {
                          toast.success("Restaurant scheduled for deletion.");
                          setIsDeleteModalOpen(false);
                          ownerRestaurantApi.list().then(updated => {
                            if (updated.success) setRestaurants(updated.data!.items);
                          });
                        } else {
                          toast.error(res.error || "Failed to schedule deletion.");
                        }
                      });
                    }}
                    className="w-full py-4 rounded-2xl bg-red-600 text-white text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200"
                  >
                    Confirm Deletion
                  </button>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <MenuEditor restaurantId={selectedId} />
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/30">
        <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-100/50">
          <Icon className="w-3.5 h-3.5 text-gray-600" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">{label}</label>
      {children}
    </div>
  );
}

function HoursEditor({ hours, onChange }: { hours: HoursForm; onChange: (h: HoursForm) => void }) {
  const toggle = (key: DayKey) => onChange({ ...hours, [key]: { ...hours[key], enabled: !hours[key].enabled } });
  const setTime = (key: DayKey, field: "open" | "close", val: string) => onChange({ ...hours, [key]: { ...hours[key], [field]: val } });

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => {
        const row = hours[key];
        return (
          <div key={key} className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300",
            row.enabled 
              ? "bg-white border-border/40 shadow-soft" 
              : "bg-slate-50/50 border-gray-100 opacity-60"
          )}>
            <div className="flex items-center gap-3">
               <button
                type="button"
                onClick={() => toggle(key)}
                className={cn(
                  "relative w-9 h-5 rounded-full transition-colors duration-500",
                  row.enabled ? "bg-emerald-500" : "bg-slate-200"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-500",
                  row.enabled ? "translate-x-4" : "translate-x-0"
                )} />
              </button>
              <span className={cn(
                "text-xs font-black uppercase tracking-widest",
                row.enabled ? "text-gray-900" : "text-muted-foreground/40"
              )}>{label}</span>
            </div>

            {row.enabled ? (
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <div className="relative flex items-center group/input">
                   <Clock className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/10 group-focus-within/input:text-primary transition-colors" />
                   <input 
                    type="time" 
                    value={row.open} 
                    onChange={e => setTime(key, "open", e.target.value)} 
                    className="w-full sm:w-28 pl-8 pr-2 py-2.5 rounded-xl text-[10px] font-black border border-border/40 bg-slate-50/50 outline-none focus:border-gray-900 focus:bg-white transition-all shadow-inset appearance-none" 
                   />
                </div>
                <div className="hidden sm:block text-[9px] font-black text-muted-foreground/30 tracking-widest px-1">TO</div>
                <div className="relative flex items-center group/input">
                   <input 
                    type="time" 
                    value={row.close} 
                    onChange={e => setTime(key, "close", e.target.value)} 
                    className="w-full sm:w-28 px-3 py-2.5 rounded-xl text-[10px] font-black border border-border/40 bg-slate-50/50 outline-none focus:border-gray-900 focus:bg-white transition-all shadow-inset appearance-none" 
                   />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground/30">
                <span className="text-[10px] font-black uppercase tracking-widest">Platform Offline</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
