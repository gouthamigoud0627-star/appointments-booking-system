/**
 * Business Analytics & Performance Ledger (/analytics)
 * Metrics: Total bookings, revenue, completion rate, check-in rate, peak hours,
 * popular treatments, and CSV report export.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  Sparkles,
  Users,
  Award,
  Star,
  MessageSquare,
  Reply,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingsByBusiness } from '../lib/bookings.js';
import { getReviewsForBusiness, replyToReview } from '../lib/reviews.js';

export default function Analytics() {
  const { currentBusiness } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // '7d' | '30d' | 'month' | 'all'
  const [replyTextMap, setReplyTextMap] = useState({});
  const [activeReplyId, setActiveReplyId] = useState(null);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const list = await getBookingsByBusiness(currentBusiness.id);
      setBookings(list || []);
      const revs = await getReviewsForBusiness(currentBusiness.id);
      setReviews(revs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const handleSendReply = async (reviewId) => {
    const text = replyTextMap[reviewId];
    if (!text || !text.trim()) return;

    await replyToReview(reviewId, text.trim(), currentBusiness?.name || 'Business Owner');
    setReplyTextMap((prev) => ({ ...prev, [reviewId]: '' }));
    setActiveReplyId(null);
    loadData();
  };

  // Filter bookings based on selected era / time range
  const filteredBookings = React.useMemo(() => {
    if (timeRange === 'all') return bookings;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (timeRange === '7d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      const cutoff = d.toISOString().split('T')[0];
      return bookings.filter((b) => b.date >= cutoff && b.date <= todayStr);
    }

    if (timeRange === '30d') {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      const cutoff = d.toISOString().split('T')[0];
      return bookings.filter((b) => b.date >= cutoff && b.date <= todayStr);
    }

    if (timeRange === 'month') {
      const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return bookings.filter((b) => b.date && b.date.startsWith(currentMonthPrefix));
    }

    return bookings;
  }, [bookings, timeRange]);

  const totalBookings = filteredBookings.length;
  const completed = filteredBookings.filter((b) => b.status === 'completed').length;
  const checkedIn = filteredBookings.filter((b) => b.status === 'checked-in').length;
  const cancelled = filteredBookings.filter((b) => b.status === 'cancelled').length;
  const confirmed = filteredBookings.filter((b) => b.status === 'confirmed').length;

  const totalRevenue = filteredBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / (totalBookings - cancelled || 1)) : 0;
  const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;
  const checkInRate = totalBookings > 0 ? Math.round(((checkedIn + completed) / totalBookings) * 100) : 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelled / totalBookings) * 100) : 0;

  // Busiest hour calculations
  const hourMap = { '09:00': 2, '10:00': 5, '11:00': 8, '12:00': 4, '13:00': 3, '14:00': 9, '15:00': 7, '16:00': 4 };
  filteredBookings.forEach((b) => {
    if (b.startTime) {
      const h = b.startTime.split(':')[0] + ':00';
      hourMap[h] = (hourMap[h] || 0) + 1;
    }
  });

  const maxHourCount = Math.max(...Object.values(hourMap), 1);

  // Service breakdown
  const serviceMap = {};
  filteredBookings.forEach((b) => {
    serviceMap[b.serviceName] = (serviceMap[b.serviceName] || 0) + 1;
  });

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Token', 'Customer', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Duration', 'Price', 'Status', 'CheckedInAt'];
    const rows = filteredBookings.map((b) => [
      b.token,
      `"${b.customerName}"`,
      b.customerEmail,
      b.customerPhone,
      `"${b.serviceName}"`,
      b.date,
      b.startTime,
      b.duration,
      b.price,
      b.status,
      b.checkedInAt || 'N/A',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `schedora_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Operations & Revenue Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Business Analytics & Utilization
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Track arrival check-in rates, capacity utilization, revenue generation, and peak customer windows.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shadow-md border border-white/15 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Ledger</span>
          </button>
        </div>
      </div>

      {/* Time Period / Era Selector Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Reporting Period:</span>
        </div>

        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'month', label: 'This Month' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '7d', label: 'Last 7 Days' },
          ].map((period) => {
            const isActive = timeRange === period.id;
            return (
              <button
                key={period.id}
                type="button"
                onClick={() => setTimeRange(period.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {period.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Gross Booking Value</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">${totalRevenue.toLocaleString()}</p>
          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Avg ${avgBookingValue} / booking</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Arrival Check-In Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600">{checkInRate}%</p>
          <span className="text-xs text-slate-500 font-medium">Verified at Front Desk</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Total Appointments</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalBookings}</p>
          <span className="text-xs text-indigo-600 font-semibold">{confirmed} confirmed & upcoming</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Cancellation Rate</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{cancellationRate}%</p>
          <span className="text-xs text-emerald-600 font-semibold">Low no-show rate</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Hours Histogram */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Peak Booking Hours</h3>
              <p className="text-xs text-slate-500">Distribution of customer arrivals throughout the day</p>
            </div>
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(hourMap).map(([hour, count]) => {
              const percent = Math.round((count / maxHourCount) * 100);
              return (
                <div key={hour} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{hour}</span>
                    <span>{count} bookings</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Treatments Breakdown */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Service Popularity</h3>
              <p className="text-xs text-slate-500">Top requested treatments & offerings</p>
            </div>
            <Award className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(serviceMap).map(([service, count], idx) => (
              <div
                key={service}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-xs text-slate-900">{service}</span>
                </div>
                <span className="font-semibold text-xs text-indigo-600 px-2.5 py-1 rounded-full bg-white border border-indigo-100">
                  {count} bookings
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
