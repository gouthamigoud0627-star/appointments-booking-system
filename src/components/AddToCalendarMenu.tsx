import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  ExternalLink,
  Check,
  CalendarDays,
  Layers,
} from 'lucide-react';
import {
  BookingCalendarData,
  BusinessCalendarData,
  openGoogleCalendar,
  openOutlookCalendar,
  exportToAppleCalendar,
  downloadIcsFile,
  downloadBulkIcsFile,
} from '../lib/calendarExport';

interface AddToCalendarMenuProps {
  booking?: BookingCalendarData;
  bookings?: BookingCalendarData[];
  business?: BusinessCalendarData;
  variant?: 'glass' | 'primary' | 'outline' | 'compact' | 'ghost' | 'icon';
  label?: string;
  className?: string;
  calendarTitle?: string;
  align?: 'left' | 'right';
  onExportSuccess?: (msg: string) => void;
}

export default function AddToCalendarMenu({
  booking,
  bookings,
  business,
  variant = 'primary',
  label,
  className = '',
  calendarTitle = 'Schedora Appointments',
  align = 'right',
  onExportSuccess,
}: AddToCalendarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBulk = Array.isArray(bookings) && bookings.length > 0;
  const activeBooking = booking || (isBulk ? bookings[0] : undefined);
  const count = bookings?.length || (booking ? 1 : 0);

  // Default label
  const defaultLabel = isBulk
    ? `Export ${count} ${count === 1 ? 'Appointment' : 'Appointments'} (.ics)`
    : 'Add to Calendar';
  const displayLabel = label || defaultLabel;

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const triggerSuccess = (name: string) => {
    setDownloadSuccess(name);
    if (onExportSuccess) {
      onExportSuccess(name);
    }
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleGoogle = () => {
    if (!activeBooking) return;
    openGoogleCalendar(activeBooking, business);
    setIsOpen(false);
    triggerSuccess('Google Calendar');
  };

  const handleOutlook = () => {
    if (!activeBooking) return;
    openOutlookCalendar(activeBooking, business);
    setIsOpen(false);
    triggerSuccess('Outlook Web');
  };

  const handleApple = () => {
    if (isBulk && bookings) {
      downloadBulkIcsFile(
        bookings,
        `schedora-appointments-${new Date().toISOString().split('T')[0]}.ics`,
        calendarTitle,
        business
      );
      setIsOpen(false);
      triggerSuccess(`All (${count}) to Apple Calendar`);
    } else if (activeBooking) {
      exportToAppleCalendar(activeBooking, business);
      setIsOpen(false);
      triggerSuccess('Apple Calendar');
    }
  };

  const handleUniversalIcs = () => {
    if (isBulk && bookings) {
      downloadBulkIcsFile(
        bookings,
        `schedora-schedule-${new Date().toISOString().split('T')[0]}.ics`,
        calendarTitle,
        business
      );
      setIsOpen(false);
      triggerSuccess(`${count} Appointments Exported (.ics)`);
    } else if (activeBooking) {
      downloadIcsFile(activeBooking, business);
      setIsOpen(false);
      triggerSuccess('.ics Downloaded');
    }
  };

  // Button styles based on variant
  let btnClasses = '';
  switch (variant) {
    case 'glass':
      btnClasses =
        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors border border-white/15 active:scale-95';
      break;
    case 'outline':
      btnClasses =
        'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95';
      break;
    case 'ghost':
      btnClasses =
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors';
      break;
    case 'compact':
      btnClasses =
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold transition-colors';
      break;
    case 'icon':
      btnClasses =
        'p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200/80 dark:border-slate-700';
      break;
    case 'primary':
    default:
      btnClasses =
        'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95';
      break;
  }

  const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={btnClasses}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={displayLabel}
      >
        {isBulk ? (
          <CalendarDays className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
        ) : (
          <Calendar className="w-3.5 h-3.5 shrink-0" />
        )}

        {variant !== 'icon' && (
          <span>{downloadSuccess ? `Added (${downloadSuccess})` : displayLabel}</span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${alignmentClass} mt-2 w-72 rounded-2xl bg-white dark:bg-slate-850 shadow-2xl border border-slate-200 dark:border-slate-750 z-50 p-2 animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
              {isBulk ? `Export Schedule (${count})` : 'Export to Calendar'}
            </span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded">
              RFC 5545
            </span>
          </div>

          <div className="py-1 space-y-1">
            {/* Universal .ics */}
            <button
              type="button"
              onClick={handleUniversalIcs}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-100 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isBulk ? 'Download All (.ics)' : 'Universal iCal (.ics)'}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      Standard
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isBulk
                      ? `Consolidated file with all ${count} appointments`
                      : 'Compatible with Outlook, Apple, Google & OS'}
                  </div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </button>

            {/* Google Calendar Web Link */}
            {activeBooking && (
              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Google Calendar
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isBulk ? 'Direct web link for upcoming' : 'Open in browser & sync'}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            )}

            {/* Outlook Web Deep Link */}
            {activeBooking && (
              <button
                type="button"
                onClick={handleOutlook}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-100 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    {/* Microsoft / Outlook icon */}
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M1 5h10v14H1V5zm12 0h10v14H13V5z" fillOpacity="0.4" />
                      <path d="M7 8.5a3.5 3.5 0 00-3.5 3.5 3.5 3.5 0 003.5 3.5A3.5 3.5 0 0010.5 12 3.5 3.5 0 007 8.5zm0 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      Outlook Web
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Live, Hotmail & Office 365
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
              </button>
            )}

            {/* Apple Calendar (.ics) */}
            <button
              type="button"
              onClick={handleApple}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-100 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.73-.85 2.76.99.08 2.01-.51 2.56-1.26" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    Apple Calendar
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    macOS, iOS & iPadOS native
                  </div>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
