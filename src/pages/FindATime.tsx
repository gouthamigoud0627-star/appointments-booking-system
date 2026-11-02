/**
 * Find a Time ("Smart Meeting Match") (/find-a-time)
 * Intelligent multi-participant scheduling assistant that scans working hours,
 * excludes busy periods, checks room availability, and ranks optimal slots with explanations.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Users,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ThumbsUp,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { UniversalSchedulingService } from '../lib/universalScheduling';

export default function FindATime() {
  const navigate = useNavigate();
  const { customerUser, currentUser } = useAuth();
  const activeOrg = UniversalSchedulingService.getActiveOrganization();

  const organizerName =
    customerUser?.name ||
    currentUser?.name ||
    currentUser?.ownerName ||
    'Janvi Patel';
  const organizerEmail =
    customerUser?.email ||
    currentUser?.email ||
    'janvi@schedora.io';

  const [meetingTitle, setMeetingTitle] = useState('Cross-Team Strategic Alignment');
  const [attendeesInput, setAttendeesInput] = useState('marcus.chen@apex.io, elena@apex.io');
  const [duration, setDuration] = useState(30);
  const [daysAhead, setDaysAhead] = useState(5);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const attendeesList = attendeesInput
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 3 && s.includes('@'));

  // Run Smart Match
  const rankedSlots = UniversalSchedulingService.findSmartMeetingSlots({
    organizationId: activeOrg.id,
    attendees: [organizerEmail, ...attendeesList],
    durationMinutes: duration,
    daysAhead,
  });

  const handleBookSlot = (slot: any) => {
    // Revalidate availability immediately before saving
    const conflict = UniversalSchedulingService.checkMeetingConflicts({
      organizationId: activeOrg.id,
      startTime: slot.slotStart,
      endTime: slot.slotEnd,
      requiredAttendees: [organizerEmail, ...attendeesList],
    });

    if (conflict.hasConflict) {
      alert(`Slot is no longer available: ${conflict.conflictReason}`);
      return;
    }

    const result = UniversalSchedulingService.createMeeting({
      organizationId: activeOrg.id,
      organizerId: 'user-organizer',
      organizerName,
      organizerEmail,
      title: meetingTitle || 'Strategic Team Meeting',
      description: 'Scheduled via Schedora Smart Meeting Match with full mutual availability.',
      meetingType: 'team_meeting',
      startTime: slot.slotStart,
      endTime: slot.slotEnd,
      duration,
      timezone: activeOrg.timezone,
      locationType: 'video',
      videoUrl: 'https://meet.google.com/sch-' + Math.random().toString(36).substring(2, 8),
      status: 'confirmed',
      requiredAttendees: [organizerEmail, ...attendeesList],
      optionalAttendees: [],
      agenda: 'Mutual alignment and follow-up items.',
    });

    if (result.success) {
      setBookingSuccess(
        `Meeting booked! ${new Date(slot.slotStart).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at ${new Date(slot.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
      setTimeout(() => {
        navigate('/meetings');
      }, 1500);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/15">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
          <span>Smart Meeting Match Heuristics</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Find a Time for Multiple Participants
        </h1>
        <p className="text-xs sm:text-sm text-indigo-200 max-w-2xl leading-relaxed">
          Schedora scans attendee schedules, eliminates busy intervals, avoids inconvenient early/late hours,
          and ranks the best candidate times with transparent explanations.
        </p>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-xs font-bold">{bookingSuccess}</div>
        </div>
      )}

      {/* Parameter Settings */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Meeting Title
            </label>
            <input
              type="text"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Cross-Functional Review"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Participants to Match (Comma-separated emails)</span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
              Host: {organizerEmail}
            </span>
          </label>
          <input
            type="text"
            value={attendeesInput}
            onChange={(e) => setAttendeesInput(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Ranked Candidate Slots */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Ranked Optimal Times ({rankedSlots.length} Found)</span>
          </h2>
          <span className="text-xs text-slate-400">Sorted by highest mutual availability score</span>
        </div>

        {rankedSlots.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No overlapping slots found within current search parameters.
            </p>
            <p className="text-[11px] text-slate-500">Try reducing meeting duration or expanding the date range.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {rankedSlots.map((slot, index) => {
              const startObj = new Date(slot.slotStart);
              const endObj = new Date(slot.slotEnd);

              return (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-black border border-indigo-200 dark:border-indigo-800">
                        Rank #{index + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {slot.score}% Match
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          ★ Recommended
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 pt-1">
                      <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {startObj.toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        {startObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {endObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400">{slot.explanation}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBookSlot(slot)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    <span>Confirm This Slot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
