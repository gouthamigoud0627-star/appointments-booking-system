/**
 * Customer Settings & Preferences Page (/settings)
 * Complete management of Profile, Language, Notifications, Appointments, Privacy, Support, and Logout.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Globe,
  Bell,
  Calendar,
  Shield,
  HelpCircle,
  LogOut,
  Trash2,
  Check,
  AlertCircle,
  MapPin,
  Lock,
  Mail,
  Phone,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  MessageSquare,
  Smartphone,
  Building2,
  Navigation,
  Crosshair,
  Compass,
  Tag,
  Percent,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { SupportedLocale } from '../types';
import {
  getCurrentLocation,
  reverseGeocode,
  saveUserLocation,
  clearSavedUserLocation,
  POPULAR_LOCALITIES,
} from '../lib/location.js';
import LocationPickerMap from '../components/LocationPickerMap.tsx';
import {
  getCustomerAiPreferences,
  saveCustomerAiPreferences,
} from '../lib/aiRecommendations';
import {
  getUserPreferences,
  saveUserPreferences,
  UserPreferencesData,
} from '../lib/offers.ts';


export default function CustomerSettings() {
  const { customerUser, updateCustomerProfile, customerLogout } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Active sub-tab
  const [activeSection, setActiveSection] = useState<'profile' | 'language' | 'notifications' | 'appointments' | 'preferences' | 'recommendations' | 'appearance' | 'privacy' | 'support'>('language');

  // AI & Service Preferences state
  const [aiPrefs, setAiPrefs] = useState(() => getCustomerAiPreferences(customerUser?.email));
  const [isAiPrefsSaved, setIsAiPrefsSaved] = useState(false);

  // Recommendations and Location Preferences
  const [recLocationPrefs, setRecLocationPrefs] = useState<UserPreferencesData>(() =>
    getUserPreferences(customerUser?.email)
  );
  const [isRecPrefsSaved, setIsRecPrefsSaved] = useState(false);


  // Profile Form state
  const [name, setName] = useState(customerUser?.name || 'Jahnavi Raja');
  const [email, setEmail] = useState(customerUser?.email || 'jahnaviaraja0909@gmail.com');
  const [phone, setPhone] = useState(customerUser?.phone || '+91 98765 43210');
  const [age, setAge] = useState(customerUser?.age || 26);
  const [gender, setGender] = useState(customerUser?.gender || 'female');
  const [city, setCity] = useState(customerUser?.locationCity || 'Hyderabad');
  const [area, setArea] = useState(customerUser?.locationArea || 'Banjara Hills');
  const [password, setPassword] = useState('••••••••');
  const [isSaved, setIsSaved] = useState(false);

  // Notification Preferences state (WhatsApp, SMS, Email, Push)
  const [notifPrefs, setNotifPrefs] = useState(
    customerUser?.notificationPreferences || {
      appointmentConfirmations: true,
      appointmentReminders: true,
      reschedulingUpdates: true,
      cancellationUpdates: true,
      businessMessages: true,
      promotionalNotifications: false,
      channelWhatsApp: true,
      channelSMS: true,
      channelEmail: true,
      channelPush: true,
    }
  );

  // Appointment reminder timing
  const [remind24h, setRemind24h] = useState(true);
  const [remind1h, setRemind1h] = useState(true);

  // Modals for confirmation
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomerProfile({
      name,
      email,
      phone,
      age,
      gender,
      locationCity: city,
      locationArea: area,
      notificationPreferences: notifPrefs,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [showLocationPickerModal, setShowLocationPickerModal] = useState(false);

  const handleUseMyLocation = async () => {
    setDetectingLocation(true);
    setLocationMessage(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      const address = await reverseGeocode(pos.latitude, pos.longitude);
      const parts = address.split(',');
      const detectedCity = parts[parts.length - 2]?.trim() || parts[0]?.trim() || 'San Francisco';
      const detectedArea = parts[0]?.trim() || 'Downtown';
      setCity(detectedCity);
      setArea(detectedArea);
      saveUserLocation({
        latitude: pos.latitude,
        longitude: pos.longitude,
        label: address,
        accuracy: pos.accuracy,
        isManual: false,
      });
      setLocationMessage(`GPS detected: ${address} (Accuracy ±${Math.round(pos.accuracy || 20)}m)`);
    } catch (err: any) {
      setLocationMessage('Location permission was denied or unavailable. You can select your area manually below or pin on map.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSaveLocationFromMap = (loc: { latitude: number; longitude: number; address: string }) => {
    const parts = loc.address.split(',');
    const detectedCity = parts[parts.length - 2]?.trim() || parts[0]?.trim() || city;
    const detectedArea = parts[0]?.trim() || area;
    setCity(detectedCity);
    setArea(detectedArea);
    saveUserLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      label: loc.address,
      isManual: true,
      isExactPin: true,
    });
    setLocationMessage(`✓ Exact location pinned on map: ${loc.address}`);
    setShowLocationPickerModal(false);
  };

  const handleSelectArea = (item: typeof POPULAR_LOCALITIES[0]) => {
    setCity(item.city);
    setArea(item.name);
    saveUserLocation({
      latitude: item.latitude,
      longitude: item.longitude,
      label: `${item.name}, ${item.city}`,
      isManual: true,
    });
    setLocationMessage(`Saved area: ${item.name}, ${item.city}`);
  };

  const handleRemoveLocation = () => {
    setCity('');
    setArea('');
    clearSavedUserLocation();
    setLocationMessage('Saved location removed.');
  };

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    updateCustomerProfile({ notificationPreferences: updated });
  };

  const handleLogout = () => {
    customerLogout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Business Workspace Switcher Banner (if business owner is logged in) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-indigo-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Business Owner Settings</h3>
            <p className="text-xs text-indigo-200">Manage storefront profile, operating hours, and automated WhatsApp/SMS messaging.</p>
          </div>
        </div>
        <Link
          to="/business-settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-950 hover:bg-indigo-50 shadow-xs transition-colors shrink-0"
        >
          <span>Open Business Settings</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('settings')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account, language preference, notification alerts, and privacy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar Menu */}
        <aside className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 space-y-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection('language')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'language'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('language')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'profile'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('profile')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('notifications')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'notifications'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('notifications')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('appointments')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'appointments'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Reminders</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('preferences')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'preferences'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>AI & Service Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('recommendations')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'recommendations'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Recommendations & Location</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('appearance')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'appearance'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Appearance & Theme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('privacy')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'privacy'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('privacy')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('support')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors text-left ${
              activeSection === 'support'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{t('support')}</span>
          </button>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <span>{t('logout')}</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="md:col-span-3 bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          {/* ============================================================= */}
          {/* 1. LANGUAGE SETTINGS                                          */}
          {/* ============================================================= */}
          {activeSection === 'language' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {t('chooseLanguage')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your preferred language. The entire application updates immediately.
                </p>
              </div>

              <LanguageSelector variant="list" />

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center gap-2 border border-slate-100">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Language is automatically saved to your profile and preserved across devices.
                </span>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 2. PROFILE SETTINGS                                           */}
          {/* ============================================================= */}
          {activeSection === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your contact details and location preferences.
                </p>
              </div>

              {isSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Your profile has been saved successfully.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Age / Date of Birth</label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-200">Locality & Saved Location</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLocationPickerModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
                        title="Pin exact location on map"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>Pin on Map</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={detectingLocation}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${detectingLocation ? 'animate-spin' : ''}`} />
                        <span>{detectingLocation ? 'Detecting GPS...' : 'Use GPS'}</span>
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Downtown, Mission, Banjara Hills"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-indigo-500 font-medium"
                  />

                  {/* Location feedback banner */}
                  {locationMessage && (
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{locationMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLocation}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Quick Select Popular Areas */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Select Area (No GPS required):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_LOCALITIES.slice(0, 6).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectArea(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                    Privacy Guarantee: Location is only used to compute approximate distances to nearby providers. We never share your exact GPS coordinates or track background location.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================= */}
          {/* 3. NOTIFICATION SETTINGS                                      */}
          {/* ============================================================= */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Notification Alerts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control which appointment updates and reminders you receive.
                </p>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Appointment Confirmations</span>
                    <span className="text-slate-500">Receive instant confirmation when you book</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.appointmentConfirmations}
                    onChange={() => toggleNotif('appointmentConfirmations')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Appointment Reminders</span>
                    <span className="text-slate-500">24-hour and 1-hour arrival notifications</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.appointmentReminders}
                    onChange={() => toggleNotif('appointmentReminders')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Rescheduling Updates</span>
                    <span className="text-slate-500">Notified whenever an appointment time changes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.reschedulingUpdates}
                    onChange={() => toggleNotif('reschedulingUpdates')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Cancellation Updates</span>
                    <span className="text-slate-500">Confirmations when an appointment is cancelled</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.cancellationUpdates}
                    onChange={() => toggleNotif('cancellationUpdates')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Business Messages</span>
                    <span className="text-slate-500">Direct notes and instructions from the business</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.businessMessages}
                    onChange={() => toggleNotif('businessMessages')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <span className="font-bold text-slate-900 block">Promotional Notifications</span>
                    <span className="text-slate-500">Seasonal offers and discounts (opt-in only)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifPrefs.promotionalNotifications}
                    onChange={() => toggleNotif('promotionalNotifications')}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </div>
              </div>

              {/* Delivery Channels */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Delivery Channels (Separate Consents)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.channelWhatsApp !== false}
                      onChange={() => toggleNotif('channelWhatsApp' as any)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">WhatsApp Messages</span>
                      <span className="text-[11px] text-slate-500">Official templates & arrival directions</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.channelSMS !== false}
                      onChange={() => toggleNotif('channelSMS' as any)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">SMS Notifications</span>
                      <span className="text-[11px] text-slate-500">Concise text message fallback</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.channelEmail}
                      onChange={() => toggleNotif('channelEmail')}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Email Notifications</span>
                      <span className="text-[11px] text-slate-500">Full invoice & calendar passes</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifPrefs.channelPush}
                      onChange={() => toggleNotif('channelPush')}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">In-App & Push Alerts</span>
                      <span className="text-[11px] text-slate-500">Instant browser notifications</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4. APPOINTMENT REMINDER TIMING                                */}
          {/* ============================================================= */}
          {activeSection === 'appointments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Appointment Reminder Schedule
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure when you want to receive notifications prior to your booked appointments.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">24 Hours Before</span>
                    <span className="text-slate-500">Day-ahead reminder with booking token & location details</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={remind24h}
                    onChange={(e) => setRemind24h(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">1 Hour Before</span>
                    <span className="text-slate-500">Final heads-up before travel time with fast check-in instructions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={remind1h}
                    onChange={(e) => setRemind1h(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4A. AI & SERVICE PREFERENCES                                   */}
          {/* ============================================================= */}
          {activeSection === 'preferences' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>AI & Service Preferences</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize how Schedora AI analyzes your booking history to proactively recommend complementary services.
                  </p>
                </div>

                {isAiPrefsSaved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    Saved to AI Profile
                  </span>
                )}
              </div>

              {/* Master AI Recommendations Toggle */}
              <div className="p-4 rounded-2xl border border-indigo-150 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-indigo-50/50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-800/80 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Proactive AI Recommendations Engine
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">
                      Gemini 3.8 Flash
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Proactively suggests relevant add-on treatments (e.g. conditioning treatment with haircuts, hot basalt stones with massages, whitening with dental cleaning) in a non-intrusive card during booking.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={aiPrefs.enabled}
                    onChange={(e) => {
                      const updated = { ...aiPrefs, enabled: e.target.checked };
                      setAiPrefs(updated);
                      saveCustomerAiPreferences(updated);
                      setIsAiPrefsSaved(true);
                      setTimeout(() => setIsAiPrefsSaved(false), 2000);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-750 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Favorite Service Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Favorite Service Categories
                </label>
                <p className="text-xs text-slate-500">
                  Select the services you frequently seek. The AI engine prioritizes recommendations within these areas.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Salon', 'Spa', 'Clinic', 'Dental', 'Pet Care', 'Fitness', 'Classes'].map((cat) => {
                    const isSelected = (aiPrefs.favoriteCategories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = aiPrefs.favoriteCategories || [];
                          const updatedCats = isSelected
                            ? current.filter((c) => c !== cat)
                            : [...current, cat];
                          setAiPrefs({ ...aiPrefs, favoriteCategories: updatedCats });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Treatment Goals & Preferences */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Treatment Goals & Sensitivities
                </label>
                <textarea
                  rows={3}
                  value={aiPrefs.treatmentGoalsNotes || ''}
                  onChange={(e) => setAiPrefs({ ...aiPrefs, treatmentGoalsNotes: e.target.value })}
                  placeholder="e.g. Sensitive scalp, prefers lavender oils, prone to upper back tension, looking for hydration..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 block">
                  The AI references these notes to proactively highlight relevant benefits on the booking page.
                </span>
              </div>

              {/* Specific Profile Details: Hair & Skin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    💇 Hair Styling Profile
                  </label>
                  <input
                    type="text"
                    value={aiPrefs.hairPreferences || ''}
                    onChange={(e) => setAiPrefs({ ...aiPrefs, hairPreferences: e.target.value })}
                    placeholder="e.g. Wavy, benefits from deep moisture conditioning"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    🌿 Skin & Complexion Profile
                  </label>
                  <input
                    type="text"
                    value={aiPrefs.skinPreferences || ''}
                    onChange={(e) => setAiPrefs({ ...aiPrefs, skinPreferences: e.target.value })}
                    placeholder="e.g. Sensitive skin, allergic to harsh chemical peels"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    💆 Massage & Bodywork Pressure Preference
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Gentle & Relaxing', 'Medium Restorative', 'Firm Therapeutic', 'Deep Tissue Myofascial'].map((p) => {
                      const isSel = aiPrefs.preferredPressure === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAiPrefs({ ...aiPrefs, preferredPressure: p })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {isSel && <Check className="w-3 h-3 inline mr-1" />}
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    saveCustomerAiPreferences(aiPrefs);
                    setIsAiPrefsSaved(true);
                    setTimeout(() => setIsAiPrefsSaved(false), 2500);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save AI Preferences</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4A-2. RECOMMENDATIONS & LOCATION SETTINGS                     */}
          {/* ============================================================= */}
          {activeSection === 'recommendations' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Compass className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <span>Recommendations and Location</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure your preferred categories, recommendation ranking, budget, travel distance, and home search area.
                  </p>
                </div>

                {isRecPrefsSaved && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    Preferences Saved
                  </span>
                )}
              </div>

              {/* Discovery Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  What would you like to discover?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    'Healthcare & Clinics',
                    'Beauty & Salons',
                    'Home Services',
                    'Car Care & Washing',
                    'Pet Grooming',
                    'Fitness & Wellness',
                    'Business Consultations',
                  ].map((cat) => {
                    const isSelected = (recLocationPrefs.categories || []).includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = recLocationPrefs.categories || [];
                          const updated = isSelected ? current.filter((c) => c !== cat) : [...current, cat];
                          setRecLocationPrefs({ ...recLocationPrefs, categories: updated });
                        }}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block">{cat}</span>
                        {isSelected && <span className="text-[10px] text-indigo-600 dark:text-indigo-400">✓ Selected</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation Style */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  What kind of recommendations do you prefer?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    'Best matches for my interests',
                    'Nearby businesses',
                    'Affordable options',
                    'Current discounts and offers',
                    'Highly rated businesses',
                    'Earliest available appointments',
                    'Newly opened businesses',
                    'Services available today',
                  ].map((type) => {
                    const isSelected = (recLocationPrefs.recommendationTypes || []).includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const current = recLocationPrefs.recommendationTypes || [];
                          const updated = isSelected ? current.filter((t) => t !== type) : [...current, type];
                          setRecLocationPrefs({ ...recLocationPrefs, recommendationTypes: updated });
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span>{type}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Budget */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Preferred Budget (INR ₹ Supported)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    'Any Budget',
                    'Under ₹500',
                    '₹500 - ₹1,500',
                    '₹1,500 - ₹3,500',
                    '₹3,500+',
                  ].map((budget) => {
                    const isSelected = recLocationPrefs.budgetRange === budget;
                    return (
                      <button
                        key={budget}
                        type="button"
                        onClick={() => setRecLocationPrefs({ ...recLocationPrefs, budgetRange: budget })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {budget}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Travel Distance Radius */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  How far are you willing to travel?
                </label>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[2, 5, 10, 25].map((km) => {
                    const isSelected = recLocationPrefs.maxDistanceKm === km;
                    return (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setRecLocationPrefs({ ...recLocationPrefs, maxDistanceKm: km })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        Within {km} km
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Location Area */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Where should we search?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Search City</span>
                    <input
                      type="text"
                      value={recLocationPrefs.locationCity || 'Hyderabad'}
                      onChange={(e) =>
                        setRecLocationPrefs({ ...recLocationPrefs, locationCity: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Search Area / Locality</span>
                    <input
                      type="text"
                      value={recLocationPrefs.locationArea || 'Banjara Hills'}
                      onChange={(e) =>
                        setRecLocationPrefs({ ...recLocationPrefs, locationArea: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
                        const geo = await reverseGeocode(pos.latitude, pos.longitude);
                        setRecLocationPrefs({
                          ...recLocationPrefs,
                          latitude: pos.latitude,
                          longitude: pos.longitude,
                          locationCity: geo.city || recLocationPrefs.locationCity,
                          locationArea: geo.area || recLocationPrefs.locationArea,
                        });
                      } catch {
                        // ignore or keep manual
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Detect via GPS Coordinates</span>
                  </button>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const saved = saveUserPreferences(customerUser?.email, recLocationPrefs);
                    setRecLocationPrefs(saved);
                    setIsRecPrefsSaved(true);
                    setTimeout(() => setIsRecPrefsSaved(false), 2500);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Recommendations & Location</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 4B. APPEARANCE SETTINGS                                        */}
          {/* ============================================================= */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sun className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Appearance & Theme</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose light mode, dark mode, or follow your operating system preferences.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  { id: 'light', label: '☀️ Light Mode', desc: 'Crisp, daytime interface', icon: Sun },
                  { id: 'dark', label: '🌙 Dark Mode', desc: 'Soft dark slate for low eye fatigue', icon: Moon },
                  { id: 'system', label: '💻 System Preference', desc: 'Match your OS light/dark setting', icon: Laptop },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                      theme === opt.id
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{opt.label}</span>
                      {theme === opt.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 5. PRIVACY                                                    */}
          {/* ============================================================= */}
          {activeSection === 'privacy' && (
            <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Privacy & Data Protection
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Schedora protects your personal contact details and appointment history.
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-semibold text-slate-800">
                  • Your data is protected by Supabase Row Level Security (RLS).
                </p>
                <p>
                  • Other customers can never view your appointments or personal contact information.
                </p>
                <p>
                  • Businesses only receive your name and phone number for the specific service you book.
                </p>
                <p>
                  • Location permission is optional and only used to calculate proximity to nearby businesses.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl transition-colors border border-rose-200 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 6. SUPPORT                                                    */}
          {/* ============================================================= */}
          {activeSection === 'support' && (
            <div className="space-y-5 text-xs">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Help & Customer Support
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Have questions about a booking, check-in, or payment? We are here to help.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <HelpCircle className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="font-bold text-slate-900 block">Help Center</span>
                  <p className="text-slate-500">Read guides on booking, rescheduling, and cancellation rules.</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <Mail className="w-5 h-5 text-indigo-600 mb-1" />
                  <span className="font-bold text-slate-900 block">Contact Support</span>
                  <p className="text-slate-500">Email our concierge team at support@schedora.app anytime.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <LogOut className="w-10 h-10 text-rose-600 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Log out of Schedora?</h3>
              <p className="text-xs text-slate-500 mt-1">
                You will need to sign in again to access your upcoming appointments.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <Trash2 className="w-10 h-10 text-rose-600 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete your account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This action is permanent and will delete all saved appointment passes and history.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Keep Account
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Map Location Picker Modal */}
      {showLocationPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <LocationPickerMap
              initialLatitude={17.415}
              initialLongitude={78.441}
              initialAddress={area ? `${area}, ${city}` : ''}
              markerLabel="My Location"
              title="Pin Exact Home/Office Location"
              description="Click anywhere on the map or drag the pin to set your exact location so nearby providers and distances are completely accurate."
              height="400px"
              onSaveLocation={handleSaveLocationFromMap}
              onCancel={() => setShowLocationPickerModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
