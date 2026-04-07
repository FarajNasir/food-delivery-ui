"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, Store
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; hex: string; description: string }
> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    hex: "#F59E0B",
    description: "Waiting for restaurant to confirm...",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "bg-green-50 text-green-700 border-green-200",
    hex: "#22C55E",
    description: "Restaurant confirmed — proceed with payment.",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    hex: "#3B82F6",
    description: "Payment received — preparing your food.",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    hex: "#A855F7",
    description: "Chef is working on your meal!",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "bg-orange-50 text-orange-700 border-orange-200",
    hex: "#F97316",
    description: "Your food is on the way!",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    hex: "#10B981",
    description: "Enjoy your meal! 🎉",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "bg-red-50 text-red-700 border-red-200",
    hex: "#EF4444",
    description: "This order was cancelled.",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState<string | null>(null);

  const handlePayment = async (orderId: string) => {
    try {
      setIsPaying(orderId);
      const res = await fetch(`/api/orders/${orderId}/stripe/session`, {
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
      setIsPaying(null);
    }
  };

  const handleMockPayment = async (orderId: string) => {
    try {
      setIsPaying(orderId);
      await updateOrderStatus(orderId, "PAID", "pi_mock_" + Date.now());
      toast.success("Mock Payment successful! (Dev Only)");
    } catch (err) {
      toast.error("Mock payment failed");
    } finally {
      setIsPaying(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fetching orders...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Orders</h1>
        <p className="text-sm font-medium text-gray-500 mt-1">Track your meals or browse your order history.</p>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-900">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Hungry? Discover something delicious nearby!</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {orders.map((order: any) => {
            const config = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION;
            const Icon = config.icon;

            return (
              <div
                key={order.id}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* thin status bar */}
                <div
                  className="h-1 w-full"
                  style={{ backgroundColor: config.hex }}
                />

                <div className="p-6">
                  {/* Top row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: `${config.hex}10` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: config.hex }} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                            Order #{order.id?.slice(0, 8)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              config.color
                            )}
                          >
                            {config.label}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          {order.restaurant?.name || "Restaurant"}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                          {config.description}
                        </p>
                      </div>
                    </div>
                    <div className="md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
                      <p className="text-xl font-black text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center md:justify-end gap-1.5 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-[#FAFAFA] rounded-xl p-4 border border-gray-100/60 mb-5">
                    <div className="space-y-2.5">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 font-medium flex items-center">
                            <span className="w-6 h-6 flex items-center justify-center bg-white border border-gray-100 rounded text-[10px] font-bold text-gray-500 mr-3">
                              {item.quantity}×
                            </span>
                            {item.menuItem?.name || "Item"}
                          </span>
                          <span className="text-gray-500 font-bold">
                            £{parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100/80">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Order Total
                      </span>
                      <span className="text-lg font-black text-gray-900">
                        £{parseFloat(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {(order.status === "CONFIRMED" || (process.env.NODE_ENV === "development" && order.status === "PENDING_CONFIRMATION")) && (
                      <div className="space-y-3">
                        <button
                          onClick={() => handlePayment(order.id)}
                          disabled={!!isPaying}
                          className="w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{
                            background: `linear-gradient(135deg, ${gradientFrom}, ${accent})`,
                          }}
                        >
                          {isPaying === order.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4" />
                          )}
                          {isPaying === order.id ? "Initializing..." : "Complete Secure Payment"}
                        </button>
                        
                        {process.env.NODE_ENV === "development" && (
                          <button
                            onClick={() => handleMockPayment(order.id)}
                            disabled={!!isPaying}
                            className="w-full text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline transition-all py-1"
                          >
                            [ DEV ONLY: SKIP TO PAID STATUS ]
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === "PAID" && (
                      <div className="flex items-center justify-center gap-3 py-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-black text-blue-700 uppercase tracking-widest">
                          Payment Confirmed
                        </span>
                      </div>
                    )}

                    {/* View Details Link */}
                    <button 
                      onClick={() => router.push(`/dashboard/customer/status/${order.id}`)}
                      className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors py-2"
                    >
                      View Real-time Tracking →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>

  );
}
