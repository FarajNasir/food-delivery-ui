"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Search, CheckCircle, Ban, Clock, Filter, 
  MessageSquare, User, Store, Star, Loader2 
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

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)" }}>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Moderation" 
        subtitle="Approve or block community feedback to maintain platform safety." 
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews, users, or restaurants..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl border border-gray-100 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2">
          {["all", "inactive", "active", "ban"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shadow-sm",
                statusFilter === s 
                  ? "bg-[#3b82f6] text-white border-[#3b82f6]" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4 pb-12">
        {filteredReviews.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-gray-50 shadow-sm">
            <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-4" />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--dash-text-secondary)" }}>No reviews found</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div 
              key={review.id}
              className="group bg-white rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-md transition-all p-6 md:p-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Review Content */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={cn(
                            "w-4 h-4",
                            review.rating >= star ? "fill-amber-400 text-amber-400" : "text-gray-100"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                      review.status === 'active' ? "bg-green-50 text-green-600 border-green-100" :
                      review.status === 'ban' ? "bg-red-50 text-red-600 border-red-100" :
                      "bg-amber-50 text-amber-600 border-amber-100"
                    )}>
                      {review.status}
                    </span>
                  </div>

                  <p className="text-gray-700 font-medium leading-relaxed italic">
                    "{review.comment || <span className="text-gray-300 italic">No comment provided</span>}"
                  </p>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-lg bg-gray-50 select-none">
                         <User className="w-3 h-3 text-gray-400" />
                       </div>
                       <div className="text-xs">
                         <p className="font-bold uppercase" style={{ color: "var(--dash-text-primary)" }}>{review.user?.name || "Anonymous User"}</p>
                         <p className="font-medium lowercase" style={{ color: "var(--dash-text-secondary)" }}>{review.user?.email || "Deleted Account"}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-lg bg-gray-50 select-none">
                         <Store className="w-3 h-3 text-gray-400" />
                       </div>
                       <div className="text-xs">
                         <p className="font-bold uppercase" style={{ color: "var(--dash-text-primary)" }}>{review.restaurant?.name}</p>
                         <p className="font-medium" style={{ color: "var(--dash-text-secondary)" }}>Order #{review.order?.id?.slice(0, 8)}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-lg bg-gray-50 select-none">
                         <Clock className="w-3 h-3 text-gray-400" />
                       </div>
                       <div className="text-xs">
                         <p className="font-bold uppercase" style={{ color: "var(--dash-text-primary)" }}>Submitted</p>
                         <p className="font-medium" style={{ color: "var(--dash-text-secondary)" }}>{format(new Date(review.createdAt), "MMM d, yyyy")}</p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                 <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                   {review.status !== 'active' && (
                     <button
                       onClick={() => handleStatusUpdate(review.id, 'active')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#22c55e] text-white font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50"
                     >
                       <CheckCircle className="w-3.5 h-3.5" />
                       Approve
                     </button>
                   )}
                   {review.status !== 'ban' && (
                     <button
                       onClick={() => handleStatusUpdate(review.id, 'ban')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-red-100 text-[#ef4444] font-bold text-xs uppercase tracking-wider hover:bg-red-50 transition-all shadow-sm disabled:opacity-50"
                     >
                       <Ban className="w-3.5 h-3.5" />
                       Block/Ban
                     </button>
                   )}
                   {review.status === 'active' && (
                      <button
                       onClick={() => handleStatusUpdate(review.id, 'inactive')}
                       disabled={!!updatingId}
                       className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all disabled:opacity-50"
                     >
                       <Clock className="w-3.5 h-3.5" />
                       Hold/Hide
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
