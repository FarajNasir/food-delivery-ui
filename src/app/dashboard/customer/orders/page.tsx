"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, ChevronRight, Star, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FeedbackModal from "@/components/dashboard/customer/FeedbackModal";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; hex: string; bg: string; description: string }
> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "text-amber-700",
    bg: "bg-amber-50",
    hex: "#F59E0B",
    description: "Waiting for the restaurant to confirm your order",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "text-green-700",
    bg: "bg-green-50",
    hex: "#22C55E",
    description: "Confirmed — ready to proceed with payment",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "text-blue-700",
    bg: "bg-blue-50",
    hex: "#3B82F6",
    description: "Payment received — kitchen is on it",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "text-purple-700",
    bg: "bg-purple-50",
    hex: "#A855F7",
    description: "Chef is working on your meal",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    hex: "#F97316",
    description: "Your food is on the way",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    hex: "#10B981",
    description: "Enjoy your meal!",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "text-red-700",
    bg: "bg-red-50",
    hex: "#EF4444",
    description: "This order was cancelled",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus, refreshOrders } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState<string | null>(null);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = React.useState<any>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);

  const handlePayment = async (orderId: string) => {
    try {
      setIsPaying(orderId);
      const res = await fetch(`/api/orders/${orderId}/stripe/session`, { method: "POST" });
      const data = await res.json();
      const sessionUrl = data.url || data.data?.url;
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        toast.error(data.message || data.error || "Failed to initialize payment session");
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: gradientFrom }} />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-16 space-y-8">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
          My Orders
        </h1>
        <p className="text-sm font-medium text-gray-400 mt-1">
          Track your meals or browse your order history.
        </p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="py-32 flex flex-col items-center gap-4 rounded-3xl bg-white border border-gray-100">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: `${gradientFrom}12` }}
          >
            <ShoppingBag className="w-7 h-7" style={{ color: gradientFrom }} />
          </div>
          <div className="text-center">
            <p className="text-base font-black text-gray-800">No orders yet</p>
            <p className="text-sm text-gray-400 font-medium mt-1">Hungry? Find something delicious nearby.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/customer")}
            className="mt-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION;
            const Icon = config.icon;
            const date = new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            });

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* Coloured accent bar */}
                <div className="h-[3px]" style={{ background: config.hex }} />

                <div className="p-6 space-y-5">

                  {/* ── Top: status + restaurant + price ── */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Status icon */}
                      <div
                        className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0", config.bg)}
                      >
                        <Icon className="w-5 h-5" style={{ color: config.hex }} />
                      </div>

                      <div className="min-w-0">
                        {/* Status badge + order id */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", config.bg, config.color)}
                          >
                            {config.label}
                          </span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                            #{order.id?.slice(0, 8)}
                          </span>
                        </div>

                        {/* Restaurant */}
                        <p className="font-black text-gray-900 text-base leading-tight truncate">
                          {order.restaurant?.name ?? "Restaurant"}
                        </p>

                        {/* Description + date */}
                        <p className="text-xs font-medium text-gray-400 mt-0.5">{config.description}</p>
                      </div>
                    </div>

                    {/* Price + date */}
                    <div className="text-right shrink-0">
                      <p className="text-xl font-black text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {date}
                      </p>
                    </div>
                  </div>

                  {/* ── Items list ── */}
                  {order.items?.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="h-px bg-gray-50" />
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] font-black text-gray-400 bg-gray-50 border border-gray-100 rounded-lg w-7 h-6 flex items-center justify-center"
                            >
                              {item.quantity}×
                            </span>
                            <span className="text-sm font-semibold text-gray-700">
                              {item.menuItem?.name ?? "Item"}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-500">
                            £{parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="h-px bg-gray-50 !mt-3" />
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          Order Total
                        </span>
                        <span className="text-base font-black" style={{ color: accent }}>
                          £{parseFloat(order.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Actions ── */}
                  <div className="space-y-2 pt-1">

                    {/* Pay now */}
                    {order.status === "CONFIRMED" && (
                      <button
                        onClick={() => handlePayment(order.id)}
                        disabled={!!isPaying}
                        className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:translate-y-0"
                        style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                      >
                        {isPaying === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        {isPaying === order.id ? "Initializing…" : "Complete Secure Payment"}
                      </button>
                    )}

                    {/* Payment confirmed */}
                    {order.status === "PAID" && (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 text-blue-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Payment Confirmed</span>
                      </div>
                    )}

                    {/* Rate experience */}
                    {order.status === "DELIVERED" && (
                      !order.review ? (
                        <button
                          onClick={() => { setSelectedOrderForFeedback(order); setIsFeedbackOpen(true); }}
                          className="w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                        >
                          <Star className="w-4 h-4 fill-white" />
                          Rate Your Experience
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 text-emerald-700">
                          <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {order.review.status === "active" ? `Rated ${order.review.rating}/5` : "Review Pending"}
                          </span>
                        </div>
                      )
                    )}

                    {/* Track order */}
                    <button
                      onClick={() => router.push(`/dashboard/customer/status/${order.id}`)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      View Real-time Tracking
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => { setIsFeedbackOpen(false); setSelectedOrderForFeedback(null); }}
        order={selectedOrderForFeedback}
        site={site}
        onSuccess={refreshOrders}
      />
    </div>
  );
}
