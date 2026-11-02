/**
 * Bookings List Page (/bookings)
 * Comprehensive appointment ledger with multi-attribute search, status filters, and one-click status transitions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  QrCode,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Download,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingsByBusiness, updateBookingStatus } from '../lib/bookings.js';
import AddToCalendarMenu from '../components/AddToCalendarMenu.tsx';

export default function Bookings() {
  const { currentBusiness } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const list = await getBookingsByBusiness(currentBusiness.id);
      setBookings(list);
    } catch (err) {
      console.error('Failed to load bookings list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  // Filtered and sorted bookings
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (dateFilter && b.date !== dateFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (b.customerName || '').toLowerCase().includes(q);
          const matchToken = (b.token || '').toLowerCase().includes(q);
          const matchEmail = (b.customerEmail || '').toLowerCase().includes(q);
          const matchPhone = (b.customerPhone || '').toLowerCase().includes(q);
          const matchService = (b.serviceName || '').toLowerCase().includes(q);

          if (!matchName && !matchToken && !matchEmail && !matchPhone && !matchService) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date then startTime
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [bookings, statusFilter, dateFilter, searchQuery]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateBookingStatus(id, newStatus);
      loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Appointments Ledger</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track and manage all reservations, client contacts, and arrival tokens.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {filteredBookings.length > 0 && (
            <AddToCalendarMenu
              bookings={filteredBookings}
              business={currentBusiness}
              variant="outline"
              label={`Export Schedule (${filteredBookings.length})`}
              calendarTitle={`${currentBusiness?.name || 'Schedora'} Appointments`}
              align="right"
              onExportSuccess={(name) => showToast(`Schedule exported (${name})`)}
            />
          )}

          <Link
            to="/bookings/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Manual Booking</span>
          </Link>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client name, 6-char token, email, phone, or service..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked-in">Checked In</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
          </select>

          {/* Date picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          {(searchQuery || statusFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDateFilter('');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading appointments...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold">No appointments match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  <th className="py-3.5 px-4 font-semibold">Token</th>
                  <th className="py-3.5 px-4 font-semibold">Client Name</th>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {b.token}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-white">{b.customerName}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{b.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {b.serviceName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <p className="font-semibold">{b.date}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">{b.startTime} ({b.duration}m)</p>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      ${b.price}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold uppercase border focus:outline-none ${
                          b.status === 'checked-in'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : b.status === 'confirmed'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : b.status === 'completed'
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                            : b.status === 'no-show'
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="checked-in">Checked In</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="no-show">No-Show</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status !== 'checked-in' && b.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(b.id, 'checked-in')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200/60 dark:border-indigo-800/80 cursor-pointer"
                          >
                            Check In
                          </button>
                        )}
                        <AddToCalendarMenu
                          booking={b}
                          business={currentBusiness}
                          variant="compact"
                          label="Export"
                          align="right"
                          onExportSuccess={(name) => showToast(`Added to ${name}`)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
