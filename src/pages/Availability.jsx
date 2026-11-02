/**
 * Availability & Operating Hours Page (/availability)
 * Manages recurring weekly schedule, daily on/off toggles, break periods, and provides live slot previews.
 */

import React, { useState, useMemo } from 'react';
import { Clock, Check, AlertCircle, Sparkles, Plus, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { generateAvailableSlots } from '../lib/availability.js';
import { getAllBookings } from '../lib/bookings.js';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function Availability() {
  const { currentBusiness, updateBusiness } = useAuth();

  const [weekly, setWeekly] = useState(
    currentBusiness?.weeklyAvailability || {
      monday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tuesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, open: '10:00', close: '16:00', breaks: [] },
      sunday: { enabled: false, open: '10:00', close: '14:00', breaks: [] },
    }
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewDuration, setPreviewDuration] = useState(45);

  const handleToggleDay = (day) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleAddBreak = (day) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [...(prev[day].breaks || []), { start: '13:00', end: '14:00' }],
      },
    }));
  };

  const handleRemoveBreak = (day, index) => {
    setWeekly((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: (prev[day].breaks || []).filter((_, i) => i !== index),
      },
    }));
  };

  const handleBreakChange = (day, index, field, value) => {
    setWeekly((prev) => {
      const copy = [...(prev[day].breaks || [])];
      copy[index] = { ...copy[index], [field]: value };
      return {
        ...prev,
        [day]: {
          ...prev[day],
          breaks: copy,
        },
      };
    });
  };

  // Live slot preview for today using current edited settings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const livePreviewSlots = useMemo(() => {
    if (!currentBusiness) return [];
    const tempBusiness = {
      ...currentBusiness,
      weeklyAvailability: weekly,
    };
    return generateAvailableSlots({
      business: tempBusiness,
      serviceDurationMinutes: previewDuration,
      dateStr: todayStr,
      existingBookings: getAllBookings(),
    });
  }, [currentBusiness, weekly, previewDuration, todayStr]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      await updateBusiness({ weeklyAvailability: weekly });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save availability: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Operational Hours</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Weekly Availability & Cutoffs</h1>
          <p className="text-xs text-slate-500">
            Define open days, start and end hours, and staff lunch breaks to auto-generate client time slots.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all disabled:bg-slate-300 self-start sm:self-auto"
        >
          {saving ? (
            'Saving Changes...'
          ) : success ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Saved Successfully!</span>
            </>
          ) : (
            'Save Working Hours'
          )}
        </button>
      </div>

      {/* Weekly configuration list */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {DAYS.map((day) => {
          const sched = weekly[day] || { enabled: false, open: '09:00', close: '17:00', breaks: [] };
          return (
            <div key={day} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Day toggle */}
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  id={`toggle-${day}`}
                  checked={sched.enabled}
                  onChange={() => handleToggleDay(day)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label
                  htmlFor={`toggle-${day}`}
                  className={`text-sm font-bold capitalize cursor-pointer ${
                    sched.enabled ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {day}
                </label>
              </div>

              {/* Hours / Closed state */}
              {sched.enabled ? (
                <div className="flex-1 flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold">Open:</span>
                    <input
                      type="time"
                      value={sched.open}
                      onChange={(e) => handleTimeChange(day, 'open', e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <span className="text-slate-300">to</span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold">Close:</span>
                    <input
                      type="time"
                      value={sched.close}
                      onChange={(e) => handleTimeChange(day, 'close', e.target.value)}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    />
                  </div>

                  {/* Breaks */}
                  <div className="flex items-center gap-2 flex-wrap ml-0 sm:ml-4">
                    {(sched.breaks || []).map((brk, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-lg text-[11px]"
                      >
                        <span className="font-semibold">Break:</span>
                        <input
                          type="time"
                          value={brk.start}
                          onChange={(e) => handleBreakChange(day, bIdx, 'start', e.target.value)}
                          className="bg-transparent border-0 p-0 text-[11px] font-bold w-12"
                        />
                        <span>-</span>
                        <input
                          type="time"
                          value={brk.end}
                          onChange={(e) => handleBreakChange(day, bIdx, 'end', e.target.value)}
                          className="bg-transparent border-0 p-0 text-[11px] font-bold w-12"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveBreak(day, bIdx)}
                          className="text-amber-700 hover:text-amber-900 ml-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddBreak(day)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded bg-indigo-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Break
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-xs text-slate-400 italic">Closed all day</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time slot preview sandbox */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Slot Engine Preview</h2>
            <p className="text-xs text-slate-500">
              Preview open client reservation slots for today based on current hours & 45m service duration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Service Duration:</span>
            <select
              value={previewDuration}
              onChange={(e) => setPreviewDuration(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={45}>45 Minutes</option>
              <option value={60}>60 Minutes</option>
              <option value={90}>90 Minutes</option>
            </select>
          </div>
        </div>

        {livePreviewSlots.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
            No slots generated for today (either closed, past hours, or breaks).
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2 pt-2">
            {livePreviewSlots.map((slot) => (
              <div
                key={slot.time}
                className="py-2 px-1 text-center bg-indigo-50/70 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold"
              >
                {slot.formattedTime}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
