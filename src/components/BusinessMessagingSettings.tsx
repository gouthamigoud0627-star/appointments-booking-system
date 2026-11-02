/**
 * Business Customer Messages & Automated Messaging Settings Component
 * Configures official WhatsApp Business API, SMS fallback, automated appointment alerts,
 * reminder timing (24h/1h), payment confirmations, and templates.
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Zap,
  Save,
  Send,
  Eye,
  Settings2,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getBusinessMessagingConfig,
  saveBusinessMessagingConfig,
  dispatchAutomatedMessage,
  BusinessMessagingConfig,
} from '../lib/messaging';

export const BusinessMessagingSettings: React.FC<{ businessId: string }> = ({ businessId }) => {
  const { currentBusiness } = useAuth();
  const [config, setConfig] = useState<BusinessMessagingConfig>(() =>
    getBusinessMessagingConfig(businessId)
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testSendStatus, setTestSendStatus] = useState<string | null>(null);
  const [activePreview, setActivePreview] = useState<'confirmation' | 'reminder' | 'payment' | 'reschedule' | 'cancel'>('confirmation');

  useEffect(() => {
    setConfig(getBusinessMessagingConfig(businessId));
  }, [businessId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBusinessMessagingConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestSend = async () => {
    setTestSendStatus('Sending test message through verified backend...');
    const dummyAppt = {
      id: `BK-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      clientName: 'Valued Customer',
      clientPhone: currentBusiness?.phone || '+91 98765 43210',
      serviceName: 'Full Service Session',
      servicePrice: 65,
      date: 'Tomorrow',
      startTime: '11:00 AM',
      endTime: '12:00 PM',
      token: 'TST-88',
    };

    const res = await dispatchAutomatedMessage({
      appointment: dummyAppt,
      business: currentBusiness || { id: businessId, name: 'Schedora Business', address: '450 Sutter St' },
      messageType:
        activePreview === 'confirmation'
          ? 'booking_confirmation'
          : activePreview === 'reminder'
          ? 'appointment_reminder'
          : activePreview === 'payment'
          ? 'payment_confirmation'
          : activePreview === 'reschedule'
          ? 'rescheduled'
          : 'cancelled',
    });

    setTestSendStatus(`✓ Message dispatched via ${res.channelUsed.toUpperCase()}! Provider ID: ${res.log.providerMessageId?.slice(0, 16)}...`);
    setTimeout(() => setTestSendStatus(null), 5000);
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Customer Messages & WhatsApp Engine</span>
          </div>
          <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
            Automated Customer Communication
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure official WhatsApp Business messaging, automatic SMS fallbacks, and reminder schedules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTestSend}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-center"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send Test Notification</span>
        </button>
      </div>

      {testSendStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{testSendStatus}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WhatsApp Platform */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  💬
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">WhatsApp Business API</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Meta Cloud API Provider</p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Connected
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sends verified template messages with delivery confirmations. Protected by secure server-side secrets.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Enable WhatsApp:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.whatsappEnabled}
                  onChange={(e) => setConfig({ ...config, whatsappEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* SMS Fallback Gateway */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  📱
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">SMS Fallback Gateway</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct Telecom Carrier</p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                Active
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Automatically used when a client does not have WhatsApp or requests concise SMS transactional alerts.
            </p>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-700/80 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Enable SMS:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.smsEnabled}
                  onChange={(e) => setConfig({ ...config, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Trigger Preferences */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Automated Message Triggers
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Instant Booking Confirmation</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Includes date, time, service & booking code</p>
              </div>
              <input
                type="checkbox"
                checked={config.autoConfirmationEnabled}
                onChange={(e) => setConfig({ ...config, autoConfirmationEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">24-Hour Prior Reminder</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sent automatically 1 day ahead</p>
              </div>
              <input
                type="checkbox"
                checked={config.reminders24hEnabled}
                onChange={(e) => setConfig({ ...config, reminders24hEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">1-Hour Prior Reminder</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Final heads up with navigation directions</p>
              </div>
              <input
                type="checkbox"
                checked={config.reminders1hEnabled}
                onChange={(e) => setConfig({ ...config, reminders1hEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Verified Payment Confirmation</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Sent only after server confirms payment receipt</p>
              </div>
              <input
                type="checkbox"
                checked={config.paymentAlertsEnabled}
                onChange={(e) => setConfig({ ...config, paymentAlertsEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Rescheduling & Time Change Alerts</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Notifies client with new slot details</p>
              </div>
              <input
                type="checkbox"
                checked={config.reschedulingAlertsEnabled}
                onChange={(e) => setConfig({ ...config, reschedulingAlertsEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>

            <label className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer hover:border-indigo-400 transition-colors">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">Cancellation & Refund Notice</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Includes booking reference and refund timeline</p>
              </div>
              <input
                type="checkbox"
                checked={config.cancellationAlertsEnabled}
                onChange={(e) => setConfig({ ...config, cancellationAlertsEnabled: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Live Template Preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Approved WhatsApp Template Preview
            </h4>
            <div className="flex items-center gap-1">
              {(['confirmation', 'reminder', 'payment', 'reschedule', 'cancel'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActivePreview(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors ${
                    activePreview === tab
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-100 font-mono text-xs whitespace-pre-wrap leading-relaxed border border-emerald-800 shadow-inner">
            {activePreview === 'confirmation' &&
              `Hi [Customer Name], your appointment at ${currentBusiness?.name || 'Your Business'} is confirmed.\n\nService: [Selected Service]\nDate: [Appointment Date]\nTime: [Start Time] – [End Time]\nLocation: ${currentBusiness?.address || 'Your Address'}\n\nBooking ID: [ID]\n\nThank you for choosing ${currentBusiness?.name || 'Your Business'} through Schedora.`}
            {activePreview === 'reminder' &&
              `Hi [Customer Name], this is a reminder from ${currentBusiness?.name || 'Your Business'} about your appointment on [Date] at [Start Time].\n\nService: [Service Name]\nLocation: ${currentBusiness?.address || 'Your Address'}\n\nWe look forward to seeing you.`}
            {activePreview === 'payment' &&
              `Hi [Customer Name], your payment of $[Amount] for [Service Name] at ${currentBusiness?.name || 'Your Business'} has been confirmed.\n\nPayment reference: PAY-REF-[000000]\n\nThank you.`}
            {activePreview === 'reschedule' &&
              `Hi [Customer Name], your appointment at ${currentBusiness?.name || 'Your Business'} has been updated.\n\nNew date: [New Date]\nNew time: [New Time]\n\nPlease contact the business if you need assistance.`}
            {activePreview === 'cancel' &&
              `Hi [Customer Name], your appointment at ${currentBusiness?.name || 'Your Business'} on [Date] has been cancelled.\n\nBooking reference: [ID].`}
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Messaging configuration updated!</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Templates strictly adhere to WhatsApp Business Platform policy.
            </span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Messaging Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
