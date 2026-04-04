"use client";

import React from "react";
import { History, CheckCircle2, AlertCircle, Store, Calendar, ArrowRight, Package, Truck, Clock } from "lucide-react";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import { cn } from "@/lib/utils";

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function HistoryOrdersView() {
  const { orders, loading } = useOwnerOrders();

  const historyOrders = orders.filter(o => 
    o.status === "DELIVERED" || 
    o.status === "CANCELLED"
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
              <History className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Order Logs</h1>
          </div>
          <p className="text-xs md:text-sm font-medium text-gray-400 max-w-sm">
            Archive of successful deliveries and rejected requests.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-gray-400 animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
            Fetching archives...
          </p>
        </div>
      ) : historyOrders.length === 0 ? (
        <div className="py-24 md:py-32 text-center border-2 md:border-4 border-dashed border-gray-50 rounded-[2.5rem] md:rounded-[4rem] bg-white/50 backdrop-blur-sm">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gray-100">
            <History className="w-8 h-8 text-gray-100" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Logs are Empty</h3>
          <p className="text-gray-400 font-medium max-w-xs mx-auto text-sm">
            Records will appear here once orders are closed.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6">
          {historyOrders.map((order) => (
            <div 
              key={order.id} 
              className="group relative bg-white/60 backdrop-blur-sm rounded-3xl p-5 md:p-8 border border-gray-100 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-500"
            >
              <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start lg:items-center">
                {/* Info Section */}
                <div className="flex-1 w-full space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 md:gap-3">
                       <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100 text-gray-400">
                         #{order.id.slice(0, 8)}
                       </span>
                       <span className={cn(
                         "text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg md:rounded-xl border",
                         order.status === 'DELIVERED' 
                           ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                           : 'bg-red-50 text-red-600 border-red-100'
                       )}>
                         {order.status.replace(/_/g, ' ')}
                       </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg md:text-xl font-bold text-gray-300 group-hover:text-gray-900 transition-colors tracking-tight">£{parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="space-y-4">
                      <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                         <Store className="w-3.5 h-3.5" /> {order.restaurant.name}
                      </p>
                      <div className="space-y-2 pl-4 border-l-2 border-gray-50">
                        {order.items.map((item, idx) => (
                          <p key={idx} className="text-xs md:text-sm font-bold text-gray-400 group-hover:text-gray-600 transition-colors capitalize truncate">
                            <span className="text-[10px] font-bold text-gray-300 mr-2">{item.quantity}x</span>
                            {item.menuItem.name}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center space-y-3 md:space-y-4">
                       <div className="flex items-center gap-3 text-gray-400">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                            <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {formatDate(order.createdAt)}
                          </span>
                       </div>
                       <div className="flex items-center gap-3 text-gray-400">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 flex-shrink-0">
                            <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            Closed at {formatTime(order.updatedAt)}
                          </span>
                       </div>
                    </div>

                    <div className="flex flex-grow lg:flex-grow-0 flex-col justify-center items-center lg:items-end lg:pr-8 pt-4 lg:pt-0 border-t md:border-t-0 lg:border-l border-dashed border-gray-50">
                       <div className={cn(
                         "w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center transition-all duration-500",
                         order.status === 'DELIVERED' ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
                       )}>
                          {order.status === 'DELIVERED' ? <CheckCircle2 className="w-6 md:w-8 h-6 md:h-8" /> : <AlertCircle className="w-6 md:w-8 h-6 md:h-8" />}
                       </div>
                       <p className="mt-2 text-[8px] font-bold uppercase tracking-widest text-gray-300 lg:hidden">
                         {order.status === 'DELIVERED' ? 'Archived' : 'Rejected'}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
