/**
 * GuidedBooking.tsx
 * Ultra-simple, conversational, step-by-step booking flow:
 * Step 1: What do you need? (Category)
 * Step 2: Choose a place near you (Business)
 * Step 3: Choose a department (if business supports departments)
 * Step 4: What would you like? (Service)
 * Step 5: Choose a specialist (Specific staff / Any available / Gender filter)
 * Step 6: Choose a time (Today / Tomorrow / Date & Slots)
 * Step 7: Review & Confirm
 * Step 8: Confirmation Screen with QR & Arrival Pass
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  Scissors,
  Car,
  Dog,
  Dumbbell,
  Home,
  GraduationCap,
  Sparkle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Star,
  MapPin,
  CheckCircle2,
  Calendar as CalendarIcon,
  Phone,
  Mail,
  User,
  AlertCircle,
  Building2,
  ShieldCheck,
  ChevronRight,
  Users,
  Award,
  Sparkles,
  Zap,
  Tag,
  Percent,
} from 'lucide-react';
import { getBusinesses, SEEDED_BUSINESSES } from '../lib/business.js';
import { generateAvailableSlots, minutesToTime } from '../lib/availability.js';
import { getAllBookings, createBooking } from '../lib/bookings.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import AiServiceRecommendations from '../components/AiServiceRecommendations';
import {
  getStoredOffers,
  calculateDiscountedPrice,
  redeemOffer,
  BusinessOffer,
} from '../lib/offers.ts';

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  LucideIcon: React.ElementType;
  matchTags: string[];
}

const CATEGORIES: CategoryOption[] = [
  { id: 'Health', name: 'Health', icon: '🏥', LucideIcon: Heart, matchTags: ['Clinic', 'Dental', 'Health'] },
  { id: 'Beauty', name: 'Beauty', icon: '💇', LucideIcon: Scissors, matchTags: ['Salon', 'Spa', 'Tattoo', 'Beauty'] },
  { id: 'Car Care', name: 'Car Care', icon: '🚗', LucideIcon: Car, matchTags: ['Auto Care', 'Car Care', 'Car Wash'] },
  { id: 'Pet Care', name: 'Pet Care', icon: '🐾', LucideIcon: Dog, matchTags: ['Veterinary', 'Pet Care', 'Pets', 'Grooming'] },
  { id: 'Fitness', name: 'Fitness', icon: '🏋', LucideIcon: Dumbbell, matchTags: ['Fitness', 'Pilates', 'Gym', 'Yoga'] },
  { id: 'Home Services', name: 'Home Services', icon: '🏠', LucideIcon: Home, matchTags: ['Home Services', 'Cleaning', 'Repair'] },
  { id: 'Classes', name: 'Classes', icon: '📚', LucideIcon: GraduationCap, matchTags: ['Classes', 'Advisory', 'Photography', 'Education'] },
  { id: 'Other', name: 'Other', icon: '✨', LucideIcon: Sparkle, matchTags: ['Other', 'All'] },
];

export default function GuidedBooking() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { customerUser, currentUser } = useAuth();
  const { t } = useLanguage();

  // Booking selections
  const initialCategoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategoryParam || null);
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [staffGenderFilter, setStaffGenderFilter] = useState<'all' | 'female' | 'male'>('all');
  const [isAnyStaffSelected, setIsAnyStaffSelected] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateChoice, setDateChoice] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);

  // Customer contact details
  const [customerName, setCustomerName] = useState(customerUser?.name || currentUser?.name || 'Jahnavi Raja');
  const [customerPhone, setCustomerPhone] = useState(customerUser?.phone || currentUser?.phone || '+1 (555) 234-5678');
  const [customerEmail, setCustomerEmail] = useState(customerUser?.email || currentUser?.email || 'jahnaviaraja0909@gmail.com');
  const [customerNotes, setCustomerNotes] = useState('');

  // Total Calculations (Service + Proactive AI Add-ons)
  const addOnsTotalPrice = useMemo(() => {
    return selectedAddOns.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  }, [selectedAddOns]);

  const addOnsTotalDuration = useMemo(() => {
    return selectedAddOns.reduce(
      (sum, a) => sum + (Number(a.durationMinutes || a.suggestedAddOnDurationMinutes) || 15),
      0
    );
  }, [selectedAddOns]);

  // Offer integration
  const initialOfferIdParam = searchParams.get('offerId');
  const [appliedOffer, setAppliedOffer] = useState<BusinessOffer | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);

  const baseServicePrice = selectedService?.price || 0;
  const originalSubtotal = baseServicePrice + addOnsTotalPrice;

  // Calculate discount securely based on real offer rules
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
  const handleToggleAddOn = (service: any, rec: any) => {
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
  const handleSelectAlternative = (service: any) => {
    setSelectedService(service);
    setSelectedAddOns([]);
  };

  // Status & Confirmation
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Today & Tomorrow date strings
  const todayDateStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const tomorrowDateStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // Initialize selected date
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(todayDateStr);
    }
  }, [todayDateStr, selectedDate]);

  // Load businesses
  useEffect(() => {
    async function load() {
      setLoadingBusinesses(true);
      try {
        const list = await getBusinesses();
        setAllBusinesses(list.length > 0 ? list : SEEDED_BUSINESSES);
      } catch (err) {
        setAllBusinesses(SEEDED_BUSINESSES);
      } finally {
        setLoadingBusinesses(false);
      }
    }
    load();
  }, []);

  // Sync category param
  useEffect(() => {
    if (initialCategoryParam && !selectedCategory) {
      setSelectedCategory(initialCategoryParam);
    }
  }, [initialCategoryParam, selectedCategory]);

  // Sync and validate applied offer from query param
  useEffect(() => {
    if (initialOfferIdParam && allBusinesses.length > 0) {
      const offers = getStoredOffers();
      const found = offers.find((o) => o.id === initialOfferIdParam);
      if (found) {
        setAppliedOffer(found);
        const matchingBiz = allBusinesses.find((b) => b.id === found.businessId);
        if (matchingBiz) {
          setSelectedBusiness(matchingBiz);
          if (matchingBiz.category) {
            setSelectedCategory(matchingBiz.category);
          }
          // If offer is tied to specific service, auto-select it
          if (found.applicableServices && found.applicableServices.length > 0 && !found.applicableServices.includes('all')) {
            const srv = (matchingBiz.services || []).find((s: any) => found.applicableServices.includes(s.id));
            if (srv) {
              setSelectedService(srv);
            }
          }
        }
      }
    }
  }, [initialOfferIdParam, allBusinesses]);


  // Filter businesses matching selected category
  const filteredBusinesses = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'Other' || selectedCategory === 'All') {
      return allBusinesses;
    }
    const catObj = CATEGORIES.find((c) => c.id.toLowerCase() === selectedCategory.toLowerCase());
    if (!catObj) return allBusinesses;

    return allBusinesses.filter((b) => {
      const bCat = (b.category || '').toLowerCase();
      return catObj.matchTags.some((tag) => bCat.includes(tag.toLowerCase()));
    });
  }, [allBusinesses, selectedCategory]);

  // Departments for selected business
  const businessDepartments = useMemo(() => {
    return (selectedBusiness && selectedBusiness.departments && selectedBusiness.departments.length > 0)
      ? selectedBusiness.departments
      : [];
  }, [selectedBusiness]);

  // Services for selected business & department
  const filteredServices = useMemo(() => {
    if (!selectedBusiness || !selectedBusiness.services) return [];
    if (!selectedDepartment) return selectedBusiness.services;
    return selectedBusiness.services.filter(
      (s: any) => !s.departmentId || s.departmentId === selectedDepartment.id
    );
  }, [selectedBusiness, selectedDepartment]);

  // Staff roster for selected business
  const businessStaffList = useMemo(() => {
    if (!selectedBusiness || !selectedBusiness.staff) return [];
    let list = selectedBusiness.staff.filter((s: any) => s.active !== false);

    // Filter by department if applicable
    if (selectedDepartment) {
      const deptFiltered = list.filter((s: any) => !s.departmentId || s.departmentId === selectedDepartment.id);
      if (deptFiltered.length > 0) list = deptFiltered;
    }

    // Filter by service qualification if selected
    if (selectedService) {
      const qualified = list.filter((s: any) => !s.serviceIds || s.serviceIds.includes(selectedService.id));
      if (qualified.length > 0) list = qualified;
    }

    // Gender filter
    if (staffGenderFilter === 'female') {
      list = list.filter((s: any) => s.genderPreference === 'female');
    } else if (staffGenderFilter === 'male') {
      list = list.filter((s: any) => s.genderPreference === 'male');
    }

    return list;
  }, [selectedBusiness, selectedDepartment, selectedService, staffGenderFilter]);

  // Available slots for selected business + date + service + staff
  const availableSlots = useMemo(() => {
    if (!selectedBusiness || !selectedDate || !selectedService) return [];
    const allBookings = getAllBookings();
    const duration = selectedService.durationMinutes || parseInt(selectedService.duration, 10) || 30;

    return generateAvailableSlots({
      business: selectedBusiness,
      serviceId: selectedService.id,
      serviceDurationMinutes: duration,
      dateStr: selectedDate,
      existingBookings: allBookings,
      selectedStaffId: isAnyStaffSelected ? 'any' : (selectedStaff?.id || 'any'),
      genderPreference: staffGenderFilter === 'all' ? 'no_preference' : staffGenderFilter,
    });
  }, [selectedBusiness, selectedDate, selectedService, selectedStaff, isAnyStaffSelected, staffGenderFilter]);

  // Determine current active step in the conversational flow
  const currentStep = useMemo(() => {
    if (confirmedBooking) return 'confirmed';
    if (!selectedCategory) return 'category';
    if (!selectedBusiness) return 'place';
    // If business has departments and none selected
    if (businessDepartments.length > 1 && !selectedDepartment) return 'department';
    if (!selectedService) return 'service';
    // Staff selection step: if business has staff and user hasn't chosen specific or 'any'
    if (selectedBusiness.staff && selectedBusiness.staff.length > 0 && selectedStaff === null && !isAnyStaffSelected) {
      return 'staff';
    }
    if (!selectedSlot) return 'time';
    return 'confirm';
  }, [
    confirmedBooking,
    selectedCategory,
    selectedBusiness,
    businessDepartments,
    selectedDepartment,
    selectedService,
    selectedStaff,
    isAnyStaffSelected,
    selectedSlot,
  ]);

  // Handle date preset change
  const handleSetDateChoice = (choice: 'today' | 'tomorrow' | 'custom', customVal?: string) => {
    setDateChoice(choice);
    setSelectedSlot(null);
    if (choice === 'today') {
      setSelectedDate(todayDateStr);
    } else if (choice === 'tomorrow') {
      setSelectedDate(tomorrowDateStr);
    } else if (customVal) {
      setSelectedDate(customVal);
    }
  };

  // Submit appointment booking
  const handleConfirmAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBusiness || !selectedService || !selectedSlot) {
      setErrorMessage('Please make sure you have chosen a service and time slot.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!customerEmail.trim()) {
      setErrorMessage('Please enter your email so we can send your appointment details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const duration = totalBookingDuration;
      const endMins = selectedSlot.startMinutes + duration;
      const endTimeStr = minutesToTime(endMins, true);

      // Determine staff assignment: if specific selected, use it; otherwise use slot's assignedStaff or 'any'
      const assignedStaff = selectedStaff || selectedSlot.assignedStaff || null;

      const booking = await createBooking({
        businessId: selectedBusiness.id,
        businessName: selectedBusiness.name,
        departmentId: selectedDepartment?.id,
        departmentName: selectedDepartment?.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        addOnServices: selectedAddOns,
        staffId: assignedStaff?.id || 'any',
        staffName: assignedStaff?.name || 'Available Specialist',
        date: selectedDate,
        startTime: selectedSlot.time,
        endTime: endTimeStr,
        duration,
        price: totalBookingPrice,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        notes: customerNotes.trim(),
        offerApplied: appliedOffer
          ? {
              id: appliedOffer.id,
              title: appliedOffer.title,
              discountAmount,
              couponCode: appliedOffer.couponCode,
            }
          : undefined,
      });

      // Record backend offer redemption and increment redemption count
      if (appliedOffer && selectedService) {
        await redeemOffer({
          offerId: appliedOffer.id,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          originalPrice: selectedService.price || 0,
          customerEmail: customerEmail.trim(),
          customerName: customerName.trim(),
          couponCode: appliedOffer.couponCode,
          bookingToken: booking.token,
        });
      }

      setConfirmedBooking(booking);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sorry, this slot was just booked. Please choose another time.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date formatting helper
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Visual Step Progress Breadcrumbs */}
      {currentStep !== 'confirmed' && (
        <div className="mb-6 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs max-w-xl mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className={selectedCategory ? 'text-indigo-600 font-extrabold' : 'text-slate-900'}>
              1. Category
            </span>
            <span>→</span>
            <span className={selectedBusiness ? 'text-indigo-600 font-extrabold' : (selectedCategory ? 'text-slate-900' : '')}>
              2. Place
            </span>
            <span>→</span>
            <span className={selectedService ? 'text-indigo-600 font-extrabold' : (selectedBusiness ? 'text-slate-900' : '')}>
              3. Service
            </span>
            <span>→</span>
            <span className={selectedSlot ? 'text-indigo-600 font-extrabold' : (selectedService ? 'text-slate-900' : '')}>
              4. Time
            </span>
            <span>→</span>
            <span className={currentStep === 'confirm' ? 'text-indigo-600 font-extrabold' : ''}>
              5. Confirm
            </span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 1: CATEGORY SELECTION ("What do you need?")          */}
      {/* ========================================================= */}
      {currentStep === 'category' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center sm:text-left space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What do you need?
            </h1>
            <p className="text-sm text-slate-600">
              Select a service category to see places near you.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all text-left flex flex-col justify-between min-h-[110px] group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <span className="text-3xl mb-3 block transform group-hover:scale-110 transition-transform">
                  {cat.icon}
                </span>
                <span className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 2: BUSINESS SELECTION ("Choose a place near you")    */}
      {/* ========================================================= */}
      {currentStep === 'place' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedBusiness(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to categories</span>
            </button>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Category: {selectedCategory}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose a place near you
            </h1>
            <p className="text-sm text-slate-600">
              Showing verified local businesses offering {selectedCategory} services.
            </p>
          </div>

          {loadingBusinesses ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
              Finding places near you...
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <p className="text-sm font-bold text-slate-700">No businesses found in this category.</p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Browse all categories
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-indigo-600 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {biz.name}
                      </h3>
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-black shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{biz.rating || 4.9}</span>
                        {biz.reviewCount && <span className="text-slate-400 font-normal">({biz.reviewCount})</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.address || `${biz.city || 'San Francisco'}, CA`}</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {biz.description || biz.tagline}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Open • {biz.closingTime ? `until ${biz.closingTime}` : 'Open today'}
                    </span>

                    <button
                      onClick={() => {
                        setSelectedBusiness(biz);
                        setSelectedDepartment(null);
                        setSelectedService(null);
                        setSelectedStaff(null);
                        setIsAnyStaffSelected(true);
                        setSelectedSlot(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>View Services</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 3: DEPARTMENT SELECTION (Optional if > 1)            */}
      {/* ========================================================= */}
      {currentStep === 'department' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedDepartment(null);
                setSelectedBusiness(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to places</span>
            </button>
            <span className="text-xs font-extrabold text-slate-700">
              {selectedBusiness?.name}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose a Department
            </h1>
            <p className="text-sm text-slate-600">
              {selectedBusiness?.name} organizes care by specialized team.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businessDepartments.map((dept: any) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept)}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-600 hover:shadow-md transition-all text-left space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600">
                    {dept.name}
                  </h3>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
                {dept.description && (
                  <p className="text-xs text-slate-500">{dept.description}</p>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 4: SERVICE SELECTION ("What would you like?")        */}
      {/* ========================================================= */}
      {currentStep === 'service' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (businessDepartments.length > 1) {
                  setSelectedDepartment(null);
                } else {
                  setSelectedBusiness(null);
                }
                setSelectedService(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
              {selectedBusiness?.name}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              What would you like?
            </h1>
            <p className="text-sm text-slate-600">
              Choose a service offered by <strong>{selectedBusiness?.name}</strong>.
            </p>
          </div>

          <div className="space-y-3">
            {filteredServices.map((srv: any) => (
              <div
                key={srv.id || srv.name}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-600 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {srv.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {srv.duration || `${srv.durationMinutes || 45} min`}
                    </span>
                    <span>•</span>
                    <span className="text-slate-900 font-extrabold text-sm">
                      ${srv.price}
                    </span>
                  </div>
                  {srv.description && (
                    <p className="text-xs text-slate-500 pt-0.5 line-clamp-2">
                      {srv.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedService(srv);
                    setSelectedSlot(null);
                  }}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors shrink-0"
                >
                  Choose
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 5: SPECIALIST / STAFF SELECTION                      */}
      {/* ========================================================= */}
      {currentStep === 'staff' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setSelectedService(null);
                setSelectedStaff(null);
                setIsAnyStaffSelected(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to services</span>
            </button>
            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {selectedService?.name}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose your specialist
            </h1>
            <p className="text-sm text-slate-600">
              Select a preferred provider or choose first available for faster booking.
            </p>
          </div>

          {/* Gender Preference / Staff Filter Tabs */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => setStaffGenderFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                staffGenderFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Specialists
            </button>
            <button
              onClick={() => setStaffGenderFilter('female')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                staffGenderFilter === 'female'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Female Specialists
            </button>
            <button
              onClick={() => setStaffGenderFilter('male')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                staffGenderFilter === 'male'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Male Specialists
            </button>
          </div>

          {/* Any Available Specialist Card */}
          <div
            onClick={() => {
              setIsAnyStaffSelected(true);
              setSelectedStaff(null);
            }}
            className="p-5 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 rounded-2xl border-2 border-indigo-200 hover:border-indigo-600 cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  First Available Specialist
                </h3>
                <p className="text-xs text-slate-500">
                  Automatically assigns the fastest opening among qualified team members.
                </p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAnyStaffSelected(true);
                setSelectedStaff(null);
              }}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs"
            >
              Select
            </button>
          </div>

          {/* Specialist Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businessStaffList.map((st: any) => (
              <div
                key={st.id}
                className="p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-600 transition-all flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={st.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(st.name)}`}
                      alt={st.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-base text-slate-900">{st.name}</h4>
                        {st.genderPreference && st.genderPreference !== 'unspecified' && (
                          <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {st.genderPreference}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-indigo-600">{st.role}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600 pt-0.5">
                        <span className="flex items-center gap-1 font-bold text-amber-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {st.rating || 4.9}★
                        </span>
                        {st.experienceYears && (
                          <span>• {st.experienceYears} yrs experience</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {st.qualifications && st.qualifications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {st.qualifications.map((q: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  )}

                  {st.bio && (
                    <p className="text-xs text-slate-500 line-clamp-2">{st.bio}</p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSelectedStaff(st);
                    setIsAnyStaffSelected(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition-colors"
                >
                  Select {st.name}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 6: DATE AND TIME ("Choose a time")                   */}
      {/* ========================================================= */}
      {currentStep === 'time' && (
        <section className="space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                if (selectedBusiness.staff && selectedBusiness.staff.length > 0) {
                  setSelectedStaff(null);
                  setIsAnyStaffSelected(false);
                } else {
                  setSelectedService(null);
                }
                setSelectedSlot(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="bg-slate-100 px-3 py-1 rounded-full">{selectedService?.name}</span>
              {selectedStaff && (
                <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                  with {selectedStaff.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Choose a time
            </h1>
            <p className="text-sm text-slate-600">
              Pick a date to view real-time open slots.
            </p>
          </div>

          {/* Quick Date Pills: Today / Tomorrow / Other */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={() => handleSetDateChoice('today')}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                dateChoice === 'today'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-extrabold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold'
              }`}
            >
              <span className="block text-sm sm:text-base">Today</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {formatDateDisplay(todayDateStr).split(',')[0]}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSetDateChoice('tomorrow')}
              className={`p-3.5 rounded-2xl border-2 text-center transition-all ${
                dateChoice === 'tomorrow'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-extrabold shadow-xs'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold'
              }`}
            >
              <span className="block text-sm sm:text-base">Tomorrow</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {formatDateDisplay(tomorrowDateStr).split(',')[0]}
              </span>
            </button>

            <div
              className={`relative p-2.5 rounded-2xl border-2 transition-all flex items-center justify-center ${
                dateChoice === 'custom'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="date"
                min={todayDateStr}
                value={selectedDate}
                onChange={(e) => handleSetDateChoice('custom', e.target.value)}
                className="w-full text-xs font-bold text-center bg-transparent cursor-pointer focus:outline-none"
              />
            </div>
          </div>

          {/* Slots Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900">
                Available slots for {formatDateDisplay(selectedDate)}
              </h3>
              <span className="text-xs font-bold text-emerald-700">
                {availableSlots.length} openings
              </span>
            </div>

            {availableSlots.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
                <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No open slots on this date.</p>
                <p className="text-xs text-slate-500">
                  Please pick another date or select "First Available Specialist".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {availableSlots.map((slot: any) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className="p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/30 transition-all font-extrabold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {slot.formattedTime}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 7: REVIEW & CONFIRM                                  */}
      {/* ========================================================= */}
      {currentStep === 'confirm' && (
        <section className="space-y-6 animate-in fade-in duration-200 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedSlot(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change time</span>
            </button>
            <span className="text-xs font-bold text-slate-400">Step 5 of 5</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Confirm your appointment
            </h1>
            <p className="text-sm text-slate-600">
              Please review your details and confirm your reservation.
            </p>
          </div>

          {/* Appointment Summary Box */}
          <div className="bg-white rounded-2xl border-2 border-indigo-100 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {selectedBusiness?.name}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedBusiness?.address || 'San Francisco, CA'}
                </p>
              </div>
              <div className="text-right">
                {appliedOffer && discountAmount > 0 ? (
                  <div>
                    <span className="text-xs line-through text-slate-400 block">
                      ${originalSubtotal}
                    </span>
                    <span className="text-xl font-black text-rose-600">
                      ${totalBookingPrice}
                    </span>
                    <span className="block text-[10px] font-bold text-rose-600">
                      Saved ${discountAmount}
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">
                      ${totalBookingPrice}
                    </span>
                    <span className="block text-[11px] text-slate-400">Total Due ({totalBookingDuration} min)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Applied Offer Banner */}
            {appliedOffer && (
              <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-900 block">{appliedOffer.title}</span>
                    <span className="text-[10px] text-rose-700">
                      Promo discount automatically verified and applied
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white">
                  -${discountAmount}
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Primary Service:</span>
                <span className="font-extrabold text-slate-800 text-sm">{selectedService?.name}</span>
                <span className="text-slate-500 block">(${selectedService?.price} · {selectedService?.duration || `${selectedService?.durationMinutes} min`})</span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Specialist:</span>
                <span className="font-extrabold text-indigo-700 text-sm">
                  {selectedStaff?.name || selectedSlot?.assignedStaff?.name || 'First Available Specialist'}
                </span>
                <span className="text-slate-500 block">
                  {selectedStaff?.role || selectedSlot?.assignedStaff?.role || 'Qualified Practitioner'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Date:</span>
                <span className="font-extrabold text-slate-800">
                  {formatDateDisplay(selectedDate)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Time:</span>
                <span className="font-extrabold text-slate-800">
                  {selectedSlot?.formattedTime}
                </span>
              </div>
            </div>

            {/* Selected Add-ons breakdown */}
            {selectedAddOns.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI Recommended Add-ons ({selectedAddOns.length})</span>
                </span>
                <div className="space-y-1">
                  {selectedAddOns.map((addOn) => (
                    <div
                      key={addOn.id}
                      className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-indigo-50/70 border border-indigo-100"
                    >
                      <span className="font-semibold text-slate-800">
                        + {addOn.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">+{addOn.durationMinutes || 15}m</span>
                        <span className="font-extrabold text-indigo-700">+${addOn.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Proactive Non-Intrusive AI Recommendations for Selected Service */}
          {selectedService && (
            <AiServiceRecommendations
              selectedService={selectedService}
              availableServices={selectedBusiness?.services || []}
              customerEmail={customerEmail}
              customerName={customerName}
              businessName={selectedBusiness?.name}
              businessCategory={selectedBusiness?.category}
              selectedAddOns={selectedAddOns}
              onToggleAddOn={handleToggleAddOn}
              onSelectAlternative={handleSelectAlternative}
            />
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Contact Details Form */}
          <form onSubmit={handleConfirmAppointment} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Special Notes or Pet Details (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Anxious puppy, allergic to scented shampoo..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Confirming reservation...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                  <span>Confirm Appointment</span>
                </>
              )}
            </button>
          </form>
        </section>
      )}

      {/* ========================================================= */}
      {/* STEP 8: CONFIRMATION SCREEN                               */}
      {/* ========================================================= */}
      {currentStep === 'confirmed' && confirmedBooking && (
        <section className="space-y-6 max-w-lg mx-auto animate-in zoom-in-95 duration-200 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Appointment Confirmed!
            </h1>
            <p className="text-sm text-slate-600">
              Your arrival pass is ready. We've sent a confirmation to <strong>{confirmedBooking.customerEmail}</strong>.
            </p>
          </div>

          <div className="bg-white rounded-3xl border-2 border-emerald-500 p-6 text-left shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arrival Token</span>
                <span className="block font-mono text-2xl font-black text-indigo-600 tracking-wider">
                  {confirmedBooking.token}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE PASS
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Business:</span>
                <span className="font-extrabold text-slate-900">{confirmedBooking.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-extrabold text-indigo-600">{confirmedBooking.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Specialist:</span>
                <span className="font-bold text-slate-800">{confirmedBooking.staffName || 'Specialist'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Time:</span>
                <span className="font-bold text-slate-800">
                  {confirmedBooking.date} at {confirmedBooking.startTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Price:</span>
                <span className="font-extrabold text-slate-900">${confirmedBooking.price}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/confirmation/${confirmedBooking.token}`}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-md transition-colors text-center"
            >
              View Digital Pass & QR
            </Link>
            <Link
              to="/my-bookings"
              className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm transition-colors text-center"
            >
              My Appointments
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
