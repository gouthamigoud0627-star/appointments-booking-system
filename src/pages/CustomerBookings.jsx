/**
 * Customer Appointments Portal (/my-bookings)
 * Full appointment lifecycle: View, Check In, Reschedule, and Cancel.
 * Respects status constraints, prevents double bookings, displays arrival tokens.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bell,
  MapPin,
  ExternalLink,
  PlusCircle,
  Building2,
  AlertCircle,
  QrCode,
  X,
  RefreshCw,
  Scissors,
  Sparkles,
  Trash2,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import { getBookingsByCustomer, updateBookingStatus, rescheduleBooking } from '../lib/bookings.js';
import { getBusinessById } from '../lib/business.js';
import { generateAvailableSlots, minutesToTime } from '../lib/availability.js';
import { NotificationCenterModal } from '../components/NotificationCenterModal.tsx';
import { getWaitlistForCustomer, cancelWaitlistEntry } from '../lib/waitlist';
import AddToCalendarMenu from '../components/AddToCalendarMenu.tsx';
import { CustomerFeedbackModal } from '../components/CustomerFeedbackModal.tsx';
import { getFeedbackForAppointment } from '../lib/reviews.js';

export default function CustomerBookings() {
  const { customerUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedBookingForFeedback, setSelectedBookingForFeedback] = useState(null);

  const customerEmail = customerUser?.email || 'jahnaviaraja0909@gmail.com';
  const customerName = customerUser?.name || 'Jahnavi';

  const [bookings, setBookings] = useState([]);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('upcoming');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Reschedule modal state
  const [reschedulingBooking, setReschedulingBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState(null);

  // Action toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getBookingsByCustomer(customerEmail);
      setBookings(list || []);
      const wl = getWaitlistForCustomer(customerEmail);
      setWaitlistEntries(wl || []);
    } catch (err) {
      console.error('Failed to load customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWaitlist = async (id) => {
    if (confirm('Cancel this standby waitlist request?')) {
      await cancelWaitlistEntry(id);
      showToast('Standby waitlist request cancelled.');
      loadData();
    }
  };

  useEffect(() => {
    loadData();
  }, [customerEmail]);

  // Today string for check-in rules
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Upcoming list for calendar bulk export
  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'checked-in');
  }, [bookings]);

  // Filtered list
  const filteredBookings = useMemo(() => {
    if (filterTab === 'upcoming') {
      return upcomingBookings;
    }
    if (filterTab === 'completed') {
      return bookings.filter((b) => b.status === 'completed');
    }
    if (filterTab === 'cancelled') {
      return bookings.filter((b) => b.status === 'cancelled');
    }
    return bookings;
  }, [bookings, filterTab, upcomingBookings]);

  // Handle Check-In
  const handleCheckIn = async (booking) => {
    if (booking.status === 'checked-in' || booking.status === 'completed') {
      showToast(t('youHaveCheckedIn', "You've checked in."));
      return;
    }
    if (booking.date !== todayStr) {
      showToast(t('checkInOpensCloser', "Check-in opens closer to your appointment."));
      return;
    }

    try {
      await updateBookingStatus(booking.id, 'checked-in');
      showToast(t('youHaveCheckedIn', "You've checked in."));
      loadData();
    } catch (err) {
      showToast("Could not check in: " + err.message);
    }
  };

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setCancelLoading(true);
    try {
      await updateBookingStatus(cancellingBooking.id, 'cancelled', 'Cancelled by customer');
      setCancellingBooking(null);
      showToast(t('appointmentCancelledSuccess', 'Your appointment has been cancelled.'));
      loadData();
    } catch (err) {
      alert('Failed to cancel: ' + err.message);
    } finally {
      setCancelLoading(false);
    }
  };

  // Open Reschedule Modal
  const handleOpenReschedule = async (booking) => {
    setReschedulingBooking(booking);
    setRescheduleDate(booking.date);
    setRescheduleSlot(null);
    setRescheduleError(null);

    // Load business to get services & opening hours
    try {
      const biz = await getBusinessById(booking.businessId);
      if (biz) {
        const slots = generateAvailableSlots({
          business: biz,
          serviceDurationMinutes: booking.duration || 30,
          dateStr: booking.date,
          existingBookings: bookings,
        });
        setRescheduleSlots(slots);
      }
    } catch (e) {
      console.warn('Could not generate slots for reschedule:', e);
    }
  };

  // On reschedule date change
  const handleRescheduleDateChange = async (newDate) => {
    setRescheduleDate(newDate);
    setRescheduleSlot(null);
    if (!reschedulingBooking) return;

    try {
      const biz = await getBusinessById(reschedulingBooking.businessId);
      if (biz) {
        const slots = generateAvailableSlots({
          business: biz,
          serviceDurationMinutes: reschedulingBooking.duration || 30,
          dateStr: newDate,
          existingBookings: bookings,
        });
        setRescheduleSlots(slots);
      }
    } catch (e) {}
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!reschedulingBooking || !rescheduleSlot) return;
    setRescheduleLoading(true);
    setRescheduleError(null);

    try {
      const duration = reschedulingBooking.duration || 30;
      const endMins = rescheduleSlot.startMinutes + duration;
      const endStr = minutesToTime(endMins, true);

      await rescheduleBooking(
        reschedulingBooking.id,
        rescheduleDate,
        rescheduleSlot.time,
        endStr
      );

      setReschedulingBooking(null);
      showToast(t('appointmentRescheduledSuccess', 'Your appointment has been changed.'));
      loadData();
    } catch (err) {
      setRescheduleError(err.message || 'Could not reschedule appointment.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-in fade-in duration-200">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('myAppointments', 'My Appointments')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            View arrival tokens, manage schedules, reschedule, or cancel bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {upcomingBookings.length > 0 && (
            <AddToCalendarMenu
              bookings={upcomingBookings}
              variant="outline"
              label={`Export All Upcoming (${upcomingBookings.length})`}
              calendarTitle="My Schedora Appointments"
              align="right"
              onExportSuccess={(name) => showToast(`Schedule exported (${name})`)}
            />
          )}

          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('bookAppointment', 'Book an Appointment')}</span>
          </Link>
        </div>
      </div>

      {/* Priority Opening Alert Banner */}
      {waitlistEntries.some((w) => w.status === 'notified') && (
        <div className="p-4.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-300 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                A Slot Just Opened for You!
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                An appointment slot on standby has opened up. Claim your priority reservation before it's released!
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('waitlist')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
          >
            View Open Slot
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setFilterTab('upcoming')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            filterTab === 'upcoming'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Upcoming ({bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending' || b.status === 'checked-in').length})
        </button>

        <button
          onClick={() => setFilterTab('waitlist')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
            filterTab === 'waitlist'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Standby Waitlist ({waitlistEntries.length})</span>
          {waitlistEntries.some((w) => w.status === 'notified') && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setFilterTab('completed')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            filterTab === 'completed'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Completed ({bookings.filter((b) => b.status === 'completed').length})
        </button>

        <button
          onClick={() => setFilterTab('cancelled')}
          className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
            filterTab === 'cancelled'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Cancelled ({bookings.filter((b) => b.status === 'cancelled').length})
        </button>
      </div>

      {/* Appointments or Waitlist List */}
      {filterTab === 'waitlist' ? (
        waitlistEntries.length === 0 ? (
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Standby Requests</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              When a service or date is fully booked, you can join the standby waitlist to be automatically notified when a cancellation opens.
            </p>
            <div className="pt-2">
              <Link
                to="/businesses"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Browse Services
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {waitlistEntries.map((wl) => (
              <div
                key={wl.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {wl.token}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {wl.businessName}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{wl.serviceName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Target Date: {wl.preferredDate} ({wl.preferredTime})
                    </p>
                  </div>

                  <span
                    className={`self-start px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      wl.status === 'notified'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 animate-pulse'
                        : wl.status === 'converted'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
                        : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {wl.status === 'notified' ? '🎉 Slot Opened!' : wl.status === 'converted' ? 'Confirmed' : `Standby #${wl.queuePosition}`}
                  </span>
                </div>

                {wl.status === 'notified' && wl.matchedSlot && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <strong className="block text-sm text-amber-950 dark:text-amber-100">A cancellation has opened up!</strong>
                      <div>
                        Date: <span className="font-semibold">{wl.matchedSlot.date}</span> at <span className="font-semibold">{wl.matchedSlot.startTime}</span>
                      </div>
                    </div>
                    {wl.matchedSlot.claimUrl && (
                      <Link
                        to={wl.matchedSlot.claimUrl}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                      >
                        <span>Claim & Book Slot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Alert channel: <strong className="capitalize text-slate-700 dark:text-slate-300">{wl.channel}</strong></span>
                  {wl.status === 'waiting' && (
                    <button
                      onClick={() => handleCancelWaitlist(wl.id)}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 font-bold hover:underline"
                    >
                      Cancel Standby Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : loading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">{t('loadingAppointments', 'Loading appointments...')}</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {t('noAppointmentsYet', 'No appointments yet')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t('bookYourFirst', 'Book your first appointment and it will appear here.')}
          </p>
          <div className="pt-2">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('bookAppointment', 'Book an Appointment')}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((apt) => {
            const isActionable = apt.status === 'confirmed' || apt.status === 'pending' || apt.status === 'checked-in';

            return (
              <div
                key={apt.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                      {apt.businessName || 'Elite Car Care'}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{apt.serviceName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Duration: {apt.duration || 30} mins • Price: ${apt.price || 0}
                    </p>
                    {apt.addOnServices && apt.addOnServices.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {apt.addOnServices.map((a, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200/60 dark:border-indigo-800"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                            <span>+ {a.name} (${a.price})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        apt.status === 'confirmed' || apt.status === 'checked-in' || apt.status === 'completed'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : apt.status === 'cancelled'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {apt.status === 'checked-in' ? 'Checked In' : apt.status}
                    </span>

                    {apt.token && (
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 px-2 py-1 rounded-lg">
                        {apt.token}
                      </span>
                    )}
                  </div>
                </div>

                {/* Date & Time Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {formatDateDisplay(apt.date)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {apt.startTime} {apt.endTime ? `– ${apt.endTime}` : ''}
                  </span>
                </div>

                {/* Actions Row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {apt.token && (
                    <Link
                      to={`/confirmation/${apt.token}`}
                      className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/80"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{t('viewAppointment', 'View Pass')}</span>
                    </Link>
                  )}

                  {isActionable && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCheckIn(apt)}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-800/80"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t('checkIn', 'Check In')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReschedule(apt)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{t('reschedule', 'Reschedule')}</span>
                      </button>

                      {/* Add to Calendar Export Menu */}
                      <AddToCalendarMenu
                        variant="outline"
                        booking={apt}
                        label="Calendar"
                        onExportSuccess={(name) => showToast(`Added to ${name}`)}
                      />

                      {/* Customer Feedback & Rating Action */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookingForFeedback(apt);
                          setFeedbackModalOpen(true);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 border ${
                          getFeedbackForAppointment(apt.id)
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        }`}
                        title="Rate your experience and leave verified feedback"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>
                          {getFeedbackForAppointment(apt.id)
                            ? `${getFeedbackForAppointment(apt.id)?.rating}★ Reviewed`
                            : 'Rate & Review'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCancellingBooking(apt)}
                        className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors ml-auto"
                      >
                        {t('cancelAppointment', 'Cancel')}
                      </button>
                    </>
                  )}

                  {/* Completed Booking Review Button */}
                  {apt.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingForFeedback(apt);
                        setFeedbackModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-amber-300 dark:border-amber-800"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>
                        {getFeedbackForAppointment(apt.id)
                          ? `${getFeedbackForAppointment(apt.id)?.rating}★ Feedback Recorded`
                          : 'Leave Feedback'}
                      </span>
                    </button>
                  )}

                  {apt.status === 'cancelled' && (
                    <Link
                      to="/book"
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      Book Again
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200 dark:border-slate-750">
            <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('cancelConfirmTitle', 'Cancel appointment?')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('cancelConfirmMessage', 'Are you sure you want to cancel this appointment?')}
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-3 text-xs text-left border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-white block">{cancellingBooking.serviceName}</span>
                <span className="text-slate-500 dark:text-slate-400">{cancellingBooking.businessName} • {formatDateDisplay(cancellingBooking.date)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs"
              >
                {t('keepAppointment', 'Keep Appointment')}
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancel}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                {cancelLoading ? 'Cancelling...' : t('confirmCancellation', 'Cancel Appointment')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-750">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reschedule Appointment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{reschedulingBooking.serviceName}</p>
              </div>
              <button
                onClick={() => setReschedulingBooking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {rescheduleError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select New Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={rescheduleDate}
                  onChange={(e) => handleRescheduleDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Available Slots ({rescheduleSlots.length})
                </label>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 py-2">No open slots on this date. Please try another day.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1">
                    {rescheduleSlots.map((slot) => {
                      const isSelected = rescheduleSlot?.time === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setRescheduleSlot(slot)}
                          className={`p-2 rounded-xl border text-center font-bold text-xs transition-colors ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200'
                              : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-650 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReschedulingBooking(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rescheduleSlot || rescheduleLoading}
                onClick={handleConfirmReschedule}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs disabled:opacity-40"
              >
                {rescheduleLoading ? 'Saving...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={[
          {
            id: 'notif-1',
            appointmentId: 'apt-1',
            type: 'push',
            recipient: customerEmail,
            message: 'Your booking has been received and confirmed.',
            status: 'delivered',
            timestamp: 'Today',
          },
        ]}
        onMarkAllRead={() => {}}
        onSendTestNotification={() => {}}
      />

      {/* Verified Customer Feedback & Rating Modal */}
      <CustomerFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        booking={selectedBookingForFeedback}
        onSuccess={() => {
          showToast('Thank you! Your verified review has been saved.');
          loadData();
        }}
      />
    </div>
  );
}
