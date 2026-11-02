/**
 * Calendar Page (/calendar)
 * Interactive schedule visualizer supporting Day, Week, and Month views.
 * Shows status badges, client name, 6-character arrival tokens, and appointment details.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  QrCode,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getBookingsByBusiness, updateBookingStatus } from '../lib/bookings.js';
import AddToCalendarMenu from '../components/AddToCalendarMenu.tsx';

export default function CalendarView() {
  const { currentBusiness } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedBooking, setSelectedBooking] = useState(null);
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
      console.error('Failed to load appointments for calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month grid generation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    // Padding from previous month
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null });
    }
    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, dateStr });
    }
    return days;
  }, [currentDate]);

  // Group bookings by dateStr
  const bookingsByDate = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    });
    return map;
  }, [bookings]);

  // Current day string YYYY-MM-DD
  const currentDayStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentDate]);

  // Current week range (Monday to Sunday)
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(current);
    monday.setDate(current.getDate() + diffToMonday);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      days.push({
        date: d,
        dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: dateStr === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
        isSelected: dateStr === currentDayStr,
      });
    }
    return days;
  }, [currentDate, currentDayStr]);

  // Filtered bookings for current day
  const dayBookings = useMemo(() => {
    return (bookingsByDate[currentDayStr] || []).slice().sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [bookingsByDate, currentDayStr]);

  // Filtered bookings for current week
  const weekBookings = useMemo(() => {
    const weekDateStrs = new Set(weekDays.map((w) => w.dateStr));
    return bookings
      .filter((b) => weekDateStrs.has(b.date))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [bookings, weekDays]);

  // Current view bookings for calendar export
  const currentViewBookings = useMemo(() => {
    if (viewMode === 'day') return dayBookings;
    if (viewMode === 'week') return weekBookings;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return bookings
      .filter((b) => {
        const [y, m] = (b.date || '').split('-').map(Number);
        return y === year && m === month + 1;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [viewMode, dayBookings, weekBookings, bookings, currentDate]);

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setSelectedBooking(null);
      loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Practice Schedule</h1>
          <p className="text-xs text-slate-500">View and manage booked time slots, arrivals, and client appointments.</p>
        </div>

        {/* View mode toggle & date nav */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            {['month', 'week', 'day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                  viewMode === mode ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Export View Schedule Dropdown */}
          <AddToCalendarMenu
            bookings={currentViewBookings}
            business={currentBusiness}
            variant="outline"
            label={`Export ${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} (${currentViewBookings.length})`}
            calendarTitle={`${currentBusiness?.name || 'Schedora'} ${viewMode.toUpperCase()} Calendar`}
            align="right"
            onExportSuccess={(name) => showToast(`Calendar exported (${name})`)}
          />
        </div>
      </div>

      {/* Date banner */}
      <div className="text-center font-bold text-lg text-slate-800">
        {viewMode === 'month' &&
          currentDate.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })}
        {viewMode === 'week' && (
          <span>
            Week of {weekDays[0].dayName}, {weekDays[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {weekDays[6].dayName}, {weekDays[6].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        {viewMode === 'day' &&
          currentDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500 py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[560px]">
            {monthDays.map((d, idx) => {
              const dayBookingsList = d.dateStr ? bookingsByDate[d.dateStr] || [] : [];
              const isToday =
                d.dateStr ===
                `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(
                  new Date().getDate()
                ).padStart(2, '0')}`;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (d.day) {
                      const newD = new Date(currentDate.getFullYear(), currentDate.getMonth(), d.day);
                      setCurrentDate(newD);
                      setViewMode('day');
                    }
                  }}
                  className={`p-2 sm:p-2.5 flex flex-col justify-start min-h-[95px] sm:min-h-[115px] transition-colors ${
                    d.day ? 'bg-white hover:bg-indigo-50/30 cursor-pointer' : 'bg-slate-50/50'
                  }`}
                  title={d.day ? `View appointments for ${d.dateStr}` : ''}
                >
                  {d.day && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                        }`}
                      >
                        {d.day}
                      </span>
                      {dayBookingsList.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                          {dayBookingsList.length}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayBookingsList.map((b) => (
                      <button
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(b);
                        }}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold truncate border transition-colors cursor-pointer ${
                          b.status === 'checked-in'
                            ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
                            : b.status === 'confirmed'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : b.status === 'completed'
                            ? 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100'
                            : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className="font-mono text-[10px] mr-1 opacity-75">{b.token}</span>
                        <span>{b.customerName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View: 7-Day Grouped Layout */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((wd) => {
              const items = bookingsByDate[wd.dateStr] || [];
              return (
                <div
                  key={wd.dateStr}
                  onClick={() => {
                    setCurrentDate(new Date(wd.date));
                    setViewMode('day');
                  }}
                  className={`bg-white rounded-2xl border p-3 shadow-xs hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between min-h-[300px] ${
                    wd.isToday
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Day header */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          {wd.dayName}
                        </span>
                        <span className={`text-base font-extrabold ${wd.isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {wd.dayNumber}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          items.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {items.length} {items.length === 1 ? 'appt' : 'appts'}
                      </span>
                    </div>

                    {/* Bookings for this day */}
                    <div className="space-y-1.5 overflow-y-auto max-h-[320px]">
                      {items.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic py-4 text-center">No slots booked</p>
                      ) : (
                        items.map((b) => (
                          <div
                            key={b.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBooking(b);
                            }}
                            className={`p-2 rounded-xl border text-xs transition-colors hover:shadow-xs cursor-pointer ${
                              b.status === 'checked-in'
                                ? 'bg-blue-50 border-blue-200 text-blue-900'
                                : b.status === 'confirmed'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className="font-bold text-[11px] truncate">{b.startTime}</span>
                              <span className="font-mono text-[9px] px-1 py-0.2 bg-white/80 rounded font-bold">
                                {b.token}
                              </span>
                            </div>
                            <p className="font-bold truncate text-[11px]">{b.customerName}</p>
                            <p className="text-[10px] opacity-75 truncate">{b.serviceName}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(new Date(wd.date));
                      setViewMode('day');
                    }}
                    className="w-full mt-3 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors text-center"
                  >
                    View Day Schedule →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View: Detailed Daily Schedule */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">
                Daily Schedule for {currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500">
                Showing {dayBookings.length} {dayBookings.length === 1 ? 'appointment' : 'appointments'} scheduled for this day
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Switch to Week View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Switch to Month View
              </button>
            </div>
          </div>

          {dayBookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="font-bold text-sm text-slate-700">No Appointments on this Day</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                There are no scheduled customer bookings on {currentDate.toLocaleDateString()}. Use the date navigator above to check other dates or switch to week/month view.
              </p>
              <button
                type="button"
                onClick={handleToday}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Jump to Today</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {dayBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBooking(b)}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-indigo-400 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="font-mono font-black text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl shrink-0">
                      {b.token}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {b.customerName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                            b.status === 'checked-in'
                              ? 'bg-blue-100 text-blue-800'
                              : b.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'completed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {b.serviceName} · {b.duration} min · ${b.price}
                      </p>
                      {b.customerPhone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          <span>{b.customerPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-slate-800 block">
                        {b.startTime}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.duration} mins slot
                      </span>
                    </div>

                    {b.status !== 'checked-in' && b.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(b.id, 'checked-in');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointment Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600" />
                <span className="font-mono font-bold text-sm text-indigo-600">{selectedBooking.token}</span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedBooking.customerName}</h3>
              <p className="text-xs text-slate-500">{selectedBooking.serviceName}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <p className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-slate-400" />
                <span>{selectedBooking.date} at {selectedBooking.startTime} ({selectedBooking.duration} mins)</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{selectedBooking.customerEmail}</span>
              </p>
              {selectedBooking.customerPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedBooking.customerPhone}</span>
                </p>
              )}
            </div>

            {selectedBooking.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                <span className="font-bold block mb-1">Notes:</span>
                {selectedBooking.notes}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <AddToCalendarMenu
                booking={selectedBooking}
                business={currentBusiness}
                variant="outline"
                label="Add to Calendar"
                align="left"
                onExportSuccess={(name) => showToast(`Added to ${name}`)}
              />

              <div className="flex flex-wrap items-center gap-2">
                {selectedBooking.status !== 'checked-in' && (
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'checked-in')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                  >
                    Check In
                  </button>
                )}
                {selectedBooking.status !== 'completed' && (
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'completed')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                  >
                    Mark Completed
                  </button>
                )}
                {selectedBooking.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusChange(selectedBooking.id, 'cancelled')}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
