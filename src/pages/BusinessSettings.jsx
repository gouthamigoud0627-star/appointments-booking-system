/**
 * Business Settings & Integrations Center (/settings)
 * Comprehensive practice management: profile, GPS coordinates, operating hours,
 * "Scan to Book" printable poster, and external webhooks/calendar integrations.
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Building2,
  Clock,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  QrCode,
  Printer,
  Download,
  CheckCircle2,
  Share2,
  ExternalLink,
  Zap,
  Bell,
  Globe,
  Link as LinkIcon,
  Copy,
  Check,
  MessageSquare,
  Sun,
  Moon,
  Laptop,
  Navigation,
  Crosshair,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext';
import { BusinessMessagingSettings } from '../components/BusinessMessagingSettings';
import { getCurrentLocation, reverseGeocode } from '../lib/location.js';
import LocationPickerMap from '../components/LocationPickerMap.tsx';

export default function BusinessSettings() {
  const { currentBusiness, updateBusiness } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'messaging' | 'appearance'>('profile');
  const [showLocationPickerModal, setShowLocationPickerModal] = useState(false);

  const [formData, setFormData] = useState({
    name: currentBusiness?.name || 'Bloom Spa & Wellness Sanctuary',
    category: currentBusiness?.category || 'Spa',
    tagline: 'Restorative wellness, thermal saunas, and botanical therapies',
    description: currentBusiness?.description || '',
    address: currentBusiness?.address || '450 Sutter St, Suite 800',
    city: currentBusiness?.city || 'San Francisco',
    state: currentBusiness?.state || 'CA',
    pincode: currentBusiness?.pincode || '94108',
    latitude: currentBusiness?.latitude || 37.7895,
    longitude: currentBusiness?.longitude || -122.4082,
    phone: currentBusiness?.phone || '+1 (415) 555-0192',
    email: currentBusiness?.email || 'owner@bloomspa.io',
    openingTime: currentBusiness?.openingTime || '09:00 AM',
    closingTime: currentBusiness?.closingTime || '06:00 PM',
    cancellationWindowHours: 24,
    cancellationFee: 25,
    webhookUrl: 'https://api.schedora.io/hooks/v1/arrivals',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [posterQrUrl, setPosterQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Generate Scan-to-Book QR code
  useEffect(() => {
    const bookingUrl = `${window.location.origin}/b/${currentBusiness?.slug || 'bloom-spa'}`;
    QRCode.toDataURL(bookingUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setPosterQrUrl);
  }, [currentBusiness]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (currentBusiness) {
      await updateBusiness(formData);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/b/${currentBusiness?.slug || 'bloom-spa'}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);

  const handleDetectStorefrontLocation = async () => {
    setDetectingGps(true);
    setGpsMessage(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      setFormData((prev) => ({
        ...prev,
        latitude: parseFloat(pos.latitude.toFixed(6)),
        longitude: parseFloat(pos.longitude.toFixed(6)),
      }));
      const address = await reverseGeocode(pos.latitude, pos.longitude);
      setGpsMessage(`Storefront GPS pinned: ${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)} (${address})`);
    } catch (err) {
      setGpsMessage('Could not retrieve device GPS. You can type coordinates or enter street address.');
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSaveLocationFromMap = (loc) => {
    const addressParts = loc.address ? loc.address.split(',') : [];
    const street = addressParts[0]?.trim() || formData.address;
    const city = addressParts[1]?.trim() || formData.city;
    const stateZip = addressParts[2]?.trim() || '';
    const stateMatch = stateZip.match(/[A-Z]{2}/);
    const zipMatch = stateZip.match(/\d{5}/);

    setFormData((prev) => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude,
      address: street,
      city: city || prev.city,
      state: stateMatch ? stateMatch[0] : prev.state,
      pincode: zipMatch ? zipMatch[0] : prev.pincode,
    }));
    setGpsMessage(`✓ Exact storefront pinned on map: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)} (${loc.address})`);
    setShowLocationPickerModal(false);
  };

  const handlePrintPoster = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Building2 className="w-3.5 h-3.5" />
              <span>Establishment Configuration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Business Settings & Integrations
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Storefront metadata, GPS location coordinates, policies, and storefront Scan-to-Book posters.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-colors"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4" />}
              <span>{copiedLink ? 'Link Copied' : 'Share Booking Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profile & Operating Hours</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'messaging'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Customer Messages & WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'appearance'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>Appearance & Theme</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Business settings and operational preferences saved successfully!</span>
        </div>
      )}

      {/* Tab: Customer Messages & WhatsApp */}
      {activeTab === 'messaging' && (
        <BusinessMessagingSettings businessId={currentBusiness?.id || 'biz-happy-paws-grooming'} />
      )}

      {/* Tab: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-7 shadow-xs space-y-5">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Appearance & Display Theme</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your preferred appearance mode for the dashboard and administrative views.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { id: 'light', label: '☀️ Light Mode', desc: 'Crisp, high-contrast daytime interface', icon: Sun },
              { id: 'dark', label: '🌙 Dark Mode', desc: 'Soft dark slate surfaces for low eye strain', icon: Moon },
              { id: 'system', label: '💻 System Preference', desc: 'Automatically match device OS theme', icon: Laptop },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTheme(opt.id)}
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

      {/* Tab: Profile & Operating Hours (Original Form) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="space-y-8">
        {/* Practice Details Card */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Profile & Location Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Business Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Industry Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none font-semibold"
              >
                <option>Spa</option>
                <option>Dental</option>
                <option>Salon</option>
                <option>Clinic</option>
                <option>Veterinary</option>
                <option>Auto Care</option>
                <option>Consulting</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">City, State, Zip</label>
              <input
                type="text"
                value={`${formData.city}, ${formData.state} ${formData.pincode}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  setFormData({ ...formData, city: parts[0]?.trim() || formData.city });
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">GPS Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">GPS Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Storefront Map Pinning & Directions Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationPickerModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors shadow-sm cursor-pointer"
                  title="Open interactive map to place exact storefront pin"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Pin Exact Location on Map</span>
                </button>

                <button
                  type="button"
                  onClick={handleDetectStorefrontLocation}
                  disabled={detectingGps}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 font-bold transition-colors cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
                  <span>{detectingGps ? 'Pinning GPS...' : 'Detect Device GPS'}</span>
                </button>

                {formData.latitude && formData.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>Preview Driving Directions</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}
              </div>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
                Pins your exact building entrance so clients never get wrong directions or sent to the wrong block.
              </p>
            </div>

            {/* Coordinates Status Pill */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold">Current Exact Pin:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {formData.latitude ? formData.latitude.toFixed(6) : '37.789500'}, {formData.longitude ? formData.longitude.toFixed(6) : '-122.408200'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPickerModal(true)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Fine-tune Pin on Map →
              </button>
            </div>
          </div>

          {gpsMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{gpsMessage}</span>
            </div>
          )}
        </div>

        {/* Operating Hours & Policies */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-5">
          <h3 className="font-bold text-base text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Operating Hours & Cancellation Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Opening Time</label>
              <input
                type="text"
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">Closing Time</label>
              <input
                type="text"
                value={formData.closingTime}
                onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Cancellation Window (Hours)
              </label>
              <input
                type="number"
                value={formData.cancellationWindowHours}
                onChange={(e) => setFormData({ ...formData, cancellationWindowHours: Number(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Late Cancellation Fee ($ USD)
              </label>
              <input
                type="number"
                value={formData.cancellationFee}
                onChange={(e) => setFormData({ ...formData, cancellationFee: Number(e.target.value) })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Storefront Scan-to-Book Poster Card */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Storefront "Scan to Book" Counter Poster</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Display this high-contrast QR poster at your front counter or entrance window for walk-in clients.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintPoster}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors self-start sm:self-center"
            >
              <Printer className="w-4 h-4" />
              <span>Print Counter Stand</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750">
            {posterQrUrl && (
              <div className="p-3 bg-white no-dark-surface rounded-2xl shadow-sm border border-slate-200 shrink-0">
                <img src={posterQrUrl} alt="Scan to book QR" className="w-32 h-32 object-contain" />
              </div>
            )}
            <div className="space-y-2 text-center sm:text-left">
              <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Instant Reservation Pass
              </span>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Scan with Phone Camera to Book & Receive Arrival Token
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Directs visitors to your booking schedule at{' '}
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  /b/{currentBusiness?.slug || 'bloom-spa'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Language Selection Card */}
        <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Language & Regional Preferences</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the default operational display language for this business dashboard.
            </p>
          </div>

          <div className="pt-2">
            <LanguageSelector variant="list" />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save All Configuration</span>
          </button>
        </div>
      </form>
      )}

      {/* Interactive Storefront Map Pinning Modal */}
      {showLocationPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <LocationPickerMap
              initialLatitude={formData.latitude || 37.7895}
              initialLongitude={formData.longitude || -122.4082}
              initialAddress={formData.address ? `${formData.address}, ${formData.city}, ${formData.state} ${formData.pincode}` : ''}
              markerLabel={formData.name || 'Storefront'}
              title="Pin Exact Business Location on Map"
              description="Click anywhere on the map or drag the pin right to your building entrance so clients get 100% accurate driving directions with no wrong locations."
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
