import React, { useState } from 'react';
import { 
  Calendar, 
  BarChart3, 
  Settings, 
  Bell, 
  Globe, 
  Code2, 
  Server, 
  Users, 
  Sparkles,
  CalendarCheck2,
  CheckCircle2,
  AlertCircle,
  Mic,
  Compass,
  Building2,
  MapPin,
  User,
  UserCheck,
  Ticket,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { AuthUser, SupportedLocale, UserRole } from '../types';
import { translations } from '../i18n';

interface HeaderProps {
  currentTab: 'directory' | 'register' | 'booking' | 'hub' | 'calendar' | 'analytics' | 'clients' | 'api' | 'architecture' | 'business_settings' | 'customer_passes';
  setCurrentTab: (tab: 'directory' | 'register' | 'booking' | 'hub' | 'calendar' | 'analytics' | 'clients' | 'api' | 'architecture' | 'business_settings' | 'customer_passes') => void;
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  pendingCount: number;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenVoiceModal?: () => void;
  autoConfirm: boolean;
  currentUser?: AuthUser | null;
  onOpenAuthModal: (role: UserRole) => void;
  onLogout: () => void;
  customerPassesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  locale,
  setLocale,
  pendingCount,
  unreadNotifications,
  onOpenNotifications,
  onOpenSettings,
  onOpenVoiceModal,
  autoConfirm,
  currentUser,
  onOpenAuthModal,
  onLogout,
  customerPassesCount = 0,
}) => {
  const t = translations[locale];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const languages: { code: SupportedLocale; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 text-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentTab('directory')}
              className="flex items-center gap-2 text-left group focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform p-1.5 shrink-0">
                <img
                  src="/schedora-mark.png"
                  alt="Schedora Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/schedora-mark.svg';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 font-display">
                    {t.appName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded border border-indigo-200 uppercase tracking-wider">
                    v3.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  Smart Booking Engine & Business OS
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              id="nav-tab-directory"
              onClick={() => setCurrentTab('directory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'directory'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span>Directory</span>
            </button>

            <button
              id="nav-tab-booking"
              onClick={() => setCurrentTab('booking')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'booking'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t.bookAppointment}
            </button>

            {/* If Customer is logged in or active passes exist: Show Customer Passes Tab */}
            {(currentUser?.role === 'customer' || customerPassesCount > 0) && (
              <button
                id="nav-tab-customer-passes"
                onClick={() => setCurrentTab('customer_passes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'customer_passes'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-indigo-600" />
                <span>My Passes</span>
                {customerPassesCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                    {customerPassesCount}
                  </span>
                )}
              </button>
            )}

            <button
              id="nav-tab-register"
              onClick={() => setCurrentTab('register')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'register'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Register</span>
            </button>

            <button
              id="nav-tab-hub"
              onClick={() => setCurrentTab('hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                currentTab === 'hub'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t.adminDashboard}</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-calendar"
              onClick={() => setCurrentTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.calendarSync}</span>
              <span className="lg:hidden">Calendar</span>
            </button>

            <button
              id="nav-tab-analytics"
              onClick={() => setCurrentTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'analytics'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Trends</span>
            </button>
          </nav>

          {/* Right Action Tools: Login / User Account, Live Voice, Locale, Settings */}
          <div className="flex items-center gap-2">
            
            {/* AUTHENTICATION CONTROLS */}
            {!currentUser ? (
              <div className="flex items-center gap-1.5">
                {/* Customer Login Button */}
                <button
                  id="btn-customer-login"
                  onClick={() => onOpenAuthModal('customer')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs hover:border-indigo-300"
                  title="Log in as customer to view passes and tokens"
                >
                  <User className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer Login</span>
                </button>

                {/* Business Login Button */}
                <button
                  id="btn-business-login"
                  onClick={() => onOpenAuthModal('business')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-emerald-200"
                  title="Log in as small business owner to access admin hub"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Business Login</span>
                  <span className="sm:hidden">Business</span>
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 text-xs transition-all"
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="font-bold text-slate-900 leading-tight max-w-[110px] truncate">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] font-semibold text-indigo-600 capitalize">
                      {currentUser.role === 'business' ? 'Business Owner' : 'Customer'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      <span className="inline-block mt-1 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {currentUser.role === 'business'
                          ? currentUser.businessName || 'Business Owner'
                          : currentUser.isVip ? 'VIP Customer' : 'Customer'}
                      </span>
                    </div>

                    <div className="py-1">
                      {currentUser.role === 'customer' ? (
                        <>
                          <button
                            onClick={() => {
                              setCurrentTab('customer_passes');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 font-medium"
                          >
                            <Ticket className="w-4 h-4 text-indigo-500" />
                            <span>My Passes & Tokens</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentTab('directory');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                          >
                            <Compass className="w-4 h-4 text-indigo-500" />
                            <span>Find Businesses</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setCurrentTab('hub');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 font-medium"
                          >
                            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
                            <span>Business Hub (Admin)</span>
                          </button>
                          <button
                            onClick={() => {
                              setCurrentTab('business_settings');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                          >
                            <Settings className="w-4 h-4 text-slate-500" />
                            <span>Business Settings</span>
                          </button>
                        </>
                      )}

                      <div className="h-px bg-slate-100 my-1" />

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenAuthModal(currentUser.role === 'customer' ? 'business' : 'customer');
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                      >
                        {currentUser.role === 'customer' ? (
                          <>
                            <Building2 className="w-4 h-4 text-slate-500" />
                            <span>Switch to Business Login</span>
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 text-slate-500" />
                            <span>Switch to Customer Login</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auto confirm indicator pill */}
            <div 
              onClick={onOpenSettings}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer border transition-colors hover:opacity-90"
              style={{
                backgroundColor: autoConfirm ? '#ECFDF5' : '#FFFBEB',
                color: autoConfirm ? '#047857' : '#B45309',
                borderColor: autoConfirm ? '#A7F3D0' : '#FDE68A',
              }}
              title={autoConfirm ? 'Bookings confirm instantly' : 'Manual owner approval required'}
            >
              {autoConfirm ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{autoConfirm ? 'Auto-Confirm ON' : 'Owner Review'}</span>
            </div>

            {/* Gemini Live Voice Assistant Button */}
            {onOpenVoiceModal && (
              <button
                id="btn-nav-live-voice"
                onClick={onOpenVoiceModal}
                title="Launch Gemini Live API Conversational Voice Assistant"
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
              >
                <div className="relative">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="hidden sm:inline">Live Voice</span>
              </button>
            )}

            {/* Notifications Bell */}
            <button
              id="btn-open-notifications"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notification Center"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Settings Button */}
            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sub-navigation bar */}
      <div className="md:hidden border-t border-slate-100 bg-slate-50/90 px-3 py-2 flex items-center overflow-x-auto gap-2">
        <button
          onClick={() => setCurrentTab('directory')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === 'directory' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Directory
        </button>

        {currentUser?.role === 'customer' && (
          <button
            onClick={() => setCurrentTab('customer_passes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              currentTab === 'customer_passes' ? 'bg-indigo-600 text-white' : 'text-slate-600'
            }`}
          >
            <Ticket className="w-3 h-3" />
            <span>My Passes</span>
          </button>
        )}

        <button
          onClick={() => setCurrentTab('booking')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === 'booking' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          {t.bookAppointment}
        </button>

        <button
          onClick={() => setCurrentTab('hub')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
            currentTab === 'hub' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          <span>{t.adminDashboard}</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('register')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Register
        </button>

        <button
          onClick={() => setCurrentTab('calendar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === 'calendar' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Calendar
        </button>

        <button
          onClick={() => setCurrentTab('analytics')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            currentTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Trends
        </button>
      </div>
    </header>
  );
};
