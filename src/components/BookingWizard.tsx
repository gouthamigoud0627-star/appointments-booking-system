import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  CreditCard, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  ChevronRight, 
  ArrowLeft,
  ShieldCheck, 
  Send, 
  Download, 
  CalendarPlus, 
  ExternalLink,
  MessageSquare,
  Lock,
  Phone,
  Mail,
  Zap,
  Tag,
  Search
} from 'lucide-react';
import { Service, StaffMember, SuggestedSlot, Appointment, SupportedLocale } from '../types';
import { translations } from '../i18n';

interface BookingWizardProps {
  services: Service[];
  staff: StaffMember[];
  locale: SupportedLocale;
  onBookingSuccess: (appointment: Appointment) => void;
  businessName: string;
  autoConfirm: boolean;
  businessAddress?: string;
  businessId?: string;
  initialSelectedTime?: string | null;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  services,
  staff,
  locale,
  onBookingSuccess,
  businessName,
  autoConfirm,
  businessAddress,
  businessId,
  initialSelectedTime,
}) => {
  const t = translations[locale];

  // Wizard Steps: 1: Service -> 2: Specialist & Slot -> 3: Details & Payment -> 4: Success Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('any');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Sync initial slot time if provided from business directory
  useEffect(() => {
    if (initialSelectedTime) {
      setSelectedTime(initialSelectedTime);
    }
  }, [initialSelectedTime]);

  // Client Details
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Physical arrival check-in status
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'google_pay'>('card');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('883');
  const [policyAccepted, setPolicyAccepted] = useState(true);

  // Slot Availability & Smart Alternatives
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean; availableStaff: any[] }[]>([]);
  const [fullyBooked, setFullyBooked] = useState(false);
  
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Submission & Confirmed Object
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // Service Catalog Filter & Search States
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('All');
  const [serviceSearchQuery, setServiceSearchQuery] = useState<string>('');

  const serviceCategories = useMemo(() => {
    const cats = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
    return ['All', ...cats];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCat = serviceCategoryFilter === 'All' || srv.category === serviceCategoryFilter;
      const q = serviceSearchQuery.trim().toLowerCase();
      const matchesQ =
        !q ||
        srv.name.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [services, serviceCategoryFilter, serviceSearchQuery]);

  // Default to first service if available
  useEffect(() => {
    if (services.length > 0 && !selectedService) {
      setSelectedService(services[0]);
    }
  }, [services, selectedService]);

  // Fetch slots whenever selectedDate or selectedService or selectedStaffId changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    let isMounted = true;
    setSlotsLoading(true);
    setSelectedTime(null);

    fetch(`/api/availability?serviceId=${selectedService.id}&date=${selectedDate}&staffId=${selectedStaffId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        setAvailableSlots(data.slots || []);
        setFullyBooked(data.fullyBooked || false);
        setSlotsLoading(false);

        // If fully booked or user requested, fetch smart alternatives automatically
        if (data.fullyBooked) {
          fetchSmartSuggestions(selectedDate, selectedService.id, selectedStaffId);
        } else {
          setSuggestedSlots([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching availability:', err);
        if (isMounted) setSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedService, selectedStaffId]);

  const fetchSmartSuggestions = async (date: string, serviceId: string, staffId: string) => {
    setSuggestLoading(true);
    try {
      const res = await fetch('/api/suggest-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, serviceId, staffId }),
      });
      const data = await res.json();
      setSuggestedSlots(data.suggestions || []);
    } catch (e) {
      console.error('Failed to load smart suggestions:', e);
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleSelectSuggestedSlot = (slot: SuggestedSlot) => {
    setSelectedDate(slot.date);
    setSelectedTime(slot.startTime);
    if (slot.staffId) {
      setSelectedStaffId(slot.staffId);
    }
    // Advance to next step smoothly
    setStep(3);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedTime || !clientName || !clientEmail) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceId: selectedService.id,
        staffId: selectedStaffId,
        clientName,
        clientEmail,
        clientPhone: clientPhone || '+1 (555) 234-5678',
        clientNotes,
        date: selectedDate,
        startTime: selectedTime,
        paymentMethod,
        businessId: businessId || undefined,
        businessName: businessName,
        businessAddress: businessAddress,
      };

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Booking submission failed');
      const newApt: Appointment = await res.json();

      setConfirmedBooking(newApt);
      onBookingSuccess(newApt);
      setStep(4);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhysicalCheckIn = async (tokenOrCode: string) => {
    if (!tokenOrCode || checkingIn) return;
    setCheckingIn(true);
    try {
      const res = await fetch('/api/appointments/check-in-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tokenOrCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCheckedIn(true);
        if (confirmedBooking) {
          const updated = { ...confirmedBooking, physicallyCheckedIn: true };
          setConfirmedBooking(updated);
          onBookingSuccess(updated);
        }
      }
    } catch (err) {
      console.error('Physical arrival check-in error:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  const getGoogleCalendarUrl = (apt: Appointment) => {
    const title = encodeURIComponent(`${apt.serviceName} - ${businessName}`);
    const dateClean = apt.date.replace(/-/g, '');
    const [sh, sm] = apt.startTime.split(':');
    const [eh, em] = apt.endTime.split(':');
    const dates = `${dateClean}T${sh}${sm}00/${dateClean}T${eh}${em}00`;
    const details = encodeURIComponent(
      `Appointment Code: ${apt.confirmationCode}\nSpecialist: ${apt.staffName}\nStatus: ${apt.status}\nCustomer: ${apt.clientName}`
    );
    const location = encodeURIComponent('Apex Precision Care, 742 Montgomery St, San Francisco, CA');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Wizard Header Progress Tracker */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              {businessName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select your personalized service and secure your appointment in under 60 seconds.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>256-Bit Encrypted Booking</span>
          </div>
        </div>

        {/* Progress Bar steps */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { num: 1, label: t.services },
            { num: 2, label: t.selectDateTime },
            { num: 3, label: t.payment },
            { num: 4, label: t.confirmation },
          ].map((s) => (
            <div key={s.num} className="flex flex-col">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s.num ? 'bg-indigo-600' : 'bg-slate-200'
                }`}
              />
              <span className={`text-[11px] font-medium mt-1.5 hidden sm:block ${
                step >= s.num ? 'text-indigo-700 font-bold' : 'text-slate-400'
              }`}>
                {s.num}. {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: SERVICE SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{t.selectService}</span>
                <span className="text-xs font-normal text-slate-500">
                  ({filteredServices.length} of {services.length} available)
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose an appointment service from our comprehensive catalog or search below.
              </p>
            </div>

            {/* Quick Service Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-services-input"
                type="text"
                placeholder="Search services..."
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              {serviceSearchQuery && (
                <button
                  onClick={() => setServiceSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {serviceCategories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {serviceCategories.map((cat) => {
                const isCatActive = serviceCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    id={`filter-cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => setServiceCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isCatActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          )}

          {filteredServices.length === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No services found matching your filter</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for different terms or reset your filters.</p>
              <button
                onClick={() => {
                  setServiceCategoryFilter('All');
                  setServiceSearchQuery('');
                }}
                className="mt-3 px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-slate-50 shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredServices.map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <div
                    key={srv.id}
                    id={`service-card-${srv.id}`}
                    onClick={() => setSelectedService(srv)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-md shadow-indigo-100 ring-1 ring-indigo-600/20'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {srv.category}
                        </span>
                        <div className="text-right">
                          <span className="text-xl font-extrabold text-slate-900 font-display">
                            ${srv.price}
                          </span>
                          <span className="text-xs text-slate-400 block font-normal">
                            ${srv.depositRequired} deposit
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {srv.durationMinutes} minutes
                      </span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        Instant Confirmation
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              id="btn-step-1-continue"
              disabled={!selectedService}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span>Continue to Schedule</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SPECIALIST, CALENDAR & SMART DATE SUGGESTIONS */}
      {step === 2 && selectedService && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Back & Title */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Services</span>
            </button>
            <div className="text-right">
              <span className="text-xs text-slate-500">Selected Service:</span>
              <span className="ml-1.5 text-xs font-bold text-indigo-700">
                {selectedService.name} ({selectedService.durationMinutes}m • ${selectedService.price})
              </span>
            </div>
          </div>

          {/* Specialist Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {t.selectStaff}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setSelectedStaffId('any')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  selectedStaffId === 'any'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30 font-bold'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Any Specialist</div>
                  <div className="text-[10px] text-slate-500">Fastest available slot</div>
                </div>
              </button>

              {staff
                .filter((st) => st.serviceIds.includes(selectedService.id))
                .map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStaffId(st.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      selectedStaffId === st.id
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600/30 font-bold'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={st.avatar}
                      alt={st.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover shrink-0"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 truncate">{st.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{st.role}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Date Picker & Slot Finder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <span>Choose Session Date</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select a preferred day to view available session slots.
                </p>
              </div>

              {/* Native styled date selector */}
              <div className="flex items-center gap-2">
                <input
                  id="booking-date-input"
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => fetchSmartSuggestions(selectedDate, selectedService.id, selectedStaffId)}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-2 rounded-xl transition-colors"
                  title="Scan next 7 days for smart slot recommendations"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Suggest Dates</span>
                </button>
              </div>
            </div>

            {/* Slot grid */}
            {slotsLoading ? (
              <div className="py-10 text-center">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">Checking live schedule availability...</p>
              </div>
            ) : fullyBooked ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{t.noSlotsAvailable}</div>
                  <p className="mt-0.5 text-amber-700">
                    All direct slots on {selectedDate} are currently reserved. Check our smart suggested alternative dates below!
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  {t.availableSlots} for {selectedDate}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : slot.available
                            ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through'
                        }`}
                      >
                        <span>{slot.time}</span>
                        {slot.available && (
                          <span className={`text-[9px] font-normal mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            Open
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SMART SUGGESTED ALTERNATIVE DATES SECTION */}
            {(suggestedSlots.length > 0 || suggestLoading) && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t.suggestedAlternatives}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  {t.smartDateSuggestionDesc}
                </p>

                {suggestLoading ? (
                  <div className="py-4 text-xs text-slate-500 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing calendars and generating optimal alternative slots...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {suggestedSlots.map((s, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 to-slate-50 flex items-start justify-between gap-3 hover:border-indigo-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-indigo-900 bg-indigo-100/70 px-2 py-0.5 rounded">
                              {s.date} at {s.startTime}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {s.confidenceScore}% Match
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 font-medium leading-snug">
                            {s.reason}
                          </p>
                          <div className="text-[11px] text-slate-400 mt-1">
                            With: <span className="text-slate-700 font-semibold">{s.staffName}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectSuggestedSlot(s)}
                          className="shrink-0 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-100 transition-all hover:scale-105"
                        >
                          {t.acceptSlot}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Back
            </button>
            <button
              id="btn-step-2-continue"
              disabled={!selectedTime}
              onClick={() => setStep(3)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <span>Continue to Payment</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DETAILS & SECURE PAYMENT */}
      {step === 3 && selectedService && selectedTime && (
        <form onSubmit={handleSubmitBooking} className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Back & Summary Banner */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Scheduling</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Scheduled: <strong className="text-indigo-700">{selectedDate} @ {selectedTime}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Contact Info Form */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-indigo-600" />
                <span>{t.clientInfo}</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.fullName} *
                </label>
                <input
                  id="client-name-input"
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.emailAddress} *
                  </label>
                  <input
                    id="client-email-input"
                    type="email"
                    required
                    placeholder="jordan@example.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.phoneNumber}
                  </label>
                  <input
                    id="client-phone-input"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Session Notes or Requests (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder={t.notesPlaceholder}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Secure Payment details */}
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 flex items-center justify-between mb-3">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secure Deposit Authorization</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Stripe & Wallet Compliant</span>
                </h4>

                {/* Method selector */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { id: 'card', label: 'Credit Card' },
                    { id: 'apple_pay', label: 'Apple Pay' },
                    { id: 'google_pay', label: 'Google Pay' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        paymentMethod === m.id
                          ? 'bg-indigo-50 border-indigo-600 text-indigo-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'card' && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Expires</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">CVC</label>
                        <input
                          type="text"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Booking & Pricing Breakdown */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg space-y-4">
                <h3 className="text-sm font-bold tracking-wide uppercase text-indigo-300">
                  {t.bookingSummary}
                </h3>

                <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service:</span>
                    <span className="font-semibold text-right">{selectedService.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duration:</span>
                    <span className="font-semibold">{selectedService.durationMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled:</span>
                    <span className="font-semibold">{selectedDate} @ {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Specialist:</span>
                    <span className="font-semibold">
                      {staff.find((s) => s.id === selectedStaffId)?.name || 'Assigned Specialist'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-b border-slate-800 pb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Service Fee:</span>
                    <span className="font-bold">${selectedService.price}.00</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Due Now (Deposit):</span>
                    <span>${selectedService.depositRequired}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Balance on Arrival:</span>
                    <span>${selectedService.price - selectedService.depositRequired}.00</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-200">Cancellation Policy: </span>
                  {t.depositNotice}
                </div>

                <label className="flex items-start gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={(e) => setPolicyAccepted(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <span>I agree to the deposit terms and automated session reminders.</span>
                </label>

                <button
                  id="btn-submit-booking"
                  type="submit"
                  disabled={submitting || !policyAccepted || !clientName || !clientEmail}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Securing Booking...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{t.payDepositNow} (${selectedService.depositRequired})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status workflow note */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  {autoConfirm
                    ? 'Instant booking enabled: Your appointment will be confirmed right away.'
                    : 'Your booking request will be dispatched to the owner for instant review.'}
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* STEP 4: SUCCESS CONFIRMATION & CALENDAR SYNC */}
      {step === 4 && confirmedBooking && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
              {confirmedBooking.status === 'confirmed' ? t.statusConfirmed : t.statusPending}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3 font-display">
              Booking Confirmed!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
              Your appointment is registered with {confirmedBooking.businessName || businessName}.
            </p>
          </div>

          {/* Physical Arrival Token Pass Card (Requirement: Code or token number for appointment upon physical appearance) */}
          <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-5 rounded-3xl shadow-xl border border-indigo-500/30 text-left relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎫</span>
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    Physical Arrival Pass
                  </div>
                  <div className="text-xs font-bold text-white">
                    {confirmedBooking.businessName || businessName}
                  </div>
                </div>
              </div>
              <span
                id="booking-arrival-status-badge"
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  confirmedBooking.physicallyCheckedIn || isCheckedIn
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                }`}
              >
                {confirmedBooking.physicallyCheckedIn || isCheckedIn ? '✓ Physically Arrived' : 'Active Pass'}
              </span>
            </div>

            {/* Token display box */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-indigo-500/30 text-center mb-3">
              <div className="text-[11px] font-semibold text-indigo-200 mb-1">
                Your Physical Check-In Token:
              </div>
              <div
                id="booking-confirmation-token"
                className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-300 drop-shadow-sm py-1"
              >
                {confirmedBooking.tokenNumber || 'TK-8921'}
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                Show this token number at the front desk when you physically arrive.
              </div>
            </div>

            {/* Token metadata & simulated physical check-in button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 text-[11px] text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Confirmation Code:</span>
                <span className="font-mono font-bold text-white">{confirmedBooking.confirmationCode}</span>
              </div>
              <button
                type="button"
                id="btn-simulate-physical-checkin"
                disabled={checkingIn || isCheckedIn || confirmedBooking.physicallyCheckedIn}
                onClick={() => handlePhysicalCheckIn(confirmedBooking.tokenNumber || confirmedBooking.confirmationCode)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ${
                  isCheckedIn || confirmedBooking.physicallyCheckedIn
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95'
                }`}
              >
                {checkingIn ? (
                  <span>Verifying...</span>
                ) : isCheckedIn || confirmedBooking.physicallyCheckedIn ? (
                  <span>✓ Checked In at Venue</span>
                ) : (
                  <span>Test Reception Check-In</span>
                )}
              </button>
            </div>
          </div>

          {/* Appointment Ticket Details */}
          <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Service:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.serviceName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-bold text-indigo-700">
                {confirmedBooking.date} • {confirmedBooking.startTime} - {confirmedBooking.endTime}
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Specialist:</span>
              <span className="font-bold text-slate-900">{confirmedBooking.staffName}</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Deposit Authorized:</span>
              <span className="font-bold text-emerald-700">${confirmedBooking.payment.depositPaid}.00 (Card ending in 4242)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Notifications Sent:</span>
              <span className="font-semibold text-slate-700">Email & SMS Confirmed</span>
            </div>
          </div>

          {/* Calendar Sync Buttons */}
          <div className="pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              {t.calendarSync}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={getGoogleCalendarUrl(confirmedBooking)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:scale-105"
              >
                <CalendarPlus className="w-4 h-4 text-blue-600" />
                <span>{t.addToGoogleCalendar}</span>
              </a>

              <a
                href="/api/calendar.ics"
                download="schedula_appointment.ics"
                className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm transition-all hover:scale-105"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>{t.downloadIcs}</span>
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                setStep(1);
                setConfirmedBooking(null);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-4 py-2"
            >
              Book Another Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
