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
  const sessionTitle = restaurantCount > 1 ? "Group Order" : "Order Summary";
  const sessionDescription =
    session.status === "READY_TO_PAY"
      ? "Everything is confirmed. Complete payment to lock it in."
      : session.status === "PAID"
        ? "Paid successfully. We'll keep you updated as each kitchen progresses."
        : session.status === "CANCELLED"
          ? "This order could not be completed."
          : "We're checking with the restaurant and lining everything up.";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="h-0.5" style={{ background: config.hex }} />
      
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
              style={{ background: `${config.hex}12`, borderColor: `${config.hex}22` }}
            >
              <ShoppingBag className="w-5 h-5" style={{ color: config.hex }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 leading-tight">{sessionTitle}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{sessionDescription}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-gray-900 text-lg leading-none">£{totalAmount.toFixed(2)}</p>
            <span className={cn("inline-flex items-center text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full mt-2", config.bg, config.color)}>
              {config.label}
            </span>
          </div>
        </div>

        {/* Sub-orders List */}
        <div className="space-y-3">
          {session.orders.map((order) => {
            const subConfig = SUB_ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-400", icon: Clock };
            const StatusIcon = subConfig.icon;
            const orderItemSummary = (order.items || [])
              .slice(0, 2)
              .map((i: any) => `${i.quantity}x ${i.itemName || i.menuItem?.name || "Item"}`)
              .join(", ");
            const remainingItemCount = Math.max((order.items || []).length - 2, 0);
            const orderTotalAmount =
              Number.parseFloat(order.totalAmount || "0") + Number.parseFloat(order.deliveryFee || "0");
            const isDelivered = order.status === "DELIVERED";
            
            return (
              <div key={order.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-3.5 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                      <Store className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-bold text-gray-800 truncate">
                        {order.restaurant?.name || "Restaurant"}
                      </span>
                      <span className="block text-[11px] text-gray-400">
                        £{orderTotalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-gray-100 shrink-0">
                    <StatusIcon className={cn("w-2.5 h-2.5", subConfig.color)} />
                    <span className={cn("text-[9px] font-bold uppercase", subConfig.color)}>{subConfig.label}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-500 font-medium pr-3">
                    {orderItemSummary || "Items are being prepared for this restaurant."}
                    {remainingItemCount > 0 ? ` +${remainingItemCount} more` : ""}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {isDelivered && onRate && !order.review && (
                      <button
                        onClick={() => onRate({
                          ...order,
                          restaurant: order.restaurant || { name: order.restaurantName },
                        })}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 transition-all hover:opacity-90"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                      >
                        <Star className="w-3 h-3 fill-white" />
                        Review
                      </button>
                    )}

                    {isDelivered && onReorder && (
                      <button
                        onClick={() => onReorder(order.id)}
                        disabled={isReordering === order.id}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                      >
                        {isReordering === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        Reorder
                      </button>
                    )}

                    <button 
                      onClick={() => onTrack(order.id)}
                      className="text-[10px] font-black text-gray-500 uppercase tracking-wider flex items-center gap-0.5 hover:text-gray-700 transition-colors"
                    >
                      Track <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
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
