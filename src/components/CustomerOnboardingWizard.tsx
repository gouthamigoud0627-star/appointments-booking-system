/**
 * CustomerOnboardingWizard.tsx
 * Short, friendly personalized onboarding wizard displayed after customer registration.
 * Guides the user through:
 * 1. Discover Categories (Health, Beauty, Home, Car, Pet, Fitness, Advisory)
 * 2. Recommendation Preferences (Best matches, Nearby, Discounts/Offers, Highly rated, Today's availability, etc.)
 * 3. Budget Preference (INR support)
 * 4. Travel Distance (2 km, 5 km, 10 km, 25 km, custom)
 * 5. Search Location (Browser GPS with consent or manual City/Area/PIN code)
 * Persists preferences in Supabase and local session, and does not repeat for returning users.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Heart,
  Scissors,
  Car,
  Dog,
  Dumbbell,
  Home,
  Briefcase,
  MapPin,
  Compass,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Navigation,
  DollarSign,
  Star,
  Percent,
  Clock,
  Flame,
  Calendar,
} from 'lucide-react';
import { getCurrentLocation, reverseGeocode, POPULAR_LOCALITIES } from '../lib/location.js';

export interface UserPreferencesData {
  categories: string[];
  recommendationTypes: string[];
  budgetRange: string;
  maxDistanceKm: number;
  locationCity: string;
  locationArea: string;
  latitude?: number | null;
  longitude?: number | null;
  offersEnabled: boolean;
  personalizedEnabled: boolean;
  onboardingCompleted: boolean;
}

interface CustomerOnboardingWizardProps {
  userName?: string;
  userEmail?: string;
  initialCity?: string;
  initialArea?: string;
  onComplete: (prefs: UserPreferencesData) => void;
  onDismiss: () => void;
}

export default function CustomerOnboardingWizard({
  userName = 'Friend',
  userEmail = '',
  initialCity = 'Hyderabad',
  initialArea = 'Banjara Hills',
  onComplete,
  onDismiss,
}: CustomerOnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Step 1: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Healthcare & Clinics',
    'Beauty & Salons',
  ]);

  // Step 2: Recommendation preferences
  const [selectedRecTypes, setSelectedRecTypes] = useState<string[]>([
    'Current discounts and offers',
    'Nearby businesses',
    'Highly rated businesses',
  ]);

  // Step 3: Budget
  const [budgetRange, setBudgetRange] = useState<string>('₹500 - ₹1,500');

  // Step 4: Distance
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [customDistance, setCustomDistance] = useState<string>('15');
  const [isCustomDistance, setIsCustomDistance] = useState<boolean>(false);

  // Step 5: Location
  const [city, setCity] = useState<string>(initialCity);
  const [area, setArea] = useState<string>(initialArea);
  const [pincode, setPincode] = useState<string>('500034');
  const [latitude, setLatitude] = useState<number | null>(17.4156);
  const [longitude, setLongitude] = useState<number | null>(78.435);
  const [locating, setLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  const firstName = (userName || 'Friend').trim().split(' ')[0] || 'Friend';

  const categoryOptions = [
    { id: 'Healthcare & Clinics', label: 'Healthcare & Clinics', icon: '🏥', LucideIcon: Heart },
    { id: 'Beauty & Salons', label: 'Beauty & Salons', icon: '💇', LucideIcon: Scissors },
    { id: 'Home Services', label: 'Home Services', icon: '🏠', LucideIcon: Home },
    { id: 'Car Care & Washing', label: 'Car Care & Washing', icon: '🚗', LucideIcon: Car },
    { id: 'Pet Grooming', label: 'Pet Grooming & Spa', icon: '🐾', LucideIcon: Dog },
    { id: 'Fitness & Wellness', label: 'Fitness & Wellness', icon: '🏋', LucideIcon: Dumbbell },
    { id: 'Business Consultations', label: 'Business Consultations', icon: '💼', LucideIcon: Briefcase },
  ];

  const recTypeOptions = [
    { id: 'Best matches for my interests', label: 'Best matches for my interests', icon: Sparkles },
    { id: 'Nearby businesses', label: 'Nearby businesses', icon: MapPin },
    { id: 'Affordable options', label: 'Affordable options', icon: DollarSign },
    { id: 'Current discounts and offers', label: 'Current discounts and offers', icon: Percent },
    { id: 'Highly rated businesses', label: 'Highly rated businesses', icon: Star },
    { id: 'Earliest available appointments', label: 'Earliest available appointments', icon: Clock },
    { id: 'Newly opened businesses', label: 'Newly opened businesses', icon: Flame },
    { id: 'Services available today', label: 'Services available today', icon: Calendar },
  ];

  const budgetOptions = [
    { id: 'Any Budget', label: 'Any Budget (Flexible)' },
    { id: 'Under ₹500', label: 'Affordable (Under ₹500 / $25)' },
    { id: '₹500 - ₹1,500', label: 'Moderate (₹500 - ₹1,500 / $25 - $75)' },
    { id: '₹1,500 - ₹3,500', label: 'Premium (₹1,500 - ₹3,500 / $75 - $150)' },
    { id: '₹3,500+', label: 'Luxury (₹3,500+ / $150+)' },
  ];

  const toggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const toggleRecType = (typeId: string) => {
    setSelectedRecTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleRequestGPS = async () => {
    setLocating(true);
    setLocationStatus(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      setLatitude(pos.latitude);
      setLongitude(pos.longitude);

      try {
        const geo = await reverseGeocode(pos.latitude, pos.longitude);
        if (geo.city) setCity(geo.city);
        if (geo.area) setArea(geo.area);
        setLocationStatus(`Location verified: ${geo.area || geo.city}`);
      } catch {
        setLocationStatus('GPS coordinates captured.');
      }
    } catch (err: any) {
      setLocationStatus('Permission denied or unavailable. Enter your city or area manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleSelectPopularLocality = (loc: typeof POPULAR_LOCALITIES[0]) => {
    setCity(loc.city);
    setArea(loc.name);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setLocationStatus(`Set to ${loc.name}, ${loc.city}`);
  };

  const handleFinish = () => {
    const finalRadius = isCustomDistance ? Math.max(1, parseInt(customDistance, 10) || 10) : distanceKm;
    const finalData: UserPreferencesData = {
      categories: selectedCategories.length > 0 ? selectedCategories : ['Healthcare & Clinics', 'Beauty & Salons'],
      recommendationTypes: selectedRecTypes.length > 0 ? selectedRecTypes : ['Current discounts and offers', 'Nearby businesses'],
      budgetRange,
      maxDistanceKm: finalRadius,
      locationCity: city.trim() || 'Hyderabad',
      locationArea: area.trim() || 'Banjara Hills',
      latitude,
      longitude,
      offersEnabled: true,
      personalizedEnabled: true,
      onboardingCompleted: true,
    };

    onComplete(finalData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 my-8">
        {/* Header with Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                Personalized Onboarding • Step {step} of {totalSteps}
              </span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Customize Your Schedora Experience
              </h3>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* STEP 1: Categories */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Hey, {firstName}! What would you like to discover?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select the service categories you're interested in. You can change this anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {categoryOptions.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                const Icon = cat.LucideIcon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-xs flex-1">{cat.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Recommendation Types */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                What kind of recommendations do you prefer?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose what matters most when suggesting local providers and appointments.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {recTypeOptions.map((opt) => {
                const isSelected = selectedRecTypes.includes(opt.id);
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleRecType(opt.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="text-xs flex-1">{opt.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Preferred Budget */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                What is your preferred budget range?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Helps prioritize affordable choices and appropriate tier discounts (supports INR ₹).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {budgetOptions.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBudgetRange(b.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    budgetRange === b.id
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium'
                  }`}
                >
                  <span className="text-xs">{b.label}</span>
                  {budgetRange === b.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Travel Distance Radius */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                How far are you willing to travel?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We use exact geographic coordinates to filter providers strictly within your range.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {[2, 5, 10, 25].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => {
                    setDistanceKm(km);
                    setIsCustomDistance(false);
                  }}
                  className={`p-4 rounded-2xl border text-center transition-all cursor-pointer ${
                    !isCustomDistance && distanceKm === km
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 font-extrabold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-bold'
                  }`}
                >
                  <span className="text-base block">Within {km} km</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {km <= 2 ? 'Walking / Local' : km <= 5 ? 'Short drive' : 'City wide'}
                  </span>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsCustomDistance(true)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isCustomDistance
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium'
                }`}
              >
                <span className="text-xs text-slate-800 dark:text-slate-200">Choose custom radius</span>
                {isCustomDistance && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customDistance}
                      onChange={(e) => setCustomDistance(e.target.value)}
                      className="w-16 px-2 py-1 text-xs border border-indigo-400 rounded-lg text-center font-bold bg-white dark:bg-slate-900"
                    />
                    <span className="text-xs text-slate-500">km</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Where should we search? (Location) */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Where should we search?
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll only search around your chosen location and never share private coordinates.
              </p>
            </div>

            {/* GPS button */}
            <button
              type="button"
              onClick={handleRequestGPS}
              disabled={locating}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span>{locating ? 'Requesting GPS Location...' : 'Use My Current Location'}</span>
            </button>

            {locationStatus && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span>{locationStatus}</span>
              </div>
            )}

            {/* Manual input */}
            <div className="space-y-3 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Or Enter Location Manually:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Hyderabad, San Francisco"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Banjara Hills, Nob Hill"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Quick localities chips */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Metro Localities:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_LOCALITIES.slice(0, 5).map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectPopularLocality(loc)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Finish & Explore Schedora</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
