"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import { BarChart3, ShoppingBag, Store, Users } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";
import { toast } from "sonner";

type Period = "7d" | "30d" | "90d";

const PERIOD_LABELS: Record<Period, string> = {
  "7d":  "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
};

const STATS: Record<Period, { revenue: string; orders: string; restaurants: number; users: string; revGrowth: number; ordersGrowth: number }> = {
  "7d":  { revenue: "£8,300",  orders: "415",   restaurants: 110, users: "1,240", revGrowth:  8.3, ordersGrowth:  5.2 },
  "30d": { revenue: "£34,200", orders: "1,710", restaurants: 110, users: "1,240", revGrowth: 11.4, ordersGrowth:  9.7 },
  "90d": { revenue: "£98,500", orders: "4,925", restaurants: 110, users: "1,240", revGrowth:  6.1, ordersGrowth:  4.8 },
};

interface SiteRow {
  name:     string;
  revenue:  Record<Period, string>;
  orders:   Record<Period, number>;
  color:    string;
}

const SITE_ROWS: SiteRow[] = [
  {
    name: "Kilkeel Eats",
    revenue:  { "7d": "£2,840", "30d": "£11,200", "90d": "£31,500" },
    orders:   { "7d": 142,      "30d": 568,        "90d": 1_610 },
    color: "#ef4444",
  },
  {
    name: "Newcastle Eats",
    revenue:  { "7d": "£1,960", "30d": "£8,200",  "90d": "£23,700" },
    orders:   { "7d": 98,       "30d": 392,        "90d": 1_100 },
    color: "#22c55e",
  },
  {
    name: "Downpatrick Eats",
    revenue:  { "7d": "£3,500", "30d": "£14,800", "90d": "£43,300" },
    orders:   { "7d": 175,      "30d": 750,        "90d": 2_215 },
    color: "#3b82f6",
  },
];

const TOP_RESTAURANTS: { name: string; site: string; revenue: string; orders: number }[] = [
  { name: "The Anchor Bar",  site: "Kilkeel Eats",     revenue: "£980",  orders: 49 },
  { name: "Sushi Station",   site: "Downpatrick Eats", revenue: "£870",  orders: 42 },
  { name: "Pizza Palace",    site: "Newcastle Eats",   revenue: "£745",  orders: 38 },
  { name: "Burger Barn",     site: "Downpatrick Eats", revenue: "£690",  orders: 35 },
  { name: "Noodle House",    site: "Kilkeel Eats",     revenue: "£560",  orders: 28 },
];

export default function OwnerReports() {
  const [period, setPeriod] = useState<Period>("7d");
  const stats = STATS[period];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Platform-wide performance across all sites"
        action={
          <div className="flex items-center gap-2">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  period === p ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
            <button
              onClick={() => toast.info("Export — coming soon.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={stats.revenue}
          icon={BarChart3}
          color="green"
          trend={{ value: `${stats.revGrowth}% vs prior period`, positive: stats.revGrowth > 0 }}
        />
        <StatCard
          label="Total Orders"
          value={stats.orders}
          icon={ShoppingBag}
          color="blue"
          trend={{ value: `${stats.ordersGrowth}% vs prior period`, positive: stats.ordersGrowth > 0 }}
        />
        <StatCard label="Restaurants" value={stats.restaurants} icon={Store}  color="amber" />
        <StatCard label="Total Users"  value={stats.users}       icon={Users}  color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Sites breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <TrendingUp className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Sites Breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {SITE_ROWS.map((site) => {
              const maxOrders = Math.max(...SITE_ROWS.map((s) => s.orders[period]));
              const pct = Math.round((site.orders[period] / maxOrders) * 100);
              return (
                <div key={site.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: site.color }} />
                      <span className="font-medium text-gray-900">{site.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{site.revenue[period]}</span>
                      <span className="text-gray-400 ml-2 text-xs">{site.orders[period]} orders</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: site.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top restaurants */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <Store className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900">Top Restaurants</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {TOP_RESTAURANTS.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.site}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900">{r.revenue}</p>
                  <p className="text-xs text-gray-400">{r.orders} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
