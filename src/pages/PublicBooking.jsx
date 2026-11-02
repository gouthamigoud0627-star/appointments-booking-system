/**
 * Public Booking Page (/b/:businessSlug)
 * Seamless 5-step customer appointment reservation engine.
 * Select service -> Select date -> Pick collision-free slot -> Fill details -> Instant 6-char token confirmation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Star,
  Info,
  ShieldCheck,
  Sparkles,
  Users,
  Award,
  MessageSquare,
  Bell,
  Zap,
  Tag,
} from 'lucide-react';
import { getBusinessBySlug } from '../lib/business.js';
import { generateAvailableSlots, minutesToTime, timeToMinutes } from '../lib/availability.js';
import { getAllBookings, createBooking } from '../lib/bookings.js';
import { getReviewsForBusiness } from '../lib/reviews.js';
import JoinWaitlistModal from '../components/JoinWaitlistModal';
import AiServiceRecommendations from '../components/AiServiceRecommendations';
import { useAuth } from '../context/AuthContext.jsx';
import {
  getStoredOffers,
  calculateDiscountedPrice,
  redeemOffer,
} from '../lib/offers.ts';

export default function PublicBooking() {
  const { businessSlug } = useParams();
  const navigate = useNavigate();
  const { customerUser } = useAuth();
  const [searchParams] = useSearchParams();
  const serviceParam = searchParams.get('service');
  const slotParam = searchParams.get('slot');
  const dateParam = searchParams.get('date');
  const claimToken = searchParams.get('claimToken') || searchParams.get('waitlistToken');

  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);

  // Booking form state
  const [selectedService, setSelectedService] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isAnyStaff, setIsAnyStaff] = useState(true);
  const [staffGenderFilter, setStaffGenderFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientName, setClientName] = useState(customerUser?.name || 'Jahnavi Raja');
  const [clientEmail, setClientEmail] = useState(customerUser?.email || 'jahnaviaraja0909@gmail.com');
  const [clientPhone, setClientPhone] = useState(customerUser?.phone || '+91 98765 43210');
  const [clientNotes, setClientNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Calculate Total Price and Total Duration (Service + Proactive AI Add-ons)
  const addOnsTotalPrice = useMemo(() => {
    return selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  }, [selectedAddOns]);

  const addOnsTotalDuration = useMemo(() => {
    return selectedAddOns.reduce(
      (sum, a) => sum + (Number(a.durationMinutes || a.suggestedAddOnDurationMinutes) || 15),
      0
    );
  }, [selectedAddOns]);

  const offerIdParam = searchParams.get('offerId');
  const appliedOffer = useMemo(() => {
    if (!offerIdParam) return null;
    const offers = getStoredOffers();
    return offers.find((o) => o.id === offerIdParam) || null;
  }, [offerIdParam]);

  const baseServicePrice = selectedService?.price || 0;
  const originalSubtotal = baseServicePrice + addOnsTotalPrice;

  const { discountAmount, finalPayablePrice } = useMemo(() => {
    if (!appliedOffer || !selectedService) {
      return { discountAmount: 0, finalPayablePrice: originalSubtotal };
    }
    const calc = calculateDiscountedPrice(appliedOffer, baseServicePrice);
    return {
      discountAmount: calc.discountAmount,
      finalPayablePrice: Math.max(0, calc.finalPrice + addOnsTotalPrice),
    };
  }, [appliedOffer, selectedService, baseServicePrice, addOnsTotalPrice, originalSubtotal]);

  const totalBookingPrice = finalPayablePrice;

  const totalBookingDuration = useMemo(() => {
    const base = selectedService?.durationMinutes || parseInt(selectedService?.duration, 10) || 45;
    return base + addOnsTotalDuration;
  }, [selectedService, addOnsTotalDuration]);

  // Handle toggling an AI recommended add-on
  const handleToggleAddOn = (service, rec) => {
    setSelectedAddOns((prev) => {
      const exists = prev.some((a) => a.id === rec.serviceId);
      if (exists) {
        return prev.filter((a) => a.id !== rec.serviceId);
      } else {
        return [
          ...prev,
          {
            id: rec.serviceId,
            name: rec.serviceName,
            price: rec.suggestedAddOnPrice || service.price || 25,
            durationMinutes: rec.suggestedAddOnDurationMinutes || service.durationMinutes || 15,
            reason: rec.reason,
            badge: rec.badge,
          },
        ];
      }
    });
  };

  // Handle switching to an AI recommended alternative
  const handleSelectAlternative = (service) => {
    setSelectedService(service);
    setSelectedAddOns([]);
  };

  // Load business & reviews
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const found = await getBusinessBySlug(businessSlug);
        if (!found) {
          setError(`No business found matching "${businessSlug}".`);
        } else {
          setBusiness(found);
          const revs = await getReviewsForBusiness(found.id);
          setReviews(revs || []);
          // Preselect service if matching param or default to first
          if (found.services && found.services.length > 0) {
            const matched = serviceParam
              ? found.services.find(
                  (s) =>
                    s.id === serviceParam ||
                    s.name.toLowerCase() === serviceParam.toLowerCase()
                )
              : null;
            setSelectedService(matched || found.services[0]);
          }

          // Default date to param or today
          if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
            setSelectedDate(dateParam);
          } else {
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setSelectedDate(todayStr);
          }
        }
      } catch (err) {
        console.error('Failed to load business:', err);
        setError('An error occurred while loading this business.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [businessSlug, serviceParam, dateParam]);

  // Compute today's min date for date input
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute available slots whenever business, date, service, or staff changes
  const availableSlots = useMemo(() => {
    if (!business || !selectedDate || !selectedService) return [];
    const allBookings = getAllBookings();
    const durationMins = selectedService.durationMinutes || parseInt(selectedService.duration, 10) || 45;

    return generateAvailableSlots({
      business,
      serviceId: selectedService.id,
      serviceDurationMinutes: durationMins,
      dateStr: selectedDate,
      existingBookings: allBookings,
      selectedStaffId: isAnyStaff ? 'any' : (selectedStaff?.id || 'any'),
      genderPreference: staffGenderFilter === 'all' ? 'no_preference' : staffGenderFilter,
    });
  }, [business, selectedDate, selectedService, selectedStaff, isAnyStaff, staffGenderFilter]);

  // Filter staff for this business
  const businessStaffList = useMemo(() => {
    if (!business || !business.staff) return [];
    let list = business.staff.filter((s) => s.active !== false);

    if (selectedService) {
      const qualified = list.filter((s) => !s.serviceIds || s.serviceIds.includes(selectedService.id));
      if (qualified.length > 0) list = qualified;
    }

    if (staffGenderFilter === 'female') {
      list = list.filter((s) => s.genderPreference === 'female');
    } else if (staffGenderFilter === 'male') {
      list = list.filter((s) => s.genderPreference === 'male');
    }

    return list;
  }, [business, selectedService, staffGenderFilter]);

  // Clear selected slot if it no longer exists in available slots, or preselect from slotParam
  useEffect(() => {
    if (slotParam && availableSlots && availableSlots.length > 0) {
      const matched = availableSlots.find((s) => s.time.toLowerCase() === slotParam.toLowerCase());
      if (matched) {
        setSelectedSlot(matched);
        return;
      }
    }
    if (selectedSlot && !availableSlots.some((s) => s.time === selectedSlot.time)) {
      setSelectedSlot(null);
    }
  }, [availableSlots, selectedSlot, slotParam]);

  // Handle submit reservation
  const handleConfirmAppointment = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!selectedService) {
      setSubmitError('Please select a service.');
      return;
    }
    if (!selectedDate) {
      setSubmitError('Please select an appointment date.');
      return;
    }
    if (!selectedSlot) {
      setSubmitError('Please select a time slot.');
      return;
    }
    if (!clientName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const durationMins = totalBookingDuration;
      const endMins = selectedSlot.startMinutes + durationMins;
      const endTimeStr = minutesToTime(endMins, true);

      const assignedStaff = selectedStaff || selectedSlot.assignedStaff || null;

      const booking = await createBooking({
        businessId: business.id,
        businessName: business.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        addOnServices: selectedAddOns,
        staffId: assignedStaff?.id || 'any',
        staffName: assignedStaff?.name || 'Available Specialist',
        date: selectedDate,
        startTime: selectedSlot.time,
        endTime: endTimeStr,
        duration: durationMins,
        price: totalBookingPrice,
        customerName: clientName.trim(),
        customerEmail: clientEmail.trim(),
        customerPhone: clientPhone.trim(),
        notes: clientNotes.trim(),
        claimToken: claimToken || undefined,
        waitlistId: claimToken || undefined,
        offerApplied: appliedOffer
          ? {
              id: appliedOffer.id,
              title: appliedOffer.title,
              discountAmount,
              couponCode: appliedOffer.couponCode,
            }
          : undefined,
      });

      if (appliedOffer) {
        await redeemOffer({
          offerId: appliedOffer.id,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          originalPrice: selectedService.price || 0,
          customerEmail: clientEmail.trim(),
          customerName: clientName.trim(),
          couponCode: appliedOffer.couponCode,
          bookingToken: booking.token,
        });
      }

      // Redirect immediately to confirmation with 6-char token
      navigate(`/confirmation/${booking.token}`);
    } catch (err) {
      console.error('Booking failed:', err);
      setSubmitError(err.message || 'Failed to complete reservation. Please try another time slot.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium text-slate-500">Loading business schedule & service menu...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">{error || 'Business Not Found'}</h2>
        <p className="text-sm text-slate-500">
          The business practice you are looking for may have updated its public handle or is temporarily unavailable.
        </p>
        <Link
          to="/businesses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse Verified Businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top back navigation */}
      <div>
        <Link
          to="/businesses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Businesses</span>
        </Link>
      </div>

      {/* Business Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-48 sm:h-64 bg-slate-900 relative">
          <img
            src={business.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80'}
            alt={business.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-600 text-white text-xs font-bold mb-2 shadow-sm">
                {business.category}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{business.name}</h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">{business.tagline || business.description}</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-200 shrink-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{business.address}, {business.city}</span>
              </div>
              {business.phone && (
                <div className="hidden md:flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-indigo-400" />
                  <span>{business.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Booking Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Interactive Booking Steps */}
        <div className="lg:col-span-2 space-y-8">
          {/* Claim Token Alert Banner */}
          {claimToken && (
            <div className="p-4.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-950">
                    Standby Opening Reserved!
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your standby token <strong className="font-mono">{claimToken}</strong> unlocked this priority slot. Complete your reservation below to claim it.
                  </p>
                </div>
              </div>
              <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-amber-200/90 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0">
                VIP Claim Active
              </span>
            </div>
          )}

          {/* Step 1: Select Service */}
          <section className="bg-white dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Service</h2>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {business.services?.length || 0} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {(business.services || []).map((srv) => {
                const isSelected = selectedService?.id === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => setSelectedService(srv)}
                    className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600/20'
                        : 'border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-650 hover:bg-slate-50 dark:hover:bg-slate-750/80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{srv.name}</h3>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                          ${srv.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{srv.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-750">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {srv.duration || `${srv.durationMinutes} min`}
                      </span>
                      {isSelected && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Proactive Non-Intrusive AI Recommendations for Selected Service */}
            {selectedService && (
              <div className="pt-2">
                <AiServiceRecommendations
                  selectedService={selectedService}
                  availableServices={business.services || []}
                  customerEmail={clientEmail}
                  customerName={clientName}
                  businessName={business.name}
                  businessCategory={business.category}
                  selectedAddOns={selectedAddOns}
                  onToggleAddOn={handleToggleAddOn}
                  onSelectAlternative={handleSelectAlternative}
                />
              </div>
            )}
          </section>

          {/* Step 2: Choose Specialist (if staff roster exists) */}
          {businessStaffList && businessStaffList.length > 0 && (
            <section className="bg-white dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Choose Specialist</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pick a specific practitioner or choose fastest available.</p>
                  </div>
                </div>

                {/* Gender quick filter */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setStaffGenderFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                      staffGenderFilter === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffGenderFilter('female')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                      staffGenderFilter === 'female' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaffGenderFilter('male')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                      staffGenderFilter === 'male' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Male
                  </button>
                </div>
              </div>

              {/* Any available option */}
              <div
                onClick={() => {
                  setIsAnyStaff(true);
                  setSelectedStaff(null);
                }}
                className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                  isAnyStaff
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40'
                    : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">First Available Specialist</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fastest opening among qualified team members.</p>
                  </div>
                </div>
                {isAnyStaff && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
              </div>

              {/* Specific staff list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {businessStaffList.map((st) => {
                  const isSelected = !isAnyStaff && selectedStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        setIsAnyStaff(false);
                        setSelectedStaff(st);
                      }}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-650 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <img
                        src={st.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(st.name)}`}
                        alt={st.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{st.name}</h4>
                          <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {st.rating || 4.9}★
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">{st.role}</p>
                        {st.qualifications && st.qualifications.length > 0 && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{st.qualifications[0]}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 3: Select Date */}
          <section className="bg-white dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Choose Appointment Date</h2>
              </div>
              {selectedDate && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>

            <div className="pt-2">
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750"
              />
            </div>
          </section>

          {/* Step 3: Select Available Time Slot */}
          <section className="bg-white dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Select Time Slot</h2>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {availableSlots.length} Open Slots
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-indigo-50/70 to-slate-50 dark:from-indigo-950/40 dark:to-slate-800/80 border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <Bell className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Fully Booked on this Date
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    All appointment slots for <strong className="text-indigo-600 dark:text-indigo-400">{selectedService?.name || 'this service'}</strong> on {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} are currently filled.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Join our standby waitlist to be automatically notified via WhatsApp & SMS the instant an opening appears.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setWaitlistModalOpen(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Join Standby Waitlist</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-2">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {slot.formattedTime}
                      </button>
                    );
                  })}
                </div>
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-750">
                  <span className="text-slate-500 dark:text-slate-400">Looking for a different time?</span>
                  <button
                    type="button"
                    onClick={() => setWaitlistModalOpen(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Join Standby Waitlist</span>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Step 4: Client Contact Details */}
          <section className="bg-white dark:bg-slate-850 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Your Contact Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Miller"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Special Notes / Requests
                </label>
                <input
                  type="text"
                  placeholder="Allergies, focus areas, preferences..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-750"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary & Confirmation Box */}
        <div className="lg:sticky lg:top-24 space-y-4">
          <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Appointment Summary
            </h3>

            {/* Service info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Service</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedService ? selectedService.name : 'No service selected'}
              </p>
              {selectedService && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedService.duration || `${selectedService.durationMinutes} min`} · ${selectedService.price}
                </p>
              )}
            </div>

            {/* Date & Time info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Schedule</p>
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>
                  {selectedDate
                    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Select a date'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span>{selectedSlot ? selectedSlot.formattedTime : 'Select a time slot'}</span>
              </div>
            </div>

            {/* Specialist info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Specialist</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedStaff?.name || (isAnyStaff ? 'First Available Specialist' : 'No specialist selected')}
              </p>
              {selectedStaff && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{selectedStaff.role}</p>
              )}
            </div>

            {/* Location info */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{business.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{business.address}, {business.city}</p>
            </div>

            {/* Selected Add-ons list */}
            {selectedAddOns.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Recommended Add-ons ({selectedAddOns.length})</span>
                </p>
                <div className="space-y-1.5">
                  {selectedAddOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          + {addOn.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          +{addOn.durationMinutes || 15} min
                        </span>
                      </div>
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                        +${addOn.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Duration Row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Total Due at Arrival:
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {totalBookingDuration} min total session
                </span>
              </div>
              <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                ${totalBookingPrice}
              </span>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Confirm Button */}
            <button
              type="button"
              onClick={handleConfirmAppointment}
              disabled={submitting || !selectedSlot}
              className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                submitting || !selectedSlot
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:scale-[1.02]'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Reserving Slot...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm & Get Arrival Token</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instant token generation. No customer account needed.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verified Customer Reviews & Community Feedback Section */}
      <section className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Customer Reviews & Ratings
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Genuine feedback from customers with completed appointments.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {business.rating || 4.9}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({reviews.length > 0 ? reviews.length : (business.reviewCount || 1)} verified)
            </span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No reviews yet for this business.</p>
            <p>Customers can submit a review after completing their appointment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.customerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rev.customerName)}`}
                      alt={rev.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900">{rev.customerName}</h4>
                        {rev.verifiedBooking && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Verified Visit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                        {rev.serviceName && <span>• {rev.serviceName}</span>}
                        {rev.staffName && <span>• Specialist: {rev.staffName}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-amber-400 shrink-0">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{rev.comment}"
                </p>

                {/* Business reply if present */}
                {rev.businessReply && (
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-1">
                    <span className="font-extrabold text-indigo-900 dark:text-indigo-300 block">
                      Response from {business.name}:
                    </span>
                    <p className="text-slate-600 dark:text-slate-400">{rev.businessReply.text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Standby Waitlist Modal */}
      {business && (
        <JoinWaitlistModal
          isOpen={waitlistModalOpen}
          onClose={() => setWaitlistModalOpen(false)}
          business={business}
          initialServiceId={selectedService?.id}
          initialDate={selectedDate}
          initialStaffId={selectedStaff?.id || 'any'}
          customerDefault={{
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
          }}
          onSuccess={() => {
            // Keep open so user can review confirmation pass and token
          }}
        />
      )}
    </div>
  );
}
