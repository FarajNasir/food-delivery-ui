"use client";

import React, { useState, useEffect } from "react";
import { 
  Utensils, Package, Truck, Store, CheckCircle2, 
  Clock, ChevronRight, AlertCircle, Loader2, 
  Timer, ChevronDown, MapPin
} from "lucide-react";
import { useOwnerOrders, OwnerOrder } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";

// --- Helpers ---
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return date.toLocaleDateString();
};

const STATUS_STEPS = [
  { id: "PENDING_CONFIRMATION", label: "Accepted",  icon: CheckCircle2 },
  { id: "PAID",                 label: "Paid",      icon: Package },
  { id: "PREPARING",            label: "Kitchen",   icon: Utensils },
  { id: "OUT_FOR_DELIVERY",     label: "On Road",    icon: Truck },
];

const getStepProgress = (status: string) => {
  const index = STATUS_STEPS.findIndex(s => s.id === status);
  if (status === "PENDING_CONFIRMATION") return 0;
  if (index === -1) return 100; // Delivered or unknown
  return ((index) / (STATUS_STEPS.length - 1)) * 100;
};

// --- Sub-components ---

function OrderTicket({ order, onUpdate }: { order: OwnerOrder; onUpdate: (id: string, status: string) => Promise<boolean> }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeAgo, setTimeAgo] = useState(formatTimeAgo(order.createdAt));

  // Update time ago every minute
  useEffect(() => {
    const timer = setInterval(() => setTimeAgo(formatTimeAgo(order.createdAt)), 60000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const handleAction = async (nextStatus: string) => {
    setIsUpdating(true);
    const success = await onUpdate(order.id, nextStatus);
    if (!success) setIsUpdating(false);
  };

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isPending = order.status === "PENDING_CONFIRMATION";

  return (
    <div className={cn(
      "group relative bg-white rounded-[1.5rem] md:rounded-[2rem] border transition-all duration-300 overflow-hidden",
      isPending ? "border-amber-200 shadow-lg shadow-amber-500/5 pulse-subtle" : "border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100"
    )}>
      {/* Visual Header Decoration */}
      <div className={cn(
        "h-1.5 w-full",
        isPending ? "bg-amber-400" : 
        order.status === "OUT_FOR_DELIVERY" ? "bg-purple-500" : "bg-blue-500"
      )} />

      <div className="p-5 md:p-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* Main Info */}
          <div className="flex-1 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight truncate">#{order.id.slice(0, 8)}</h3>
                  <div className={cn(
                    "px-2.5 py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-widest leading-none",
                    isPending ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                  )}>
                    {order.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-medium text-xs md:text-sm">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeAgo}</span>
                  <span className="opacity-20">•</span>
                  <Store className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px] md:max-w-[200px]">{order.restaurant.name}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg md:text-xl font-bold text-gray-900">£{parseFloat(order.totalAmount).toFixed(2)}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{order.items.length} Items</p>
              </div>
            </div>

            {/* Progress Stepper - Mobile Optimized */}
            <div className="py-4">
              <div className="relative">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
                {/* Progress Line */}
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 transition-all duration-1000 ease-out" 
                  style={{ width: `${getStepProgress(order.status)}%` }}
                />
                
                <div className="flex justify-between relative z-10">
                  {STATUS_STEPS.map((step, idx) => {
                    const isActive = idx <= currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex flex-col items-center gap-1.5 bg-white px-1">
                        <div className={cn(
                          "w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all duration-500",
                          isActive ? "bg-blue-500 text-white shadow-md shadow-blue-200" : "bg-white border-2 border-gray-100 text-gray-300"
                        )}>
                          {isActive ? <CheckCircle2 className="w-3 md:w-3.5 h-3 md:h-3.5" /> : <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-current" />}
                        </div>
                        <span className={cn(
                          "text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-center",
                          isActive ? "text-gray-900" : "text-gray-300"
                        )}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Items Summary - Modern List */}
            <div className="bg-gray-50/50 rounded-xl md:rounded-2xl p-4 border border-gray-50">
              <div className="space-y-2.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center group/item text-xs md:text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-900">
                        {item.quantity}
                      </div>
                      <span className="font-bold text-gray-700 group-hover/item:text-gray-900 transition-colors">
                        {item.menuItem.name}
                      </span>
                    </div>
                    <span className="font-bold text-transparent group-hover:text-gray-400 text-[10px] transition-colors">£{parseFloat(item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Column */}
          <div className="lg:w-72 flex flex-col justify-center gap-2.5 pt-4 lg:pt-0 lg:pl-8 lg:border-l border-dashed border-gray-100">
             <div className="text-center lg:text-left mb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Action</p>
             </div>
             
             {isPending && (
               <>
                <button 
                  disabled={isUpdating}
                  onClick={() => handleAction("CONFIRMED")}
                  className="w-full h-14 md:h-16 bg-emerald-600 text-white rounded-[1rem] md:rounded-[1.25rem] font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Confirm Order
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button 
                  disabled={isUpdating}
                  onClick={() => handleAction("CANCELLED")}
                  className="w-full py-3 bg-white text-red-500 border border-red-100 rounded-[1rem] font-bold text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all opacity-70 hover:opacity-100"
                >
                  Reject Request
                </button>
               </>
             )}

             {order.status === "PAID" && (
                <button 
                  disabled={isUpdating}
                  onClick={() => handleAction("PREPARING")}
                  className="w-full h-14 md:h-16 bg-blue-600 text-white rounded-[1rem] md:rounded-[1.25rem] font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Send to Kitchen
                      <Utensils className="w-4 h-4" />
                    </>
                  )}
                </button>
             )}

             {order.status === "PREPARING" && (
                <button 
                  disabled={isUpdating}
                  onClick={() => handleAction("OUT_FOR_DELIVERY")}
                  className="w-full h-14 md:h-16 bg-purple-600 text-white rounded-[1rem] md:rounded-[1.25rem] font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-500/10 hover:bg-purple-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Order Ready
                      <Truck className="w-5 h-5" />
                    </>
                  )}
                </button>
             )}

             {order.status === "OUT_FOR_DELIVERY" && (
                <button 
                  disabled={isUpdating}
                  onClick={() => handleAction("DELIVERED")}
                  className="w-full h-14 md:h-16 bg-emerald-600 text-white rounded-[1rem] md:rounded-[1.25rem] font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      Complete Order
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
             )}

             {!isPending && (
                <div className="mt-1 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                   <AlertCircle className="w-2.5 h-2.5 text-gray-400" />
                   <p className="text-[8px] font-bold text-gray-400 uppercase leading-tight">
                     Customer is tracking live
                   </p>
                </div>
             )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.99; transform: scale(0.999); }
        }
        .pulse-subtle {
          animation: pulse-subtle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default function LiveOrdersView() {
  const { orders, updateOrderStatus, loading } = useOwnerOrders();

  const activeOrders = orders.filter(o => 
    o.status === "PENDING_CONFIRMATION" || 
    o.status === "CONFIRMED" ||
    o.status === "PAID" || 
    o.status === "PREPARING" ||
    o.status === "OUT_FOR_DELIVERY"
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <Utensils className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Live Orders</h1>
          </div>
          <p className="text-xs md:text-sm font-medium text-gray-400 max-w-sm">
            Manage your kitchen workflow and keep hungry customers happy.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 pl-4 pr-3 rounded-2xl border border-gray-100 shadow-sm self-start md:self-auto">
           <div className="flex flex-col">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Status</span>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest leading-none">Live Sync</span>
           </div>
           <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-green-50 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Syncing kitchen branch...
          </p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="py-24 md:py-32 text-center border-2 md:border-4 border-dashed border-gray-50 rounded-[2.5rem] md:rounded-[4rem] bg-white/50 backdrop-blur-sm">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gray-100">
            <Clock className="w-8 h-8 text-gray-200" />
          </div>
          <h3 className="text-xl md:text-2xl font-extrabold text-gray-900 mb-2">Kitchen is Idle</h3>
          <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm">
            All orders have been dispatched. Grab a coffee!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:gap-8">
          {activeOrders.map((order) => (
            <OrderTicket 
              key={order.id} 
              order={order} 
              onUpdate={updateOrderStatus} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
