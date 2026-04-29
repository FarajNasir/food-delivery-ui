"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Banknote,
  Info,
  History,
  AlertCircle,
  ChevronLeft
} from "lucide-react";
import { adminPaymentApi, type SettlementSummary, type AdminRestaurantItem } from "@/lib/api";
import { toast } from "sonner";
import { Modal, ModalActions, Field } from "@/components/dashboard/admin/AdminRestaurants"; // Reusing UI components

/* --- Stat Card --- */
function StatCard({ title, value, icon: Icon, description, trend }: {
  title: string; value: string; icon: any; description?: string; trend?: string;
}) {
  return (
    <div 
      className="p-5 rounded-3xl border flex flex-col gap-3"
      style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
    >
      <div className="flex items-center justify-between">
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--dash-bg)", border: "1px solid var(--dash-card-border)" }}
        >
          <Icon className="w-5 h-5" style={{ color: "var(--dash-accent)" }} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>{title}</p>
        <h3 className="text-2xl font-bold mt-1" style={{ color: "var(--dash-text-primary)" }}>{value}</h3>
        {description && <p className="text-[10px] mt-2" style={{ color: "var(--dash-text-secondary)" }}>{description}</p>}
      </div>
    </div>
  );
}

/* --- Settlement Modal --- */
function SettleModal({ 
  restaurant, 
  onClose, 
  onSuccess 
}: { 
  restaurant: SettlementSummary['restaurants'][0], 
  onClose: () => void,
  onSuccess: () => void 
}) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    setFetching(true);
    adminPaymentApi.getUnpaidOrders(restaurant.id)
      .then(res => {
        if (res.success) {
          setOrders(res.data?.unpaidOrders || []);
        } else {
          toast.error(res.error || "Failed to load unpaid orders");
        }
      })
      .catch(err => {
        console.error("Error fetching unpaid orders:", err);
        toast.error("Internal error fetching orders");
      })
      .finally(() => {
        setFetching(false);
      });
  }, [restaurant.id]);

  const handleSettle = async () => {
    if (orders.length === 0) {
      toast.error("No orders to settle.");
      return;
    }
    setLoading(true);
    console.log("Processing settlement for:", restaurant.name, "Order count:", orders.length);
    const orderIds = orders.map((o: any) => o.id);
    const res = await adminPaymentApi.settle({
      restaurantId: restaurant.id,
      orderIds,
      transactionId,
      notes
    });
    setLoading(false);
    if (res.success) {
      toast.success(`Successfully settled £${restaurant.pendingBalance.toFixed(2)} for ${restaurant.name}`);
      onSuccess();
    } else {
      toast.error(res.error || "Failed to process settlement");
    }
  };

  return (
    <Modal title={`Settle Payout: ${restaurant.name}`} onClose={onClose} icon={<Banknote className="w-5 h-5 text-green-500" />}>
      <div className="space-y-4">
        {/* Summary Info */}
        <div className="p-4 rounded-2xl bg-black/5 border border-dashed border-black/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500">Unpaid Balance</span>
            <span className="text-lg font-bold text-gray-800">£{restaurant.pendingBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Unpaid Orders</span>
            <span className="font-bold">{restaurant.orderCount} orders</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <Field label="Transaction ID (Bank Reference)" style={{ background: "var(--dash-bg)" }}>
            <input 
              type="text" 
              placeholder="e.g. TR-982103" 
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </Field>
          <Field label="Notes (Internal)" style={{ background: "var(--dash-bg)" }}>
            <input 
              type="text" 
              placeholder="Paid via bank transfer..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 text-sm bg-transparent outline-none"
            />
          </Field>
        </div>

        {/* Orders List */}
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">Orders included in this payout</p>
          <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border p-2 bg-gray-50/50">
            {fetching ? (
              <div className="py-8 text-center text-xs text-gray-400 animate-pulse">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">No unpaid orders found.</div>
            ) : (
              orders.map((o: any) => (
                <div key={o.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-white border border-gray-100">
                  <span className="font-medium text-gray-600">#{o.id.slice(0, 8)}</span>
                  <div className="flex gap-3">
                    <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-gray-800 text-right">£{parseFloat(o.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
           <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Settling will mark all {orders.length} orders as paid. Ensure you have initiated the actual bank transfer before confirming.
              </p>
           </div>
           
           <ModalActions 
            onCancel={onClose} 
            onConfirm={handleSettle} 
            confirmLabel={loading ? "Settling..." : `Settle £${restaurant.pendingBalance.toFixed(2)}`}
            confirmColor="var(--dash-accent)"
            loading={loading}
            disabled={fetching || orders.length === 0}
          />
        </div>
      </div>
    </Modal>
  );
}

export default function AdminPayments() {
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [settleTarget, setSettleTarget] = useState<SettlementSummary['restaurants'][0] | null>(null);
  const [search, setSearch] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const refresh = async () => {
    setLoading(true);
    const res = await adminPaymentApi.getSummary();
    if (res.success && res.data) {
      setSummary(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  const filteredRestaurants = useMemo(() => {
    return summary?.restaurants.filter((r: any) => 
      r.name.toLowerCase().includes(search.toLowerCase())
    ) || [];
  }, [summary, search]);

  const paginatedRestaurants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRestaurants.slice(start, start + pageSize);
  }, [filteredRestaurants, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredRestaurants.length / pageSize);

  if (loading && !summary) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-gray-200" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--dash-text-primary)" }}>Payments & Settlements</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--dash-text-secondary)" }}>
            Manage payouts and track platform revenue.
          </p>
        </div>
        <button 
          onClick={refresh}
          className="p-2.5 rounded-xl border transition-all active:scale-95"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <History className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: "var(--dash-text-secondary)" }} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Platform Revenue" 
          value={`£${summary?.platformSummary.totalPlatformRevenue.toFixed(2) || "0.00"}`}
          icon={TrendingUp}
          description="Standard payout model"
        />
        <StatCard 
          title="Pending Payouts" 
          value={`£${summary?.platformSummary.totalPendingPayouts.toFixed(2) || "0.00"}`}
          icon={Clock}
          description="Earnings owed to restaurants"
        />
        <StatCard 
          title="Settled Amount" 
          value={`£${(summary?.restaurants.reduce((sum: number, r: any) => sum + r.totalPaid, 0) || 0).toFixed(2)}`}
          icon={CheckCircle2}
          description="Verified money sent to restaurants"
        />
      </div>

      {/* Sheet / Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-bold" style={{ color: "var(--dash-text-primary)" }}>Restaurant Earnings</h2>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div 
              className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1 sm:w-64"
              style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
            >
              <Search className="w-4 h-4" style={{ color: "var(--dash-text-secondary)" }} />
              <input 
                type="text" 
                placeholder="Filter by restaurant name..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: "var(--dash-text-primary)" }}
              />
            </div>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none text-xs font-semibold px-3 py-2.5 pr-8 rounded-xl border bg-white shadow-sm cursor-pointer outline-none hover:bg-gray-50 transition-all"
                style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}
              >
                {[10, 25, 50].map(size => (
                  <option key={size} value={size}>{size} / page</option>
                ))}
              </select>
              <ChevronLeft className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-270 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
            </div>
          </div>
        </div>

        <div 
          className="rounded-3xl border overflow-hidden" 
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr 
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: "var(--dash-text-secondary)", borderBottom: "1px solid var(--dash-card-border)" }}
                >
                  <th className="px-6 py-4">Restaurant</th>
                  <th className="px-6 py-4">Total Earned</th>
                  <th className="px-6 py-4">Paid</th>
                  <th className="px-6 py-4 text-center">Pending Balance</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y"
                style={{ borderColor: "var(--dash-card-border)" }}
              >
                {paginatedRestaurants.map((r: any) => (
                  <tr key={r.id} className="hover:bg-black/[0.015] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {r.logoUrl ? (
                          <img src={r.logoUrl} className="w-8 h-8 rounded-lg object-cover border" alt={r.name} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-xs">{r.name[0]}</div>
                        )}
                        <div>
                          <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>{r.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>{r.orderCount} paid orders</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold" style={{ color: "var(--dash-text-primary)" }}>£{r.totalEarned.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: "var(--dash-text-secondary)" }}>£{r.totalPaid.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span 
                        className={`text-sm font-bold ${r.pendingBalance > 0 ? 'text-orange-500' : 'text-green-500'}`}
                      >
                        £{r.pendingBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        type="button"
                        onClick={() => {
                          if (r.pendingBalance <= 0) {
                            toast.error(`${r.name} has no pending earnings to settle.`);
                            return;
                          }
                          console.log("Opening settlement for:", r.name);
                          setSettleTarget(r);
                        }}
                        className={`p-3 rounded-xl transition-all active:scale-95 cursor-pointer ${
                          r.pendingBalance <= 0 
                            ? 'opacity-30 grayscale hover:bg-red-50' 
                            : 'hover:bg-black/5'
                        }`}
                      >
                        <ChevronRight className="w-5 h-5" style={{ color: "var(--dash-text-secondary)" }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {paginatedRestaurants.length === 0 && (
              <div className="py-12 text-center text-sm" style={{ color: "var(--dash-text-secondary)" }}>
                No restaurants matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {filteredRestaurants.length > 0 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs font-semibold" style={{ color: "var(--dash-text-secondary)" }}>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRestaurants.length)} of {filteredRestaurants.length}
            </p>
            <div className="flex items-center gap-1">
              <PageBtn
                onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </PageBtn>

              {paginationRange(currentPage, totalPages).map((item, i) =>
                item === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: "var(--dash-text-secondary)" }}>…</span>
                ) : (
                  <PageBtn
                    key={item}
                    onClick={() => setCurrentPage(Number(item))}
                    active={currentPage === item}
                  >
                    {item}
                  </PageBtn>
                )
              )}

              <PageBtn
                onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </PageBtn>
            </div>
          </div>
        )}
      </div>

      {settleTarget && (
        <SettleModal 
          restaurant={settleTarget} 
          onClose={() => setSettleTarget(null)} 
          onSuccess={() => { refresh(); setSettleTarget(null); }} 
        />
      )}
    </div>
  );
}

/* ── Pagination helpers ── */
function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function PageBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode; onClick: () => void;
  disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-8 h-8 rounded-lg text-sm font-semibold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed border"
      style={
        active
          ? { background: "var(--dash-accent)", color: "#fff", borderColor: "var(--dash-accent)" }
          : { background: "var(--dash-card)", color: "var(--dash-text-secondary)", borderColor: "var(--dash-card-border)" }
      }
    >
      {children}
    </button>
  );
}
