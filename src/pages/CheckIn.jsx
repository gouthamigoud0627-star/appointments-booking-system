/**
 * Schedora Smart Check-In Console (/check-in)
 * Tagline: "Scan. Verify. Check in."
 * Multi-method verification: Live Camera QR Scanner, Manual Token Entry, and Customer Search Fallback.
 * Enforces business tenant isolation and prevents duplicate check-ins.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  Camera,
  CameraOff,
  RefreshCw,
  XCircle,
  HelpCircle,
  Building2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { SchedoraGlyph } from '../components/SchedoraLogo.jsx';
import {
  getBookingsByBusiness,
  checkInWithToken,
  verifyAndCheckInBooking,
  updateBookingStatus,
} from '../lib/bookings.js';

export default function CheckIn() {
  const { currentBusiness, currentUser } = useAuth();

  // Mode: 'qr' | 'manual' | 'search'
  const [activeTab, setActiveTab] = useState('qr');

  // Scanner States: 'idle' | 'requesting' | 'scanning' | 'detected' | 'verifying' | 'valid' | 'error' | 'already_checked_in'
  const [scannerState, setScannerState] = useState('idle');
  const [cameraError, setCameraError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Manual Token State
  const [inputToken, setInputToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeBooking, setActiveBooking] = useState(null);

  // Search fallback
  const [searchQuery, setSearchQuery] = useState('');

  // Today's arrivals list
  const [todayBookings, setTodayBookings] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Load today's appointments for current business
  const loadBusinessBookings = async () => {
    if (!currentBusiness) return;
    setLoadingList(true);
    try {
      const list = await getBookingsByBusiness(currentBusiness.id);
      const todayStr = new Date().toISOString().split('T')[0];
      const todays = list.filter((b) => b.date === todayStr);
      setTodayBookings(todays);
    } catch (err) {
      console.error('Failed to load arrivals:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadBusinessBookings();
  }, [currentBusiness]);

  // Clean up scanner on unmount or tab switch
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'qr') {
      stopCameraScanner();
    }
  }, [activeTab]);

  // Start Camera Scanner
  const startCameraScanner = async () => {
    setCameraError(null);
    setScannerState('requesting');

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('qr-reader-container');
      }

      const qrCode = html5QrCodeRef.current;

      await qrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // QR detected
          handleQrScanSuccess(decodedText);
        },
        () => {
          // Frame scan pass - ignore silent frame drops
        }
      );

      setIsCameraActive(true);
      setScannerState('scanning');
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraError(
        'Unable to access camera. Please allow camera permissions or use the manual token backup below.'
      );
      setScannerState('idle');
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        // Ignore stop failures
      }
    }
    setIsCameraActive(false);
    setScannerState('idle');
  };

  // Handle scanned QR text (resolves URLs or plain tokens)
  const handleQrScanSuccess = async (rawDecoded) => {
    setScannerState('detected');
    await stopCameraScanner();
    triggerVerification(rawDecoded, 'qr');
  };

  // Trigger verification of a token or QR string
  const triggerVerification = async (tokenOrPayload, method = 'manual') => {
    setVerifying(true);
    setError(null);
    setSuccessMessage(null);
    setActiveBooking(null);
    setScannerState('verifying');

    try {
      const booking = await checkInWithToken(currentBusiness?.id, tokenOrPayload);

      // Check if already checked in
      if (booking.status === 'checked-in') {
        setActiveBooking(booking);
        setScannerState('already_checked_in');
        const timeStr = booking.checkedInAt
          ? new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'earlier today';
        setError(`Already Checked In: Customer ${booking.customerName} was checked in at ${timeStr}${booking.checkedInBy ? ' by ' + booking.checkedInBy : ''}.`);
        return;
      }

      if (booking.status === 'cancelled') {
        setActiveBooking(booking);
        setScannerState('error');
        setError(`Booking ${booking.token} is cancelled. Check-in cannot proceed.`);
        return;
      }

      setActiveBooking(booking);
      setScannerState('valid');
    } catch (err) {
      setError(err.message || 'Invalid or unverified token.');
      setScannerState('error');
    } finally {
      setVerifying(false);
    }
  };

  // Execute check-in confirmation
  const handleConfirmCheckIn = async () => {
    if (!activeBooking) return;
    setVerifying(true);
    setError(null);

    try {
      const checkedIn = await verifyAndCheckInBooking(
        currentBusiness?.id,
        activeBooking.token,
        activeTab === 'qr' ? 'qr' : 'manual',
        currentUser?.name || currentBusiness?.ownerName || 'Front Desk Staff'
      );

      setActiveBooking(checkedIn);
      setScannerState('valid');
      setSuccessMessage(
        `✓ Customer ${checkedIn.customerName} successfully checked in for ${checkedIn.serviceName}!`
      );
      loadBusinessBookings();
    } catch (err) {
      setError(err.message || 'Failed to complete check-in.');
    } finally {
      setVerifying(false);
    }
  };

  // Handle Token Input change (auto-format to uppercase and strip non-alphanumeric)
  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setInputToken(val);
    setError(null);
    setSuccessMessage(null);

    // Auto-verify when 6 characters are typed
    if (val.length === 6) {
      triggerVerification(val, 'manual');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (inputToken.length < 4) {
      setError('Please enter at least 4-6 characters.');
      return;
    }
    triggerVerification(inputToken, 'manual');
  };

  // Filtered arrivals for search fallback
  const filteredArrivals = todayBookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customerName?.toLowerCase().includes(q) ||
      b.customerEmail?.toLowerCase().includes(q) ||
      b.customerPhone?.includes(q) ||
      b.token?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-md p-2">
              <img
                src="/schedora-mark.png"
                alt="Schedora Logo"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/schedora-mark.svg';
                }}
              />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
                <QrCode className="w-3.5 h-3.5" />
                <span>Front Desk Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Check In
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200">
                Tagline: <strong className="text-white">Scan. Verify. Check in.</strong> · Business: {currentBusiness?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/15 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-200 block">Today's Queue</span>
              <span className="text-xl font-black text-white">{todayBookings.length}</span>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 backdrop-blur border border-emerald-400/30 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Checked In</span>
              <span className="text-xl font-black text-emerald-300">
                {todayBookings.filter((b) => b.status === 'checked-in' || b.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Verification Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Multi-Method Scanner & Token Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-7">
            {/* Method Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'qr'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Camera QR Scan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Enter Token</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'search'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Search Client</span>
              </button>
            </div>

            {/* TAB 1: Live Camera QR Scanner */}
            {activeTab === 'qr' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center bg-slate-50 relative overflow-hidden">
                  <div
                    id="qr-reader-container"
                    className="w-full max-w-xs mx-auto overflow-hidden rounded-xl bg-black min-h-[240px] flex items-center justify-center text-white text-xs"
                  >
                    {!isCameraActive && (
                      <div className="p-6 text-center space-y-3">
                        <QrCode className="w-12 h-12 text-slate-400 mx-auto" />
                        <p className="text-slate-300 font-medium">Camera is currently idle</p>
                        <button
                          onClick={startCameraScanner}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-md"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Activate Device Camera</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isCameraActive && (
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-semibold text-slate-700">
                        Scanning: Point camera at customer's QR code
                      </span>
                      <button
                        onClick={stopCameraScanner}
                        className="ml-3 text-xs text-rose-600 font-bold hover:underline"
                      >
                        Stop
                      </button>
                    </div>
                  )}

                  {cameraError && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-left flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{cameraError}</span>
                    </div>
                  )}
                </div>

                {/* Simulation test buttons (crucial for headless / test environments) */}
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Front Desk QR Simulator (Quick Test):
                    </span>
                    <span className="text-[10px] text-indigo-500 font-semibold">1-Click Test</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => triggerVerification('A7K2PX', 'qr')}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-900 text-xs font-mono font-bold transition-colors shadow-xs"
                    >
                      Scan A7K2PX (Valid Pass)
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVerification('B4Q8TR', 'qr')}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-900 text-xs font-mono font-bold transition-colors shadow-xs"
                    >
                      Scan B4Q8TR (Already In)
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerVerification('D9N4WX', 'qr')}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-indigo-600 hover:text-white border border-indigo-200 text-indigo-900 text-xs font-mono font-bold transition-colors shadow-xs"
                    >
                      Scan D9N4WX (Other Biz)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Manual 6-Character Token Input */}
            {activeTab === 'manual' && (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Enter Customer 6-Character Arrival Token
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={inputToken}
                      onChange={handleInputChange}
                      placeholder="e.g. A7K2PX"
                      maxLength={6}
                      autoFocus
                      className="w-full text-center text-3xl sm:text-4xl font-black font-mono tracking-widest uppercase py-4 px-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-600 focus:bg-white focus:outline-none transition-all shadow-inner"
                    />
                    {verifying && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    Auto-verifies upon typing the 6th character. Case-insensitive.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={verifying || inputToken.length < 4}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>{verifying ? 'Verifying Code...' : 'Verify Arrival Code'}</span>
                </button>
              </form>
            )}

            {/* TAB 3: Search Client / Appointment Fallback */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name, email, phone, or token..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none text-sm transition-colors"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-slate-100">
                  {filteredArrivals.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No matching clients found in today's queue.
                    </div>
                  ) : (
                    filteredArrivals.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => triggerVerification(apt.token, 'manual')}
                        className="pt-2 pb-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 p-2 rounded-xl transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{apt.customerName}</p>
                          <p className="text-xs text-slate-500">
                            {apt.serviceName} · <span className="font-mono font-semibold">{apt.token}</span>
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            apt.status === 'checked-in'
                              ? 'bg-blue-50 text-blue-700'
                              : apt.status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Feedback Banners */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Verification Notice</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Check-In Successful</p>
                <p className="text-xs mt-0.5">{successMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Appointment Verification Card (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6 sticky top-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Verification Result</h2>
              {activeBooking && (
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeBooking.token}
                </span>
              )}
            </div>

            {activeBooking ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Client Name</span>
                      <h3 className="text-lg font-bold text-slate-900">{activeBooking.customerName}</h3>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        activeBooking.status === 'checked-in'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : activeBooking.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {activeBooking.status.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block">Service</span>
                      <span className="font-semibold text-slate-800">{activeBooking.serviceName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Time Slot</span>
                      <span className="font-semibold text-slate-800">
                        {activeBooking.startTime} ({activeBooking.duration}m)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Date</span>
                      <span className="font-semibold text-slate-800">{activeBooking.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Specialist</span>
                      <span className="font-semibold text-slate-800">
                        {activeBooking.staffName || 'Available Staff'}
                      </span>
                    </div>
                  </div>

                  {activeBooking.notes && (
                    <div className="pt-2 border-t border-slate-200/70 text-xs">
                      <span className="text-slate-400 block">Client Notes:</span>
                      <span className="text-slate-600 italic">{activeBooking.notes}</span>
                    </div>
                  )}

                  {activeBooking.checkedInAt && (
                    <div className="pt-2 border-t border-slate-200/70 text-xs text-blue-700 font-medium">
                      ✓ Checked in at {new Date(activeBooking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {activeBooking.checkedInBy && ` by ${activeBooking.checkedInBy}`}
                    </div>
                  )}
                </div>

                {/* Confirm Check-In Action Button */}
                {activeBooking.status !== 'checked-in' && activeBooking.status !== 'cancelled' ? (
                  <button
                    onClick={handleConfirmCheckIn}
                    disabled={verifying}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm Customer Check-In</span>
                  </button>
                ) : activeBooking.status === 'checked-in' ? (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium text-center">
                    Customer is currently marked as present and waiting.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto border border-slate-100">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700">Waiting for QR Scan or Token</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan a customer's pass or enter their 6-character arrival token to review details and check them in.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
