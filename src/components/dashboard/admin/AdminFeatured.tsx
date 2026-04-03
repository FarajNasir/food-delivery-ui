"use client";

import { useState, useEffect } from "react";
import {
  Star, Plus, Trash2, X, ChevronDown, 
  Store, Utensils, Search, 
  ChevronRight, ArrowLeft, Check
} from "lucide-react";
import { 
  adminFeaturedApi, 
  restaurantApi, 
  menuApi,
  type AdminFeaturedItem,
  type FeaturedType,
  type FeaturedStatus
} from "@/lib/api";
import { LOCATIONS } from "@/lib/locations";
import { useSite } from "@/context/SiteContext";
import { toast } from "sonner";

/* ── Types ── */
interface Filters {
  location: string;
  type:     string;
  status:   string;
  page:     number;
}

export default function AdminFeatured() {
  const { site } = useSite();
  const [items, setItems] = useState<AdminFeaturedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState<Filters>({
    location: site.location || "all", 
    type: "all", 
    status: "all", 
    page: 1
  });

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFeaturedItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync with global site switcher
  useEffect(() => {
    if (site.location) {
      setFilters(f => ({ ...f, location: site.location }));
    }
  }, [site.location]);

  // Form state for adding
  const [formType, setFormType] = useState<FeaturedType>("restaurant");
  const [formLocation, setFormLocation] = useState(site.location || "");
  const [formSortOrder, setFormSortOrder] = useState<number | string>(0);
  
  // Guided Selection State
  const [selectedRestaurant, setSelectedRestaurant] = useState<{ id: string; name: string } | null>(null);
  const [formEntityId, setFormEntityId] = useState("");
  const [formEntityName, setFormEntityName] = useState("");
  
  const [search, setSearch] = useState("");
  const [entities, setEntities] = useState<{ id: string; name: string }[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);

  const fetchFeatured = async () => {
    setLoading(true);
    const res = await adminFeaturedApi.list({
      location: filters.location !== "all" ? filters.location : undefined,
      type: filters.type !== "all" ? filters.type : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      page: filters.page,
      limit: 20
    });
    setLoading(false);
    if (res.success && res.data) {
      setItems(res.data.items);
      setTotal(res.data.total);
    }
  };

  useEffect(() => { fetchFeatured(); }, [filters]);

  // Handle guided search
  useEffect(() => {
    if (!addOpen) return;
    const fetchVisibleItems = async () => {
      setLoadingEntities(true);
      
      if (formType === "restaurant" || (!selectedRestaurant)) {
        const res = await restaurantApi.list({ 
           search, 
           location: formLocation || undefined, 
           limit: 50 
        });
        if (res.success && res.data) {
          setEntities(res.data.restaurants.map(r => ({ id: r.id, name: r.name })));
        }
      } 
      else if (formType === "dish" && selectedRestaurant) {
        const res = await menuApi.list({ 
          search, 
          restaurantId: selectedRestaurant.id, 
          limit: 50 
        });
        if (res.success && res.data) {
          setEntities(res.data.items.map(i => ({ id: i.id, name: i.name })));
        }
      }
      
      setLoadingEntities(false);
    };
    
    const t = setTimeout(fetchVisibleItems, 400);
    return () => clearTimeout(t);
  }, [formType, search, addOpen, formLocation, selectedRestaurant]);

  const resetForm = () => {
    setFormEntityId("");
    setFormEntityName("");
    setSelectedRestaurant(null);
    setSearch("");
    setEntities([]);
    setFormSortOrder(""); // Reset to empty
  };

  // Helper to check if rank is already used in the current UI list
  const isRankTaken = (rank: string) => {
    const r = parseInt(rank);
    if (isNaN(r)) return false;
    return items.some(i => 
      i.location === formLocation && 
      i.type === formType && 
      i.sortOrder === r &&
      i.status === "active"
    );
  };

  const handleAdd = async () => {
    if (!formEntityId || !formLocation) return toast.error("Please select an item and location.");
    
    const rankNum = parseInt(formSortOrder as string) || 0;
    if (isRankTaken(formSortOrder as string)) {
      return toast.error(`Rank #${rankNum} is already assigned in ${formLocation}.`);
    }

    setSaving(true);
    const res = await adminFeaturedApi.create({
      type: formType,
      entityId: formEntityId,
      location: formLocation,
      sortOrder: rankNum,
      status: "active"
    });
    setSaving(false);
    if (res.success) {
      toast.success("Added to featured list.");
      setAddOpen(false);
      fetchFeatured();
      resetForm();
    } else {
      toast.error(res.error ?? "Failed to add.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const res = await adminFeaturedApi.delete(deleteTarget.id);
    setSaving(false);
    if (res.success) {
      toast.success("Removed from featured.");
      setDeleteTarget(null);
      fetchFeatured();
    }
  };

  const toggleStatus = async (item: AdminFeaturedItem) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    const res = await adminFeaturedApi.update(item.id, { status: newStatus as FeaturedStatus });
    if (res.success) {
      setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus as FeaturedStatus } : i));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>Featured Discovery</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            Highlight restaurants and dishes based on location.
          </p>
        </div>
        <button 
          onClick={() => { resetForm(); setFormLocation(site.location || ""); setAddOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: "var(--dash-accent)" }}
        >
          <Plus className="w-4 h-4" /> Add Featured
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterSelect 
          value={filters.location}
          onChange={v => setFilters(f => ({ ...f, location: v, page: 1 }))}
          options={[
            { value: "all", label: "All Locations" },
            ...LOCATIONS.map(l => ({ value: l, label: l }))
          ]}
        />
        <FilterSelect 
          value={filters.type}
          onChange={v => setFilters(f => ({ ...f, type: v, page: 1 }))}
          options={[
            { value: "all", label: "All Types" },
            { value: "restaurant", label: "Restaurants" },
            { value: "dish", label: "Dishes" }
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}>
        <div className="hidden sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_44px] gap-4 px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)", borderBottom: "1px solid var(--dash-card-border)" }}>
          <div>Name</div>
          <div>Type</div>
          <div>Location</div>
          <div>Status</div>
          <div>Rank</div>
          <div />
        </div>
        
        {loading ? (
          <div className="p-10 divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="py-4 animate-pulse h-12 bg-black/5 rounded-lg mb-2" />
             ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold" style={{ color: "var(--dash-text-secondary)" }}>No items featured for this criteria.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--dash-card-border)" }}>
            {items.map(item => (
              <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_44px] gap-4 px-5 py-4 text-sm items-center hover:bg-black/[0.015] transition-colors">
                <div className="font-semibold truncate" style={{ color: "var(--dash-text-primary)" }}>{item.entityName}</div>
                <div className="flex items-center gap-1.5 capitalize text-xs" style={{ color: "var(--dash-text-secondary)" }}>
                  {item.type === "restaurant" ? <Store className="w-3.5 h-3.5" /> : <Utensils className="w-3.5 h-3.5" />}
                  {item.type}
                </div>
                <div className="text-xs" style={{ color: "var(--dash-text-secondary)" }}>{item.location}</div>
                <div>
                  <span
                    onClick={() => toggleStatus(item)}
                    className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${item.status === "active" ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                  >
                    {item.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="font-bold" style={{ color: "var(--dash-text-primary)" }}>#{item.sortOrder}</div>
                <button onClick={() => setDeleteTarget(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection Modal */}
      {addOpen && (
        <Modal title="Featured Selection" onClose={() => setAddOpen(false)}>
          <div className="space-y-4">
            
            {/* Type Toggle */}
            <div className="flex gap-2 p-1 bg-black/5 rounded-xl">
              <button 
                onClick={() => { setFormType("restaurant"); resetForm(); }} 
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formType === 'restaurant' ? 'bg-white shadow-sm' : 'opacity-50'}`}
                style={{ color: "var(--dash-text-primary)" }}
              >
                Restaurant
              </button>
              <button 
                onClick={() => { setFormType("dish"); resetForm(); }} 
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formType === 'dish' ? 'bg-white shadow-sm' : 'opacity-50'}`}
                style={{ color: "var(--dash-text-primary)" }}
              >
                Food Dish
              </button>
            </div>

            {/* Config Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest opacity-50 px-1">Location</label>
                <select 
                  value={formLocation} 
                  onChange={e => { setFormLocation(e.target.value); resetForm(); }} 
                  className="w-full h-11 px-3 rounded-xl border outline-none text-sm font-medium transition-all"
                  style={{ background: "var(--dash-bg)", borderColor: "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
                >
                  <option value="">Select City</option>
                  {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-50">Rank Priority</label>
                  {isRankTaken(String(formSortOrder)) && (
                    <span className="text-[9px] font-bold text-red-500 uppercase">Rank Taken</span>
                  )}
                </div>
                <input 
                  type="number" 
                  value={formSortOrder} 
                  onFocus={(e) => { if (e.target.value === "0") setFormSortOrder(""); }}
                  onChange={e => setFormSortOrder(e.target.value)} 
                  className={`w-full h-11 px-3 rounded-xl border outline-none text-sm font-medium transition-all ${isRankTaken(String(formSortOrder)) ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  style={{ background: "var(--dash-bg)", borderColor: isRankTaken(String(formSortOrder)) ? "transparent" : "var(--dash-card-border)", color: "var(--dash-text-primary)" }}
                  placeholder="Enter rank..."
                />
              </div>
            </div>

            <div className="border-t pt-4" style={{ borderColor: "var(--dash-card-border)" }} />

            {/* Selection Flow */}
            <div className="space-y-3">
               <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#f97316]">
                  <span className={formLocation ? '' : 'opacity-30'}>{formLocation || 'No City'}</span>
                  {selectedRestaurant && (
                    <>
                      <ChevronRight className="w-3 h-3 text-gray-300" />
                      <span>{selectedRestaurant.name}</span>
                    </>
                  )}
               </div>

               {!formLocation ? (
                 <div className="p-10 text-center bg-black/5 rounded-2xl border border-dashed border-black/10">
                    <p className="text-xs font-semibold text-gray-400">Select city above to continue.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                    <div className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl border" style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}>
                      <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
                      <input 
                        type="text" 
                        placeholder={(!selectedRestaurant) ? `Search restaurants...` : `Search dishes...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 text-sm bg-transparent outline-none min-w-0"
                        style={{ color: "var(--dash-text-primary)" }}
                      />
                    </div>

                    <div className="max-h-[260px] overflow-y-auto rounded-2xl border p-1 space-y-1" style={{ background: "var(--dash-bg)", borderColor: "var(--dash-card-border)" }}>
                      {loadingEntities ? (
                        <div className="p-6 text-center text-xs font-bold text-gray-400 animate-pulse">Loading data...</div>
                      ) : entities.length === 0 ? (
                        <div className="p-6 text-center text-xs font-semibold text-gray-400 italic">No matches found</div>
                      ) : (
                        entities.map(e => (
                          <button 
                            key={e.id}
                            onClick={() => {
                              if (formType === 'dish' && !selectedRestaurant) {
                                setSelectedRestaurant({ id: e.id, name: e.name });
                                setSearch("");
                              } else {
                                setFormEntityId(e.id);
                                setFormEntityName(e.name);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${formEntityId === e.id ? 'bg-[#f97316] text-white' : 'hover:bg-black/5'}`}
                          >
                            <div className="min-w-0">
                               <p className="text-sm font-semibold truncate">{e.name}</p>
                               <p className={`text-[9px] uppercase font-bold opacity-60 ${formEntityId === e.id ? 'text-white' : ''}`}>
                                  {(!selectedRestaurant) ? 'Restaurant' : 'Food Item'}
                               </p>
                            </div>
                            {formEntityId === e.id ? <Check className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-20" />}
                          </button>
                        ))
                      )}
                    </div>
                    
                    {selectedRestaurant && (
                       <button onClick={resetForm} className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 hover:text-orange-500 transition-colors ml-2">
                         <ArrowLeft className="w-3 h-3" /> Back to Restaurants
                       </button>
                    )}
                 </div>
               )}
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => setAddOpen(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAdd}
                disabled={saving || !formEntityId || isRankTaken(String(formSortOrder))}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-30"
                style={{ background: "var(--dash-accent)" }}
              >
                {saving ? "Wait..." : `Feature ${formType === 'restaurant' ? 'Restaurant' : 'Dish'}`}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Remove Featured" onClose={() => setDeleteTarget(null)}>
          <div className="text-center py-2">
             <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>
               Permanently remove <strong style={{ color: "var(--dash-text-primary)" }}>{deleteTarget.entityName}</strong> from the featured list?
             </p>
          </div>
          <div className="flex gap-2 mt-6">
            <button 
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)", background: "var(--dash-bg)" }}
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {saving ? "..." : "Remove"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── UI Helpers ── */

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none text-sm font-medium px-3 py-2 pr-8 rounded-xl border outline-none cursor-pointer h-10"
        style={{
          background: "var(--dash-card)",
          borderColor: "var(--dash-card-border)",
          color: "var(--dash-text-primary)",
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-40" />
    </div>
  );
}

function Modal({ title, onClose, children }: { 
  title: string; onClose: () => void; children: React.ReactNode; 
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl"
        style={{ background: "var(--dash-card)", border: "1px solid var(--dash-card-border)" }}
      >
        <div className="flex items-center justify-between mb-5">
           <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>{title}</h2>
           <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
