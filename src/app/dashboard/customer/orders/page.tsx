"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import { ShoppingBag, Clock, CheckCircle2, CreditCard, Package, Truck, AlertCircle, Store } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; description: string }> = {
  PENDING_CONFIRMATION: {
    label: "Awaiting Confirmation",
    icon: Clock,
    color: "#EAB308", // Yellow
    description: "Waiting for restaurant to confirm your order...",
  },
  CONFIRMED: {
    label: "Confirmed",
    icon: CheckCircle2,
    color: "#22C55E", // Green
    description: "Restaurant confirmed! Please proceed with payment.",
  },
  PAID: {
    label: "Paid",
    icon: CreditCard,
    color: "#3B82F6", // Blue
    description: "Payment successful. Preparing your food...",
  },
  PREPARING: {
    label: "Preparing",
    icon: Package,
    color: "#A855F7", // Purple
    description: "Chef is working on your meal!",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    icon: Truck,
    color: "#F97316", // Orange
    description: "Your food is on the way!",
  },
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle2,
    color: "#10B981", // Emerald
    description: "Enjoy your meal!",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertCircle,
    color: "#EF4444", // Red
    description: "This order was cancelled.",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-12 px-4 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "var(--dash-text-primary)" }}>
          My Orders
        </h1>
        <p className="text-sm font-medium opacity-50" style={{ color: "var(--dash-text-secondary)" }}>
          Track your delicious meals in real-time
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-sm">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-200 mb-6" />
          <h3 className="text-xl font-black text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-400 font-medium">Hungry? Order something delicious from your favourite restaurant!</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {orders.map((order: any) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING_CONFIRMATION;
            const Icon = config.icon;

            return (
              <div 
                key={order.id}
                className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 md:gap-8 items-start relative overflow-hidden"
              >
                {/* Visual Status Indicator in bg */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10"
                  style={{ backgroundColor: config.color }}
                />

                <div 
                  className="w-20 h-20 rounded-[1.75rem] flex items-center justify-center flex-shrink-0 shadow-lg shadow-gray-100"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-10 h-10" style={{ color: config.color }} />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl bg-gray-50 text-gray-400 border border-gray-100 shadow-sm">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span 
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm"
                      style={{ backgroundColor: `${config.color}15`, color: config.color }}
                    >
                      {config.label}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 ml-auto">
                      <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Store className="w-5 h-5 text-gray-400" />
                        {order.restaurant?.name || "Restaurant"}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {config.description}
                      </p>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-50/50 rounded-2xl p-4 space-y-2 border border-gray-50">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm font-medium">
                          <span className="text-gray-700">
                             <span className="text-xs opacity-50 mr-2">{item.quantity}x</span>
                             {item.menuItem?.name || "Dish"}
                          </span>
                          <span className="text-gray-400 font-bold">£{parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Grand Total</p>
                      <p className="text-xl md:text-2xl font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-48 flex flex-col justify-end pt-4 md:pt-0">
                  {order.status === "CONFIRMED" && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "PAID", "pi_mock_" + Date.now())}
                      className="w-full px-8 py-4 rounded-2xl text-white font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
                    >
                      Process Payment
                    </button>
                  )}
                  {order.status === "PAID" && (
                    <div className="flex flex-col items-center gap-2 py-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Payment Secured</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
