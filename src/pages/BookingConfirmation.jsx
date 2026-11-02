/**
 * Booking Confirmation Page (/confirmation/:token)
 * Schedora Smart Check-In: "Scan. Verify. Check in."
 * Generates cryptographic scannable QR code, 6-character arrival token,
 * calendar export (.ics), print voucher, and appointment lifecycle controls.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Download,
  Printer,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  QrCode,
  Share2,
  ExternalLink,
  Star,
  Building2,
  User,
} from 'lucide-react';
import { getBookingByToken, updateBookingStatus, getSecureQrPayload } from '../lib/bookings.js';
import { getBusinessById } from '../lib/business.js';
import AddToCalendarMenu from '../components/AddToCalendarMenu.tsx';
import { openGoogleCalendar, exportToAppleCalendar } from '../lib/calendarExport';

export default function BookingConfirmation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const foundBooking = await getBookingByToken(token);
        if (foundBooking) {
          setBooking(foundBooking);
          const foundBusiness = await getBusinessById(foundBooking.businessId);
          setBusiness(foundBusiness);

          // Generate scannable QR Code with high contrast and safe quiet zone
          const payload = getSecureQrPayload(foundBooking.token);
          try {
            const url = await QRCode.toDataURL(payload, {
              errorCorrectionLevel: 'H',
              margin: 2,
              width: 320,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            setQrDataUrl(url);
          } catch (qrErr) {
            console.error('Failed to generate QR:', qrErr);
          }
        }
      } catch (err) {
        console.error('Failed to load booking:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const handleCopyToken = () => {
    if (booking?.token) {
      navigator.clipboard.writeText(booking.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl || !booking) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `schedora-qr-${booking.token}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download iCalendar (.ics) file
  const handleDownloadIcs = () => {
    if (!booking) return;

    const dateClean = booking.date.replace(/-/g, '');
    const startTimeClean = booking.startTime.replace(/:/g, '') + '00';
    const endTimeClean = (booking.endTime || booking.startTime).replace(/:/g, '') + '00';

    const icsString = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Schedora//Smart Arrival Pass//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@schedora.io`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dateClean}T${startTimeClean}`,
      `DTEND:${dateClean}T${endTimeClean}`,
      `SUMMARY:${booking.serviceName} at ${business?.name || 'Schedora Partner'}`,
      `DESCRIPTION:Arrival Token: ${booking.token}\\nCustomer: ${booking.customerName}\\nStaff: ${booking.staffName || 'Specialist'}\\nNotes: ${booking.notes || 'None'}`,
      `LOCATION:${business?.address || ''}, ${business?.city || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `schedora-appointment-${booking.token}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment? This action will deactivate your arrival token.')) {
      return;
    }
    setCancelling(true);
    try {
      const updated = await updateBookingStatus(booking.id, 'cancelled', 'Cancelled by customer from pass view.');
      setBooking(updated);
    } catch (err) {
      alert('Failed to cancel appointment: ' + err.message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-slate-600">Retrieving appointment record...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Appointment Record Not Found</h2>
        <p className="text-sm text-slate-500">
          No active booking matches the token code <span className="font-mono font-bold text-slate-800">{token}</span>.
        </p>
        <div className="pt-2">
          <Link
            to="/businesses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Local Directory
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = booking.status === 'cancelled';
  const isCheckedIn = booking.status === 'checked-in';
  const isCompleted = booking.status === 'completed';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header status */}
      <div className="text-center space-y-3">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-sm mx-auto mb-1 ${
            isCancelled
              ? 'bg-rose-100 text-rose-600 border border-rose-200'
              : isCheckedIn
              ? 'bg-blue-100 text-blue-600 border border-blue-200'
              : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
          }`}
        >
          {isCancelled ? (
            <XCircle className="w-8 h-8" />
          ) : isCheckedIn ? (
            <ShieldCheck className="w-8 h-8" />
          ) : (
            <CheckCircle2 className="w-8 h-8" />
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {isCancelled
            ? 'Appointment Cancelled'
            : isCheckedIn
            ? 'You Are Checked In!'
            : 'Appointment Confirmed!'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto">
          {isCancelled
            ? 'This appointment has been cancelled. Your arrival token has been deactivated.'
            : isCheckedIn
            ? `Your arrival was verified at ${new Date(booking.checkedInAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please proceed to the waiting lounge.`
            : 'Your appointment is reserved. Present the digital QR pass or token at the front desk when you arrive.'}
        </p>
      </div>

      {/* Schedora Smart Check-In Card: "Scan. Verify. Check in." */}
      <div className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-800/40 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          {/* Left info & token */}
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Schedora Smart Check-In</span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-1">
                Your 6-Character Arrival Token
              </p>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white drop-shadow-md">
                {booking.token}
              </div>
            </div>

            <p className="text-xs text-indigo-200/90 max-w-sm">
              Tagline: <strong className="text-white">Scan. Verify. Check in.</strong>
              <br />
              Present this pass at front desk reception for instant contactless check-in.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
              <button
                onClick={handleCopyToken}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/15"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Token'}</span>
              </button>

              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/15"
              >
                <Download className="w-4 h-4" />
                <span>Save QR</span>
              </button>

              <AddToCalendarMenu
                variant="glass"
                booking={booking}
                business={business}
                label="Add to Calendar"
              />

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/15"
              >
                <Printer className="w-4 h-4" />
                <span>Print Pass</span>
              </button>
            </div>
          </div>

          {/* Right: High-Contrast Scannable QR Code */}
          <div className="flex flex-col items-center shrink-0">
            <div className="bg-white no-dark-surface p-3.5 rounded-2xl shadow-xl border-4 border-white/90">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`Arrival QR for ${booking.token}`}
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg">
                  <QrCode className="w-10 h-10 text-slate-400 animate-pulse" />
                </div>
              )}
            </div>
            <span className="text-[11px] font-semibold text-indigo-200 mt-2 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Show this QR at the business
            </span>
          </div>
        </div>
      </div>

      {/* Appointment Details Card */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Appointment Confirmation Details</h2>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              booking.status === 'confirmed'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : booking.status === 'checked-in'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : booking.status === 'completed'
                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {booking.status.replace('-', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          {/* Business info */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Business Practice</span>
            <p className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{business?.name || booking.businessName || 'Local Partner'}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{business?.address || 'Downtown'}, {business?.city || 'San Francisco'}</span>
            </p>
            {business?.phone && (
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{business.phone}</span>
              </p>
            )}
          </div>

          {/* Service info */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Service Booked</span>
            <p className="font-bold text-base text-slate-900 dark:text-white">{booking.serviceName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Duration: {booking.duration} minutes · Total Fee: ${booking.price}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Specialist: {booking.staffName || 'Assigned Staff Specialist'}
            </p>

            {booking.addOnServices && booking.addOnServices.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Bundled AI Add-ons ({booking.addOnServices.length})</span>
                </span>
                <div className="space-y-1">
                  {booking.addOnServices.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                      <span>+ {a.name}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">+${a.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scheduled Date & Time</span>
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                {new Date(booking.date + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span>{booking.startTime} – {booking.endTime} ({booking.duration} mins)</span>
            </p>
          </div>

          {/* Customer info */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Client Details</span>
            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{booking.customerName}</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{booking.customerEmail}</p>
            {booking.customerPhone && <p className="text-xs text-slate-500 dark:text-slate-400">{booking.customerPhone}</p>}
          </div>
        </div>

        {booking.notes && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Appointment Notes</span>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              {booking.notes}
            </p>
          </div>
        )}

        {/* Sync to Personal Calendar Block */}
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Sync to Your Personal Calendar</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Add directly to Google Calendar or export an Apple Calendar / universal iCal (.ics) pass with automated reminders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openGoogleCalendar(booking, business)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
              </svg>
              <span>Google Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => exportToAppleCalendar(booking, business)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.73-.85 2.76.99.08 2.01-.51 2.56-1.26" />
              </svg>
              <span>Apple Calendar (.ics)</span>
            </button>
          </div>
        </div>

        {/* Action row */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/businesses"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Discover Other Businesses
            </Link>

            <Link
              to="/my-bookings"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              View My Bookings
            </Link>
          </div>

          {!isCancelled && (
            <button
              onClick={handleCancelBooking}
              disabled={cancelling}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Appointment'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
