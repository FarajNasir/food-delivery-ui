"use client";

import React from "react";
import {
  Clock, CreditCard, ChevronRight, Loader2, Star, RotateCcw,
  ShoppingBag, Truck, Package, AlertCircle, CheckCircle2,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderSession {
  id: string;
  status: string;
  totalItemsAmount: string;
  totalDeliveryFee: string;
  createdAt: string;
  orders: any[];
}

interface OrderSessionCardProps {
  session: OrderSession;
  accent: string;
  gradientFrom: string;
  isPaying: boolean;
  isReordering?: string | null;
  onPay: (id: string) => void;
  onTrack: (subOrderId: string) => void;
  onReorder?: (subOrderId: string) => void;
  onRate?: (order: any) => void;
}

const SESSION_STATUS_CONFIG: Record<string, any> = {
  PENDING: { label: "Confirming", color: "text-amber-700", bg: "bg-amber-50", hex: "#F59E0B", icon: Clock },
  READY_TO_PAY: { label: "Accepted - Ready to Pay", color: "text-green-700", bg: "bg-green-50", hex: "#22C55E", icon: CheckCircle2 },
  PAID: { label: "Paid", color: "text-blue-700", bg: "bg-blue-50", hex: "#3B82F6", icon: CreditCard },
  CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-50", hex: "#EF4444", icon: AlertCircle },
};

const SUB_ORDER_STATUS_CONFIG: Record<string, any> = {
  PENDING_CONFIRMATION: { label: "Confirming", color: "text-amber-500", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "text-green-600", icon: CheckCircle2 },
  PAID: { label: "Paid", color: "text-blue-600", icon: CreditCard },
  CANCELLED: { label: "Cancelled", color: "text-red-400", icon: AlertCircle },
  PREPARING: { label: "Preparing", color: "text-purple-600", icon: Package },
  DISPATCH_REQUESTED: { label: "Dispatching", color: "text-orange-500", icon: Truck },
  OUT_FOR_DELIVERY: { label: "On the Way", color: "text-orange-600", icon: Truck },
  DELIVERED: { label: "Delivered", color: "text-emerald-600", icon: CheckCircle2 },
};

export default function OrderSessionCard({
  session,
  accent,
  gradientFrom,
  isPaying,
  isReordering,
  onPay,
  onTrack,
  onReorder,
  onRate
}: OrderSessionCardProps) {
  const config = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.PENDING;

  const date = new Date(session.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const sessionItemsAmount = Number.parseFloat(session.totalItemsAmount || "0");
  const sessionDeliveryFee = Number.parseFloat(session.totalDeliveryFee || "0");
  const sessionTotalAmount = sessionItemsAmount + sessionDeliveryFee;
  const derivedTotalAmount = session.orders.reduce((sum, order) => {
    const itemTotal = Number.parseFloat(order.totalAmount || "0");
    const deliveryTotal = Number.parseFloat(order.deliveryFee || "0");
    return sum + itemTotal + deliveryTotal;
  }, 0);
  const totalAmount = sessionTotalAmount > 0 ? sessionTotalAmount : derivedTotalAmount;
  const restaurantCount = session.orders.length;
  const itemCount = session.orders.reduce((sum, order) => {
    return sum + ((order.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0));
  }, 0);
  const subtitle = `${date} · ${restaurantCount} restaurant${restaurantCount !== 1 ? "s" : ""} · ${itemCount} item${itemCount !== 1 ? "s" : ""}`;
  const sessionTitle = restaurantCount > 1 ? "Group Order" : "Multi-Order";
  const sessionDescription =
    session.status === "READY_TO_PAY"
      ? "Everything is confirmed. Complete payment to lock it in."
      : session.status === "PAID"
        ? "Paid successfully. We'll keep you updated as each kitchen progresses."
        : session.status === "CANCELLED"
          ? "This order could not be completed."
          : "We're checking with the restaurant and lining everything up.";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg group">
      <div className="p-5 sm:p-6">
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 border border-gray-50 shadow-sm transition-transform group-hover:scale-105"
              style={{ background: `${config.hex}10` }}
            >
              <Store className="w-8 h-8" style={{ color: config.hex }} />
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 text-lg truncate leading-tight group-hover:text-gray-950">
                {sessionTitle}
              </h3>
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                <span>{date}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>Session ID: {session.id.slice(-6).toUpperCase()}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5",
                    config.bg, config.color
                  )}
                >
                  <config.icon className="w-3 h-3" />
                  {config.label}
                </span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full border border-gray-100">
                  {restaurantCount} Restaurants
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-4 sm:pt-0">
            <p className="font-black text-gray-900 text-xl tracking-tight">
              £{totalAmount.toFixed(2)}
            </p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{itemCount} Items</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50">
          {sessionDescription}
        </p>

        {/* Sub-orders Grid */}
        <div className="mt-6 space-y-3">
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest px-1">Detailed Breakdown</p>
          <div className="grid grid-cols-1 gap-3">
            {session.orders.map((order) => {
              const subConfig = SUB_ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-400", icon: Clock };
              const StatusIcon = subConfig.icon;
              const orderTotalAmount =
                Number.parseFloat(order.totalAmount || "0") + Number.parseFloat(order.deliveryFee || "0");
              const isDelivered = order.status === "DELIVERED";
              
              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-gray-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{order.restaurant?.name || "Restaurant"}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {order.items?.length || 0} items · £{orderTotalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <StatusIcon className={cn("w-3 h-3", subConfig.color)} />
                      <span className={cn("text-[10px] font-bold uppercase tracking-wide", subConfig.color)}>{subConfig.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDelivered && onRate && !order.review && (
                        <button
                          onClick={() => onRate(order)}
                          className="p-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                          title="Rate Order"
                        >
                          <Star className="w-4 h-4 fill-white" />
                        </button>
                      )}
                      <button 
                        onClick={() => onTrack(order.id)}
                        className="px-3 py-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                      >
                        Track <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Session Actions */}
        {(session.status === "READY_TO_PAY" || session.status === "PAID") && (
          <div className="mt-6 pt-6 border-t border-gray-50">
            {session.status === "READY_TO_PAY" && (
              <button
                onClick={() => onPay(session.id)}
                disabled={isPaying}
                className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
              >
                {isPaying ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {isPaying ? "Initialising..." : `Complete Payment · £${totalAmount.toFixed(2)}`}
              </button>
            )}

            {session.status === "PAID" && (
              <div className="w-full py-3 rounded-xl text-sm font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 flex items-center justify-center gap-3 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
                Session Paid & Confirmed
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
