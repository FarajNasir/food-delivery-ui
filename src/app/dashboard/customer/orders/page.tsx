"use client";

import React from "react";
import { useOrders } from "@/context/OrderContext";
import { useCart } from "@/context/CartContext";
import { useSite } from "@/context/SiteContext";
import { useAuthStore } from "@/store/useAuthStore";
import {
  ShoppingBag, Clock, CheckCircle2, CreditCard,
  Package, Truck, AlertCircle, Loader2, RefreshCw,
  ChevronLeft, ChevronRight
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
  const {
    orders,
    loading,
    pagination,
    refreshOrders
  } = useOrders();
  const { replaceCart } = useCart();
  const { site } = useSite();
  const { gradientFrom, accent } = site.theme;
  const router = useRouter();
  const [isPaying, setIsPaying] = React.useState<string | null>(null);
  const [isReordering, setIsReordering] = React.useState<string | null>(null);
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = React.useState<any>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"all" | "active" | "past">("all");
  const expiringOrdersRef = React.useRef<Set<string>>(new Set());

  const handleReorder = async (orderId: string) => {
    try {
      setIsReordering(orderId);
      const order = orders.find((item) => item.id === orderId);
      const reorderItems = order?.items?.map((item) => ({
        menuItemId: item.menuItem?.id,
        quantity: item.quantity,
      })).filter((item): item is { menuItemId: string; quantity: number } => Boolean(item.menuItemId)) ?? [];

      const success = await replaceCart(reorderItems);
      if (success) {
        toast.success("Your previous items are ready in checkout.");
        router.push("/dashboard/customer/checkout");
      }
    } finally {
      setIsReordering(null);
    }
  };

  const handlePayment = async (orderId: string) => {
    try {
      setIsPaying(orderId);
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/stripe/session`, {
        method: "POST",
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
      });
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
    try {
      const session = useAuthStore.getState().session;
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
        },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message || data?.error || "Failed to cancel expired order.");
        return;
      }

      await refreshOrders();
      toast.error("Restaurant didn't respond in time. Order cancelled.");
    } catch {
      toast.error("A network error occurred. Please try again.");
    } finally {
      expiringOrdersRef.current.delete(orderId);
    }
  };

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      orders.forEach((order) => {
        if (order.status !== "PENDING_CONFIRMATION") return;
        if (expiringOrdersRef.current.has(order.id)) return;

        const createdAt = new Date(order.createdAt).getTime();
        const expiresAt = createdAt + (5 * 60 * 1000);

        if (now >= expiresAt) {
          expiringOrdersRef.current.add(order.id);
          void handleExpire(order.id);
        }
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [orders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  };

  const handlePageChange = async (p: number) => {
    setRefreshing(true);
    await refreshOrders(p);
    setRefreshing(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: gradientFrom }} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Retrieving your feast...</p>
      </div>
    );
  }

  const allItems = [
    ...groupedItems.standalones.map(o => ({ type: "order", data: o, date: new Date(o.createdAt) })),
    ...groupedItems.sessions.map(s => ({ type: "session", data: sessionDetails[s.id] || s, date: new Date(s.createdAt) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const activeItems = allItems.filter(item => {
    if (item.type === "order") {
      return ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"].includes(item.data.status);
    } else {
      const s = item.data;
      if (s.orders && s.orders.length > 0) {
        return s.orders.some((o: any) => ["PENDING_CONFIRMATION", "CONFIRMED", "PAID", "PREPARING", "DISPATCH_REQUESTED", "OUT_FOR_DELIVERY"].includes(o.status));
      }
      return ["PENDING", "READY_TO_PAY", "PAID"].includes(s.status);
    }
  });

  const pastItems = allItems.filter(item => {
    if (item.type === "order") {
      return ["DELIVERED", "CANCELLED"].includes(item.data.status);
    } else {
      const s = item.data;
      if (s.orders && s.orders.length > 0) {
        return s.orders.every((o: any) => ["DELIVERED", "CANCELLED"].includes(o.status));
      }
      return ["CANCELLED"].includes(s.status);
    }
  });

  const displayedItems = activeTab === "all" ? allItems : activeTab === "active" ? activeItems : pastItems;


  return (
    <div className="w-full max-w-5xl mx-auto pt-8 sm:pt-12 pb-24 px-4 sm:px-6 space-y-10">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight sm:text-4xl">Order History</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Manage your past cravings and track active deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className={cn(
              "p-3 bg-white rounded-2xl border border-gray-200 shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all active:scale-95",
              refreshing && "animate-spin"
            )}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-inner">
            {(["all", "active", "past"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  activeTab === tab 
                    ? "bg-white text-gray-900 shadow-md scale-[1.02]" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[2.5rem] border border-dashed border-gray-200 shadow-sm">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner"
            style={{ background: `${gradientFrom}10` }}
          >
            <ShoppingBag className="w-10 h-10" style={{ color: gradientFrom }} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-gray-900">Your stomach is waiting!</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-[280px] mx-auto">You haven't placed any orders yet. Let's find something delicious for you.</p>
          </div>
          <button
            onClick={() => router.push("/dashboard/customer")}
            className="px-8 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest text-white transition-all hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${accent})` }}
          >
            Explore Restaurants
          </button>
        </div>
      ) : (
        <div className="space-y-12">

          {/* Conditional List Rendering */}
          <div className="space-y-6">
            {displayedItems.length === 0 ? (
              <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-gray-100">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No {activeTab} orders found</p>
              </div>
            ) : (
              displayedItems.map((item: any) => item.type === "session" ? (
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
              ))
            )}
          </div>

          {/* Pagination */}
          {!loading && displayedItems.length > 0 && (
            <Pagination
              total={pagination.total}
              page={pagination.page}
              limit={pagination.limit}
              onPageChange={handlePageChange}
              accent={gradientFrom}
            />
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

function Pagination({
  total,
  page,
  limit,
  onPageChange,
  accent
}: {
  total: number;
  page: number;
  limit: number;
  onPageChange: (p: number) => void;
  accent?: string;
}) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  // Simple page range calculation
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);

  for (let i = adjustedStart; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-12 py-6">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2.5 rounded-2xl bg-white border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>

      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "w-11 h-11 rounded-2xl text-xs font-black transition-all duration-300 active:scale-90",
              page === p
                ? "text-white shadow-md scale-105"
                : "text-gray-400 hover:bg-gray-50 hover:text-gray-900"
            )}
            style={page === p ? { background: accent || "black" } : {}}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2.5 rounded-2xl bg-white border border-gray-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
}
