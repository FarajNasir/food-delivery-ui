"use client";

import React from "react";
import {
  Clock, CreditCard, ChevronRight, Star, Loader2,
  ShoppingBag, Timer, PackageCheck, Truck, Package, AlertCircle, CheckCircle2, RotateCcw,
  Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderTimer } from "@/hooks/useOrderTimer";

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
  onPay: (id: string) => void;
  onTrack: (subOrderId: string) => void;
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
  onPay,
  onTrack
}: OrderSessionCardProps) {
  const config = SESSION_STATUS_CONFIG[session.status] || SESSION_STATUS_CONFIG.PENDING;
  
  const date = new Date(session.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  const totalAmount = parseFloat(session.totalItemsAmount) + parseFloat(session.totalDeliveryFee);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="h-0.5" style={{ background: config.hex }} />
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 border border-gray-100">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Order Session</p>
              <p className="text-[10px] text-gray-400">{date} · {session.orders.length} Restaurant{session.orders.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-black text-gray-900 text-sm">£{totalAmount.toFixed(2)}</p>
            <span className={cn("inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1", config.bg, config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Sub-orders List */}
        <div className="space-y-3">
          {session.orders.map((order) => {
            const subConfig = SUB_ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-400", icon: Clock };
            const StatusIcon = subConfig.icon;
            
            return (
              <div key={order.id} className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-3 h-3 text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">{order.restaurant?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-gray-100">
                    <StatusIcon className={cn("w-2.5 h-2.5", subConfig.color)} />
                    <span className={cn("text-[9px] font-bold uppercase", subConfig.color)}>{subConfig.label}</span>
                  </div>
                </div>
                
                {/* Item summary for this sub-order */}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-gray-400 font-medium">
                    {order.items?.map((i: any) => `${i.quantity}x ${i.menuItem?.name}`).join(", ")}
                  </p>
                  <button 
                    onClick={() => onTrack(order.id)}
                    className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-0.5 hover:text-gray-600 transition-colors"
                  >
                    Track <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-50 flex items-center gap-2">
          {session.status === "READY_TO_PAY" && (
            <button
              onClick={() => onPay(session.id)}
              disabled={isPaying}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
            >
              {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {isPaying ? "Initialising..." : `Pay £${totalAmount.toFixed(2)} Now`}
            </button>
          )}

          {session.status === "PAID" && (
            <div className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Session Paid Successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
