/**
 * Automations and Notifications (/automations)
 * Notification preferences, scheduled reminder rules (24h and 1h),
 * channel configurations (WhatsApp Business, SMS, Email), and n8n webhook triggers.
 */

import React, { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  RefreshCw,
  Workflow,
  ExternalLink,
} from 'lucide-react';

export default function Automations() {
  const [reminders24h, setReminders24h] = useState(true);
  const [reminders1h, setReminders1h] = useState(true);
  const [rescheduleAlerts, setRescheduleAlerts] = useState(true);
  const [conflictAlerts, setConflictAlerts] = useState(true);
  const [taskDueAlerts, setTaskDueAlerts] = useState(true);

  // Channels
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  // n8n Webhook
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.schedora.io/webhook/meeting-lifecycle');
  const [webhookActive, setWebhookActive] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const deliveryLogs = [
    {
      id: 'log-1',
      event: '24-Hour Appointment Reminder',
      channel: 'whatsapp',
      recipient: '+1 (555) 019-2834',
      status: 'delivered',
      time: '10 minutes ago',
    },
    {
      id: 'log-2',
      event: 'Meeting Invitation Created',
      channel: 'email',
      recipient: 'marcus.chen@apex.io',
      status: 'delivered',
      time: '2 hours ago',
    },
    {
      id: 'log-3',
      event: 'Candidate Screening Reminder',
      channel: 'sms',
      recipient: '+1 (555) 349-2918',
      status: 'delivered',
      time: 'Yesterday',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Automations & Notification Rules
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure automated meeting reminders, multi-channel dispatch, delivery tracking, and n8n webhooks.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Automated Rules & Reminders */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Scheduled Automated Triggers</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
              Duplicate Protection Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">24-Hour Pre-Meeting Reminder</span>
                <span className="text-slate-500 text-[11px]">Dispatches reminder pass 24 hours before start time.</span>
              </div>
              <input
                type="checkbox"
                checked={reminders24h}
                onChange={(e) => {
                  setReminders24h(e.target.checked);
                  showToast('24h reminder rule updated.');
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">1-Hour Arrival Token & Link Ping</span>
                <span className="text-slate-500 text-[11px]">Urgent 60-minute notification with video URL / QR code.</span>
              </div>
              <input
                type="checkbox"
                checked={reminders1h}
                onChange={(e) => {
                  setReminders1h(e.target.checked);
                  showToast('1h reminder rule updated.');
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Rescheduling & Cancellation Alerts</span>
                <span className="text-slate-500 text-[11px]">Instantly updates calendar and alerts all affected attendees.</span>
              </div>
              <input
                type="checkbox"
                checked={rescheduleAlerts}
                onChange={(e) => {
                  setRescheduleAlerts(e.target.checked);
                  showToast('Reschedule alert rule updated.');
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Post-Meeting Follow-up Task Reminders</span>
                <span className="text-slate-500 text-[11px]">Alerts assignees when action items approach due date.</span>
              </div>
              <input
                type="checkbox"
                checked={taskDueAlerts}
                onChange={(e) => {
                  setTaskDueAlerts(e.target.checked);
                  showToast('Task due alert rule updated.');
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Dispatch Channels & Provider Status */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Communication Channels</span>
            </h2>
            <span className="text-xs text-slate-400">Multi-Channel Failover</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">WhatsApp Business Cloud API</h4>
                  <p className="text-[11px] text-slate-500">Official template messages with 2-way client confirmation.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold">
                  SMS
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Twilio SMS Gateway</h4>
                  <p className="text-[11px] text-slate-500">Automated SMS fallback for instant attendee arrival passes.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                Ready
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
                  @
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Transactional Email</h4>
                  <p className="text-[11px] text-slate-500">HTML invitation cards with embedded .ics calendar passes.</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                Active
              </span>
            </div>
          </div>

          {/* n8n Webhook Integration */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                <span>n8n Workflow Webhook</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setWebhookActive(!webhookActive);
                  showToast(webhookActive ? 'n8n webhook disabled' : 'n8n webhook enabled');
                }}
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  webhookActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {webhookActive ? 'Active' : 'Disabled'}
              </button>
            </div>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Message Delivery Logs (Section 14: Keep message delivery status & retry history) */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            Live Delivery & Audit Log
          </h3>
          <span className="text-xs text-slate-400">Delivery receipts verified by messaging provider</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {deliveryLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 dark:text-white block">{log.event}</span>
                <span className="text-slate-500 font-mono text-[11px]">
                  {log.channel.toUpperCase()} → {log.recipient}
                </span>
              </div>

              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                  ✓ {log.status.toUpperCase()}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
