/**
 * Sales Team Scheduling Mode (/sales)
 * Product demonstrations, discovery calls, fair round-robin representative assignment,
 * lead references, and meeting outcome tracking.
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2,
  Shuffle,
  PlusCircle,
  ExternalLink,
  Target,
  FileCheck,
} from 'lucide-react';
import { UniversalSchedulingService, SalesLead } from '../lib/universalScheduling';

export default function SalesWorkspace() {
  const activeOrg = UniversalSchedulingService.getActiveOrganization();
  const [leads, setLeads] = useState<SalesLead[]>(() => UniversalSchedulingService.getSalesLeads(activeOrg.id));

  // Form state for scheduling new demo
  const [leadName, setLeadName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const reloadData = () => {
    setLeads(UniversalSchedulingService.getSalesLeads(activeOrg.id));
  };

  const handleBookDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !company.trim() || !email.trim()) return;

    const created = UniversalSchedulingService.assignRoundRobinSalesDemo({
      organizationId: activeOrg.id,
      leadName: leadName.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      demoDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: 'demo_scheduled',
      outcomeNotes: notes.trim(),
    });

    reloadData();
    setLeadName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setNotes('');

    setSuccessToast(`Demo scheduled! Automatically assigned via Round-Robin to ${created.assignedRepName}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-950 via-amber-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/30">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Sales Scheduling Workspace</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Inbound Demos & Round-Robin Routing
        </h1>
        <p className="text-xs sm:text-sm text-orange-200 max-w-2xl leading-relaxed">
          Distribute client discovery calls and software demos fairly among account executives,
          track conversion stages, and eliminate lead drop-off.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schedule Inbound Demo Form */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Book & Route Demo
            </h2>
            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Shuffle className="w-3 h-3" />
              <span>Round-Robin</span>
            </span>
          </div>

          <form onSubmit={handleBookDemo} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Lead Name *</label>
              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="e.g. David Vance"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Company / Organization *</label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Orbit Financial Technologies"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Business Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@company.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2918"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Outcome & Requirements</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Key use cases, seat count, compliance needs..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              Dispatch Demo via Round-Robin
            </button>
          </form>
        </div>

        {/* Right: Scheduled Demos Ledger */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Demo Pipeline & Rep Distribution ({leads.length})
            </h2>
            <span className="text-xs text-slate-400 font-semibold">Real CRM References</span>
          </div>

          <div className="space-y-3">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {lead.leadName} • <span className="text-slate-500">{lead.company}</span>
                    </h3>
                    <div className="text-xs text-slate-400 font-mono">{lead.email} {lead.phone ? `• ${lead.phone}` : ''}</div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto ${
                      lead.status === 'converted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lead.status === 'demo_scheduled'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {lead.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Target className="w-3.5 h-3.5 text-orange-500" />
                    <span>Assigned Rep: <strong className="text-slate-900 dark:text-white">{lead.assignedRepName}</strong></span>
                  </div>

                  {lead.demoDate && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(lead.demoDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>

                {lead.outcomeNotes && (
                  <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <strong>Notes:</strong> {lead.outcomeNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
