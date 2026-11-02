/**
 * Schedora 2.0 Main Application Layout
 * Responsive sidebar on desktop and mobile navigation supporting all primary modules:
 * Home, My Calendar, Schedule Meeting, Find a Time, Appointments, Meetings,
 * Tasks & Follow-ups, People & Teams, Rooms & Resources, Automations, Analytics,
 * Integrations, Settings, and specialized organization workspaces.
 */

import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  PlusCircle,
  Clock,
  QrCode,
  Settings,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Calendar,
  Sparkles,
  ChevronRight,
  Store,
  Users,
  Scissors,
  Award,
  Bell,
  BarChart3,
  Bot,
  User,
  ShieldCheck,
  Building2,
  CheckSquare,
  Workflow,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Sliders,
  Check,
  Tag,
  Mic,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import DoraAssistant from './DoraAssistant.jsx';
import { ThemeToggle } from './ThemeToggle';
import { BottomNavigation } from './BottomNavigation';
import { NotificationBell } from './NotificationBell';
import { VoiceConversationModal } from './VoiceConversationModal';
import { AudioTranscriberModal } from './AudioTranscriberModal';
import { UniversalSchedulingService } from '../lib/universalScheduling';

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [transcriberModalOpen, setTranscriberModalOpen] = useState(false);
  const { currentBusiness, currentUser, customerUser, logout } = useAuth();
  const navigate = useNavigate();

  const [activeOrg, setActiveOrg] = useState(() =>
    UniversalSchedulingService.getActiveOrganization()
  );
  const organizations = UniversalSchedulingService.getOrganizations();

  useEffect(() => {
    const handleOrgSwitched = (e) => {
      if (e.detail) setActiveOrg(e.detail);
    };
    window.addEventListener('schedora_org_switched', handleOrgSwitched);
    return () => window.removeEventListener('schedora_org_switched', handleOrgSwitched);
  }, []);

  const handleOrgChange = (orgId) => {
    const switched = UniversalSchedulingService.setActiveOrganization(orgId);
    setActiveOrg(switched);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Primary Navigation according to Section 4
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard, exact: true },
    { to: '/calendar', label: 'My Calendar', icon: CalendarDays },
    { to: '/meetings/new', label: 'Schedule a Meeting', icon: PlusCircle },
    { to: '/find-a-time', label: 'Find a Time', icon: Sparkles, badge: 'Smart' },
    { to: '/meetings', label: 'Meetings', icon: Calendar },
    { to: '/bookings', label: 'Appointments', icon: CalendarCheck },
    { to: '/tasks', label: 'Tasks & Follow-ups', icon: CheckSquare },
    { to: '/people', label: 'People & Teams', icon: Users },
    { to: '/resources', label: 'Rooms & Resources', icon: Building2 },
    { to: '/automations', label: 'Automations', icon: Workflow },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/integrations', label: 'Integrations', icon: Sliders },
    { to: '/dora', label: 'Dora AI', icon: Bot, badge: 'AI' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  // Specialized Organization Workspace Nav Links
  const modeWorkspaceLinks = [
    { to: '/education', label: 'Schools & Colleges', icon: GraduationCap, orgType: 'education' },
    { to: '/recruitment', label: 'Recruitment & HR', icon: Briefcase, orgType: 'recruitment' },
    { to: '/sales', label: 'Sales & Demos', icon: TrendingUp, orgType: 'sales' },
    { to: '/services', label: 'Services Menu', icon: Scissors, orgType: 'business' },
    { to: '/admin/offers', label: 'Offers & Discounts', icon: Tag, orgType: 'business' },
    { to: '/check-in', label: 'Check In Kiosk', icon: QrCode, orgType: 'business' },
  ];

  const publicBookingPath = activeOrg.slug ? `/b/${activeOrg.slug}` : `/b/${activeOrg.id}`;

  const userName =
    customerUser?.name ||
    currentUser?.name ||
    currentUser?.ownerName ||
    'Janvi';

  return (
    <div className="min-h-screen bg-mesh-pattern flex text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/schedora-mark.png"
              alt="Schedora Logo"
              className="w-7 h-7 object-contain shrink-0 group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.currentTarget.src = '/schedora-mark.svg';
              }}
            />
            <span className="font-brand font-black tracking-tight text-lg text-white">
              Schedora <span className="text-[10px] text-indigo-400 font-mono">2.0</span>
            </span>
          </Link>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
            SaaS
          </span>
        </div>

        {/* Multi-Tenant Organization Switcher */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 space-y-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Organization
            </span>
            <div className="relative">
              <select
                value={activeOrg.id}
                onChange={(e) => handleOrgChange(e.target.value)}
                className="w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer truncate"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id} className="bg-slate-900 text-white">
                    {org.name} ({org.type.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Link
            to={publicBookingPath}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 text-xs font-medium border border-indigo-800/40 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <ExternalLink className="w-3 h-3" />
              <span>Public Booking Page</span>
            </span>
            <ChevronRight className="w-3 h-3 text-indigo-400" />
          </Link>
        </div>

        {/* Navigation Items (Section 4) */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Specialized Mode Section */}
          <div className="pt-3 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Workspaces ({activeOrg.type})
          </div>

          {modeWorkspaceLinks.map((item) => {
            const Icon = item.icon;
            const isCurrentMode = item.orgType === activeOrg.type;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isCurrentMode
                      ? 'text-indigo-300 bg-indigo-950/40 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isCurrentMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                {userName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{activeOrg.subscriptionPlan} Plan</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src="/schedora-mark.png"
            alt="Schedora Logo"
            className="w-7 h-7 object-contain"
            onError={(e) => {
              e.currentTarget.src = '/schedora-mark.svg';
            }}
          />
          <span className="font-brand font-black text-white text-base">Schedora 2.0</span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex">
          <div className="w-72 bg-slate-900 text-slate-200 h-full flex flex-col p-4 space-y-4 animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Navigation</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold ${
                        isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pt-16 lg:pt-0">
        {/* Desktop Top Header Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
              {activeOrg.name}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {activeOrg.type}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Voice API Conversation Button */}
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-xs hover:shadow-md hover:scale-102 transition-all cursor-pointer"
              title="Launch Gemini Live Voice Assistant"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Voice</span>
            </button>

            {/* Live Audio Transcriber Button */}
            <button
              type="button"
              onClick={() => setTranscriberModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-750"
              title="Live Real-time Audio Feed Transcription"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Transcribe</span>
            </button>

            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Dora AI Copilot Widget */}
      <DoraAssistant />

      {/* Gemini Live Voice API Modal */}
      <VoiceConversationModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        businessName={currentBusiness?.name || activeOrg.name}
      />

      {/* Live Audio Transcriber Modal */}
      <AudioTranscriberModal
        isOpen={transcriberModalOpen}
        onClose={() => setTranscriberModalOpen(false)}
      />
    </div>
  );
}
