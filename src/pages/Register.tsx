/**
 * Schedora Registration & Step-by-Step Onboarding (/register)
 * Features:
 * 1. Role Selection: Customer | Business Owner | Executive
 * 2. Customer 7-step Onboarding with Interactive Calendar & Business Timings:
 *    - Step 1: Language selection
 *    - Step 2: Account creation (Email, Phone, Password)
 *    - Step 3: Verification (OTP)
 *    - Step 4: Personal profile (Name, Age, Gender)
 *    - Step 5: Location selection (Auto GPS or Manual City/Area)
 *    - Step 6: Interactive Appointment Calendar (Select Date)
 *    - Step 7: Business Timings & Schedule ("When will it open & all" - Opening hours, weekly schedule, slots)
 * 3. Business Registration with Working Hours & Weekly Calendar Setup
 * 4. Executive Enterprise Registration
 * 5. Full-screen layout with 100% stationary background and sticky on-screen "Next" navigation.
 */

import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Globe,
  Mail,
  Lock,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Briefcase,
  Eye,
  EyeOff,
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  Store,
  Compass,
  Check,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { UniversalSchedulingService } from '../lib/universalScheduling';
import { SEEDED_BUSINESSES } from '../lib/business';

export default function Register() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const initialRole =
    initialRoleParam === 'business'
      ? 'business'
      : initialRoleParam === 'executive'
      ? 'executive'
      : 'customer';
  const [role, setRole] = useState<'customer' | 'business' | 'executive'>(initialRole);
  const [roleConfirmed, setRoleConfirmed] = useState<boolean>(Boolean(initialRoleParam));

  const { customerRegister, register: businessRegister, executiveRegister, loginWithGoogle, loginWithApple } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Executive Form State
  const [execName, setExecName] = useState('');
  const [execEmail, setExecEmail] = useState('');
  const [execOrgName, setExecOrgName] = useState('');
  const [execTitle, setExecTitle] = useState('Director of Operations');
  const [execPassword, setExecPassword] = useState('');

  // Customer Onboarding Step: 1 to 7
  const [customerStep, setCustomerStep] = useState<number>(1);

  // Customer Form state
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('742891');
  const [otpError, setOtpError] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');

  const [locationCity, setLocationCity] = useState('Hyderabad');
  const [locationArea, setLocationArea] = useState('Banjara Hills');
  const [locationDenied, setLocationDenied] = useState(false);
  const [locating, setLocating] = useState(false);

  // Step 6: Calendar Selection State
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  }, [today]);

  const [selectedDate, setSelectedDate] = useState<Date>(tomorrow);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date(tomorrow.getFullYear(), tomorrow.getMonth(), 1));

  // Step 7: Business Timings & Slots State
  const businessesList = useMemo(() => {
    if (SEEDED_BUSINESSES && SEEDED_BUSINESSES.length > 0) {
      return SEEDED_BUSINESSES;
    }
    return [
      {
        id: 'biz-hyd-aura-ayur',
        name: 'Aura Ayurvedic Wellness Clinic',
        category: 'Clinic',
        rating: 4.9,
        reviewCount: 168,
        address: 'Road No. 12, Banjara Hills',
        city: 'Hyderabad',
        openingTime: '08:30 AM',
        closingTime: '07:30 PM',
        daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        availableSlotsToday: ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '06:00 PM'],
      },
    ];
  }, []);

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(businessesList[0]?.id || 'biz-hyd-aura-ayur');
  const activeBusiness = useMemo(() => {
    return businessesList.find((b) => b.id === selectedBusinessId) || businessesList[0];
  }, [businessesList, selectedBusinessId]);

  const [selectedSlot, setSelectedSlot] = useState<string>('10:30 AM');

  // Business Registration Form State
  const [businessStep, setBusinessStep] = useState<1 | 2>(1);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('Spa');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPassword, setBusinessPassword] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessCity, setBusinessCity] = useState('San Francisco');
  const [orgUseCase, setOrgUseCase] = useState<'business' | 'corporate' | 'education' | 'recruitment' | 'sales' | 'personal'>('business');

  // Business Operating Hours Setup State
  const [bizOpenTime, setBizOpenTime] = useState('09:00 AM');
  const [bizCloseTime, setBizCloseTime] = useState('07:00 PM');
  const [bizLunchBreak, setBizLunchBreak] = useState('01:00 PM - 02:00 PM');
  const [bizWorkingDays, setBizWorkingDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [bizSlotDuration, setBizSlotDuration] = useState('30 min');

  // Social Sign-in Handler
  const handleSocialRegister = async (provider: 'google' | 'apple') => {
    setError(null);
    setSocialLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle(role);
      } else {
        await loginWithApple(role);
      }
      navigate(role === 'customer' ? '/' : '/dashboard');
    } catch (err: any) {
      setError(err.message || `${provider} sign-up failed. Please try again.`);
    } finally {
      setSocialLoading(false);
    }
  };

  // Location Geolocation Handler
  const handleRequestLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          setLocationCity('Hyderabad');
          setLocationArea('Banjara Hills');
          setCustomerStep(6); // Advance to Calendar step!
        },
        (err) => {
          setLocating(false);
          setLocationDenied(true);
        },
        { timeout: 5000 }
      );
    } else {
      setLocating(false);
      setLocationDenied(true);
    }
  };

  // Finalize Customer Onboarding
  const handleFinishCustomerOnboarding = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await customerRegister({
        name: name.trim() || 'New Customer',
        email: email.trim() || `customer-${Date.now()}@schedora.me`,
        phone: phone.trim() || '+91 98765 43210',
        password: password || 'Schedora123!',
        age: age || '26',
        gender,
        locationCity: locationCity.trim() || 'Hyderabad',
        locationArea: locationArea.trim() || 'Banjara Hills',
        language,
      });

      // Persist chosen booking preference
      try {
        localStorage.setItem(
          'schedora_last_selected_appointment',
          JSON.stringify({
            businessId: activeBusiness.id,
            businessName: activeBusiness.name,
            date: selectedDate.toISOString(),
            timeSlot: selectedSlot,
            category: activeBusiness.category,
            address: activeBusiness.address,
            city: activeBusiness.city,
            tokenNumber: 'A-14',
          })
        );
      } catch (e) {
        // storage silent fail
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setSubmitting(false);
    }
  };

  // Finalize Business Registration
  const handleBusinessRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await businessRegister({
        businessName: businessName.trim() || 'My Schedora Practice',
        ownerName: ownerName.trim() || 'Business Owner',
        email: businessEmail.trim(),
        password: businessPassword,
        phone: businessPhone.trim(),
        category: businessCategory,
        address: businessAddress.trim() || '100 Main Street',
        city: businessCity.trim() || 'San Francisco',
        state: 'CA',
        pincode: '94108',
      });

      // Synchronize with Schedora 2.0 multi-tenant organization engine
      UniversalSchedulingService.createOrganization({
        name: businessName.trim() || 'My Schedora Practice',
        slug: (businessName || 'practice').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: orgUseCase,
        brandColor: '#4f46e5',
        timezone: 'America/Los_Angeles',
        subscriptionPlan: 'team',
        ownerId: `user-${Date.now()}`,
        ownerName: ownerName.trim() || 'Business Owner',
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize Executive Registration
  const handleExecutiveRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (!execEmail.trim() || !execPassword) {
        throw new Error('Please provide corporate work email and password.');
      }
      await executiveRegister({
        name: execName.trim() || 'Executive Lead',
        email: execEmail.trim(),
        password: execPassword,
        organizationName: execOrgName.trim() || 'Global Enterprise',
        title: execTitle.trim() || 'Director of Operations',
      });
      UniversalSchedulingService.createOrganization({
        name: execOrgName.trim() || 'Global Enterprise',
        slug: (execOrgName || 'enterprise').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: 'corporate',
        brandColor: '#4338ca',
        timezone: 'America/Los_Angeles',
        subscriptionPlan: 'enterprise',
        ownerId: `user-exec-${Date.now()}`,
        ownerName: execName.trim() || 'Executive Lead',
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Executive registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // Calendar Math & Helpers
  // ==========================================
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

    const days: Array<{
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isPast: boolean;
      isOpen: boolean;
    }> = [];

    // Prefix padding from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        isPast: true,
        isOpen: false,
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      const isPast = d.getTime() < today.getTime();
      const isSelected =
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate();
      const isCurrentDay = d.getTime() === today.getTime();
      const dayOfWeek = d.getDay(); // 0 is Sunday
      const isOpen = dayOfWeek !== 0; // Open Mon-Sat

      days.push({
        date: d,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: isCurrentDay,
        isSelected,
        isPast,
        isOpen,
      });
    }

    return days;
  }, [calendarMonth, selectedDate, today]);

  const monthLabel = useMemo(() => {
    return calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [calendarMonth]);

  const formattedSelectedDate = useMemo(() => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className="flex flex-col min-h-full">
      {/* ========================================================================= */}
      {/* 1. DEDICATED ROLE-SELECTION SCREEN                                        */}
      {/* ========================================================================= */}
      {!roleConfirmed ? (
        <div className="p-6 sm:p-10 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <Link
              to="/login"
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
            <LanguageSelector variant="dropdown" />
          </div>

          <div className="text-center space-y-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Step 1: Choose Your Account Role</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How will you use Schedora?
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Select your role below to launch your tailored registration questionnaire and schedule calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {/* 1. Customer Role Card */}
            <div
              onClick={() => {
                setRole('customer');
                setRoleConfirmed(true);
                setSearchParams({ role: 'customer' });
              }}
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow-lg transition-all cursor-pointer group bg-white dark:bg-slate-800 text-left relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        Customer
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700">
                        Personal & Appointments
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Book appointments, browse interactive calendars, view business opening timings, and track physical arrival tokens.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                      <span>✓ Interactive booking calendar</span>
                      <span>✓ View business opening timings</span>
                      <span>✓ Physical arrival tokens</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-600 text-slate-700 dark:text-slate-200 group-hover:text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Business Owner Role Card */}
            <div
              onClick={() => {
                setRole('business');
                setRoleConfirmed(true);
                setSearchParams({ role: 'business' });
              }}
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-600 hover:shadow-lg transition-all cursor-pointer group bg-white dark:bg-slate-800 text-left relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        Business Owner
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                        Storefront & Practice
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Configure your storefront calendar, opening and closing hours, lunch breaks, and client appointments.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                      <span>✓ Set opening & closing hours</span>
                      <span>✓ Roster weekly working days</span>
                      <span>✓ Collision-free client slots</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-emerald-600 text-slate-700 dark:text-slate-200 group-hover:text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Executive Role Card */}
            <div
              onClick={() => {
                setRole('executive');
                setRoleConfirmed(true);
                setSearchParams({ role: 'executive' });
              }}
              className="p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-600 hover:shadow-lg transition-all cursor-pointer group bg-white dark:bg-slate-800 text-left relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                        Executive & Enterprise
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700">
                        Corporate & Leadership
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Cross-organization capacity scheduling, candidate interview loops, executive boards, and SLA logs.
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-1 font-medium">
                      <span>✓ Enterprise audit logs</span>
                      <span>✓ Multi-department sync</span>
                      <span>✓ Executive calendar security</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-purple-600 text-slate-700 dark:text-slate-200 group-hover:text-white text-xs font-bold transition-colors shrink-0 flex items-center gap-1 mt-1 cursor-pointer"
                >
                  <span>Select</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have a Schedora account?{' '}
            <Link to="/login" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Sign In →
            </Link>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ONBOARDING QUESTIONNAIRE & REGISTRATION SHELL                          */
        /* ========================================================================= */
        <div className="flex flex-col flex-1">
          {/* Top Bar: Change Role & 3-Way Quick Switcher */}
          <div className="p-4 sm:px-8 border-b border-slate-150 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setRoleConfirmed(false);
                setSearchParams({});
              }}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-white dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Role</span>
            </button>

            {/* Quick Role Switcher */}
            <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-700/60 rounded-xl text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole('customer');
                  setSearchParams({ role: 'customer' });
                }}
                className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  role === 'customer'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('business');
                  setSearchParams({ role: 'business' });
                }}
                className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  role === 'business'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Business</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('executive');
                  setSearchParams({ role: 'executive' });
                }}
                className={`py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  role === 'executive'
                    ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Executive</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mx-6 sm:mx-8 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* CUSTOMER 7-STEP ONBOARDING WITH CALENDAR & BUSINESS TIMINGS               */}
          {/* ========================================================================= */}
          {role === 'customer' && (
            <div className="flex-1 flex flex-col justify-between">
              {/* Step Questionnaire Content */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Step Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                      Step {customerStep} of 7: {
                        customerStep === 1
                          ? 'Language'
                          : customerStep === 2
                          ? 'Account Credentials'
                          : customerStep === 3
                          ? 'OTP Verification'
                          : customerStep === 4
                          ? 'Profile Details'
                          : customerStep === 5
                          ? 'Location'
                          : customerStep === 6
                          ? 'Interactive Calendar'
                          : 'Business Timings & Schedule'
                      }
                    </span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{Math.round((customerStep / 7) * 100)}%</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((s) => (
                      <div
                        key={s}
                        onClick={() => {
                          if (s <= customerStep) setCustomerStep(s);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          s === customerStep
                            ? 'bg-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900'
                            : s < customerStep
                            ? 'bg-indigo-400 dark:bg-indigo-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* STEP 1: CHOOSE YOUR LANGUAGE */}
                {customerStep === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Choose your language
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Select how you would like Schedora to display content and appointments
                      </p>
                    </div>

                    <div className="py-2">
                      <LanguageSelector variant="buttons" />
                    </div>

                    <p className="text-center text-xs text-slate-400">
                      You can change your language preference at any time in Settings.
                    </p>
                  </div>
                )}

                {/* STEP 2: CREATE YOUR ACCOUNT */}
                {customerStep === 2 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCustomerStep(3);
                    }}
                    className="space-y-4 text-xs animate-in fade-in duration-200 max-w-lg mx-auto"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Create your customer account
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter your contact details to start reserving appointments
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <SocialAuthButtons
                        onGoogleSignIn={() => handleSocialRegister('google')}
                        onAppleSignIn={() => handleSocialRegister('apple')}
                        loading={socialLoading}
                        actionText="Sign up"
                      />
                    </div>
                  </form>
                )}

                {/* STEP 3: VERIFY YOUR ACCOUNT (OTP) */}
                {customerStep === 3 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200 max-w-md mx-auto text-center">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Verify your account
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Enter the 6-digit OTP verification code sent to{' '}
                        <strong className="text-slate-800 dark:text-slate-200">{phone || email || '+91 98765 43210'}</strong>
                      </p>
                    </div>

                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 rounded-2xl text-center space-y-1.5">
                      <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">Demo Secure OTP (Click to Fill):</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode(generatedOtp);
                          setOtpError(false);
                        }}
                        className="block mx-auto text-xl font-mono font-black text-indigo-900 dark:text-indigo-200 tracking-widest hover:scale-105 transition-transform"
                      >
                        {generatedOtp}
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => {
                          setOtpCode(e.target.value);
                          setOtpError(false);
                        }}
                        placeholder="Enter 6-digit OTP"
                        className="w-full py-3 text-center font-mono font-black text-xl tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-indigo-500"
                      />
                      {otpError && (
                        <p className="text-rose-600 font-bold mt-1.5 text-[11px]">
                          Please enter the 6-digit OTP code ({generatedOtp})
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: TELL US ABOUT YOU */}
                {customerStep === 4 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setCustomerStep(5);
                    }}
                    className="space-y-4 text-xs animate-in fade-in duration-200 max-w-lg mx-auto"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Tell us about you
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        This information helps businesses prepare your consultation and tokens
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Age or Year of Birth</label>
                      <input
                        type="text"
                        required
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="e.g. 28"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </form>
                )}

                {/* STEP 5: WHERE ARE YOU? (LOCATION) */}
                {customerStep === 5 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200 max-w-lg mx-auto">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Where are you located?
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Allows us to suggest top nearby clinics, spas, and auto centers for your schedule
                      </p>
                    </div>

                    {!locationDenied ? (
                      <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                          <MapPin className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          Find nearby businesses automatically
                        </p>
                        <button
                          type="button"
                          disabled={locating}
                          onClick={handleRequestLocation}
                          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-colors cursor-pointer"
                        >
                          {locating ? 'Detecting Location...' : 'Use My Current Location & Continue'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationDenied(true)}
                          className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:underline block mx-auto cursor-pointer"
                        >
                          Choose location manually instead
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                          Select your city and area below:
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                          <input
                            type="text"
                            required
                            value={locationCity}
                            onChange={(e) => setLocationCity(e.target.value)}
                            placeholder="e.g. Hyderabad, San Francisco, Bengaluru"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Area / Locality</label>
                          <input
                            type="text"
                            required
                            value={locationArea}
                            onChange={(e) => setLocationArea(e.target.value)}
                            placeholder="e.g. Banjara Hills, Jubilee Hills, Downtown"
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 6: SHOW A CALENDAR (USER REQUEST)                                    */}
                {/* ========================================================================= */}
                {customerStep === 6 && (
                  <div className="space-y-5 animate-in fade-in duration-200 max-w-xl mx-auto">
                    <div className="text-center space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Interactive Calendar</span>
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Select your appointment date
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Pick a date on the calendar to view available business opening hours and arrival slots
                      </p>
                    </div>

                    {/* Quick Date Chips */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDate(today)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedDate.getTime() === today.getTime()
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(tomorrow)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedDate.getTime() === tomorrow.getTime()
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Tomorrow
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sat = new Date(today);
                          sat.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
                          setSelectedDate(sat);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        This Weekend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const mon = new Date(today);
                          mon.setDate(today.getDate() + ((1 - today.getDay() + 7) % 7 || 7));
                          setSelectedDate(mon);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Next Monday
                      </button>
                    </div>

                    {/* Interactive Calendar Card */}
                    <div className="p-4 sm:p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                      {/* Month Header with Controls */}
                      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarMonth(
                              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {monthLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCalendarMonth(
                              new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                            );
                          }}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Day of Week Headers */}
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase py-1">
                        <span>Sun</span>
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                      </div>

                      {/* Calendar Days Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center pt-1">
                        {calendarDays.map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            disabled={item.isPast || !item.isCurrentMonth}
                            onClick={() => {
                              setSelectedDate(item.date);
                            }}
                            className={`h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-bold flex flex-col items-center justify-center relative transition-all ${
                              !item.isCurrentMonth
                                ? 'opacity-25 cursor-default'
                                : item.isPast
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                : item.isSelected
                                ? 'bg-indigo-600 text-white font-extrabold shadow-md scale-105 z-10'
                                : item.isToday
                                ? 'border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                            }`}
                          >
                            <span>{item.dayNumber}</span>
                            {/* Open Day Green Indicator Dot */}
                            {item.isCurrentMonth && !item.isPast && item.isOpen && !item.isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Date Confirmation Banner */}
                    <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 rounded-2xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                        <CalendarIcon className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          Selected Date: <strong className="font-bold">{formattedSelectedDate}</strong>
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                        Confirmed
                      </span>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* STEP 7: SHOW TIMINGS OF THAT BUSINESS ("WHEN WILL IT OPEN AND ALL")      */}
                {/* ========================================================================= */}
                {customerStep === 7 && (
                  <div className="space-y-5 animate-in fade-in duration-200 max-w-xl mx-auto text-xs">
                    <div className="text-center space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Business Timings & Schedule</span>
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Business Hours & Available Timings
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400">
                        See when <strong className="text-slate-800 dark:text-slate-200">{activeBusiness.name}</strong> opens, breaks, and daily slots
                      </p>
                    </div>

                    {/* Business Profile Spotlight Card */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 dark:from-slate-800 dark:to-slate-850 border border-indigo-100 dark:border-slate-700 rounded-2xl shadow-xs">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                {activeBusiness.name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>OPEN TODAY</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span>{activeBusiness.address}, {activeBusiness.city}</span>
                            </p>
                          </div>
                        </div>

                        {/* Switch Business Dropdown if multiple */}
                        {businessesList.length > 1 && (
                          <select
                            value={selectedBusinessId}
                            onChange={(e) => setSelectedBusinessId(e.target.value)}
                            className="text-[11px] font-bold py-1 px-2 rounded-lg bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          >
                            {businessesList.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Daily Hours Highlights */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/60 text-center">
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-150 dark:border-slate-700">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Opens At</span>
                          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            {activeBusiness.openingTime || '08:30 AM'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-150 dark:border-slate-700">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Closes At</span>
                          <span className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                            {activeBusiness.closingTime || '07:30 PM'}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-150 dark:border-slate-700">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase">Lunch Break</span>
                          <span className="font-extrabold text-xs text-amber-600 dark:text-amber-400 mt-0.5 block">
                            1:00 - 2:00 PM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Operating Timings Table ("When will it open and all") */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Full 7-Day Operating Schedule</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Standard business week</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        {[
                          { day: 'Mon', hours: '08:30 AM - 07:30 PM', open: true },
                          { day: 'Tue', hours: '08:30 AM - 07:30 PM', open: true },
                          { day: 'Wed', hours: '08:30 AM - 07:30 PM', open: true },
                          { day: 'Thu', hours: '08:30 AM - 07:30 PM', open: true },
                          { day: 'Fri', hours: '08:30 AM - 07:30 PM', open: true },
                          { day: 'Sat', hours: '10:00 AM - 05:00 PM', open: true },
                          { day: 'Sun', hours: 'Closed (Rest Day)', open: false },
                        ].map((sched) => (
                          <div
                            key={sched.day}
                            className={`p-2 rounded-xl border flex flex-col justify-between ${
                              sched.open
                                ? 'bg-slate-50/80 dark:bg-slate-750/50 border-slate-150 dark:border-slate-700'
                                : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-150 dark:border-rose-900/40 text-rose-500'
                            }`}
                          >
                            <span className="font-extrabold text-xs">{sched.day}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {sched.hours}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Available Arrival Time Slots for Selected Date */}
                    <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Select Your Preferred Arrival Time ({formattedSelectedDate})</span>
                        </span>
                        <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {selectedSlot} Selected
                        </span>
                      </div>

                      <div className="space-y-2">
                        {/* Morning Slots */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Morning Slots
                          </span>
                          <div className="grid grid-cols-3 gap-2">
                            {['09:30 AM', '10:30 AM', '11:30 AM'].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                  selectedSlot === slot
                                    ? 'bg-indigo-600 text-white shadow-xs scale-102'
                                    : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Afternoon & Evening Slots */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Afternoon & Evening Slots
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {['02:30 PM', '04:15 PM', '05:30 PM', '06:30 PM'].map((slot) => (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2 px-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                  selectedSlot === slot
                                    ? 'bg-indigo-600 text-white shadow-xs scale-102'
                                    : 'bg-slate-50 dark:bg-slate-750 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking & Token Summary Card */}
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-black text-xs text-indigo-950 dark:text-indigo-200 block">
                          Appointment Preview: {formattedSelectedDate} at {selectedSlot}
                        </span>
                        <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                          Real-time Physical Token #A-14 will be issued upon arrival
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Zero Wait Queue
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ========================================================================= */}
              {/* STICKY BOTTOM ACTION BAR (PERMANENTLY ON SCREEN)                          */}
              {/* ========================================================================= */}
              <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md border-t border-slate-150 dark:border-slate-800 p-4 sm:px-8 flex items-center justify-between gap-3 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (customerStep > 1) {
                      setCustomerStep(customerStep - 1);
                    } else {
                      setRoleConfirmed(false);
                      setSearchParams({});
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{customerStep === 1 ? 'Change Role' : 'Back'}</span>
                </button>

                {/* Step indicator pill */}
                <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span>Step {customerStep} of 7</span>
                </div>

                {/* NEXT / CONTINUE BUTTON (ALWAYS VISIBLE ON SCREEN) */}
                {customerStep === 1 && (
                  <button
                    type="button"
                    onClick={() => setCustomerStep(2)}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 2 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!email || !password) {
                        setError('Please provide email and password');
                        return;
                      }
                      setError(null);
                      setCustomerStep(3);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (otpCode.trim() === generatedOtp || otpCode.trim() === '123456' || otpCode.length >= 4) {
                        setCustomerStep(4);
                      } else {
                        setOtpCode(generatedOtp);
                        setCustomerStep(4);
                      }
                    }}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 4 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!name) {
                        setName('Valued Client');
                      }
                      setCustomerStep(5);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{t('continue')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 5 && (
                  <button
                    type="button"
                    onClick={() => setCustomerStep(6)}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Select Date on Calendar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 6 && (
                  <button
                    type="button"
                    onClick={() => setCustomerStep(7)}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: View Business Hours & Timings</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {customerStep === 7 && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleFinishCustomerOnboarding}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Creating Profile...</span>
                    ) : (
                      <>
                        <span>Complete Registration & Save Booking</span>
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BUSINESS REGISTRATION WITH TIMINGS & CALENDAR SETUP                       */}
          {/* ========================================================================= */}
          {role === 'business' && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Business Setup: Step {businessStep} of 2</span>
                  <span className="text-emerald-600">{businessStep === 1 ? 'Details & Address' : 'Operating Hours & Schedule'}</span>
                </div>

                {businessStep === 1 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setBusinessStep(2);
                    }}
                    className="space-y-4 text-xs animate-in fade-in duration-200"
                  >
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Register Your Business Practice
                      </h2>
                      <p className="text-xs text-slate-500">
                        Create a dedicated storefront booking portal with custom hours and rosters
                      </p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Business / Practice Name
                      </label>
                      <input
                        type="text"
                        required
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Apex Wellness & Salon"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Owner Name</label>
                        <input
                          type="text"
                          required
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                        <select
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        >
                          <option value="Spa">Spa & Wellness</option>
                          <option value="Clinic">Clinic & Medical</option>
                          <option value="Dental">Dental Care</option>
                          <option value="Salon">Salon & Hair</option>
                          <option value="Auto Care">Car Care & Auto</option>
                          <option value="Veterinary">Pet Care & Vet</option>
                          <option value="Fitness">Fitness & Yoga</option>
                          <option value="Other">Other Services</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Business Email</label>
                        <input
                          type="email"
                          required
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="contact@business.com"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          required
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={businessPassword}
                        onChange={(e) => setBusinessPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                        <input
                          type="text"
                          required
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="Street Address"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">City</label>
                        <input
                          type="text"
                          required
                          value={businessCity}
                          onChange={(e) => setBusinessCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </form>
                )}

                {/* Step 2: Business Timings & Operating Schedule ("When will it open and all") */}
                {businessStep === 2 && (
                  <div className="space-y-4 text-xs animate-in fade-in duration-200">
                    <div className="text-center space-y-1">
                      <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Configure Storefront Timings & Schedule
                      </h2>
                      <p className="text-xs text-slate-500">
                        Specify when your business opens, closes, break periods, and calendar slot sizes
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Opening Time</label>
                        <input
                          type="text"
                          value={bizOpenTime}
                          onChange={(e) => setBizOpenTime(e.target.value)}
                          placeholder="09:00 AM"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Closing Time</label>
                        <input
                          type="text"
                          value={bizCloseTime}
                          onChange={(e) => setBizCloseTime(e.target.value)}
                          placeholder="07:00 PM"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lunch Break</label>
                        <input
                          type="text"
                          value={bizLunchBreak}
                          onChange={(e) => setBizLunchBreak(e.target.value)}
                          placeholder="1:00 - 2:00 PM"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-amber-600"
                        />
                      </div>
                    </div>

                    {/* Working Days Checkboxes */}
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Weekly Operating Days
                      </label>
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                          const isActive = bizWorkingDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                if (isActive) {
                                  setBizWorkingDays(bizWorkingDays.filter((d) => d !== day));
                                } else {
                                  setBizWorkingDays([...bizWorkingDays, day]);
                                }
                              }}
                              className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slot Interval */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Standard Slot Duration
                        </label>
                        <select
                          value={bizSlotDuration}
                          onChange={(e) => setBizSlotDuration(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                        >
                          <option value="15 min">15 minutes</option>
                          <option value="30 min">30 minutes</option>
                          <option value="45 min">45 minutes</option>
                          <option value="60 min">60 minutes</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Walk-in Token Capacity
                        </label>
                        <input
                          type="text"
                          defaultValue="25 tokens / day"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs">
                      ✓ Collision-free slots will automatically generate for customers based on {bizOpenTime} to {bizCloseTime}.
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Bottom Actions */}
              <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md border-t border-slate-150 dark:border-slate-800 p-4 sm:px-8 flex items-center justify-between gap-3 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    if (businessStep === 2) {
                      setBusinessStep(1);
                    } else {
                      setRoleConfirmed(false);
                      setSearchParams({});
                    }
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{businessStep === 1 ? 'Change Role' : 'Back'}</span>
                </button>

                {businessStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!businessName || !businessEmail || !businessPassword) {
                        setError('Please provide business name, email, and password.');
                        return;
                      }
                      setError(null);
                      setBusinessStep(2);
                    }}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>Next: Set Business Timings & Calendar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleBusinessRegister()}
                    className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submitting ? 'Creating Business Portal...' : 'Complete Business Registration'}
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* EXECUTIVE REGISTRATION                                                    */}
          {/* ========================================================================= */}
          {role === 'executive' && (
            <form onSubmit={handleExecutiveRegister} className="flex-1 flex flex-col justify-between">
              <div className="p-6 sm:p-8 space-y-4 text-xs">
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Executive & Enterprise Onboarding
                  </h2>
                  <p className="text-slate-500">
                    High-volume cross-org scheduling, interview panel loops, and SLA oversight
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={execName}
                    onChange={(e) => setExecName(e.target.value)}
                    placeholder="e.g. Dr. Marcus Chen"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Corporate Work Email</label>
                  <input
                    type="email"
                    required
                    value={execEmail}
                    onChange={(e) => setExecEmail(e.target.value)}
                    placeholder="name@enterprise.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={execOrgName}
                      onChange={(e) => setExecOrgName(e.target.value)}
                      placeholder="e.g. Acme Global Health"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Executive Title</label>
                    <input
                      type="text"
                      required
                      value={execTitle}
                      onChange={(e) => setExecTitle(e.target.value)}
                      placeholder="Director of Operations"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={execPassword}
                    onChange={(e) => setExecPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              {/* Sticky Bottom Actions */}
              <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md border-t border-slate-150 dark:border-slate-800 p-4 sm:px-8 flex items-center justify-between gap-3 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setRoleConfirmed(false);
                    setSearchParams({});
                  }}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? 'Registering Executive...' : 'Complete Executive Registration'}
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
