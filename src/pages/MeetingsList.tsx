/**
 * Universal Meetings Ledger (/meetings)
 * Multi-mode meeting management featuring Meeting Readiness Checklists,
 * Conflict Rescue heuristics, Fair Scheduling tracking, and Decision-to-Action linkage.
 */

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Search,
  Filter,
  CheckSquare,
  ShieldCheck,
  RefreshCw,
  XCircle,
  ExternalLink,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { UniversalSchedulingService, Meeting } from '../lib/universalScheduling';
import AddToCalendarMenu from '../components/AddToCalendarMenu.tsx';

export default function MeetingsList() {
  const activeOrg = UniversalSchedulingService.getActiveOrganization();
  const [meetings, setMeetings] = useState<Meeting[]>(() => UniversalSchedulingService.getMeetings(activeOrg.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Conflict Rescue Modal State
  const [rescueMeeting, setRescueMeeting] = useState<Meeting | null>(null);
  const [rescueAlternatives, setRescueAlternatives] = useState<any[]>([]);
  const [rescueToast, setRescueToast] = useState<string | null>(null);

  const reloadData = () => {
    setMeetings(UniversalSchedulingService.getMeetings(activeOrg.id));
  };

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (typeFilter !== 'all' && m.meetingType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchAttendees = m.requiredAttendees.some((a) => a.toLowerCase().includes(q));
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchAttendees && !matchDesc) return false;
      }
      return true;
    });
  }, [meetings, statusFilter, typeFilter, searchQuery]);

  // Open Conflict Rescue Modal
  const handleOpenRescue = (m: Meeting) => {
    setRescueMeeting(m);
    const alternatives = UniversalSchedulingService.rescueConflict(m);
    setRescueAlternatives(alternatives);
  };

  // Execute Conflict Rescue Shift
  const handleApplyRescue = (alt: any) => {
    if (!rescueMeeting) return;
    const res = UniversalSchedulingService.rescheduleMeeting(
      rescueMeeting.id,
      alt.alternativeStart,
      alt.alternativeEnd
    );
    if (res.success) {
      setRescueToast(`Meeting rescued! Moved to ${new Date(alt.alternativeStart).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`);
      setRescueMeeting(null);
      reloadData();
      setTimeout(() => setRescueToast(null), 3500);
    } else {
      alert(`Rescue failed: ${res.error}`);
    }
  };

  // Toggle or resolve checklist item
  const handleResolveChecklistItem = (meeting: Meeting, key: string) => {
    const updated = { ...meeting.readinessChecklist, [key]: true };
    meeting.readinessChecklist = updated;
    meeting.readinessScore = Object.values(updated).filter(Boolean).length * 25;
    reloadData();
  };

  const handleCancelMeeting = (m: Meeting) => {
    if (confirm(`Cancel meeting "${m.title}"? Attendees will be notified.`)) {
      UniversalSchedulingService.cancelMeeting(m.id, 'Cancelled by organizer');
      reloadData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Toast */}
      {rescueToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{rescueToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Meetings Ledger
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {activeOrg.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track multi-party schedules, meeting readiness checklists, and conflict resolution.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Link
            to="/find-a-time"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Smart Match</span>
          </Link>

          <Link
            to="/meetings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule Meeting</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search meetings by title, agenda, or attendee email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="scheduled">Scheduled</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Meeting Types</option>
            <option value="team_meeting">Team Meeting</option>
            <option value="one_to_one">1:1 Sync</option>
            <option value="interview">Interview</option>
            <option value="parent_teacher">Parent-Teacher</option>
            <option value="department_review">Department Review</option>
            <option value="sales_demo">Sales Demo</option>
          </select>
        </div>
      </div>

      {/* Meetings Cards */}
      {filteredMeetings.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No meetings match your filters</h3>
          <p className="text-xs text-slate-500">Create a new meeting or switch organization.</p>
          <div className="pt-2">
            <Link
              to="/meetings/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule a Meeting</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((m) => {
            const start = new Date(m.startTime);
            const end = new Date(m.endTime);

            // Mock calendar export data
            const calendarItem = {
              id: m.id,
              serviceName: m.title,
              date: start.toISOString().split('T')[0],
              startTime: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              endTime: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              duration: m.duration,
              notes: m.agenda || m.description,
              businessName: activeOrg.name,
              staffName: m.organizerName,
              address: m.resourceName || m.address || m.videoUrl,
            };

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {m.meetingType.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          m.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : m.status === 'rescheduled'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : m.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {m.title}
                    </h3>
                    {m.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                    )}
                  </div>

                  {/* Meeting Readiness Badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        Readiness:
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          m.readinessScore >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.readinessScore >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.readinessScore}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date, Location, and Resource Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({m.duration} mins)
                  </span>
                  {m.videoUrl && (
                    <>
                      <span>•</span>
                      <a
                        href={m.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Video Link</span>
                      </a>
                    </>
                  )}
                  {m.resourceName && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <Building2 className="w-4 h-4 text-indigo-500" />
                        <span>{m.resourceName}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Attendees */}
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Attendees:</span>
                  {m.requiredAttendees.map((att, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300"
                    >
                      {att}
                    </span>
                  ))}
                </div>

                {/* Meeting Readiness Checklist (Interactive 1-click resolve) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Meeting Readiness Checklist</span>
                    </span>
                    <span className="text-[11px] text-slate-400">Click to resolve missing requirements</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleResolveChecklistItem(m, 'agenda')}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] font-bold ${
                        m.readinessChecklist?.agenda
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <span>Agenda Prepared</span>
                      {m.readinessChecklist?.agenda ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="text-indigo-600">+ Add</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveChecklistItem(m, 'attendeesConfirmed')}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] font-bold ${
                        m.readinessChecklist?.attendeesConfirmed
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <span>Attendees Ready</span>
                      {m.readinessChecklist?.attendeesConfirmed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="text-indigo-600">+ Confirm</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveChecklistItem(m, 'locationReady')}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] font-bold ${
                        m.readinessChecklist?.locationReady
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <span>Link / Room Ready</span>
                      {m.readinessChecklist?.locationReady ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="text-indigo-600">+ Assign</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleResolveChecklistItem(m, 'materialsReady')}
                      className={`px-2.5 py-1.5 rounded-lg border text-left flex items-center justify-between text-[11px] font-bold ${
                        m.readinessChecklist?.materialsReady
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <span>Materials Attached</span>
                      {m.readinessChecklist?.materialsReady ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <span className="text-indigo-600">+ Attach</span>}
                    </button>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <AddToCalendarMenu
                      booking={calendarItem}
                      variant="outline"
                      label="Add to Calendar"
                      align="left"
                    />

                    <Link
                      to="/tasks"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Decisions & Tasks</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Conflict Rescue Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenRescue(m)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Conflict Rescue</span>
                    </button>

                    {m.status !== 'cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleCancelMeeting(m)}
                        className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Conflict Rescue Modal */}
      {rescueMeeting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Automated Conflict Rescue Heuristics
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Rescue: {rescueMeeting.title}
                </h3>
              </div>
              <button
                onClick={() => setRescueMeeting(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Conflict Rescue scans your attendees and room schedule to find the smallest reasonable set of changes that resolves the conflict while preserving all required attendees.
            </p>

            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Recommended Alternative Windows:
              </span>

              {rescueAlternatives.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                  No direct conflict detected. You can reschedule manually if desired.
                </div>
              ) : (
                rescueAlternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          {new Date(alt.alternativeStart).toLocaleString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{alt.explanation}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyRescue(alt)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0"
                    >
                      Shift to this Time
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
