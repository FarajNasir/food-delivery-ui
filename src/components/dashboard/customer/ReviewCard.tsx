"use client";

import React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ReviewCardProps {
  review: {
    id: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string | Date;
  };
  compact?: boolean;
}

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-[1.5rem] border border-gray-100/60 shadow-sm transition-all hover:shadow-md",
        compact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center font-black text-gray-400 text-[9px] uppercase border border-gray-100/50 shrink-0">
            {review.userName?.charAt(0)}
          </div>
          <p className="text-[11px] font-bold font-heading text-gray-900 uppercase tracking-tight truncate max-w-[120px]">
            {review.userName}
          </p>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star 
              key={star} 
              className={cn(
                "w-2.5 h-2.5", 
                review.rating >= star ? "fill-amber-400 text-amber-400" : "text-gray-100"
              )} 
            />
          ))}
        </div>
      </div>
      
      <p className={cn(
        "text-gray-600 font-medium leading-tight px-0.5",
        compact ? "text-[10px] line-clamp-1" : "text-[11px] font-sans"
      )}>
        {review.comment || <span className="text-gray-300 italic font-sans">No comment provided</span>}
      </p>
      
      {!compact && (
        <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest font-sans">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </p>
        </div>
      )}
    </div>
  );
}
