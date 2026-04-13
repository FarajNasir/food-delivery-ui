"use client";

import React from "react";
import {
  Clock, CreditCard, ChevronRight, Star, Loader2,
  ShoppingBag, Timer, PackageCheck, Truck, Package, AlertCircle, CheckCircle2, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderTimer } from "@/hooks/useOrderTimer";

interface OrderCardProps {
  order: any;
  config: any;
  accent: string;
  gradientFrom: string;
  isPaying: boolean;
  isReordering: boolean;
  onPay: (id: string) => void;
  onReorder: (id: string) => void;
  onRate: (order: any) => void;
  onTrack: (id: string) => void;
  onExpire: (id: string) => void;
}

export default function OrderCard({
  order,
  config,
  accent,
  gradientFrom,
  isPaying,
  isReordering,
  onPay,
  onReorder,
  onRate,
  onTrack,
  onExpire
}: OrderCardProps) {
  const isPending = order.status === "PENDING_CONFIRMATION";
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";

  const { formattedTime, isExpired } = useOrderTimer(
    order.createdAt,
    5,
    () => { if (isPending) onExpire(order.id); }
  );

  const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  const itemCount = order.items?.length ?? 0;
  const itemLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <div className={cn(
      "bg-white rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-md",
      isPending ? "border-amber-200/80" : isCancelled ? "border-gray-100" : "border-gray-100"
    )}>
      {/* Thin top accent */}
      <div className="h-0.5" style={{ background: config.hex }} />

      <div className="p-4">
        {/* Row 1: Restaurant + Price */}
        <div className="flex items-start gap-3">
          {/* Icon Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${config.hex}14` }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: config.hex }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate leading-tight">
                  {order.restaurant?.name ?? "Restaurant"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {itemLabel} · {date}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900 text-sm">
                  £{parseFloat(order.totalAmount).toFixed(2)}
                </p>
                <span
                  className={cn(
                    "inline-block text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mt-1",
                    config.bg, config.color
                  )}
                >
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items list */}
        {order.items?.length > 0 && (
          <div className="mt-3 px-1">
            {order.items.slice(0, 3).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <span className="text-[11px] text-gray-500 truncate">
                  <span className="font-bold text-gray-700">{item.quantity}× </span>
                  {item.menuItem?.name}
                </span>
                <span className="text-[11px] font-bold text-gray-600 shrink-0 ml-2">
                  £{parseFloat(item.price).toFixed(2)}
                </span>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-[10px] text-gray-400 mt-1">
                +{order.items.length - 3} more item{order.items.length - 3 !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}

        {/* Timer */}
        {isPending && !isExpired && (
          <div className="mt-3 flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                Waiting for restaurant
              </span>
            </div>
            <span className="text-xs font-black text-amber-600 tabular-nums">{formattedTime}</span>
          </div>
        )}

        {/* Divider */}
        <div className="mt-3 border-t border-gray-50" />

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {/* Primary action */}
          {order.status === "CONFIRMED" && (
            <button
              onClick={() => onPay(order.id)}
              disabled={isPaying}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              {isPaying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
              {isPaying ? "Processing..." : "Pay Now"}
            </button>
          )}

          {order.status === "PAID" && (
            <div className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide text-blue-600 bg-blue-50 border border-blue-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Paid
            </div>
          )}


          {isDelivered && !order.review && (
            <button
              onClick={() => onRate(order)}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              <Star className="w-3.5 h-3.5 fill-white" />
              Rate
            </button>
          )}

          {isDelivered && (
            <button
              onClick={() => onReorder(order.id)}
              disabled={isReordering}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
            >
              {isReordering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Reorder
            </button>
          )}

          {/* Track */}
          <button
            onClick={() => onTrack(order.id)}
            className={cn(
              "py-2.5 px-3 rounded-xl text-[11px] font-bold text-gray-500 border border-gray-100 hover:bg-gray-50 hover:text-gray-700 transition-all flex items-center justify-center gap-1",
              (!order.status.includes("DELIVERED") && order.status !== "CONFIRMED") ? "flex-1" : "shrink-0"
            )}
          >
            Track
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
