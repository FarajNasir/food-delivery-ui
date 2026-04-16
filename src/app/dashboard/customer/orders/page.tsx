"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useSite } from "@/context/SiteContext";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, Loader2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FeedbackModal from "@/components/dashboard/customer/FeedbackModal";
import OrderCard from "@/components/dashboard/customer/OrderCard";
import OrderSessionCard from "@/components/dashboard/customer/OrderSessionCard";

export interface StatusConfig {
  label: string;
  icon: any;
  color: string;
  hex: string;
  bg: string;
  description: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING_CONFIRMATION: {
    label: "Confirming",
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
  DISPATCH_REQUESTED: {
    label: "Dispatching",
    icon: Truck,
    color: "text-orange-700",
    bg: "bg-orange-50",
    hex: "#FB923C",
    description: "Your courier is being arranged",
  },
  OUT_FOR_DELIVERY: {
    label: "On the Way",
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
    color: "text-red-500",
    bg: "bg-red-50",
    hex: "#EF4444",
    description: "This order was cancelled",
  },
};

export default function CustomerOrdersPage() {
  const { orders, loading, updateOrderStatus, refreshOrders, reorder } = useOrders();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState<string | null>(null);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = React.useState<any>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const handleReorder = async (orderId: string) => {
    try {
      setIsReordering(orderId);
      const res = await reorder(orderId);
      if (res.success && res.orderId) {
        router.push(`/dashboard/customer/status/${res.orderId}`);
      }
    } finally {
      setIsReordering(null);
    }
  };

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

  const handleExpire = async (orderId: string) => {
    await updateOrderStatus(orderId, "CANCELLED");
    toast.error("Restaurant didn't respond in time. Order cancelled.");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handleSessionPayment = async (sessionId: string) => {
    try {
      setIsPaying(sessionId);
      const res = await fetch(`/api/orders/session/${sessionId}/stripe/session`, { method: "POST" });
      const data = await res.json();
      const sessionUrl = data.url || data.data?.url;
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        toast.error(data.message || data.error || "Failed to initialize session payment");
      }
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      setIsPaying(null);
    }
  };

  // --- Grouping Logic ---
  const [sessionDetails, setSessionDetails] = React.useState<Record<string, any>>({});
  const groupedItems = React.useMemo(() => {
    const sessionsMap: Record<string, any> = {};
    const standalones: any[] = [];
    orders.forEach(order => {
      if (order.sessionId) {
        if (!sessionsMap[order.sessionId]) {
          sessionsMap[order.sessionId] = { id: order.sessionId, orders: [], createdAt: order.createdAt, status: "PENDING", totalItemsAmount: "0", totalDeliveryFee: "0" };
        }
        sessionsMap[order.sessionId].orders.push(order);
      } else { standalones.push(order); }
    });
    return { sessions: Object.values(sessionsMap), standalones };
  }, [orders]);

  React.useEffect(() => {
    const sessionIds = Object.keys(orders.reduce((acc, o) => { if (o.sessionId) acc[o.sessionId] = true; return acc; }, {} as any));
    sessionIds.forEach(async (sid) => {
      if (sessionDetails[sid]) return;
      try {
        const res = await fetch(`/api/orders/session/${sid}`);
        const data = await res.json();
        if (data.success) setSessionDetails(prev => ({ ...prev, [sid]: data.data.session }));
      } catch (e) { console.error("Failed to fetch session", sid, e); }
    });
  }, [orders]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: gradientFrom }} />
        <p className="text-xs font-semibold text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  const allItems = [
    ...groupedItems.standalones.map(o => ({ type: "order", data: o, date: new Date(o.createdAt) })),
    ...groupedItems.sessions.map(s => ({ type: "session", data: sessionDetails[s.id] || s, date: new Date(s.createdAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const activeItems = allItems.filter(item => item.type === "order" ? ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"].includes(item.data.status) : ["PENDING", "READY_TO_PAY", "PAID"].includes(item.data.status));
  const pastItems = allItems.filter(item => item.type === "order" ? ["DELIVERED", "CANCELLED"].includes(item.data.status) : ["CANCELLED"].includes(item.data.status));


  return (
    <div className="w-full max-w-xl mx-auto pb-20 px-4 space-y-8">

      {/* Page Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-gray-400 mt-0.5">Track and manage your orders</p>
        </div>
        <button
          onClick={handleRefresh}
          className={cn(
            "p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm text-gray-400 hover:text-gray-700 transition-all active:scale-95",
            refreshing && "animate-spin"
          )}
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 bg-white rounded-3xl border border-dashed border-gray-200">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: `${gradientFrom}14` }}
          >
            <ShoppingBag className="w-7 h-7" style={{ color: gradientFrom }} />
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-800 text-sm">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">Explore restaurants and place your first order!</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/customer")}
            className="px-6 py-2.5 rounded-2xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Find Food
          </button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* Active Orders */}
          {activeItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Active</p>
                <span className="text-[10px] font-bold text-gray-300">· {activeItems.length}</span>
              </div>
              <div className="space-y-3">
                {activeItems.map((item: any) => item.type === "session" ? (
                  <OrderSessionCard
                    key={`session-${item.data.id}`}
                    session={item.data}
                    accent={accent}
                    gradientFrom={gradientFrom}
                    isPaying={isPaying === item.data.id}
                    onPay={handleSessionPayment}
                    onTrack={(id) => router.push(`/dashboard/customer/status/${id}`)}
                  />
                ) : (
                  <OrderCard
                    key={`order-${item.data.id}`}
                    order={item.data}
                    config={STATUS_CONFIG[item.data.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION}
                    accent={accent}
                    gradientFrom={gradientFrom}
                    isPaying={isPaying === item.data.id}
                    isReordering={isReordering === item.data.id}
                    onPay={handlePayment}
                    onReorder={handleReorder}
                    onRate={(o) => { setSelectedOrderForFeedback(o); setIsFeedbackOpen(true); }}
                    onTrack={(id) => router.push(`/dashboard/customer/status/${id}`)}
                    onExpire={handleExpire}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Orders */}
          {pastItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Past Orders</p>
                <span className="text-[10px] font-bold text-gray-300">· {pastItems.length}</span>
              </div>
              <div className="space-y-3">
                {pastItems.map((item: any) => item.type === "session" ? (
                  <OrderSessionCard
                    key={`session-${item.data.id}`}
                    session={item.data}
                    accent={accent}
                    gradientFrom={gradientFrom}
                    isPaying={isPaying === item.data.id}
                    onPay={handleSessionPayment}
                    onTrack={(id) => router.push(`/dashboard/customer/status/${id}`)}
                  />
                ) : (
                  <OrderCard
                    key={`order-${item.data.id}`}
                    order={item.data}
                    config={STATUS_CONFIG[item.data.status] ?? STATUS_CONFIG.PENDING_CONFIRMATION}
                    accent={accent}
                    gradientFrom={gradientFrom}
                    isPaying={isPaying === item.data.id}
                    isReordering={isReordering === item.data.id}
                    onPay={handlePayment}
                    onReorder={handleReorder}
                    onRate={(o) => { setSelectedOrderForFeedback(o); setIsFeedbackOpen(true); }}
                    onTrack={(id) => router.push(`/dashboard/customer/status/${id}`)}
                    onExpire={handleExpire}
                  />
                ))}
              </div>
            </div>
          )}
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
