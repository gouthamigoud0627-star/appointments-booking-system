import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CalendarCheck, 
  Clock, 
  Users, 
  ShieldAlert, 
  ArrowUpRight, 
  Percent, 
  BarChart2, 
  RefreshCw 
} from 'lucide-react';
import { AnalyticsSummary, SupportedLocale } from '../types';
import { translations } from '../i18n';

interface AnalyticsDashboardProps {
  analytics: AnalyticsSummary | null;
  loading: boolean;
  onRefresh: () => void;
  locale: SupportedLocale;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  loading,
  onRefresh,
  locale,
}) => {
  const t = translations[locale];

  if (!analytics) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4 text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Compiling real-time booking and revenue metrics...</p>
      </div>
    );
  }

  // Calculate highest hour count for histogram scaling
  const maxHourCount = Math.max(...analytics.busiestHours.map((h) => h.count), 1);
  const maxWeeklyRevenue = Math.max(...analytics.weeklyTrend.map((w) => w.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <span>{t.realtimeAnalytics}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated financial metrics, capacity utilization, and booking demand patterns.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.totalRevenue}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-display">
            ${analytics.totalRevenue.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.4% vs last week</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.totalBookings}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-display">
            {analytics.totalBookings}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {analytics.confirmedCount} confirmed • {analytics.pendingCount} pending
          </div>
        </div>

        {/* Deposits Collected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t.depositCollected}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700 font-display">
            ${analytics.depositCollected.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Escrow deposits held securely
          </div>
        </div>

        {/* Completion & Retained Fees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-display">
            {analytics.completionRate}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            ${analytics.cancellationFeesCollected} cancellation fee retained
          </div>
        </div>
      </div>

      {/* Charts Grid: Weekly Revenue Trends & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Revenue & Booking Volume */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Weekly Revenue & Booking Volume
            </h3>
            <span className="text-[11px] text-slate-400">7-day rolling window</span>
          </div>

          <div className="pt-4 h-48 flex items-end justify-between gap-2 border-b border-slate-100 pb-2">
            {analytics.weeklyTrend.map((item, idx) => {
              const heightPercent = Math.max(15, Math.round((item.revenue / maxWeeklyRevenue) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    ${item.revenue} • {item.bookings} bookings
                  </div>
                  
                  <div
                    className="w-full bg-indigo-500/80 hover:bg-indigo-600 rounded-t-lg transition-all duration-300"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] font-semibold text-slate-500 mt-1">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Average Ticket: <strong>${analytics.avgBookingValue}</strong></span>
            <span>Total Week Capacity: <strong>91.4%</strong></span>
          </div>
        </div>

        {/* Busiest Booking Hours Histogram */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{t.peakHours}</span>
            </h3>
            <span className="text-[11px] text-slate-400">Traffic Heatmap</span>
          </div>

          <div className="space-y-2.5 pt-2">
            {analytics.busiestHours.map((h, i) => {
              const pct = Math.round((h.count / maxHourCount) * 100);
              const isPeak = pct > 75;
              return (
                <div key={i} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold text-slate-700">{h.hour}</span>
                    <span className="text-slate-400 font-mono">
                      {h.count} sessions {isPeak && '🔥 Peak'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isPeak ? 'bg-amber-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service Performance Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Service Category Breakdown & Contribution
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Service Name</th>
                <th className="py-2.5 px-3">Bookings Count</th>
                <th className="py-2.5 px-3">Gross Generated</th>
                <th className="py-2.5 px-3">Demand Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.servicePerformance.map((srv, idx) => {
                const share = analytics.totalRevenue > 0
                  ? Math.round((srv.revenue / analytics.totalRevenue) * 100)
                  : 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: srv.color }}
                      />
                      <span>{srv.serviceName}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{srv.count} sessions</td>
                    <td className="py-3 px-3 font-bold text-slate-900">${srv.revenue.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-slate-500 font-medium">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
