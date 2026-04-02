"use client";

import { useState } from "react";
import { Banknote, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import StatCard from "@/components/dashboard/shared/StatCard";

type Period = "today" | "week" | "month";

const STATS: Record<Period, { earnings: string; deliveries: number; hours: string; perDelivery: string }> = {
  today: { earnings: "£48.00",  deliveries: 7,  hours: "5.5", perDelivery: "£6.86" },
  week:  { earnings: "£312.50", deliveries: 43, hours: "38",  perDelivery: "£7.27" },
  month: { earnings: "£1,240",  deliveries: 172,hours: "150", perDelivery: "£7.21" },
};

interface EarningsRow {
  date:       string;
  deliveries: number;
  hours:      string;
  earnings:   string;
  tips:       string;
  total:      string;
}

const HISTORY: EarningsRow[] = [
  { date: "Today, 2 Apr",    deliveries: 7,  hours: "5.5", earnings: "£42.00", tips: "£6.00",  total: "£48.00" },
  { date: "Tue, 1 Apr",      deliveries: 9,  hours: "7",   earnings: "£54.00", tips: "£8.50",  total: "£62.50" },
  { date: "Mon, 31 Mar",     deliveries: 6,  hours: "5",   earnings: "£36.00", tips: "£4.00",  total: "£40.00" },
  { date: "Sun, 30 Mar",     deliveries: 11, hours: "8",   earnings: "£66.00", tips: "£12.00", total: "£78.00" },
  { date: "Sat, 29 Mar",     deliveries: 10, hours: "7.5", earnings: "£60.00", tips: "£9.50",  total: "£69.50" },
  { date: "Fri, 28 Mar",     deliveries: 8,  hours: "6",   earnings: "£48.00", tips: "£7.00",  total: "£55.00" },
  { date: "Thu, 27 Mar",     deliveries: 7,  hours: "5.5", earnings: "£42.00", tips: "£5.50",  total: "£47.50" },
];

const PERIOD_LABELS: Record<Period, string> = {
  today: "Today",
  week:  "This Week",
  month: "This Month",
};

export default function DriverEarnings() {
  const [period, setPeriod] = useState<Period>("week");
  const stats = STATS[period];

  return (
    <div>
      <PageHeader
        title="Earnings"
        subtitle="Your earnings breakdown and history"
        action={
          <div className="flex gap-1.5">
            {(["today", "week", "month"] as Period[]).map((p) => (
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
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Earnings"           value={stats.earnings}           icon={Banknote}     color="green"  />
        <StatCard label="Deliveries"         value={stats.deliveries}         icon={CheckCircle2} color="blue"   />
        <StatCard label="Hours Worked"       value={`${stats.hours}h`}        icon={Clock}        color="amber"  />
        <StatCard label="Avg. per Delivery"  value={stats.perDelivery}        icon={TrendingUp}   color="purple" />
      </div>

      {/* Earnings breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Bar chart (simplified) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Daily Earnings (Last 7 Days)</h2>
          <div className="flex items-end gap-2 h-40">
            {HISTORY.slice().reverse().map((row, i) => {
              const val    = parseFloat(row.total.replace("£", ""));
              const maxVal = Math.max(...HISTORY.map((r) => parseFloat(r.total.replace("£", ""))));
              const pct    = Math.round((val / maxVal) * 100);
              const isToday = i === HISTORY.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {row.total}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${pct}%`,
                      background: isToday ? "#111827" : "#e5e7eb",
                      minHeight: 4,
                    }}
                  />
                  <span className="text-xs text-gray-400">
                    {row.date.split(",")[0].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tips breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Breakdown (This Week)</h2>
          <div className="space-y-3">
            {[
              { label: "Base Pay",  value: "£252.00", color: "#111827" },
              { label: "Tips",      value: "£60.50",  color: "#22c55e" },
              { label: "Bonuses",   value: "£0.00",   color: "#f59e0b" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-sm font-bold text-gray-900">£312.50</span>
            </div>
          </div>
        </div>

      </div>

      {/* History table */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Earnings History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left font-semibold text-gray-500">Date</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">Deliveries</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500 hidden sm:table-cell">Hours</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500 hidden md:table-cell">Base</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500 hidden md:table-cell">Tips</th>
                <th className="px-5 py-3 text-right font-semibold text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HISTORY.map((row) => (
                <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-900">{row.date}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{row.deliveries}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600 hidden sm:table-cell">{row.hours}h</td>
                  <td className="px-5 py-3.5 text-right text-gray-600 hidden md:table-cell">{row.earnings}</td>
                  <td className="px-5 py-3.5 text-right text-green-600 hidden md:table-cell">{row.tips}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{row.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
