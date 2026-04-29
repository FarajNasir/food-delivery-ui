"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, CheckCircle, Ban, Clock, Filter, 
  MessageSquare, User, Store, Star, Loader2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { session } = useAuthStore();

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/reviews", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      toast.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchReviews();
  }, [session]);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        toast.success(`Review ${newStatus === 'active' ? 'Approved' : newStatus === 'ban' ? 'Banned' : 'Updated'}`);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setUpdatingId(null);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchSearch = 
        (r.comment || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.user?.name || "anonymous user").toLowerCase().includes(search.toLowerCase()) ||
        (r.restaurant?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reviews, search, statusFilter]);

  // Paginated Data
  const totalPages = Math.ceil(filteredReviews.length / pageSize);
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReviews.slice(start, start + pageSize);
  }, [filteredReviews, currentPage, pageSize]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)" }}>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Moderation" 
        subtitle="Manage community feedback and platform safety." 
      />

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <div 
          className="flex-1 min-w-48 flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500/10"
          style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "var(--dash-text-secondary)" }} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews, users, or restaurants..."
            className="flex-1 text-sm bg-transparent outline-none min-w-0"
            style={{ color: "var(--dash-text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="hover:opacity-70">
              <Clock className="w-3.5 h-3.5 rotate-45" style={{ color: "var(--dash-text-secondary)" }} />
            </button>
          )}
        </div>

        <div className="flex gap-1.5">
          {["all", "inactive", "active", "ban"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm",
                statusFilter === s 
                  ? "bg-orange-500 text-white border-orange-500" 
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Page Size Select */}
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="appearance-none text-[10px] font-bold uppercase tracking-wider px-3 py-2 pr-8 rounded-xl border bg-white shadow-sm cursor-pointer outline-none hover:bg-gray-50 transition-all"
            style={{ borderColor: "var(--dash-card-border)", color: "var(--dash-text-secondary)" }}
          >
            {[5, 10, 25, 50].map(size => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>
          <ChevronLeft className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-270 pointer-events-none" style={{ color: "var(--dash-text-secondary)" }} />
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3 pb-4">
        {paginatedReviews.length === 0 ? (
          <div 
            className="py-16 text-center rounded-2xl border shadow-sm"
            style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
          >
            <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)" }}>No reviews found</p>
          </div>
        ) : (
          paginatedReviews.map((review) => (
            <div 
              key={review.id}
              className="group relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              style={{ background: "var(--dash-card)", borderColor: "var(--dash-card-border)" }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-5 gap-5">
                {/* Review Content */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={cn(
                            "w-3.5 h-3.5",
                            review.rating >= star ? "fill-amber-400 text-amber-400" : "text-gray-200"
                          )}
                        />
                      ))}
                    </div>
                    <div 
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        review.status === 'active' ? "bg-green-50 text-green-600 border-green-100" :
                        review.status === 'ban' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}
                    >
                      {review.status}
                    </div>
                  </div>

                  <p className="text-sm font-medium leading-relaxed italic" style={{ color: "var(--dash-text-primary)" }}>
                    "{review.comment || <span className="text-gray-300 italic">No comment provided</span>}"
                  </p>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-3 border-t border-gray-50/50">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <User className="w-3.5 h-3.5 text-gray-400" />
                       </div>
                       <div className="min-w-0">
                         <p className="text-[10px] font-bold uppercase tracking-tight truncate" style={{ color: "var(--dash-text-primary)" }}>{review.user?.name || "Anonymous User"}</p>
                         <p className="text-[10px] lowercase truncate" style={{ color: "var(--dash-text-secondary)" }}>{review.user?.email || "Deleted Account"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <Store className="w-3.5 h-3.5 text-gray-400" />
                       </div>
                       <div className="min-w-0">
                         <p className="text-[10px] font-bold uppercase tracking-tight truncate" style={{ color: "var(--dash-text-primary)" }}>{review.restaurant?.name}</p>
                         <p className="text-[10px] truncate" style={{ color: "var(--dash-text-secondary)" }}>Order #{review.order?.id?.slice(0, 8)}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                         <Clock className="w-3.5 h-3.5 text-gray-400" />
                       </div>
                       <div>
                         <p className="text-[10px] font-bold uppercase tracking-tight" style={{ color: "var(--dash-text-primary)" }}>Submitted</p>
                         <p className="text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                 <div className="flex flex-row lg:flex-col gap-2 shrink-0 lg:w-36">
                   {review.status !== 'active' && (
                     <button
                       onClick={() => handleStatusUpdate(review.id, 'active')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-green-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-green-600 transition-all shadow-sm shadow-green-500/10 disabled:opacity-50"
                     >
                       <CheckCircle className="w-3 h-3" />
                       Approve
                     </button>
                   )}
                   {review.status !== 'ban' && (
                     <button
                       onClick={() => handleStatusUpdate(review.id, 'ban')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white border border-red-100 text-red-500 font-bold text-[10px] uppercase tracking-wider hover:bg-red-50 transition-all disabled:opacity-50"
                     >
                       <Ban className="w-3 h-3" />
                       Block/Ban
                     </button>
                   )}
                   {review.status === 'active' && (
                      <button
                       onClick={() => handleStatusUpdate(review.id, 'inactive')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-[10px] uppercase tracking-wider hover:bg-gray-200 transition-all disabled:opacity-50"
                     >
                       <Clock className="w-3 h-3" />
                       Hold/Hide
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {filteredReviews.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)" }}>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredReviews.length)} of {filteredReviews.length}
          </p>
          <div className="flex items-center gap-1">
            <PageBtn
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </PageBtn>

            {paginationRange(currentPage, totalPages).map((item, i) =>
              item === "…" ? (
                <span key={`ellipsis-${i}`} className="px-1 text-[10px]" style={{ color: "var(--dash-text-secondary)" }}>…</span>
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </PageBtn>
          </div>
        </div>
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
      className="w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed border"
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
