import React, { useState } from 'react';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  Sparkles,
  Phone,
  Mail,
  User,
  Users,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { addToWaitlist, WaitlistEntry } from '../lib/waitlist';

interface JoinWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: {
    id: string;
    name: string;
    slug?: string;
    services?: Array<{ id: string; name: string; price?: number; duration?: string | number }>;
    staff?: Array<{ id: string; name: string; role?: string; avatar?: string }>;
  };
  initialServiceId?: string;
  initialDate?: string;
  initialStaffId?: string;
  customerDefault?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: (entry: WaitlistEntry) => void;
}

export default function JoinWaitlistModal({
  isOpen,
  onClose,
  business,
  initialServiceId,
  initialDate,
  initialStaffId,
  customerDefault,
  onSuccess,
}: JoinWaitlistModalProps) {
  const [selectedServiceId, setSelectedServiceId] = useState(
    initialServiceId || business.services?.[0]?.id || ''
  );
  const [date, setDate] = useState(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [timePreference, setTimePreference] = useState<'any' | 'morning' | 'afternoon' | 'evening'>('any');
  const [staffId, setStaffId] = useState(initialStaffId || 'any');
  const [name, setName] = useState(customerDefault?.name || '');
  const [email, setEmail] = useState(customerDefault?.email || '');
  const [phone, setPhone] = useState(customerDefault?.phone || '');
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedEntry, setSubmittedEntry] = useState<WaitlistEntry | null>(null);

  if (!isOpen) return null;

  const selectedService = business.services?.find((s) => s.id === selectedServiceId) || business.services?.[0];
  const selectedStaffObj = business.staff?.find((st) => st.id === staffId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number to receive instant WhatsApp or SMS alerts.');
      return;
    }

    setLoading(true);
    try {
      const entry = await addToWaitlist({
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
        serviceId: selectedService?.id || selectedServiceId,
        serviceName: selectedService?.name || 'Scheduled Service',
        servicePrice: selectedService?.price,
        staffId: staffId === 'any' ? undefined : staffId,
        staffName: staffId === 'any' ? 'First Available Specialist' : selectedStaffObj?.name,
        preferredDate: date,
        preferredTime: timePreference,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        notes: notes.trim(),
        channel,
      });

      setSubmittedEntry(entry);
      if (onSuccess) onSuccess(entry);
    } catch (err: any) {
      console.error('Waitlist submission failed:', err);
      setError(err?.message || 'Could not register for waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Standby Queue</span>
          </div>
          <h3 className="text-xl font-extrabold tracking-tight">Join Standby Waitlist</h3>
          <p className="text-xs text-indigo-200 mt-1">
            Get automated WhatsApp or SMS opening notifications the instant a customer cancels or reschedules at {business.name}.
          </p>
        </div>

        {/* Success View */}
        {submittedEntry ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">
                You're on the Standby List!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                We've reserved your standby position. An automated confirmation was dispatched via{' '}
                <strong className="text-indigo-600 dark:text-indigo-400 capitalize">{submittedEntry.channel}</strong>.
              </p>
            </div>

            {/* Standby Pass Token Card */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-left space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Standby Pass Token
                  </span>
                  <div className="font-mono text-2xl font-black text-slate-900 dark:text-white">
                    {submittedEntry.token}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Queue Position
                  </span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    #{submittedEntry.queuePosition}
                  </div>
                </div>
              </div>

              <div className="border-t border-indigo-100 dark:border-indigo-900/60 pt-3 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedEntry.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedEntry.preferredDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alert Recipient:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedEntry.customerPhone}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Service & Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  {business.services?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration || '45m'}{s.price ? ` - $${s.price}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Time Window Preference */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Time Window Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'any', label: 'Any Slot', desc: 'Fastest opening' },
                  { id: 'morning', label: 'Morning', desc: '8am – 12pm' },
                  { id: 'afternoon', label: 'Afternoon', desc: '12pm – 5pm' },
                  { id: 'evening', label: 'Evening', desc: '5pm – Close' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTimePreference(t.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      timePreference === t.id
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300 text-xs'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Specialist Preference */}
            {business.staff && business.staff.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Practitioner Preference
                </label>
                <select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="any">Any Available Specialist (Recommended)</option>
                  {business.staff.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.role || 'Specialist'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Client Contact Info */}
            <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Contact & Alert Channel
              </h5>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="alex@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone (WhatsApp / SMS)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Channel Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Notification Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      channel === 'whatsapp'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp (Recommended)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      channel === 'sms'
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <span>SMS Text Alert</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Can arrive on 20 mins notice"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Join Standby Waitlist</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
