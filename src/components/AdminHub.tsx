import React, { useState } from 'react';
import { 
  CalendarCheck2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Send, 
  Search, 
  Plus, 
  Filter, 
  User, 
  DollarSign, 
  Phone, 
  Mail, 
  Tag, 
  Sparkles,
  RefreshCw,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  Calendar,
  Coffee,
  Check,
  ChevronDown,
  Download,
  ShieldCheck,
  Briefcase,
  Ticket,
  QrCode
} from 'lucide-react';
import { Appointment, AppointmentStatus, BusinessSettings, DaySchedule, Service, StaffMember, SupportedLocale } from '../types';
import { translations } from '../i18n';

interface AdminHubProps {
  appointments: Appointment[];
  services: Service[];
  staff: StaffMember[];
  settings: BusinessSettings;
  locale: SupportedLocale;
  onUpdateStatus: (id: string, newStatus: AppointmentStatus, note?: string) => Promise<void>;
  onSendReminder: (appointmentId: string, reminderType: '24h' | '2h', medium: 'sms' | 'email' | 'both') => Promise<void>;
  onAddService: (newService: Partial<Service>) => Promise<void>;
  onAddStaff: (newStaff: Partial<StaffMember>) => Promise<void>;
  onUpdateStaff: (id: string, updatedStaff: Partial<StaffMember>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  onAssignStaff: (appointmentId: string, staffId: string) => Promise<void>;
  onRefresh: () => void;
  loading: boolean;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  appointments,
  services,
  staff,
  settings,
  locale,
  onUpdateStatus,
  onSendReminder,
  onAddService,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onAssignStaff,
  onRefresh,
  loading,
}) => {
  const t = translations[locale];

  const [activeSubTab, setActiveSubTab] = useState<'appointments' | 'services' | 'staff'>('appointments');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Front Desk Arrival Token Verifier
  const [verifyTokenInput, setVerifyTokenInput] = useState<string>('');
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [verifyFeedback, setVerifyFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleVerifyToken = async (tokenCode: string) => {
    if (!tokenCode.trim()) return;
    setVerifyLoading(true);
    setVerifyFeedback(null);
    try {
      const res = await fetch(`/api/appointments/check-in-token?token=${encodeURIComponent(tokenCode.trim())}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifyFeedback({
          success: true,
          message: `Arrival Verified! ${data.appointment?.clientName} (Token ${data.appointment?.tokenNumber || tokenCode}) has been confirmed at reception and marked as physically arrived.`
        });
        setVerifyTokenInput('');
        if (onRefresh) onRefresh();
        showToast(`Arrival Verified: ${data.appointment?.clientName}`);
      } else {
        setVerifyFeedback({
          success: false,
          message: data.error || 'Token not found or already verified.'
        });
      }
    } catch {
      setVerifyFeedback({
        success: false,
        message: 'Could not connect to reception token verification service.'
      });
    } finally {
      setVerifyLoading(false);
    }
  };

  // New Service Modal
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('Consultation');
  const [newServicePrice, setNewServicePrice] = useState(80);
  const [newServiceDuration, setNewServiceDuration] = useState(45);
  const [newServiceDeposit, setNewServiceDeposit] = useState(25);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Service Catalog Filter States
  const [adminServiceSearch, setAdminServiceSearch] = useState('');
  const [adminServiceCategory, setAdminServiceCategory] = useState('All');

  // Staff Modal (Add & Edit)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffAvatar, setStaffAvatar] = useState('');
  const [staffBio, setStaffBio] = useState('');
  const [staffServiceIds, setStaffServiceIds] = useState<string[]>([]);
  const [staffStartHour, setStaffStartHour] = useState('09:00');
  const [staffEndHour, setStaffEndHour] = useState('17:00');
  const [staffBreakStart, setStaffBreakStart] = useState('12:30');
  const [staffBreakEnd, setStaffBreakEnd] = useState('13:30');
  const [staffDaySchedule, setStaffDaySchedule] = useState<DaySchedule[]>([
    { day: 1, enabled: true, start: '09:00', end: '17:00' },
    { day: 2, enabled: true, start: '09:00', end: '17:00' },
    { day: 3, enabled: true, start: '09:00', end: '17:00' },
    { day: 4, enabled: true, start: '09:00', end: '17:00' },
    { day: 5, enabled: true, start: '09:00', end: '16:00' },
    { day: 6, enabled: false, start: '10:00', end: '16:00' },
    { day: 0, enabled: false, start: '09:00', end: '17:00' },
  ]);

  // Appointment Reassignment Modal
  const [reassignAppointment, setReassignAppointment] = useState<Appointment | null>(null);
  const [targetReassignStaffId, setTargetReassignStaffId] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    if (filterStaffId !== 'all' && apt.staffId !== filterStaffId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        apt.clientName.toLowerCase().includes(q) ||
        apt.serviceName.toLowerCase().includes(q) ||
        apt.confirmationCode.toLowerCase().includes(q) ||
        apt.staffName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus) => {
    setActionLoadingId(id);
    try {
      await onUpdateStatus(id, newStatus);
      showToast(`Appointment status updated to ${newStatus.replace('_', ' ')}.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName) return;
    await onAddService({
      name: newServiceName,
      category: newServiceCategory,
      price: newServicePrice,
      durationMinutes: newServiceDuration,
      depositRequired: newServiceDeposit,
      description: newServiceDesc,
    });
    setIsAddServiceOpen(false);
    setNewServiceName('');
    setNewServiceDesc('');
    showToast(`Service "${newServiceName}" added to catalog.`);
  };

  const openAddStaffModal = () => {
    setEditingStaffId(null);
    setStaffName('');
    setStaffRole('Specialist Associate');
    setStaffEmail('');
    setStaffPhone('+1 (555) 000-1234');
    setStaffAvatar('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80');
    setStaffBio('Dedicated service professional focused on exceptional client outcomes.');
    setStaffServiceIds(services.map((s) => s.id));
    setStaffStartHour('09:00');
    setStaffEndHour('17:00');
    setStaffBreakStart('12:30');
    setStaffBreakEnd('13:30');
    setStaffDaySchedule([
      { day: 1, enabled: true, start: '09:00', end: '17:00' },
      { day: 2, enabled: true, start: '09:00', end: '17:00' },
      { day: 3, enabled: true, start: '09:00', end: '17:00' },
      { day: 4, enabled: true, start: '09:00', end: '17:00' },
      { day: 5, enabled: true, start: '09:00', end: '17:00' },
      { day: 6, enabled: false, start: '10:00', end: '15:00' },
      { day: 0, enabled: false, start: '09:00', end: '17:00' },
    ]);
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (st: StaffMember) => {
    setEditingStaffId(st.id);
    setStaffName(st.name);
    setStaffRole(st.role);
    setStaffEmail(st.email);
    setStaffPhone(st.phone);
    setStaffAvatar(st.avatar);
    setStaffBio(st.bio || '');
    setStaffServiceIds(st.serviceIds || []);
    setStaffStartHour(st.workingHours?.start || '09:00');
    setStaffEndHour(st.workingHours?.end || '17:00');
    setStaffBreakStart(st.breakTimes?.[0]?.start || '12:30');
    setStaffBreakEnd(st.breakTimes?.[0]?.end || '13:30');

    if (st.workingHours?.daySchedule && st.workingHours.daySchedule.length > 0) {
      setStaffDaySchedule(st.workingHours.daySchedule);
    } else {
      const activeDays = st.workingHours?.days || [1, 2, 3, 4, 5];
      setStaffDaySchedule([0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        enabled: activeDays.includes(day),
        start: st.workingHours?.start || '09:00',
        end: st.workingHours?.end || '17:00',
      })));
    }
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffRole) return;

    const enabledDays = staffDaySchedule.filter((d) => d.enabled).map((d) => d.day);

    const staffPayload: Partial<StaffMember> = {
      name: staffName,
      role: staffRole,
      email: staffEmail || `${staffName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@schedulabusiness.com`,
      phone: staffPhone,
      avatar: staffAvatar,
      bio: staffBio,
      serviceIds: staffServiceIds,
      workingHours: {
        start: staffStartHour,
        end: staffEndHour,
        days: enabledDays,
        daySchedule: staffDaySchedule,
      },
      breakTimes: [{ start: staffBreakStart, end: staffBreakEnd, label: 'Lunch Break' }],
      active: true,
    };

    if (editingStaffId) {
      await onUpdateStaff(editingStaffId, staffPayload);
      showToast(`Updated specialist ${staffName}'s profile and working hours.`);
    } else {
      await onAddStaff(staffPayload);
      showToast(`Added new staff member ${staffName} with custom working schedule.`);
    }

    setIsStaffModalOpen(false);
  };

  const handleDeleteStaffMember = async (st: StaffMember) => {
    const activeCount = appointments.filter(
      (a) => a.staffId === st.id && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress')
    ).length;

    if (activeCount > 0) {
      alert(`Cannot delete ${st.name}: they have ${activeCount} active appointment(s). Please reassign those appointments first.`);
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${st.name} from the staff directory?`)) {
      await onDeleteStaff(st.id);
      showToast(`Staff specialist ${st.name} removed.`);
    }
  };

  const handleConfirmReassign = async () => {
    if (!reassignAppointment || !targetReassignStaffId) return;
    const targetStaff = staff.find((s) => s.id === targetReassignStaffId);
    if (!targetStaff) return;

    await onAssignStaff(reassignAppointment.id, targetReassignStaffId);
    showToast(`Appointment ${reassignAppointment.confirmationCode} reassigned to ${targetStaff.name}.`);
    setReassignAppointment(null);
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hub Top Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
              <span>{t.adminDashboard}</span>
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {appointments.length} Total Bookings
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage your appointments queue, staff specialist roster with individual working hours, and service catalog.
          </p>
        </div>

        {/* Sub-tab switch & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              id="subtab-appointments-btn"
              onClick={() => setActiveSubTab('appointments')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'appointments'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Appointments ({appointments.length})
            </button>
            <button
              id="subtab-staff-btn"
              onClick={() => setActiveSubTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'staff'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff Specialists ({staff.length})</span>
            </button>
            <button
              id="subtab-services-btn"
              onClick={() => setActiveSubTab('services')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSubTab === 'services'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Services Catalog ({services.length})
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. APPOINTMENTS QUEUE TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-4">
          
          {/* Front Desk Physical Arrival Token Verifier Console */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/50 flex items-center justify-center text-indigo-300 border border-indigo-400/30">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                      <span>Front Desk Arrival & Token Verification Console</span>
                      <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        Live Check-In
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      When customers physically appear, ask for their arrival token number or confirmation code to verify attendance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Token Input Form */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Ticket className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Enter Token (e.g. TK-9821 or APX-8149)"
                    value={verifyTokenInput}
                    onChange={(e) => setVerifyTokenInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyToken(verifyTokenInput);
                    }}
                    className="w-64 pl-9 pr-3 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVerifyToken(verifyTokenInput)}
                  disabled={verifyLoading || !verifyTokenInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{verifyLoading ? 'Verifying...' : 'Verify Arrival'}</span>
                </button>
              </div>
            </div>

            {/* Verification Result Feedback Alert */}
            {verifyFeedback && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
                verifyFeedback.success
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200'
                  : 'bg-red-500/20 border border-red-400/40 text-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {verifyFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{verifyFeedback.message}</span>
                </div>
                <button
                  onClick={() => setVerifyFeedback(null)}
                  className="text-[11px] underline opacity-80 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Quick Token Pills from Pending Arrivals */}
            {appointments.filter((a) => !a.physicallyCheckedIn && (a.status === 'confirmed' || a.status === 'pending')).length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="text-slate-400 font-semibold">Today's Expected Tokens:</span>
                {appointments
                  .filter((a) => !a.physicallyCheckedIn && (a.status === 'confirmed' || a.status === 'pending'))
                  .slice(0, 4)
                  .map((apt) => {
                    const token = apt.tokenNumber || apt.confirmationCode;
                    return (
                      <button
                        key={apt.id}
                        onClick={() => handleVerifyToken(token)}
                        className="px-2.5 py-1 bg-white/10 hover:bg-indigo-600/40 rounded-lg text-white font-mono text-[10px] font-bold border border-white/10 transition-colors flex items-center gap-1.5"
                        title={`Click to quickly check in ${apt.clientName}`}
                      >
                        <span>{token}</span>
                        <span className="text-[9px] font-sans font-normal text-slate-300">({apt.clientName})</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Filter, Specialist Select & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/90 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Status:</span>
              {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-semibold transition-all ${
                    filterStatus === st
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Staff:</span>
              <select
                value={filterStaffId}
                onChange={(e) => setFilterStaffId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Specialists</option>
                {staff.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search client, service, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Appointment Cards Feed */}
          {filteredAppointments.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No appointments matching this search or filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map((apt) => {
                const isPending = apt.status === 'pending';
                const isConfirmed = apt.status === 'confirmed';
                const isInProgress = apt.status === 'in_progress';
                const isCompleted = apt.status === 'completed';

                return (
                  <div
                    key={apt.id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between ${
                      isPending
                        ? 'border-amber-300 ring-1 ring-amber-200 bg-amber-50/10'
                        : isInProgress
                        ? 'border-blue-300 bg-blue-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top Header info */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              {apt.clientName}
                            </span>
                            <span 
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center gap-1"
                              title="Physical Arrival Token"
                            >
                              <Ticket className="w-2.5 h-2.5" />
                              <span>{apt.tokenNumber || apt.confirmationCode}</span>
                            </span>
                            {apt.physicallyCheckedIn && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Arrived</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-indigo-700 mt-0.5">
                            {apt.serviceName}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-100 text-amber-800'
                              : isConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : isInProgress
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : isCompleted
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {apt.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Time & Assigned Specialist */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.date} @ <strong>{apt.startTime}</strong></span>
                        </div>
                        <div className="flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate font-semibold">{apt.staffName}</span>
                          </div>
                          <button
                            onClick={() => {
                              setReassignAppointment(apt);
                              setTargetReassignStaffId(apt.staffId);
                            }}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold ml-1 hover:underline shrink-0"
                            title="Reassign to another staff member"
                          >
                            Reassign
                          </button>
                        </div>
                      </div>

                      {/* Contact and Payment summary */}
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>{apt.clientEmail} • {apt.clientPhone}</span>
                        <span className="font-bold text-slate-900">${apt.payment.amountTotal}.00</span>
                      </div>
                    </div>

                    {/* Operational Action Controls */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isPending && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                            disabled={actionLoadingId === apt.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Confirm</span>
                          </button>
                        )}

                        {isConfirmed && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'in_progress')}
                            disabled={actionLoadingId === apt.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Start Session</span>
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            disabled={actionLoadingId === apt.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Complete Booking</span>
                          </button>
                        )}

                        {!apt.physicallyCheckedIn && apt.status !== 'completed' && apt.status !== 'cancelled' && (
                          <button
                            onClick={() => handleVerifyToken(apt.tokenNumber || apt.confirmationCode)}
                            disabled={verifyLoading}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors"
                            title="Verify physical arrival at reception"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            <span>Verify Arrival</span>
                          </button>
                        )}

                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <button
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            disabled={actionLoadingId === apt.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Cancel appointment"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Reminders Dispatch */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onSendReminder(apt.id, '24h', 'both')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Trigger 24-hour reminder email & SMS"
                        >
                          <Send className="w-3 h-3 text-indigo-600" />
                          <span>24h Reminder</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STAFF SPECIALISTS & SCHEDULES MANAGEMENT MODULE */}
      {/* ========================================================================= */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Specialist Team & Working Hours Configuration</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define staff working hours per day, assign authorized services, configure breaks, and synchronize calendar feeds.
              </p>
            </div>

            <button
              id="btn-add-staff-member"
              onClick={openAddStaffModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((st) => {
              const assignedAppointments = appointments.filter(
                (a) => a.staffId === st.id && a.status !== 'cancelled'
              );
              const pendingCount = assignedAppointments.filter((a) => a.status === 'pending').length;
              const staffServices = services.filter((srv) => st.serviceIds.includes(srv.id));

              return (
                <div
                  key={st.id}
                  id={`staff-card-${st.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    {/* Specialist Profile Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-50 border border-slate-200 shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">{st.name}</h4>
                          <span className="text-[11px] font-semibold text-indigo-700 block">{st.role}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{st.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditStaffModal(st)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit staff details & schedule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaffMember(st)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove specialist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bio */}
                    {st.bio && (
                      <p className="mt-2.5 text-xs text-slate-600 line-clamp-2 leading-relaxed italic bg-slate-50/80 p-2 rounded-xl">
                        "{st.bio}"
                      </p>
                    )}

                    {/* Weekly Schedule Overview */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          Working Hours
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {st.workingHours?.start || '09:00'} - {st.workingHours?.end || '17:00'}
                        </span>
                      </div>

                      {/* Day Pills */}
                      <div className="flex items-center gap-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, dayIdx) => {
                          let isWorking = false;
                          if (st.workingHours?.daySchedule) {
                            const ds = st.workingHours.daySchedule.find((d) => d.day === dayIdx);
                            isWorking = ds ? ds.enabled : false;
                          } else if (st.workingHours?.days) {
                            isWorking = st.workingHours.days.includes(dayIdx);
                          }

                          return (
                            <span
                              key={dayIdx}
                              className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                isWorking
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                              title={`${dayNames[dayIdx]}: ${isWorking ? 'Working' : 'Off'}`}
                            >
                              {dayChar}
                            </span>
                          );
                        })}
                      </div>

                      {/* Lunch / Break hours */}
                      {st.breakTimes && st.breakTimes.length > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 bg-amber-50/70 px-2 py-1 rounded-lg border border-amber-100">
                          <span className="flex items-center gap-1 font-semibold text-amber-900">
                            <Coffee className="w-3 h-3 text-amber-600" />
                            {st.breakTimes[0].label || 'Break'}:
                          </span>
                          <span className="font-bold text-amber-900">
                            {st.breakTimes[0].start} - {st.breakTimes[0].end}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Authorized Services */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Services Offered ({staffServices.length})
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                        {staffServices.map((srv) => (
                          <span
                            key={srv.id}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 flex items-center gap-1"
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: srv.color }} />
                            {srv.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Staff Footer: Active bookings & Calendar Sync */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="text-slate-500">
                      <span className="font-bold text-slate-900">{assignedAppointments.length}</span> bookings
                      {pendingCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {pendingCount} pending
                        </span>
                      )}
                    </div>

                    <a
                      href={`/api/calendar.ics?staffId=${st.id}`}
                      download={`${st.name.replace(/\s+/g, '_')}_schedule.ics`}
                      className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                      title="Download individual staff iCal feed"
                    >
                      <Download className="w-3 h-3" />
                      <span>Sync iCal</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SERVICES CATALOG TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'services' && (() => {
        const categories = ['All', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];
        const filteredAdminServices = services.filter((srv) => {
          const matchCat = adminServiceCategory === 'All' || srv.category === adminServiceCategory;
          const q = adminServiceSearch.trim().toLowerCase();
          const matchQ =
            !q ||
            srv.name.toLowerCase().includes(q) ||
            srv.description.toLowerCase().includes(q) ||
            srv.category.toLowerCase().includes(q);
          return matchCat && matchQ;
        });

        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Service Offerings & Pricing Engine ({filteredAdminServices.length} of {services.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure appointment durations, upfront deposits, and cancellation policies.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={adminServiceSearch}
                    onChange={(e) => setAdminServiceSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {adminServiceSearch && (
                    <button
                      onClick={() => setAdminServiceSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAddServiceOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </button>
              </div>
            </div>

            {/* Category Filter Chips */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((cat) => {
                  const isActive = adminServiceCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setAdminServiceCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            {filteredAdminServices.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No services match your query</p>
                <button
                  onClick={() => {
                    setAdminServiceCategory('All');
                    setAdminServiceSearch('');
                  }}
                  className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
                >
                  Clear search & filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAdminServices.map((srv) => (
                  <div
                    key={srv.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {srv.category}
                        </span>
                        <span className="text-base font-extrabold text-slate-900 font-display">
                          ${srv.price}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-2">{srv.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{srv.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {srv.durationMinutes} min
                      </span>
                      <span className="text-indigo-600 font-bold">
                        ${srv.depositRequired} deposit
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      {/* ========================================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveStaff}
            className="bg-white max-w-xl w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingStaffId ? 'Edit Specialist & Schedule' : 'Add New Staff Member'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configure identity, services offered, and weekly working hour limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Elena Rostova"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Role / Specialization *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Master Stylist"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="staff@schedulabusiness.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 (555) 234-5678"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Avatar Image URL</label>
              <input
                type="url"
                value={staffAvatar}
                onChange={(e) => setStaffAvatar(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bio / Specialties</label>
              <textarea
                rows={2}
                placeholder="Brief summary of certifications, specialties, and experience..."
                value={staffBio}
                onChange={(e) => setStaffBio(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Standard Shift Hours & Lunch Breaks */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Standard Shift & Lunch Window</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Shift Start</label>
                  <input
                    type="time"
                    value={staffStartHour}
                    onChange={(e) => setStaffStartHour(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Shift End</label>
                  <input
                    type="time"
                    value={staffEndHour}
                    onChange={(e) => setStaffEndHour(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Break Start</label>
                  <input
                    type="time"
                    value={staffBreakStart}
                    onChange={(e) => setStaffBreakStart(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Break End</label>
                  <input
                    type="time"
                    value={staffBreakEnd}
                    onChange={(e) => setStaffBreakEnd(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-1.5 font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Day by Day Granular Schedule */}
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Individual Day-by-Day Working Hours
              </span>
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {staffDaySchedule.map((ds, idx) => (
                  <div key={ds.day} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-slate-200/60 last:border-0">
                    <label className="flex items-center gap-2 font-bold text-slate-700 w-28 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ds.enabled}
                        onChange={(e) => {
                          const updated = [...staffDaySchedule];
                          updated[idx] = { ...updated[idx], enabled: e.target.checked };
                          setStaffDaySchedule(updated);
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>{dayNames[ds.day]}</span>
                    </label>

                    {ds.enabled ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="time"
                          value={ds.start}
                          onChange={(e) => {
                            const updated = [...staffDaySchedule];
                            updated[idx] = { ...updated[idx], start: e.target.value };
                            setStaffDaySchedule(updated);
                          }}
                          className="bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-xs"
                        />
                        <span className="text-slate-400">to</span>
                        <input
                          type="time"
                          value={ds.end}
                          onChange={(e) => {
                            const updated = [...staffDaySchedule];
                            updated[idx] = { ...updated[idx], end: e.target.value };
                            setStaffDaySchedule(updated);
                          }}
                          className="bg-white border border-slate-200 rounded px-2 py-1 font-semibold text-xs"
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px] px-3">Off / Unavailable</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Services Checklist */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-800 block text-xs">
                Authorized Services Offered by This Specialist
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-40 overflow-y-auto">
                {services.map((srv) => {
                  const checked = staffServiceIds.includes(srv.id);
                  return (
                    <label
                      key={srv.id}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffServiceIds([...staffServiceIds, srv.id]);
                          } else {
                            setStaffServiceIds(staffServiceIds.filter((id) => id !== srv.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span className="truncate">{srv.name} (${srv.price})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100"
              >
                {editingStaffId ? 'Save Specialist Updates' : 'Add Staff Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REASSIGN APPOINTMENT STAFF */}
      {/* ========================================================================= */}
      {reassignAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Reassign Appointment Specialist</h3>
                <p className="text-[11px] text-slate-500">
                  {reassignAppointment.serviceName} for {reassignAppointment.clientName}
                </p>
              </div>
              <button
                onClick={() => setReassignAppointment(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500">Currently Assigned Specialist:</div>
              <div className="font-bold text-slate-900 text-sm">{reassignAppointment.staffName}</div>
              <div className="text-slate-500">
                Date: <strong>{reassignAppointment.date}</strong> at <strong>{reassignAppointment.startTime}</strong>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-2">Select New Specialist:</label>
              <div className="space-y-2">
                {staff
                  .filter((st) => st.serviceIds.includes(reassignAppointment.serviceId) || st.id === reassignAppointment.staffId)
                  .map((st) => (
                    <label
                      key={st.id}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        targetReassignStaffId === st.id
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30 font-bold'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="targetStaff"
                          value={st.id}
                          checked={targetReassignStaffId === st.id}
                          onChange={() => setTargetReassignStaffId(st.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <img
                          src={st.avatar}
                          alt={st.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{st.name}</div>
                          <div className="text-[10px] text-slate-500">{st.role}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-500">
                        {st.workingHours?.start} - {st.workingHours?.end}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReassignAppointment(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-100"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SERVICE */}
      {/* ========================================================================= */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateService}
            className="bg-white max-w-md w-full rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">Create New Service</h3>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. VIP Consultation"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration (Min)</label>
                <input
                  type="number"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deposit Due ($)</label>
                <input
                  type="number"
                  value={newServiceDeposit}
                  onChange={(e) => setNewServiceDeposit(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
              >
                Create Service
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
