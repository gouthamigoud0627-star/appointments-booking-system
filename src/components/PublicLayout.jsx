/**
 * Public Layout Component
 * Clean, high-contrast, accessible customer layout with multilingual header,
 * mobile bottom navigation, and notification center.
 */

import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Calendar,
  LogIn,
  Menu,
  X,
  ArrowRight,
  User,
  Bell,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import DoraAssistant from './DoraAssistant.jsx';
import { NotificationCenterModal } from './NotificationCenterModal.tsx';
import { LanguageSelector } from './LanguageSelector';
import { BottomNavigation } from './BottomNavigation';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { VoiceConversationModal } from './VoiceConversationModal';
import { AudioTranscriberModal } from './AudioTranscriberModal';
import { Mic, Radio } from 'lucide-react';

const SAMPLE_NOTIFICATIONS = [
  {
    id: 'notif-1',
    appointmentId: 'apt-seed-1',
    type: 'push',
    recipient: 'jahnaviaraja0909@gmail.com',
    message: 'Your appointment at Bloom Spa is confirmed for today.',
    status: 'delivered',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'notif-2',
    appointmentId: 'apt-seed-2',
    type: 'email',
    recipient: 'jahnaviaraja0909@gmail.com',
    message: 'Welcome to Schedora! Book appointments simply anytime.',
    status: 'delivered',
    timestamp: 'Yesterday',
  },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [transcriberModalOpen, setTranscriberModalOpen] = useState(false);
  const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
  const location = useLocation();
  const { isAuthenticated, currentBusiness } = useAuth();
  const { t } = useLanguage();

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' })));
  };

  const handleSendTestNotification = (type) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      appointmentId: 'apt-test',
      type,
      recipient: 'jahnaviaraja0909@gmail.com',
      message: `Test ${type.toUpperCase()} notification delivered successfully.`,
      status: 'delivered',
      timestamp: 'Just now',
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-150">
      {/* Primary Header - Clean, High Contrast, Accessible */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900/90 dark:backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/schedora-horizontal.svg"
              alt="Schedora Logo"
              className="h-8 w-auto object-contain transition-transform group-hover:scale-102"
              onError={(e) => {
                e.currentTarget.src = '/schedora-logo.png';
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                location.pathname === '/'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Home
            </Link>

            <Link
              to="/book"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/book' || location.pathname === '/businesses'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{t('bookAppointment')}</span>
            </Link>

            <Link
              to="/my-bookings"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/my-bookings'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4 text-indigo-600" />
              <span>{t('myAppointments')}</span>
            </Link>

            <Link
              to="/notifications"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/notifications'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>{t('notifications')}</span>
            </Link>

            <Link
              to="/settings"
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-1.5 ${
                location.pathname === '/settings'
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>{t('settings')}</span>
            </Link>
          </nav>

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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-extrabold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Live Real-time Audio Feed Transcription"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Transcribe</span>
            </button>

            {/* Live Notification Bell with unread counter & real-time updates */}
            <NotificationBell scope="customer" />

            {/* Theme Toggle (☀️ Light / 🌙 Dark / System) */}
            <ThemeToggle />

            {/* Language Selector */}
            <LanguageSelector variant="dropdown" />

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 font-bold text-xs transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                <span>Dashboard ({currentBusiness?.name?.split(' ')[0] || 'Admin'})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login?role=business"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('businessLogin')}</span>
                </Link>
                <Link
                  to="/register?role=business"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                >
                  <span>{t('registerBusiness')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls: Notification Bell + Theme Toggle + Language Selector + Menu toggle */}
          <div className="md:hidden flex items-center gap-1.5">
            <NotificationBell scope="customer" />
            <ThemeToggle compact />
            <LanguageSelector variant="dropdown" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span>Home</span>
            </Link>

            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60"
            >
              <Calendar className="w-4 h-4" />
              <span>{t('bookAppointment')}</span>
            </Link>

            <Link
              to="/my-bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('myAppointments')}</span>
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setNotificationsOpen(true);
              }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('notifications')}</span>
            </button>

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t('settings')}</span>
            </Link>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-3 rounded-xl text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {t('businessLogin')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Outlet (padded on mobile for bottom navigation bar) */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Footer - Minimal & Trustworthy */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs py-8 mt-12 mb-14 md:mb-0 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">Schedora</span>
            <span>•</span>
            <span className="text-slate-600 dark:text-slate-300">{t('tagline')}</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link to="/book" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t('bookAppointment')}
            </Link>
            <Link to="/my-bookings" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t('myAppointments')}
            </Link>
            <Link to="/settings" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t('settings')}
            </Link>
            <Link to="/login?role=business" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t('businessLogin')}
            </Link>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Schedora. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNavigation
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadCount={notifications.length}
      />

      {/* Notification Modal */}
      <NotificationCenterModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onSendTestNotification={handleSendTestNotification}
      />

      {/* Global Floating Dora Assistant (Positioned safely above bottom nav on mobile) */}
      <DoraAssistant />

      {/* Gemini Live Voice API Conversational Modal */}
      <VoiceConversationModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        businessName={currentBusiness?.name || 'Happy Paws Grooming'}
      />

      {/* Live Audio Transcriber Modal */}
      <AudioTranscriberModal
        isOpen={transcriberModalOpen}
        onClose={() => setTranscriberModalOpen(false)}
      />
    </div>
  );
}
