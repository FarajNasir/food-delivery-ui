"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, Filter, ArrowRight, MessageSquare, StarHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import ReviewCard from "./ReviewCard";
import Link from "next/link";
import { formatReviewCount } from "@/lib/utils/reviewUtils";

interface ReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  reviews: any[];
  restaurantName: string;
}

export default function ReviewSheet({ isOpen, onClose, reviews, restaurantName }: ReviewSheetProps) {
  const [sortBy, setSortBy] = useState<"latest" | "highest">("latest");

  const breakdown = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[5 - r.rating]++;
      }
    });
    return counts;
  }, [reviews]);

  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return b.rating - a.rating;
    });
  }, [reviews, sortBy]);

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-gray-100"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-20">
              <div>
                <div className="flex items-center gap-3 mb-1">
                   <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                     <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                   </div>
                   <h2 className="text-xl font-black text-gray-900 tracking-tight">Reviews</h2>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-heading">
                  Verified feedback for {restaurantName}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 rounded-full bg-gray-50 border border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-8 custom-scrollbar space-y-8">
              {/* Summary Stats Card */}
              <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100/50 space-y-6">
                <div className="flex items-center gap-6">
                   <p className="text-5xl font-black text-gray-900 tracking-tighter">{avgRating}</p>
                   <div>
                     <div className="flex gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star 
                            key={s} 
                            className={cn(
                              "w-3.5 h-3.5", 
                              parseFloat(avgRating) >= s ? "fill-amber-400 text-amber-400" : "text-gray-200"
                            )} 
                          />
                        ))}
                     </div>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-sans">
                        From {formatReviewCount(reviews.length)} customers
                     </p>
                   </div>
                </div>

                <div className="space-y-2.5">
                  {breakdown.map((count, i) => {
                    const stars = 5 - i;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-gray-400 w-3">{stars}</span>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-gray-100 shadow-inner">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full bg-amber-400 rounded-full"
                          />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 w-8 text-right">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sorting Bar */}
              <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md py-4 z-10 border-b border-gray-50 -mx-6 px-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sort</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: "latest", label: "Newest" },
                    { id: "highest", label: "Top" }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSortBy(btn.id as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border",
                        sortBy === btn.id 
                          ? "bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-400/20" 
                          : "bg-white text-gray-400 border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6 pb-24">
                {sortedReviews.length === 0 ? (
                  <div className="py-20 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No reviews found</p>
                  </div>
                ) : (
                  sortedReviews.map((r) => (
                    <ReviewCard key={r.id} review={r} />
                  ))
                )}
              </div>
            </div>

            {/* Fixed Footer CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-white via-white to-white/0 border-t border-gray-50 flex items-center justify-center pointer-events-none">
               <Link
                href="/dashboard/customer/orders"
                className="w-full h-14 rounded-2xl bg-gray-900 flex items-center justify-center gap-3 text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-900/20 pointer-events-auto"
               >
                 Rate your order
                 <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
