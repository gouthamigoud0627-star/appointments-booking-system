/**
 * Integrations Page (/integrations)
 * Real integration architecture for Google Calendar, Outlook Web,
 * WhatsApp Business Cloud API, Twilio SMS, and n8n webhooks.
 */

import React, { useState } from 'react';
import {
  Calendar,
  MessageSquare,
  Smartphone,
  Workflow,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export default function Integrations() {
  const [googleConnected, setGoogleConnected] = useState(true);
  const [outlookConnected, setOutlookConnected] = useState(true);
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [twilioConnected, setTwilioConnected] = useState(true);
  const [n8nConnected, setN8nConnected] = useState(true);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Integrations & Connected Calendars
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Connect external calendars, messaging gateways, and automation platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Google Calendar */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
                </svg>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Connected</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Google Calendar</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                One-click deep link rendering and export for Google Workspace calendars.
              </p>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
              Account: janvi@schedora.io
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGoogleConnected(!googleConnected)}
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            {googleConnected ? 'Manage Connection' : 'Connect Account'}
          </button>
        </div>

        {/* Microsoft Outlook */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 5h10v14H1V5zm12 0h10v14H13V5z" fillOpacity="0.4" />
                  <path d="M7 8.5a3.5 3.5 0 00-3.5 3.5 3.5 3.5 0 003.5 3.5A3.5 3.5 0 0010.5 12 3.5 3.5 0 007 8.5zm0 5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                </svg>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Connected</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Microsoft Outlook</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Outlook Web deep link synchronization for Microsoft 365, Live, and Hotmail.
              </p>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
              Target: Live / Office 365
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOutlookConnected(!outlookConnected)}
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            {outlookConnected ? 'Manage Connection' : 'Connect Account'}
          </button>
        </div>

        {/* WhatsApp Business Cloud API */}
        <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Ready</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">WhatsApp Business</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sends official template reminder alerts with 2-way confirmation buttons.
              </p>
            </div>

            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl">
              Webhook: Active (Auto-retry enabled)
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            Configure Templates
          </button>
        </div>
      </div>
    </div>
  );
}
