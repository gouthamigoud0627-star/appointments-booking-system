/**
 * Schedule a Meeting (/meetings/new)
 * Universal meeting scheduling engine with attendee picker, room selector,
 * real-time server-side conflict detection, and meeting readiness checklist.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  ArrowLeft,
  ShieldCheck,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { UniversalSchedulingService, Resource } from '../lib/universalScheduling';

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const { currentBusiness, currentUser, customerUser } = useAuth();
  const activeOrg = UniversalSchedulingService.getActiveOrganization();

  // Organizer details
  const organizerName =
    customerUser?.name ||
    currentUser?.name ||
    currentUser?.ownerName ||
    'Janvi Patel';
  const organizerEmail =
    customerUser?.email ||
    currentUser?.email ||
    'janvi@schedora.io';

  const resources = useMemo(() => {
    return UniversalSchedulingService.getResources(activeOrg.id);
  }, [activeOrg.id]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingType, setMeetingType] = useState<any>('team_meeting');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<'video' | 'in_person' | 'phone'>('video');
  const [videoUrl, setVideoUrl] = useState('https://meet.google.com/sch-' + Math.random().toString(36).substring(2, 8));
  const [address, setAddress] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [requiredAttendeesInput, setRequiredAttendeesInput] = useState('marcus.chen@apex.io, elena@apex.io');
  const [optionalAttendeesInput, setOptionalAttendeesInput] = useState('');
  const [agenda, setAgenda] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('Please notify at least 2 hours in advance.');

  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Compute ISO start and end
  const { startIso, endIso } = useMemo(() => {
    try {
      const [year, month, day] = date.split('-').map(Number);
      const [hour, minute] = startTime.split(':').map(Number);
      const start = new Date(year, month - 1, day, hour, minute, 0);
      const end = new Date(start.getTime() + duration * 60000);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    } catch {
      const now = new Date();
      return { startIso: now.toISOString(), endIso: new Date(now.getTime() + 1800000).toISOString() };
    }
  }, [date, startTime, duration]);

  // Parse attendees list
  const requiredAttendees = useMemo(() => {
    return requiredAttendeesInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 3 && s.includes('@'));
  }, [requiredAttendeesInput]);

  const optionalAttendees = useMemo(() => {
    return optionalAttendeesInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 3 && s.includes('@'));
  }, [optionalAttendeesInput]);

  // Live Conflict Check
  const liveConflict = useMemo(() => {
    if (!startIso || !endIso) return null;
    const check = UniversalSchedulingService.checkMeetingConflicts({
      organizationId: activeOrg.id,
      startTime: startIso,
      endTime: endIso,
      requiredAttendees,
      resourceId: selectedResourceId || undefined,
    });
    return check.hasConflict ? check.conflictReason : null;
  }, [activeOrg.id, startIso, endIso, requiredAttendees, selectedResourceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setConflictWarning(null);

    if (!title.trim()) {
      alert('Please enter a meeting title.');
      return;
    }

    setSubmitting(true);
    const selectedResource = resources.find((r) => r.id === selectedResourceId);

    const result = UniversalSchedulingService.createMeeting({
      organizationId: activeOrg.id,
      organizerId: 'user-organizer',
      organizerName,
      organizerEmail,
      title: title.trim(),
      description: description.trim(),
      meetingType,
      startTime: startIso,
      endTime: endIso,
      duration,
      timezone: activeOrg.timezone,
      locationType,
      videoUrl: locationType === 'video' ? videoUrl : undefined,
      address: locationType === 'in_person' ? (selectedResource ? selectedResource.location : address) : undefined,
      resourceId: selectedResourceId || undefined,
      resourceName: selectedResource?.name,
      status: 'confirmed',
      requiredAttendees: [organizerEmail, ...requiredAttendees],
      optionalAttendees,
      agenda: agenda.trim(),
      cancellationPolicy,
    });

    setSubmitting(false);

    if (!result.success) {
      setConflictWarning(result.error || 'Failed to schedule meeting due to conflict.');
      return;
    }

    setSuccessToast(true);
    setTimeout(() => {
      navigate('/meetings');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/meetings"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meetings</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Organization:
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            {activeOrg.name} ({activeOrg.type})
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Schedule a New Meeting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Universal scheduling engine prevents double-booking rooms and detects attendee schedule overlaps.
          </p>
        </div>

        {/* Live Conflict Warning Banner */}
        {liveConflict && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="block font-bold">Scheduling Conflict Detected</strong>
              <p>{liveConflict}</p>
              <div className="pt-1">
                <Link
                  to="/find-a-time"
                  className="font-bold underline text-rose-700 dark:text-rose-300 hover:text-rose-900"
                >
                  Use Smart Meeting Match to find alternative slots →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Meeting Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Meeting Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Architecture Alignment & Q4 Sprint Planning"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Meeting Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="team_meeting">Internal Team Meeting</option>
                <option value="one_to_one">1:1 Synchronization</option>
                <option value="group_meeting">Group Collaboration</option>
                <option value="client_consultation">Client Consultation</option>
                <option value="interview">Recruitment Interview</option>
                <option value="panel_interview">Panel Interview</option>
                <option value="parent_teacher">Parent-Teacher Meeting</option>
                <option value="department_review">Department Review</option>
                <option value="sales_demo">Sales Demo</option>
                <option value="discovery_call">Discovery Call</option>
              </select>
            </div>
          </div>

          {/* Date, Time & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={15}>15 minutes (Quick Standup)</option>
                <option value={30}>30 minutes (Standard)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes (1 Hour)</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Required Attendees (Comma-separated emails)</span>
                <span className="text-[10px] text-slate-400">Strict conflict checks apply</span>
              </label>
              <input
                type="text"
                value={requiredAttendeesInput}
                onChange={(e) => setRequiredAttendeesInput(e.target.value)}
                placeholder="alice@apex.io, bob@apex.io"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Optional Attendees (Optional)
              </label>
              <input
                type="text"
                value={optionalAttendeesInput}
                onChange={(e) => setOptionalAttendeesInput(e.target.value)}
                placeholder="charlie@apex.io"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Location & Room Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Location Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType('video')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                    locationType === 'video'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Video Call
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('in_person')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                    locationType === 'in_person'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  In-Person
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType('phone')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                    locationType === 'phone'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Phone
                </button>
              </div>
            </div>

            {/* Room / Resource selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reserve Meeting Room or Resource
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No physical room needed</option>
                {resources.map((res) => (
                  <option key={res.id} value={res.id}>
                    {res.name} ({res.type} • Cap: {res.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {locationType === 'video' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Video Conference URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>
          )}

          {locationType === 'in_person' && !selectedResourceId && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Physical Address / Location Details
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 500 Howard Street, San Francisco, CA"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Agenda & Readiness */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Meeting Agenda & Objectives (Boosts Meeting Readiness)
            </label>
            <textarea
              rows={3}
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              placeholder="Outline topics to discuss, expected outcomes, and pre-read materials..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Double-booking prevention & RLS organization isolation active.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/meetings')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || Boolean(liveConflict)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Verifying & Saving...' : 'Confirm & Schedule Meeting'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
