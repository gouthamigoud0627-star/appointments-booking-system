import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  DollarSign, 
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  Send
} from 'lucide-react';
import { Appointment } from '../types';
import { SupportedLocale } from '../types';
import { translations } from '../i18n';

interface OwnerConfirmationBannerProps {
  pendingAppointments: Appointment[];
  onConfirm: (id: string, note?: string) => Promise<void>;
  onDecline: (id: string, note?: string) => Promise<void>;
  onReschedule: (id: string, newDate: string, newTime: string) => Promise<void>;
  locale: SupportedLocale;
}

export const OwnerConfirmationBanner: React.FC<OwnerConfirmationBannerProps> = ({
  pendingAppointments,
  onConfirm,
  onDecline,
  onReschedule,
  locale,
}) => {
  const t = translations[locale];
  const [activeRescheduleId, setActiveRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('11:00');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (pendingAppointments.length === 0) {
    return null;
  }

  const latestPending = pendingAppointments[0];

  const handleConfirmAction = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onConfirm(id, 'Owner approved booking promptly via Quick Actions');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineAction = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onDecline(id, 'Declined by owner due to capacity conflict. Deposit refunded.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRescheduleSubmit = async (id: string) => {
    if (!rescheduleDate || !rescheduleTime) return;
    setActionLoadingId(id);
    try {
      await onReschedule(id, rescheduleDate, rescheduleTime);
      setActiveRescheduleId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-b border-amber-200/80 px-4 py-3 sm:px-6 transition-all animate-in fade-in slide-in-from-top-2">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left info badge */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-200">
            <Clock className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                Action Required ({pendingAppointments.length} Pending)
              </span>
              <span className="text-xs text-amber-700 font-medium hidden sm:inline">
                Customer awaiting your confirmation
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-800 font-medium">
              <span className="font-bold text-slate-900">{latestPending.clientName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-indigo-700 font-semibold">{latestPending.serviceName}</span>
              <span className="text-slate-400">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {latestPending.date} at {latestPending.startTime}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-semibold">
                ${latestPending.payment.depositPaid} deposit paid
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {activeRescheduleId === latestPending.id ? (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-amber-300 shadow-sm">
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="09:30">09:30 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="13:30">01:30 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:30">04:30 PM</option>
              </select>
              <button
                disabled={actionLoadingId === latestPending.id || !rescheduleDate}
                onClick={() => handleRescheduleSubmit(latestPending.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2.5 py-1 rounded transition-colors disabled:opacity-50"
              >
                Send Offer
              </button>
              <button
                onClick={() => setActiveRescheduleId(null)}
                className="text-xs text-slate-500 hover:text-slate-800 px-1"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id={`btn-approve-pending-${latestPending.id}`}
                disabled={actionLoadingId === latestPending.id}
                onClick={() => handleConfirmAction(latestPending.id)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.approveBooking}</span>
              </button>

              <button
                id={`btn-reschedule-pending-${latestPending.id}`}
                onClick={() => {
                  setRescheduleDate(latestPending.date);
                  setActiveRescheduleId(latestPending.id);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t.rescheduleBooking}</span>
              </button>

              <button
                id={`btn-decline-pending-${latestPending.id}`}
                disabled={actionLoadingId === latestPending.id}
                onClick={() => handleDeclineAction(latestPending.id)}
                className="flex items-center gap-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 bg-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span className="hidden sm:inline">{t.declineBooking}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
