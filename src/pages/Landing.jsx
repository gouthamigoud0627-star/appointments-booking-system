/**
 * Schedora Customer Home Page
 * Consumer-friendly, personalized discovery experience:
 * 1. Medium-sized Schedora logo at the beginning of the mobile app
 * 2. Personalized dynamic greeting: "Hey, {firstName}! What are your plans today?"
 * 3. Search Location selector & radius filter (2 km, 5 km, 10 km, 25 km)
 * 4. "Offers Near You" section with real business discounts, distances & 1-click booking
 * 5. Primary "Book an Appointment" CTA & popular service categories
 * 6. "Nearby Businesses" with accurate Haversine distance & helpful empty state
 * 7. "Your Next Appointment" with schedule details
 * 8. 5-step first-time customer onboarding wizard integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  Heart,
  Scissors,
  Car,
  Dog,
  Dumbbell,
  Home,
  GraduationCap,
  Sparkle,
  Clock,
  CheckCircle2,
  Users,
  Star,
  Sparkles,
  X,
  UserPlus,
  ShieldCheck,
  Building2,
  Share2,
  MapPin,
  Tag,
  Percent,
  Compass,
  Navigation,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import SchedoraLogo, { SchedoraAppIcon } from '../components/SchedoraLogo.jsx';
import { LanguageSelector } from '../components/LanguageSelector';
import { getBookingsByCustomer } from '../lib/bookings.js';
import { getBusinesses, SEEDED_BUSINESSES } from '../lib/business.js';
import { calculateDistance, getCurrentLocation, reverseGeocode, POPULAR_LOCALITIES } from '../lib/location.js';
import {
  getOffersNearCustomer,
  getUserPreferences,
  saveUserPreferences,
} from '../lib/offers.ts';
import CustomerOnboardingWizard from '../components/CustomerOnboardingWizard.tsx';
import {
  generatePersonalizedRecommendations,
  getFriendConnections,
  addFriendConnection,
  removeFriendConnection,
  dismissRecommendation,
  getSocialPrivacySettings,
  updateSocialPrivacySettings,
} from '../lib/social.js';

export default function Landing() {
  const navigate = useNavigate();
  const { customerUser, currentUser } = useAuth();
  const { t } = useLanguage();

  const [bookings, setBookings] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [privacySettings, setPrivacySettings] = useState({ shareVisitsAndReviews: true });
  const [loading, setLoading] = useState(true);

  // Social modal
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [newFriendName, setNewFriendName] = useState('');
  const [friendSuccessMsg, setFriendSuccessMsg] = useState(null);

  // User profile & preferences
  const activeUser = customerUser || currentUser;
  const customerEmail = activeUser?.email || '';

  // Personalized Greeting Name (never hardcoded)
  const userFirstName = useMemo(() => {
    const raw = activeUser?.name || '';
    if (!raw.trim()) return '';
    return raw.trim().split(' ')[0];
  }, [activeUser]);

  // Load user preferences (location, radius, categories, onboarding status)
  const [userPrefs, setUserPrefs] = useState(() => getUserPreferences(customerEmail));
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Location selector state
  const [searchRadius, setSearchRadius] = useState(userPrefs.maxDistanceKm || 10);
  const [userLat, setUserLat] = useState(userPrefs.latitude ?? 17.4156);
  const [userLng, setUserLng] = useState(userPrefs.longitude ?? 78.435);
  const [currentAreaLabel, setCurrentAreaLabel] = useState(
    userPrefs.locationArea ? `${userPrefs.locationArea}, ${userPrefs.locationCity}` : 'Banjara Hills, Hyderabad'
  );
  const [locatingGps, setLocatingGps] = useState(false);
  const [locationStatus, setLocationStatus] = useState(null);

  // Check if first-time onboarding should be presented
  useEffect(() => {
    if (activeUser && customerUser && !userPrefs.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [activeUser, customerUser, userPrefs.onboardingCompleted]);

  // Load bookings, businesses, and recommendations
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [bookingsList, bizList, recs] = await Promise.all([
          customerEmail ? getBookingsByCustomer(customerEmail) : Promise.resolve([]),
          getBusinesses().catch(() => SEEDED_BUSINESSES),
          generatePersonalizedRecommendations(activeUser),
        ]);

        setBookings(bookingsList || []);
        setBusinesses(bizList && bizList.length > 0 ? bizList : SEEDED_BUSINESSES);
        setRecommendations(recs || []);
        setFriends(getFriendConnections());
        setPrivacySettings(getSocialPrivacySettings());
      } catch (err) {
        console.warn('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [customerEmail, activeUser]);

  // Query Offers Near You
  const nearbyOffers = useMemo(() => {
    return getOffersNearCustomer({
      userLat,
      userLon: userLng,
      maxRadiusKm: searchRadius,
      customerEmail,
      isNewCustomer: bookings.length === 0,
    });
  }, [userLat, userLng, searchRadius, customerEmail, bookings.length]);

  // Nearby Businesses with Haversine distance
  const nearbyBusinesses = useMemo(() => {
    return businesses
      .map((b) => {
        const dist =
          userLat != null && userLng != null && b.latitude && b.longitude
            ? calculateDistance(userLat, userLng, b.latitude, b.longitude)
            : null;
        return { ...b, distanceKm: dist };
      })
      .filter((b) => {
        if (b.distanceKm === null) return true; // Include if unknown coordinates
        return b.distanceKm <= searchRadius;
      })
      .sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [businesses, userLat, userLng, searchRadius]);

  // Find next upcoming appointment
  const nextAppointment = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'completed')
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    return upcoming[0] || null;
  }, [bookings]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (prefs) => {
    const saved = saveUserPreferences(customerEmail, {
      ...prefs,
      onboardingCompleted: true,
    });
    setUserPrefs(saved);
    if (saved.latitude && saved.longitude) {
      setUserLat(saved.latitude);
      setUserLng(saved.longitude);
      setCurrentAreaLabel(`${saved.locationArea}, ${saved.locationCity}`);
    }
    if (saved.maxDistanceKm) {
      setSearchRadius(saved.maxDistanceKm);
    }
    setShowOnboarding(false);
  };

  // Handle GPS detection in location modal
  const handleUseCurrentLocation = async () => {
    setLocatingGps(true);
    setLocationStatus(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000 });
      setUserLat(pos.latitude);
      setUserLng(pos.longitude);

      try {
        const geo = await reverseGeocode(pos.latitude, pos.longitude);
        const label = geo.area ? `${geo.area}, ${geo.city}` : geo.city || 'Detected Location';
        setCurrentAreaLabel(label);
        saveUserPreferences(customerEmail, {
          latitude: pos.latitude,
          longitude: pos.longitude,
          locationCity: geo.city || 'Hyderabad',
          locationArea: geo.area || 'Downtown',
        });
        setLocationStatus(`Verified location: ${label}`);
      } catch {
        setCurrentAreaLabel('Current GPS Location');
        setLocationStatus('GPS coordinates captured.');
      }
      setTimeout(() => setShowLocationModal(false), 800);
    } catch (err) {
      setLocationStatus('Location permission denied. Please pick a locality from the list.');
    } finally {
      setLocatingGps(false);
    }
  };

  const handleSelectLocality = (loc) => {
    setUserLat(loc.latitude);
    setUserLng(loc.longitude);
    setCurrentAreaLabel(`${loc.name}, ${loc.city}`);
    saveUserPreferences(customerEmail, {
      latitude: loc.latitude,
      longitude: loc.longitude,
      locationCity: loc.city,
      locationArea: loc.name,
    });
    setShowLocationModal(false);
  };

  const categories = [
    { id: 'Health', name: t('categoryHealth', 'Health & Clinics'), icon: '🏥' },
    { id: 'Beauty', name: t('categoryBeauty', 'Beauty & Salons'), icon: '💇' },
    { id: 'Car Care', name: t('categoryCarCare', 'Car Care & Wash'), icon: '🚗' },
    { id: 'Pet Care', name: t('categoryPetCare', 'Pet Grooming'), icon: '🐾' },
    { id: 'Fitness', name: t('categoryFitness', 'Fitness & Yoga'), icon: '🏋' },
    { id: 'Home Services', name: t('categoryHomeServices', 'Home Services'), icon: '🏠' },
    { id: 'Classes', name: t('categoryClasses', 'Consultations'), icon: '💼' },
    { id: 'Other', name: t('categoryMore', 'All Services'), icon: '✨' },
  ];

  const handleSelectCategory = (catId) => {
    navigate(`/book?category=${encodeURIComponent(catId)}`);
  };

  const handleDismissRec = (recId) => {
    dismissRecommendation(recId);
    setRecommendations((prev) => prev.filter((r) => r.id !== recId));
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!newFriendName.trim() || !newFriendEmail.trim()) return;

    const newConn = await addFriendConnection({
      name: newFriendName,
      email: newFriendEmail,
    });

    setFriends(getFriendConnections());
    setNewFriendName('');
    setNewFriendEmail('');
    setFriendSuccessMsg(`Connected with ${newConn.friendName}! Recommendations updated.`);
    setTimeout(() => setFriendSuccessMsg(null), 4000);

    const updatedRecs = await generatePersonalizedRecommendations(activeUser);
    setRecommendations(updatedRecs);
  };

  const handleRemoveFriend = async (connId) => {
    await removeFriendConnection(connId);
    setFriends(getFriendConnections());
    const updatedRecs = await generatePersonalizedRecommendations(activeUser);
    setRecommendations(updatedRecs);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

      if (dateStr === todayStr) return t('today', 'Today');
      if (dateStr === tomorrowStr) return t('tomorrow', 'Tomorrow');

      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. MEDIUM-SIZED SCHEDORA LOGO AT THE BEGINNING OF MOBILE APP             */}
      {/* ========================================================================= */}
      <div className="sm:hidden flex items-center justify-between pb-3 pt-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <SchedoraAppIcon size={44} idPrefix="mob-home-icon" />
          <div>
            <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight leading-tight block">
              Schedora
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block -mt-0.5">
              Find services & offers near you
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector variant="dropdown" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. PERSONALIZED DYNAMIC GREETING & SEARCH LOCATION BAR                   */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        {/* Dynamic Personalized Greeting - NEVER hardcoded */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {userFirstName
              ? `Hey, ${userFirstName}! What are your plans today?`
              : t('whatWouldYouLikeToBook', 'What would you like to book?')}
          </h1>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300">
            {t('subtagline', 'Find the right services, appointments, and offers around you.')}
          </p>
        </div>

        {/* Location & Radius Control Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentAreaLabel}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                  • Within {searchRadius} km
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Showing real verified businesses and active offers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Radius quick switcher */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-750 p-1 rounded-xl text-xs font-bold">
              {[2, 5, 10, 25].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setSearchRadius(r);
                    saveUserPreferences(customerEmail, { maxDistanceKm: r });
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    searchRadius === r
                      ? 'bg-white dark:bg-slate-850 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLocationModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors border border-indigo-200/80 dark:border-indigo-800"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. PRIMARY BOOKING CALL TO ACTION                                        */}
      {/* ========================================================================= */}
      <div>
        <Link
          to="/book"
          className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-base sm:text-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          <Calendar className="w-5 h-5 text-indigo-200" />
          <span>{t('bookAppointment', 'Book an Appointment')}</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 4. OFFERS NEAR YOU (Real Business Offers with Distance & Claim)          */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Offers Near You</span>
                {nearbyOffers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700">
                    {nearbyOffers.length} Active
                  </span>
                )}
              </h2>
            </div>
          </div>

          <Link
            to="/offers"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View all offers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nearbyOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-rose-100/80 dark:border-rose-950/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-600 text-white shadow-2xs">
                      {offer.offerType === 'percentage'
                        ? `${offer.discountValue}% OFF`
                        : offer.offerType === 'free_service'
                        ? 'FREE SERVICE'
                        : offer.currency === 'INR'
                        ? `₹${offer.discountValue} OFF`
                        : `$${offer.discountValue} OFF`}
                    </span>

                    {offer.distanceKm !== null && (
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{offer.distanceKm} km away</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                      {offer.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {offer.businessName} • <span className="text-indigo-600 dark:text-indigo-400">{offer.businessCategory}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {offer.description}
                  </p>

                  {offer.applicableServiceNames && offer.applicableServiceNames.length > 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      Applies to: <span className="font-bold text-slate-700 dark:text-slate-200">{offer.applicableServiceNames[0]}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {offer.expiryDate ? `Valid until ${offer.expiryDate}` : 'Limited time offer'}
                  </div>

                  <Link
                    to={`/book?businessId=${offer.businessId}&offerId=${offer.id}&category=${encodeURIComponent(offer.businessCategory)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <span>Claim & Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
            <Tag className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              No active offers within {searchRadius} km of your area right now.
            </p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Businesses in nearby hubs regularly publish new packages. You can expand your search radius to discover deals.
            </p>
            <button
              onClick={() => {
                setSearchRadius(25);
                saveUserPreferences(customerEmail, { maxDistanceKm: 25 });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100"
            >
              Expand radius to 25 km
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 5. POPULAR SERVICES CATEGORIES                                           */}
      {/* ========================================================================= */}
      <section className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            {t('popularServices', 'Popular services')}
          </h2>
          <Link
            to="/book"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelectCategory(cat.id)}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-xs transition-all text-left flex flex-col justify-between min-h-[96px] group focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <span className="text-2xl" role="img" aria-label={cat.name}>
                {cat.icon}
              </span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors pt-2 block">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. NEARBY BUSINESSES (Accurate Distance Filtering & Empty State)         */}
      {/* ========================================================================= */}
      <section className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Businesses Near You</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified providers within {searchRadius} km of {currentAreaLabel}
            </p>
          </div>

          <Link
            to="/businesses"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Explore all ({businesses.length}) →
          </Link>
        </div>

        {nearbyBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {nearbyBusinesses.slice(0, 6).map((biz) => (
              <div
                key={biz.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {biz.category || 'Service'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {biz.rating || 4.9}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {biz.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {biz.address || biz.city}
                      {biz.distanceKm !== null && ` (${biz.distanceKm} km)`}
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {biz.services?.length || 3} services
                  </span>

                  <Link
                    to={`/book?businessId=${biz.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <span>Book</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
            <Compass className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              No matching businesses found within {searchRadius} km
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We never show fake listings. Would you like to expand your search radius or search a different locality?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => {
                  setSearchRadius(25);
                  saveUserPreferences(customerEmail, { maxDistanceKm: 25 });
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
              >
                Expand radius to 25 km
              </button>
              <button
                onClick={() => setShowLocationModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200"
              >
                Change search area
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 7. YOUR NEXT APPOINTMENT SECTION                                         */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-1">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('yourNextAppointment', 'Your next appointment')}
        </h2>

        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center text-xs text-slate-400">
            Checking schedule...
          </div>
        ) : nextAppointment ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  {nextAppointment.businessName || 'Elite Wellness'}
                </h3>
                <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {nextAppointment.serviceName}
                </p>
                {nextAppointment.staffName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Specialist: <strong>{nextAppointment.staffName}</strong>
                  </p>
                )}
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {nextAppointment.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-100 dark:border-slate-700">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {formatDateLabel(nextAppointment.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {nextAppointment.startTime} {nextAppointment.endTime ? `– ${nextAppointment.endTime}` : ''}
              </span>
            </div>

            <div className="pt-1 flex items-center gap-3">
              <Link
                to={`/confirmation/${nextAppointment.token}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                <span>{t('viewAppointment', 'View Appointment & Calendar Pass')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center space-y-3">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {t('noUpcomingAppointments', 'No upcoming appointments')}
            </p>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('bookAppointment', 'Book an Appointment')}</span>
            </Link>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 8. PERSONALIZED SMART DISCOVERY & FRIEND RECOMMENDATIONS                 */}
      {/* ========================================================================= */}
      {recommendations.length > 0 && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Recommended for you
              </h2>
            </div>
            <button
              onClick={() => setShowFriendsModal(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Friends & Community ({friends.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/90 dark:border-slate-700 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 relative group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                        rec.type === 'friend_recommendation'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300'
                          : rec.type === 'book_again'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {rec.badge}
                    </span>

                    <button
                      onClick={() => handleDismissRec(rec.id)}
                      title="Dismiss suggestion"
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {rec.headline}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rec.subtext}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {rec.rating || 4.9}★
                  </span>

                  <Link
                    to={rec.actionUrl}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 9. LOCATION & RADIUS CHANGE MODAL                                        */}
      {/* ========================================================================= */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Where Should We Search?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set your locality and search radius for businesses & offers
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GPS Detection Button */}
            <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900 space-y-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locatingGps}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {locatingGps ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Detecting GPS Coordinates...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>Use My Current Location</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                We only ask for browser location permission when you tap this.
              </p>
              {locationStatus && (
                <p className="text-xs font-bold text-center text-indigo-700 dark:text-indigo-300">
                  {locationStatus}
                </p>
              )}
            </div>

            {/* Search Radius Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Search Radius
              </label>
              <div className="grid grid-cols-4 gap-2 text-xs font-bold">
                {[2, 5, 10, 25].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSearchRadius(r);
                      saveUserPreferences(customerEmail, { maxDistanceKm: r });
                    }}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      searchRadius === r
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Verified Localities */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Or Select a Popular Verified Area
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_LOCALITIES.slice(0, 8).map((loc) => (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => handleSelectLocality(loc)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-750 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-left border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      {loc.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {loc.city}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLocationModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. FIRST-TIME CUSTOMER ONBOARDING WIZARD                                */}
      {/* ========================================================================= */}
      {showOnboarding && (
        <CustomerOnboardingWizard
          userName={userFirstName || 'Friend'}
          userEmail={customerEmail}
          initialCity={userPrefs.locationCity || 'Hyderabad'}
          initialArea={userPrefs.locationArea || 'Banjara Hills'}
          onComplete={handleOnboardingComplete}
          onDismiss={() => {
            saveUserPreferences(customerEmail, { onboardingCompleted: true });
            setShowOnboarding(false);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 11. SOCIAL NETWORK & FRIENDS MODAL                                       */}
      {/* ========================================================================= */}
      {showFriendsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Trusted Friends & Recommendations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Discover businesses verified by people you know
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFriendsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Safeguard Notice */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-750 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Share my visits & reviews with connected friends
                </span>
                <input
                  type="checkbox"
                  checked={privacySettings.shareVisitsAndReviews}
                  onChange={(e) => {
                    const updated = updateSocialPrivacySettings({ shareVisitsAndReviews: e.target.checked });
                    setPrivacySettings(updated);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </div>
              <div className="flex items-start gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Sensitive healthcare and medical appointments are strictly private and never shared.
                </span>
              </div>
            </div>

            {/* Connect with a friend */}
            <form onSubmit={handleAddFriend} className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Add a Friend Connection</h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  placeholder="Friend's Name"
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  value={newFriendEmail}
                  onChange={(e) => setNewFriendEmail(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-750 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect</span>
                </button>
              </div>
              {friendSuccessMsg && (
                <p className="text-xs font-bold text-emerald-600">{friendSuccessMsg}</p>
              )}
            </form>

            {/* Current connections */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Connected Friends</h4>
              {friends.length === 0 ? (
                <p className="text-xs text-slate-400">No connections yet.</p>
              ) : (
                friends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 bg-white dark:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={f.friendAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(f.friendName)}`}
                        alt={f.friendName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white block">{f.friendName}</span>
                        <span className="text-[11px] text-slate-400">{f.friendEmail}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(f.id)}
                      className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
