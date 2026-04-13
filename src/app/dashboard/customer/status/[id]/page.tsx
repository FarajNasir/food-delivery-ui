"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  ChevronLeft,
  ShoppingBag,
  Store,
  CreditCard,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Timer } from "lucide-react";
import { useOrderTimer } from "@/hooks/useOrderTimer";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; description: string; step: number }> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "#EAB308", // Yellow
    description: "Waiting for restaurant to confirm your order...",
    step: 1
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "#22C55E", // Green
    description: "Restaurant confirmed! Please proceed with payment.",
    step: 2
  },
  PAID: {
    label: "Paid & Preparing",
    icon: CreditCard,
    color: "#3B82F6", // Blue
    description: "Payment successful. Preparing your food...",
    step: 3
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "#A855F7", // Purple
    description: "Chef is working on your meal!",
    step: 3
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "#F97316", // Orange
    description: "Your food is on the way!",
    step: 4
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "#10B981", // Emerald
    description: "Enjoy your meal!",
    step: 5
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "#EF4444", // Red
    description: "This order was cancelled.",
    step: 0
  },
};

export default function OrderStatusPage() {
  const { id } = useParams();
  const { orders, loading, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const [isPaying, setIsPaying] = React.useState(false);

  const order = orders.find(o => o.id === id);

  const handleExpire = async () => {
    if (!order || order.status !== "PENDING_CONFIRMATION") return;
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        toast.error("Order expired as the restaurant did not respond in time.");
        updateOrderStatus(order.id, "CANCELLED");
      }
    } catch (err) {
      console.error("[handleExpire]", err);
    }
  };

  const { formattedTime, isExpired } = useOrderTimer(
    order?.createdAt || new Date().toISOString(),
    5,
    handleExpire
  );

  const handlePayment = async () => {
    if (!order) return;

    try {
      setIsPaying(true);
      const res = await fetch(`/api/orders/${order.id}/stripe/session`, {
        method: "POST",
      });
      const data = await res.json();

      const sessionUrl = data.url || data.data?.url;

      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        toast.error(data.message || data.error || "Failed to initialize payment session");
      }
    } catch (err) {
      console.error("[handlePayment]", err);
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };


  const config = order ? (STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_CONFIRMATION) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30 font-black text-gray-400 uppercase tracking-widest text-xs">
        Locating Order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-10 space-y-6 text-center">
        <AlertCircle className="w-16 h-16 text-gray-200" />
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Order Not Found</h1>
        <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">
          We couldn't find the order you're looking for. It might be archived or incorrect.
        </p>
        <Link href="/dashboard/customer/orders" className="text-xs font-black uppercase tracking-widest text-blue-500 hover:scale-105 transition-all">
          View All Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      <div className="flex items-center gap-6">
        <Link
          href="/dashboard/customer/orders"
          className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6 text-gray-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Track Order</h1>
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-none mt-1">
            #{order.id.slice(0, 8)} • Real-time Status
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Progress Tracker */}
        <div className="lg:col-span-2 space-y-10">

          <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
            {/* Large status icon in bg */}
            <div
              className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 rounded-full blur-[100px] opacity-10"
              style={{ backgroundColor: config?.color }}
            />

            <div className="space-y-10 relative">
              <div className="flex flex-col items-center text-center space-y-6">
                <div
                  className="w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 animate-in fade-in zoom-in"
                  style={{ backgroundColor: `${config?.color}15`, border: `2px solid ${config?.color}30` }}
                >
                  {config && <config.icon className="w-12 h-12" style={{ color: config.color }} />}
                </div>

                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">{config?.label}</h2>
                  <p className="text-sm font-medium text-gray-400 max-w-md">{config?.description}</p>

                  {order.status === "PENDING_CONFIRMATION" && !isExpired && (
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3 px-5 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm animate-pulse">
                        <Timer className="w-4 h-4 text-amber-500" />
                        <span className="text-lg font-black text-amber-600 tabular-nums tracking-wider">{formattedTime}</span>
                      </div>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                        Auto-cancels if not accepted soon
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Simple Step Bar */}
              <div className="flex justify-between items-center px-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 mx-1 rounded-full transition-all duration-500 ${s <= (config?.step || 0) ? 'shadow-sm' : 'bg-gray-50 opacity-50'
                      }`}
                    style={{
                      backgroundColor: s <= (config?.step || 0) ? config?.color : undefined
                    }}
                  />
                ))}
              </div>

              {/* Action: Payment (Visible ONLY if CONFIRMED) */}
              {(order.status === "CONFIRMED") && (
                <div className="flex flex-col items-center pt-6 animate-bounce">
                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="px-10 py-5 rounded-[1.5rem] text-white font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                  >
                    {isPaying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    )}
                    {isPaying ? "Wait..." : `Pay £${parseFloat(order.totalAmount).toFixed(2)} Now`}
                  </button>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                    Secure Payment via Stripe
                  </p>

                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Order Details</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 py-2 border-b border-gray-50">
                <Store className="w-5 h-5 text-gray-300" />
                <div>
                  <p className="text-sm font-black text-gray-900">{order.restaurant?.name || "Restaurant"}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Preparation Venue</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50/50 rounded-2xl p-6 space-y-3">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-gray-700">
                        <span className="text-xs opacity-50 mr-2">{item.quantity}x</span>
                        {item.menuItem?.name}
                      </span>
                      <span className="text-xs font-black text-gray-400">£{parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="h-px bg-gray-100 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotal</span>
                    <span className="text-xl font-black text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Sidebar / Helper */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black">Help & Support</h3>
              <p className="text-xs font-medium text-white/50 leading-relaxed">
                Something wrong with your order? Our support team is here 24/7.
              </p>
            </div>
            <button className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
              Chat with Support
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center space-y-4">
            <Clock className="w-8 h-8 text-gray-200 mx-auto" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Estimated Delivery<br />
              <span className="text-gray-900 text-lg">25 - 40 Mins</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
