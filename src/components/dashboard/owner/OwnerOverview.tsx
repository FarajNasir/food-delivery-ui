"use client";

import React from "react";
import { Globe, Users, Store, TrendingUp, Clock, CheckCircle2, Package, Truck, Utensils, ArrowRight, ChevronRight, Activity } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import StatCard from "@/components/dashboard/shared/StatCard";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { useOwnerOrders } from "@/context/OwnerOrderContext";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stats: { 
  label: string; 
  value: string | number; 
  icon: any; 
  color: "purple" | "blue" | "amber" | "green" | "red"; 
  trend?: { value: string; positive: boolean } 
}[] = [
  { label: "Total Sites",        value: "3",      icon: Globe,       color: "purple" },
  { label: "Total Restaurants",  value: "110",    icon: Store,       color: "blue"   },
  { label: "Total Users",        value: "1,240",  icon: Users,       color: "green",  trend: { value: "12% this month", positive: true } },
  { label: "Monthly Revenue",    value: "£8,300", icon: TrendingUp,  color: "amber",  trend: { value: "8% vs last month", positive: true } },
];

const sites = [
  { name: "Kilkeel Eats",      orders: 142, revenue: "£2,840", restaurants: 30, color: "bg-red-500" },
  { name: "Newcastle Eats",    orders: 98,  revenue: "£1,960", restaurants: 35, color: "bg-green-600" },
  { name: "Downpatrick Eats",  orders: 175, revenue: "£3,500", restaurants: 45, color: "bg-blue-600" },
];

export default function OwnerOverview({ user }: { user: SessionUser }) {
  const { orders, loading } = useOwnerOrders();

  const activeOrders = orders.filter(o => 
    o.status === "PENDING_CONFIRMATION" || 
    o.status === "CONFIRMED" ||
    o.status === "PAID" || 
    o.status === "PREPARING" ||
    o.status === "OUT_FOR_DELIVERY"
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 px-4 md:px-0 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <PageHeader
          title={`Welcome, ${user.name.split(' ')[0]}`}
          subtitle="Platform performance overview"
        />
        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm self-start md:self-auto">
           <Activity className="w-3.5 h-3.5 text-blue-500" />
           <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Live</span>
        </div>
      </div>

      {/* Stats Grid - Fixed for Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
        {/* Recent Live Orders Summary */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Recent Activity</h2>
            <Link 
              href="/dashboard/owner/orders"
              className="group flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
            >
              Order Desk
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl md:rounded-[2.5rem] border border-gray-50 shadow-sm">
               <div className="w-8 h-8 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin" />
               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Syncing...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="py-20 md:py-24 text-center bg-white rounded-2xl md:rounded-[3.5rem] border-2 md:border-4 border-dashed border-gray-50 shadow-sm">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Utensils className="w-6 h-6 text-gray-200" />
               </div>
               <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Queue is Clear</h3>
               <p className="text-gray-400 font-medium text-xs">No active orders right now.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {activeOrders.map((order) => (
                <Link 
                  key={order.id} 
                  href="/dashboard/owner/orders"
                  className="group relative flex items-center justify-between p-4 md:p-6 bg-white rounded-xl md:rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4 md:gap-6 min-w-0">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center text-white font-bold text-[9px] md:text-[10px] shadow-lg flex-shrink-0",
                      order.status === 'PENDING_CONFIRMATION' ? 'bg-amber-500 shadow-amber-100' : 'bg-blue-500 shadow-blue-100'
                    )}>
                      #{order.id.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-base md:text-lg leading-none mb-1 group-hover:text-blue-600 transition-colors truncate">
                        {order.restaurant.name}
                      </h4>
                      <div className="flex items-center gap-2">
                         <span className={cn(
                           "text-[7px] md:text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md leading-none",
                           order.status === 'PENDING_CONFIRMATION' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                         )}>
                            {order.status.replace(/_/g, ' ')}
                         </span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">• {order.items.length} items</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 md:gap-6 flex-shrink-0 ml-4">
                     <span className="text-lg md:text-xl font-extrabold text-gray-900 tracking-tight">£{parseFloat(order.totalAmount).toFixed(2)}</span>
                     <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-100 items-center justify-center text-gray-300 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                        <ArrowRight className="w-4 h-4" />
                     </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sites Sidebar */}
        <div className="space-y-6 md:space-y-8">
           <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">Zone Metrics</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
             {sites.map((site) => (
               <div key={site.name} className="relative bg-white rounded-xl md:rounded-[2rem] p-5 md:p-6 border border-gray-50 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className={cn("absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 -mr-12 md:-mr-16 -mt-12 md:-mt-16 rounded-full blur-3xl opacity-5", site.color)} />
                  <div className="flex items-center gap-2.5 mb-4 md:mb-6 relative z-10">
                    <div className={cn("w-1.5 h-1.5 rounded-full", site.color)} />
                    <span className="font-bold text-gray-700 text-[9px] md:text-[10px] uppercase tracking-widest">{site.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 relative z-10">
                     <div className="bg-gray-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100/50">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Orders</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 uppercase">{site.orders}</p>
                     </div>
                     <div className="bg-gray-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100/50 text-right">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1 leading-none">Revenue</p>
                        <p className="text-lg md:text-xl font-bold text-gray-900 uppercase">{site.revenue}</p>
                     </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
