import React, { useState } from 'react';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Building2, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  Sparkles,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Appointment, AuthUser, SupportedLocale } from '../types';
import { translations } from '../i18n';

interface CustomerDashboardProps {
  currentUser: AuthUser;
  appointments: Appointment[];
  locale: SupportedLocale;
  onBookNew: () => void;
  onExploreDirectory: () => void;
  onRefreshAppointments: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  appointments,
  locale,
  onBookNew,
  onExploreDirectory,
  onRefreshAppointments,
}) => {
  const t = translations[locale];
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [checkInSuccessId, setCheckInSuccessId] = useState<string | null>(null);

  // Filter appointments for this user by email (or show sample appointments if none)
  const userEmail = currentUser.email.toLowerCase();
  let userAppointments = appointments.filter(
    (a) => a.clientEmail.toLowerCase() === userEmail
  );

  // Fallback so customers always have access to test arrival token passes
  if (userAppointments.length === 0) {
    userAppointments = appointments.slice(0, 3);
  }

  const upcomingAppointments = userAppointments.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled'
  );
  const pastAppointments = userAppointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled'
  );

  const handleSimulateArrivalCheckIn = async (apt: Appointment) => {
    const tokenToUse = apt.tokenNumber || apt.confirmationCode;
    setCheckingInId(apt.id);
    try {
      const res = await fetch(`/api/appointments/check-in-token?token=${encodeURIComponent(tokenToUse)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCheckInSuccessId(apt.id);
        onRefreshAppointments();
        setTimeout(() => {
          setCheckInSuccessId(null);
        }, 5000);
      } else {
        alert(data.error || 'Failed to check in token');
      }
    } catch (e) {
      alert('Could not connect to reception token verifier.');
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Customer Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={currentUser.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-400/50 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{currentUser.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {currentUser.isVip ? 'VIP Customer' : 'Client Account'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  {currentUser.email}
                </span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    {currentUser.phone}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onBookNew}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
            <button
              onClick={onExploreDirectory}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Directory</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Passes</div>
            <div className="text-xl font-black text-white mt-0.5">{upcomingAppointments.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Bookings</div>
            <div className="text-xl font-black text-white mt-0.5">{currentUser.totalBookings || userAppointments.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Arrival Method</div>
            <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Token Physical Check-In
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member Status</div>
            <div className="text-xs font-bold text-indigo-300 mt-1">Verified Client</div>
          </div>
        </div>
      </div>

      {/* Check In Success Toast */}
      {checkInSuccessId && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">Arrival Confirmed with Reception!</div>
              <div className="text-xs opacity-90">
                Your physical arrival token was verified. Please take a seat in the waiting lounge.
              </div>
            </div>
          </div>
          <button 
            onClick={() => setCheckInSuccessId(null)}
            className="text-xs px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Passes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-display">
              Physical Arrival Passes & Active Appointments
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              {upcomingAppointments.length}
            </span>
          </div>

          <button
            onClick={onRefreshAppointments}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors text-xs flex items-center gap-1"
            title="Refresh passes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No upcoming appointment passes</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You do not have any active appointments scheduled. Explore local businesses or book a session now.
              </p>
            </div>
            <button
              onClick={onExploreDirectory}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
            >
              <span>Explore Business Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {upcomingAppointments.map((apt) => {
              const tokenNum = apt.tokenNumber || apt.confirmationCode || 'TK-8801';
              const isCheckedIn = apt.physicallyCheckedIn;
              const isInSession = apt.status === 'in_progress';

              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-indigo-300 transition-all"
                >
                  {/* Pass Ticket Top Header */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Building2 className="w-3 h-3" />
                          <span>{apt.businessName || 'Schedora Partner Studio'}</span>
                        </div>
                        <h3 className="text-lg font-black text-white mt-1">{apt.serviceName}</h3>
                        <div className="text-xs text-slate-300 mt-0.5">Specialist: {apt.staffName}</div>
                      </div>

                      {/* Physical Arrival Token Badge */}
                      <div className="bg-white text-slate-900 rounded-2xl p-3 text-center shadow-lg border border-indigo-200 shrink-0">
                        <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                          Arrival Token
                        </div>
                        <div className="text-xl font-black font-mono tracking-wider text-indigo-600 mt-0.5">
                          {tokenNum}
                        </div>
                        <div className="text-[9px] font-bold text-slate-500 mt-0.5">Show at reception</div>
                      </div>
                    </div>

                    {/* Venue Address & Date Badge */}
                    <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-xs">{apt.businessAddress || '742 Montgomery St, San Francisco'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-white bg-white/10 px-2.5 py-1 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{apt.date} • {apt.startTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pass Ticket Body */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Booking Status</div>
                        <div className="font-bold text-slate-800 capitalize mt-0.5">
                          {apt.status.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Physical Arrival</div>
                        <div className={`font-bold mt-0.5 flex items-center gap-1 ${isCheckedIn ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isCheckedIn ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Checked In</span>
                            </>
                          ) : (
                            <span>Pending In-Person Arrival</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Physical Arrival Action Button */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                      {isCheckedIn ? (
                        <div className="w-full py-2.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Physically Checked In with Front Desk</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSimulateArrivalCheckIn(apt)}
                          disabled={checkingInId === apt.id}
                          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {checkingInId === apt.id ? 'Checking In...' : 'I Have Arrived - Check In with Reception'}
                          </span>
                        </button>
                      )}

                      <a
                        href="/api/calendar.ics"
                        download="schedora_pass.ics"
                        className="w-full sm:w-auto px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
                        title="Export to Calendar"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>.ICS Pass</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past History */}
      {pastAppointments.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Past Appointment History ({pastAppointments.length})
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {pastAppointments.map((past) => (
              <div key={past.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{past.serviceName}</div>
                  <div className="text-slate-500 mt-0.5">
                    {past.businessName || 'Studio'} • Specialist: {past.staffName} • {past.date} at {past.startTime}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-400">{past.tokenNumber || past.confirmationCode}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                    {past.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
