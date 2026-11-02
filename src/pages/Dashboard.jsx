/**
 * Business Dashboard Page (/dashboard)
 * Focused on today's work per specification:
 * 1. Good morning/afternoon, [Business Name]
 * 2. Today: Appointments today, Next appointment, Business open/closed status
 * 3. Today's appointments (Time, Customer, Service, Status)
 * 4. Actions: [ View Appointments ] [ Add Service ] [ Manage Hours ]
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Scissors,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import { getBookingsByBusiness, updateBookingStatus } from '../lib/bookings.js';

export default function Dashboard() {
  const { currentBusiness } = useAuth();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const businessName = currentBusiness?.name || 'Bloom Spa';

  // Compute greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', 'Good morning');
    if (hour < 17) return t('goodAfternoon', 'Good afternoon');
    return t('goodEvening', 'Good evening');
  }, [t]);

  const loadData = async () => {
    if (!currentBusiness) return;
    setLoading(true);
    try {
      const list = await getBookingsByBusiness(currentBusiness.id);
      setBookings(list || []);
    } catch (err) {
      console.error('Failed to load dashboard bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's appointments, sorted by time
  const todayAppointments = useMemo(() => {
    return bookings
      .filter((b) => b.date === todayStr)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [bookings, todayStr]);

  // Next upcoming appointment today
  const nextAppointmentToday = useMemo(() => {
    return todayAppointments.find((b) => b.status === 'confirmed' || b.status === 'pending') || null;
  }, [todayAppointments]);

  // Open/closed status (Check against current hour 9am-6pm by default)
  const isOpenNow = useMemo(() => {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 19;
  }, []);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadData();
    } catch (err) {
      alert('Could not update status: ' + err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 animate-in fade-in duration-200">
      {/* 1. Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {greeting}, {businessName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Here is your operational schedule for today.
          </p>
        </div>

        {/* Business Public Link */}
        {currentBusiness?.slug && (
          <Link
            to={`/b/${currentBusiness.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>Public Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        )}
      </div>

      {/* 2. Today Summary Section */}
      <section className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Today
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Appointments Today */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Appointments Today</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todayAppointments.length}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {todayAppointments.filter((b) => b.status === 'checked-in' || b.status === 'completed').length} checked in
            </span>
          </div>

          {/* Next Appointment */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Next Appointment</span>
            {nextAppointmentToday ? (
              <div>
                <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 truncate">
                  {nextAppointmentToday.startTime} – {nextAppointmentToday.customerName}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">
                  {nextAppointmentToday.serviceName}
                </span>
              </div>
            ) : (
              <div className="text-sm font-bold text-slate-400 dark:text-slate-500 pt-1">
                None remaining
              </div>
            )}
          </div>

          {/* Open/Closed Status */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Business Status</span>
            <div className="flex items-center gap-2 pt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'
                }`}
              />
              <span className="text-base font-extrabold text-slate-900 dark:text-white">
                {isOpenNow ? t('open', 'OPEN') : t('closed', 'CLOSED')}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {isOpenNow ? 'Regular working hours (until 7 PM)' : 'Closed until morning'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Today's Appointments Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('todayAppointments', "Today's appointments")}
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {todayAppointments.length} scheduled
          </span>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
            <div className="w-8 h-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading today's schedule...</p>
          </div>
        ) : todayAppointments.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">No appointments scheduled for today</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Any new customer reservations will appear here automatically in real time.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            {todayAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  {/* Time box */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-xl text-center shrink-0 min-w-[76px] border border-indigo-100/60 dark:border-indigo-800/80">
                    <span className="block font-extrabold text-sm leading-tight">
                      {apt.startTime}
                    </span>
                    <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold block">
                      {apt.endTime ? `to ${apt.endTime}` : `${apt.duration || 30}m`}
                    </span>
                  </div>

                  {/* Customer and Service details */}
                  <div className="space-y-0.5">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {apt.customerName || 'Walk-in Customer'}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{apt.serviceName}</span>
                      {apt.price ? <span>• ₹{apt.price}</span> : null}
                    </p>
                    {apt.token && (
                      <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 block pt-0.5">
                        Token: {apt.token}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Quick Check-in */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                      apt.status === 'confirmed' || apt.status === 'checked-in' || apt.status === 'completed'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : apt.status === 'pending'
                        ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {apt.status === 'checked-in' ? 'Checked In' : apt.status}
                  </span>

                  {apt.status !== 'completed' && apt.status !== 'checked-in' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'checked-in')}
                      className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors border border-indigo-200/60 dark:border-indigo-800/80 cursor-pointer"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Action Buttons */}
      <section className="space-y-3 pt-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/bookings"
            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-center"
          >
            <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('viewAppointments', 'View Appointments')}</span>
          </Link>

          <Link
            to="/services"
            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-center"
          >
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('addService', 'Add Service')}</span>
          </Link>

          <Link
            to="/availability"
            className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col items-center justify-center gap-2 font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 text-center"
          >
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>{t('manageHours', 'Manage Hours')}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
