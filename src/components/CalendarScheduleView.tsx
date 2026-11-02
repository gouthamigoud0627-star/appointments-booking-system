import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Send, 
  Download, 
  Filter, 
  DollarSign,
  Share2,
  CalendarDays,
  List
} from 'lucide-react';
import { Appointment, AppointmentStatus, StaffMember, SupportedLocale } from '../types';
import { translations } from '../i18n';

interface CalendarScheduleViewProps {
  appointments: Appointment[];
  staff: StaffMember[];
  locale: SupportedLocale;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus, note?: string) => Promise<void>;
  onSendReminder: (appointmentId: string, reminderType: '24h' | '2h', medium: 'sms' | 'email' | 'both') => Promise<void>;
}

export const CalendarScheduleView: React.FC<CalendarScheduleViewProps> = ({
  appointments,
  staff,
  locale,
  onUpdateStatus,
  onSendReminder,
}) => {
  const t = translations[locale];

  // Calendar View Mode: 'agenda' | 'day' | 'month'
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'agenda'>('month');

  // Selected date for day view or focus
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  // Selected Appointment Modal
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderSentMessage, setReminderSentMessage] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
    if (staffFilter !== 'all' && apt.staffId !== staffFilter) return false;
    return true;
  });

  const getAppointmentsForDate = (dateStr: string) => {
    return filteredAppointments.filter((a) => a.date === dateStr);
  };

  const handleReminderDispatch = async (type: '24h' | '2h') => {
    if (!activeAppointment) return;
    setReminderLoading(true);
    try {
      await onSendReminder(activeAppointment.id, type, 'both');
      setReminderSentMessage(`Successfully dispatched automated ${type} email & SMS reminders to ${activeAppointment.clientName}!`);
      setTimeout(() => setReminderSentMessage(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setReminderLoading(false);
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Confirmed</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Pending Review</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">In Session</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Cancelled</span>;
      case 'rescheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Rescheduled</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Header & Calendar Sync Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>Live Schedule & Synchronization</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            All appointments sync automatically across Web, Google Calendar, Apple iCal, and Outlook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === 'agenda' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Agenda
            </button>
          </div>

          {/* Export / Sync feed */}
          <a
            href={staffFilter !== 'all' ? `/api/calendar.ics?staffId=${staffFilter}` : '/api/calendar.ics'}
            download={
              staffFilter !== 'all'
                ? `${(staff.find((s) => s.id === staffFilter)?.name || 'staff').replace(/\s+/g, '_')}_schedule.ics`
                : 'schedula_master.ics'
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-700 transition-colors"
            title={
              staffFilter !== 'all'
                ? `Sync ${staff.find((s) => s.id === staffFilter)?.name || 'Specialist'}'s calendar feed`
                : 'Subscribe to master schedule via Google Calendar or Outlook'
            }
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {staffFilter !== 'all'
                ? `Sync ${staff.find((s) => s.id === staffFilter)?.name?.split(' ')[0]}'s Calendar`
                : 'Sync Master Calendar'}
            </span>
          </a>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-600">Filter by:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses ({appointments.length})</option>
            <option value="pending">Pending ({appointments.filter((a) => a.status === 'pending').length})</option>
            <option value="confirmed">Confirmed ({appointments.filter((a) => a.status === 'confirmed').length})</option>
            <option value="in_progress">In Session</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Specialists (Master Calendar)</option>
            {staff.map((st) => (
              <option key={st.id} value={st.id}>{st.name} ({st.role})</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredAppointments.length}</strong> scheduled sessions
        </div>
      </div>

      {/* Staff Availability Card Banner (when staff filter active) */}
      {staffFilter !== 'all' && (() => {
        const selStaff = staff.find((s) => s.id === staffFilter);
        if (!selStaff) return null;
        return (
          <div className="bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={selStaff.avatar}
                alt={selStaff.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-200"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">{selStaff.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                    {selStaff.role}
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span>🕒 Working Shift: <strong>{selStaff.workingHours?.start} - {selStaff.workingHours?.end}</strong></span>
                  {selStaff.breakTimes && selStaff.breakTimes.length > 0 && (
                    <span>☕ Lunch: <strong>{selStaff.breakTimes[0].start} - {selStaff.breakTimes[0].end}</strong></span>
                  )}
                  <span>📅 Active Days: <strong>{(selStaff.workingHours?.days || [1,2,3,4,5]).map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</strong></span>
                </div>
              </div>
            </div>

            <a
              href={`/api/calendar.ics?staffId=${selStaff.id}`}
              download={`${selStaff.name.replace(/\s+/g, '_')}_schedule.ics`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download {selStaff.name.split(' ')[0]}'s Calendar Feed</span>
            </a>
          </div>
        );
      })()}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Month Header Navigation */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 font-display">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                }}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-slate-100 text-center py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr border-collapse">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="min-h-[95px] p-2 bg-slate-50/30 border-b border-r border-slate-100" />
            ))}

            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayAppointments = getAppointmentsForDate(dStr);
              const isToday = dStr === today.toISOString().split('T')[0];
              const isSelected = dStr === selectedDate;

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(dStr)}
                  className={`min-h-[105px] p-2 border-b border-r border-slate-100 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/40 ring-1 ring-inset ring-indigo-400'
                      : isToday
                      ? 'bg-blue-50/20'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayAppointments.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-700 px-1.5 py-0.2 bg-indigo-100 rounded-full">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px]">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveAppointment(apt);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium border cursor-pointer hover:scale-[1.02] transition-transform ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : apt.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        title={`${apt.startTime} - ${apt.clientName} (${apt.serviceName})`}
                      >
                        <span className="font-bold mr-1">{apt.startTime}</span>
                        <span>{apt.clientName}</span>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-semibold px-1">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Day Schedule</span>
              <h3 className="text-lg font-bold text-slate-900">{selectedDate}</h3>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 font-semibold"
            />
          </div>

          {getAppointmentsForDate(selectedDate).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No appointments scheduled on {selectedDate}.
            </div>
          ) : (
            <div className="space-y-3">
              {getAppointmentsForDate(selectedDate).map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => setActiveAppointment(apt)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:shadow-sm transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      <div className="text-xs font-extrabold text-slate-900">{apt.startTime}</div>
                      <div className="text-[10px] text-slate-400">{apt.endTime}</div>
                    </div>
                    <div className="w-1 h-8 rounded-full bg-indigo-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{apt.clientName}</span>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {apt.serviceName} with <strong className="text-slate-700">{apt.staffName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-end text-xs">
                    <div className="text-right">
                      <div className="font-bold text-slate-900">${apt.payment.amountTotal}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">${apt.payment.depositPaid} deposit paid</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveAppointment(apt);
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                    >
                      Inspect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
            Chronological Upcoming Sessions
          </h3>

          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setActiveAppointment(apt)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0 text-left">
                    <div className="text-xs font-bold text-slate-900">{apt.date}</div>
                    <div className="text-[11px] text-indigo-700 font-semibold">{apt.startTime}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{apt.clientName}</span>
                      {getStatusBadge(apt.status)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {apt.serviceName} • {apt.staffName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">{apt.confirmationCode}</span>
                  <span className="font-bold text-slate-800">${apt.payment.amountTotal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* APPOINTMENT DETAILS & STATUS TRANSITION MODAL */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  REF: {activeAppointment.confirmationCode}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {activeAppointment.serviceName}
                </h3>
              </div>
              <button
                onClick={() => setActiveAppointment(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            {/* Status pill & transition selector */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                <div className="mt-1">{getStatusBadge(activeAppointment.status)}</div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Change:</span>
                <select
                  value={activeAppointment.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as AppointmentStatus;
                    await onUpdateStatus(activeAppointment.id, newStatus);
                    setActiveAppointment({ ...activeAppointment, status: newStatus });
                  }}
                  className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Session</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>
            </div>

            {/* Client & Booking details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Client</span>
                <div className="font-bold text-slate-900">{activeAppointment.clientName}</div>
                <div className="text-slate-500 truncate">{activeAppointment.clientEmail}</div>
                <div className="text-slate-500">{activeAppointment.clientPhone}</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Timing & Staff</span>
                <div className="font-bold text-indigo-700">{activeAppointment.date}</div>
                <div className="text-slate-700">{activeAppointment.startTime} - {activeAppointment.endTime}</div>
                <div className="text-slate-500">{activeAppointment.staffName}</div>
              </div>
            </div>

            {/* Payment & deposit details */}
            <div className="p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Summary</span>
                <span className="font-bold text-slate-900 text-sm">${activeAppointment.payment.amountTotal}.00</span>
                <span className="text-slate-400 ml-1.5">(${activeAppointment.payment.depositPaid} deposit paid)</span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                {activeAppointment.payment.status.replace('_', ' ')}
              </span>
            </div>

            {/* Automated Reminders Dispatch Buttons */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Automated Customer Reminders (Email & SMS)
              </span>

              {reminderSentMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reminderSentMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={reminderLoading}
                  onClick={() => handleReminderDispatch('24h')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Send 24h Reminder</span>
                </button>

                <button
                  disabled={reminderLoading}
                  onClick={() => handleReminderDispatch('2h')}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send 2h SMS Reminder</span>
                </button>
              </div>
            </div>

            {/* Footer close */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveAppointment(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
