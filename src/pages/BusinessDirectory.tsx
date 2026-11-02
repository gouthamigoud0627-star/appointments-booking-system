/**
 * Business Directory & Nearby Discovery Page
 * Supports:
 * - Category-based filter sidebar (Health, Beauty, Fitness, Professional Services, Auto Care, etc.)
 * - Interactive Leaflet & OpenStreetMap visualization with custom category pins & popups
 * - Multiple layout view modes: Grid View, Split View (Map + List), and Map View
 * - Text search with Recent Searches (localStorage integration)
 * - Sorting by Rating, Distance, or Service Type (category)
 * - Filtering by Service Type / Category, Minimum Rating, Open Now, and Distance Radius
 * - GPS distance calculation with Haversine formula
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Navigation,
  Star,
  MapPin,
  ChevronRight,
  Sparkles,
  AlertCircle,
  X,
  History,
  ArrowUpDown,
  Filter,
  Clock,
  Tag,
  RotateCcw,
  Check,
  LayoutGrid,
  Map as MapIcon,
  Columns2,
  ExternalLink,
  SlidersHorizontal,
  Layers,
  Eye,
  EyeOff,
  Calendar,
  ChevronDown,
  ChevronUp,
  HeartPulse,
  Dumbbell,
  Briefcase,
  Wrench,
  Crosshair,
} from 'lucide-react';
import { getBusinesses, DISTANCE_OPTIONS } from '../lib/business.js';
import {
  calculateDistance,
  formatDistance,
  getCurrentLocation,
  POPULAR_LOCALITIES,
  getSavedUserLocation,
  saveUserLocation,
  clearSavedUserLocation,
  reverseGeocode,
} from '../lib/location.js';
import { isBusinessOpenNow } from '../lib/availability.js';
import { RecentSearches, useRecentSearches, saveRecentSearch } from '../components/RecentSearches.tsx';
import BusinessMap from '../components/BusinessMap.tsx';
import LocationPickerMap from '../components/LocationPickerMap.tsx';
import CategoryFilterSidebar, { MACRO_CATEGORIES } from '../components/CategoryFilterSidebar.tsx';
import SearchSuggestionsDropdown, {
  SuggestionItem,
  getSearchSuggestions,
} from '../components/SearchSuggestionsDropdown.tsx';
import BusinessQuickViewModal from '../components/BusinessQuickViewModal.tsx';

export type SortOption = 'rating' | 'distance' | 'service_type' | 'name';
export type ViewMode = 'grid' | 'split' | 'map';

export const SORT_OPTIONS: { id: SortOption; label: string; shortLabel: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'rating',
    label: 'Rating (Highest first)',
    shortLabel: 'Rating',
    icon: Star,
    description: 'Highest customer review ratings first',
  },
  {
    id: 'distance',
    label: 'Distance (Nearest first)',
    shortLabel: 'Distance',
    icon: MapPin,
    description: 'Closest service providers to your location',
  },
  {
    id: 'service_type',
    label: 'Service Type (A-Z)',
    shortLabel: 'Service Type',
    icon: Tag,
    description: 'Grouped alphabetically by category / service type',
  },
  {
    id: 'name',
    label: 'Business Name (A-Z)',
    shortLabel: 'Name',
    icon: ArrowUpDown,
    description: 'Alphabetical order by business name',
  },
];

/**
 * Checks if a business's category matches the user's selected category,
 * supporting both high-level macro categories (Health, Beauty, Fitness, Professional Services)
 * and specific subcategories (Clinic, Dental, Spa, Salon, etc.).
 */
export function matchesCategory(businessCategory: string, selectedCategory: string): boolean {
  if (!selectedCategory || selectedCategory === 'All') return true;
  if (!businessCategory) return false;
  if (businessCategory.toLowerCase() === selectedCategory.toLowerCase()) return true;

  const target = selectedCategory.toLowerCase().trim();
  const bCat = businessCategory.toLowerCase().trim();

  // Macro sector mappings
  if (target === 'health') {
    return ['clinic', 'dental', 'veterinary', 'health', 'medical', 'hospital'].includes(bCat);
  }
  if (target === 'beauty') {
    return ['spa', 'salon', 'tattoo', 'beauty', 'wellness', 'skincare', 'hair'].includes(bCat);
  }
  if (target === 'fitness') {
    return ['fitness', 'gym', 'yoga', 'pilates', 'training', 'recreation'].includes(bCat);
  }
  if (target === 'professional services' || target === 'professional') {
    return ['advisory', 'photography', 'professional services', 'consulting', 'legal', 'accounting'].includes(bCat);
  }
  if (target === 'auto care' || target === 'auto') {
    return ['auto care', 'automotive', 'auto', 'car care', 'mechanic'].includes(bCat);
  }

  return bCat.includes(target) || target.includes(bCat);
}

export const CATEGORY_SPOTLIGHTS: Record<string, { title: string; subtitle: string; icon: React.ElementType; color: string; subcategories: string[] }> = {
  Health: {
    title: 'Health & Medical Services',
    subtitle: 'Evidence-based clinics, aesthetic dental practices, and licensed veterinary hospitals.',
    icon: HeartPulse,
    color: 'from-emerald-600 to-teal-700',
    subcategories: ['Clinic', 'Dental', 'Veterinary'],
  },
  Beauty: {
    title: 'Beauty, Wellness & Self-Care',
    subtitle: 'Organic spas, botanical hair salons, thermal stone bodywork, and custom tattoo studios.',
    icon: Sparkles,
    color: 'from-purple-600 to-pink-600',
    subcategories: ['Spa', 'Salon', 'Tattoo'],
  },
  Fitness: {
    title: 'Fitness & Athletic Conditioning',
    subtitle: 'High-performance functional training, cold plunge recovery, and classical reformer pilates.',
    icon: Dumbbell,
    color: 'from-sky-600 to-blue-700',
    subcategories: ['Fitness'],
  },
  'Professional Services': {
    title: 'Professional & Business Services',
    subtitle: 'Fiduciary wealth planning, tax restructuring, executive portrait studios, and brand media.',
    icon: Briefcase,
    color: 'from-indigo-600 to-violet-700',
    subcategories: ['Advisory', 'Photography'],
  },
  'Auto Care': {
    title: 'Automotive & Mechanical Care',
    subtitle: 'ASE-certified computerized diagnostics, full synthetic oil changes, and brake overhaul.',
    icon: Wrench,
    color: 'from-amber-600 to-orange-700',
    subcategories: ['Auto Care'],
  },
  Spa: {
    title: 'Spa & Wellness Sanctuaries',
    subtitle: 'Organic hydro-facials, thermal basalt stone therapy, and restorative botanical aromatics.',
    icon: Sparkles,
    color: 'from-purple-600 to-indigo-600',
    subcategories: ['Spa'],
  },
  Dental: {
    title: 'Modern Aesthetic Dentistry',
    subtitle: 'Gentle dental hygiene, 3D smile scans, teeth whitening, and preventive oral wellness.',
    icon: HeartPulse,
    color: 'from-sky-600 to-cyan-700',
    subcategories: ['Dental'],
  },
  Clinic: {
    title: 'Integrative Medical Clinics',
    subtitle: 'Diagnostic evaluations, biomarker analysis, executive checkups, and longevity care.',
    icon: HeartPulse,
    color: 'from-emerald-600 to-teal-700',
    subcategories: ['Clinic'],
  },
  Salon: {
    title: 'Hair Salons & Styling Ateliers',
    subtitle: 'Precision cutting, sun-kissed balayage, botanical glosses, and restorative keratin seals.',
    icon: Sparkles,
    color: 'from-rose-600 to-pink-600',
    subcategories: ['Salon'],
  },
  Veterinary: {
    title: 'Compassionate Veterinary Hospitals',
    subtitle: 'Comprehensive wellness exams, tailored vaccine schedules, and gentle pet grooming.',
    icon: HeartPulse,
    color: 'from-amber-600 to-yellow-600',
    subcategories: ['Veterinary'],
  },
  Tattoo: {
    title: 'Custom Artisanal Tattoo Art',
    subtitle: 'Sterile single-needle fine lines, intricate botanical motifs, and bespoke ink designs.',
    icon: Sparkles,
    color: 'from-slate-700 to-slate-900',
    subcategories: ['Tattoo'],
  },
  Advisory: {
    title: 'Wealth & Business Advisory',
    subtitle: 'Fiduciary wealth blueprints, corporate tax optimization, and strategic capital growth.',
    icon: Briefcase,
    color: 'from-indigo-600 to-indigo-900',
    subcategories: ['Advisory'],
  },
  Photography: {
    title: 'Portrait & Creative Studios',
    subtitle: 'Studio lighting portraits, natural light headshots, and editorial branding photography.',
    icon: Briefcase,
    color: 'from-violet-600 to-indigo-700',
    subcategories: ['Photography'],
  },
};

export default function BusinessDirectory() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [submittedQuery, setSubmittedQuery] = useState<string>('');

  // Filtering states
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyOpenNow, setOnlyOpenNow] = useState<boolean>(false);
  const [selectedRadius, setSelectedRadius] = useState<string>('all');

  // Sorting state - default to rating
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  // View Mode: 'grid' | 'split' | 'map'
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [lastMapMode, setLastMapMode] = useState<ViewMode>('split');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Helper to switch view modes while remembering preferred map presentation
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'split' || mode === 'map') {
      setLastMapMode(mode);
    }
  };

  // Check if map view layer is currently active
  const isMapLayerVisible = viewMode === 'split' || viewMode === 'map';

  // Toggle map view layer on and off for a cleaner interface
  const toggleMapLayer = () => {
    if (isMapLayerVisible) {
      setViewMode('grid');
    } else {
      setViewMode(lastMapMode === 'grid' ? 'split' : lastMapMode);
    }
  };

  // Mobile sidebar drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Quick View Modal state
  const [quickViewBusiness, setQuickViewBusiness] = useState<any | null>(null);

  // Expandable services state on cards
  const [expandedCardServices, setExpandedCardServices] = useState<Record<string, boolean>>({});

  const toggleCardServices = (businessId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedCardServices((prev) => ({
      ...prev,
      [businessId]: !prev[businessId],
    }));
  };

  // Real-time suggestions & keyboard navigation state
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);

  // Recent Searches hook
  const { searches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Geolocation & permission-based state
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    label?: string;
    accuracy?: number;
    isManual?: boolean;
    isExactPin?: boolean;
  } | null>(() => getSavedUserLocation());
  const [locating, setLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualLocationPicker, setShowManualLocationPicker] = useState<boolean>(false);
  const [showLocationPickerModal, setShowLocationPickerModal] = useState<boolean>(false);

  // Sync real-time location changes dispatched from interactive maps or settings
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setUserLocation(e.detail);
      } else {
        setUserLocation(getSavedUserLocation());
      }
    };
    const handleClear = () => {
      setUserLocation(null);
    };
    window.addEventListener('schedora_location_updated', handleUpdate);
    window.addEventListener('schedora_location_cleared', handleClear);
    return () => {
      window.removeEventListener('schedora_location_updated', handleUpdate);
      window.removeEventListener('schedora_location_cleared', handleClear);
    };
  }, []);

  // Compute real-time suggestions based on current search query, loaded directory data, and recent searches
  const { flatItems: suggestionItems } = useMemo(() => {
    return getSearchSuggestions(businesses, searchQuery, searches);
  }, [businesses, searchQuery, searches]);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveSuggestionIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch businesses
  useEffect(() => {
    async function load() {
      try {
        const list = await getBusinesses();
        setBusinesses(list);
      } catch (err) {
        console.error('Failed to load businesses:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Submits a search query: persists to localStorage and refreshes state
  const handleSubmitSearch = (queryToSubmit?: string) => {
    const target = typeof queryToSubmit === 'string' ? queryToSubmit : searchQuery;
    const trimmed = target.trim();
    if (trimmed) {
      addSearch(trimmed);
      saveRecentSearch(trimmed);
      setSubmittedQuery(trimmed);
      setSearchQuery(trimmed);
    }
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitSearch();
  };

  // Handles selection from real-time suggestions dropdown
  const handleSelectSuggestion = (item: SuggestionItem) => {
    if (item.type === 'business') {
      const b = item.data;
      setSearchQuery(b.name);
      handleSubmitSearch(b.name);
      setSelectedBusinessId(b.id);
    } else if (item.type === 'service') {
      setSearchQuery(item.data.serviceName);
      handleSubmitSearch(item.data.serviceName);
    } else if (item.type === 'category') {
      setSelectedCategory(item.data.categoryName);
      setSearchQuery('');
      setSubmittedQuery('');
    } else if (item.type === 'recent') {
      setSearchQuery(item.data);
      handleSubmitSearch(item.data);
    }
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
  };

  // Enhanced keyboard navigation across suggestions
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSuggestions) {
        setShowSuggestions(true);
      } else if (suggestionItems.length > 0) {
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestionItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestionItems.length > 0) {
        setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestionItems.length - 1 : prev - 1));
      }
    } else if (e.key === 'Enter') {
      if (showSuggestions && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestionItems.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestionItems[activeSuggestionIndex]);
      } else {
        e.preventDefault();
        handleSubmitSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSelectRecentSearch = (selected: string) => {
    setSearchQuery(selected);
    handleSubmitSearch(selected);
    setShowSuggestions(false);
  };

  // Request browser GPS location with user consent
  const handleDetectLocation = async () => {
    setLocating(true);
    setLocationError(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
      const addressLabel = await reverseGeocode(pos.latitude, pos.longitude);
      const loc = {
        latitude: pos.latitude,
        longitude: pos.longitude,
        label: addressLabel,
        accuracy: pos.accuracy,
        isManual: false,
      };
      setUserLocation(loc);
      saveUserLocation(loc);
      setSortBy('distance');
      setShowManualLocationPicker(false);
    } catch (err: any) {
      console.warn('Geolocation failed or denied:', err);
      // Never silently substitute an estimated IP location for a precise GPS location
      setLocationError(
        'GPS location was denied or unavailable. You can choose your area manually below, or continue browsing all locations.'
      );
    } finally {
      setLocating(false);
    }
  };

  // Set location manually from predefined or searched localities
  const handleSelectManualLocality = (item: typeof POPULAR_LOCALITIES[0]) => {
    const loc = {
      latitude: item.latitude,
      longitude: item.longitude,
      label: `${item.name}, ${item.city}`,
      isManual: true,
    };
    setUserLocation(loc);
    saveUserLocation(loc);
    setSortBy('distance');
    setShowManualLocationPicker(false);
    setLocationError(null);
  };

  // Remove / clear saved location
  const handleClearLocation = () => {
    setUserLocation(null);
    clearSavedUserLocation();
    setLocationError(null);
    if (sortBy === 'distance') {
      setSortBy('rating');
    }
  };

  // When user clicks "Distance" sort, prompt location if not yet active
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    if (newSort === 'distance' && !userLocation && !locating) {
      handleDetectLocation();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('All');
    setMinRating(0);
    setOnlyOpenNow(false);
    setSelectedRadius('all');
    setSearchQuery('');
    setSubmittedQuery('');
  };

  // Check if any filter is active
  const hasActiveFilters =
    selectedCategory !== 'All' ||
    minRating > 0 ||
    onlyOpenNow ||
    selectedRadius !== 'all' ||
    searchQuery.trim().length > 0;

  // Filter and compute distances
  const processedBusinesses = useMemo(() => {
    return businesses
      .map((b) => {
        let distanceKm: number | null = null;
        if (userLocation && b.latitude && b.longitude) {
          distanceKm = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.latitude,
            b.longitude
          );
        }
        const isOpen = isBusinessOpenNow(b);
        return {
          ...b,
          distanceKm,
          distanceFormatted: formatDistance(distanceKm),
          isOpen,
        };
      })
      .filter((b) => {
        // Category / Sector filter with macro & subcategory support
        if (!matchesCategory(b.category, selectedCategory)) {
          return false;
        }

        // Minimum Rating filter
        if (minRating > 0 && (b.rating || 0) < minRating) {
          return false;
        }

        // Open Now filter
        if (onlyOpenNow && !b.isOpen) {
          return false;
        }

        // Distance Radius filter
        if (selectedRadius !== 'all' && b.distanceKm !== null) {
          if (b.distanceKm > Number(selectedRadius)) {
            return false;
          }
        }

        // Text search filter
        const activeSearch = searchQuery.trim().toLowerCase();
        if (activeSearch) {
          const matchName = (b.name || '').toLowerCase().includes(activeSearch);
          const matchCategory = (b.category || '').toLowerCase().includes(activeSearch);
          const matchCity = (b.city || '').toLowerCase().includes(activeSearch);
          const matchAddress = (b.address || '').toLowerCase().includes(activeSearch);
          const matchDesc = (b.description || '').toLowerCase().includes(activeSearch);
          const matchServices = (b.services || []).some((s: any) =>
            (s.name || '').toLowerCase().includes(activeSearch)
          );

          if (!matchName && !matchCategory && !matchCity && !matchAddress && !matchDesc && !matchServices) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Sort by Distance
        if (sortBy === 'distance') {
          if (a.distanceKm !== null && b.distanceKm !== null) {
            return a.distanceKm - b.distanceKm;
          }
          if (a.distanceKm !== null) return -1;
          if (b.distanceKm !== null) return 1;
          return 0;
        }

        // 2. Sort by Rating (highest first)
        if (sortBy === 'rating') {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }

        // 3. Sort by Service Type (category A-Z, then business name)
        if (sortBy === 'service_type') {
          const categoryDiff = (a.category || '').localeCompare(b.category || '');
          if (categoryDiff !== 0) return categoryDiff;
          return (a.name || '').localeCompare(b.name || '');
        }

        // 4. Sort by Business Name (A-Z)
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }

        return 0;
      });
  }, [businesses, userLocation, selectedCategory, minRating, onlyOpenNow, selectedRadius, searchQuery, sortBy]);

  // Counts per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: businesses.length };
    for (const b of businesses) {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    }
    return counts;
  }, [businesses]);

  // Dynamically compute exact counts for all macro & subcategories
  const quickCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: businesses.length };
    const categoriesToCheck = [
      'Health', 'Beauty', 'Fitness', 'Professional Services', 'Auto Care',
      'Spa', 'Dental', 'Clinic', 'Salon', 'Veterinary', 'Tattoo', 'Advisory', 'Photography'
    ];
    for (const catId of categoriesToCheck) {
      counts[catId] = businesses.filter((b) => matchesCategory(b.category, catId)).length;
    }
    return counts;
  }, [businesses]);

  // Handler when a business is focused from map or card
  const handleFocusBusiness = (business: any) => {
    setSelectedBusinessId(business.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Verified Local Businesses</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Book an Appointment
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          Choose what you need, pick a place near you, and schedule your appointment in seconds.
        </p>
      </div>

      {/* Main Search & Location Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input Row */}
        <form onSubmit={handleFormSubmit} className="flex flex-col md:flex-row gap-3">
          {/* Search container */}
          <div ref={searchContainerRef} className="relative flex-1">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  setActiveSuggestionIndex(-1);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by business name, service, neighborhood, or city..."
                className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <div className="absolute right-2.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSubmittedQuery('');
                      setShowSuggestions(false);
                      setActiveSuggestionIndex(-1);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Clear search text"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {searches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSuggestions((prev) => !prev)}
                    className={`px-2 py-1 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      showSuggestions
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-100'
                    }`}
                    title="Toggle search suggestions & history"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Recent ({searches.length})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Real-time search suggestions dropdown with keyboard navigation */}
            <SearchSuggestionsDropdown
              isOpen={showSuggestions}
              query={searchQuery}
              businesses={businesses}
              userLocation={userLocation}
              recentSearches={searches}
              activeIndex={activeSuggestionIndex}
              onSelectSuggestion={handleSelectSuggestion}
              onRemoveRecentSearch={(q) => removeSearch(q)}
              onClearRecentSearches={() => clearSearches()}
              onClose={() => {
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }}
            />
          </div>

          {/* Search Action Button */}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>

          {/* Detect & Pin Location Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1. Pin Exact Location on Map Button */}
            <button
              type="button"
              onClick={() => setShowLocationPickerModal(true)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                userLocation?.isExactPin
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm hover:bg-indigo-700'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
              title="Pin exact location on interactive map to avoid wrong locations"
            >
              <Crosshair className={`w-4 h-4 ${userLocation?.isExactPin ? 'text-white' : 'text-indigo-600'}`} />
              <span className="hidden sm:inline">
                {userLocation?.isExactPin ? 'Exact Map Pin' : 'Pin on Map'}
              </span>
              <span className="sm:hidden">Map Pin</span>
            </button>

            {/* 2. Detect GPS Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                userLocation && !userLocation.isManual && !userLocation.isExactPin
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title="Detect GPS location with browser permission"
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {locating
                  ? 'Detecting...'
                  : userLocation && !userLocation.isManual && !userLocation.isExactPin
                  ? 'GPS Active'
                  : 'Use My GPS'}
              </span>
              <span className="sm:hidden">
                {locating ? 'Locating...' : 'GPS'}
              </span>
            </button>

            {/* 3. Manual Locality Picker Toggle */}
            <button
              type="button"
              onClick={() => setShowManualLocationPicker((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                userLocation && userLocation.isManual && !userLocation.isExactPin
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Select your area manually without sharing GPS"
            >
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Choose Area</span>
            </button>
          </div>

          {/* Mobile Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shrink-0 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>Categories</span>
            {selectedCategory !== 'All' && (
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            )}
          </button>
        </form>

        {/* Integrated RecentSearches component */}
        <RecentSearches
          searches={searches}
          activeQuery={searchQuery}
          onSelectSearch={handleSelectRecentSearch}
          onRemove={(query) => removeSearch(query)}
          onClear={() => clearSearches()}
        />

        {/* Manual Locality Selection Drawer */}
        {showManualLocationPicker && (
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 animate-in fade-in space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Choose Your Area (No GPS Permission Required)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Distances to nearby clinics, spas, and specialists are calculated from your selected locality.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowManualLocationPicker(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {POPULAR_LOCALITIES.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelectManualLocality(loc)}
                  className="p-2.5 text-left rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer group"
                >
                  <span className="font-bold text-slate-800 block truncate group-hover:text-indigo-600">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {loc.city}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Location Info & Clear Badge */}
        {userLocation && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>{userLocation.isExactPin ? 'Exact Map Location:' : 'Location:'}</strong>{' '}
                {userLocation.label || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                <span className="text-emerald-700 ml-1.5 text-[11px] font-semibold">
                  {userLocation.isExactPin
                    ? '🎯 Verified Exact Pin'
                    : userLocation.isManual
                    ? '(Manual area)'
                    : `(Approximate GPS ±${Math.round(userLocation.accuracy || 20)}m)`}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLocationPickerModal(true)}
                className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                title="Open interactive map to adjust exact pin"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Adjust on Map</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManualLocationPicker(true)}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
              >
                Change Area
              </button>
              <button
                type="button"
                onClick={handleClearLocation}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Remove Location
              </button>
            </div>
          </div>
        )}

        {/* Geolocation Denied / Error Banner */}
        {locationError && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationError}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowManualLocationPicker(true)}
              className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-[11px] shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Choose Area Manually
            </button>
          </div>
        )}
      </div>

      {/* Quick Category Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Category Filter
          </span>
          {selectedCategory !== 'All' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All ({businesses.length})</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {[
            { id: 'All', label: 'All Businesses', count: businesses.length },
            { id: 'Health', label: 'Health & Medical', count: quickCategoryCounts['Health'] || 0 },
            { id: 'Beauty', label: 'Beauty & Wellness', count: quickCategoryCounts['Beauty'] || 0 },
            { id: 'Fitness', label: 'Fitness & Gym', count: quickCategoryCounts['Fitness'] || 0 },
            { id: 'Professional Services', label: 'Professional Services', count: quickCategoryCounts['Professional Services'] || 0 },
            { id: 'Auto Care', label: 'Auto Care', count: quickCategoryCounts['Auto Care'] || 0 },
            { id: 'Spa', label: 'Spa & Wellness', count: quickCategoryCounts['Spa'] || 0 },
            { id: 'Dental', label: 'Dental Clinic', count: quickCategoryCounts['Dental'] || 0 },
            { id: 'Clinic', label: 'Medical Clinic', count: quickCategoryCounts['Clinic'] || 0 },
            { id: 'Salon', label: 'Hair Salon', count: quickCategoryCounts['Salon'] || 0 },
            { id: 'Veterinary', label: 'Veterinary Clinic', count: quickCategoryCounts['Veterinary'] || 0 },
            { id: 'Tattoo', label: 'Artisanal Tattoo', count: quickCategoryCounts['Tattoo'] || 0 },
            { id: 'Advisory', label: 'Wealth Advisory', count: quickCategoryCounts['Advisory'] || 0 },
            { id: 'Photography', label: 'Portrait Studio', count: quickCategoryCounts['Photography'] || 0 },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Layout: Filter Sidebar on Left, Listings & Map on Right */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Category-based Filter Sidebar (Desktop Sticky + Mobile Drawer) */}
        <CategoryFilterSidebar
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          categoryCounts={categoryCounts}
          totalCount={businesses.length}
          minRating={minRating}
          onSelectMinRating={setMinRating}
          onlyOpenNow={onlyOpenNow}
          onToggleOpenNow={() => setOnlyOpenNow((prev) => !prev)}
          selectedRadius={selectedRadius}
          onSelectRadius={setSelectedRadius}
          userLocation={userLocation}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          isOpenMobile={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Top Controls Bar: Sort, View Layout Switcher, and Counts */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              {/* Sort Options */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 shrink-0 uppercase tracking-wider">
                  <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                  Sort:
                </span>
                <div className="inline-flex flex-wrap items-center p-1 bg-slate-100 rounded-xl gap-1">
                  {SORT_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isActive = sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSortChange(opt.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white text-indigo-700 shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                        title={opt.description}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span>{opt.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Layout Switcher (Grid, Split, Map) */}
              <div className="flex items-center gap-2 self-end lg:self-auto">
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => handleViewModeChange('grid')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Clean Cards Grid View (Map Hidden)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewModeChange('split')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'split'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Split Map & List View"
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span>Split</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleViewModeChange('map')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'map'
                        ? 'bg-white text-indigo-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Interactive Map Only View"
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    <span>Map</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Summary Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 font-medium">
                  Showing <strong className="text-slate-900 font-bold">{processedBusinesses.length}</strong> of{' '}
                  {businesses.length} businesses
                </span>

                {/* Active Filter Badges */}
                {selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
                    Category: {selectedCategory}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('All')}
                      className="hover:text-indigo-900 cursor-pointer"
                      title="Clear category filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                    Rating ≥ {minRating}★
                    <button
                      type="button"
                      onClick={() => setMinRating(0)}
                      className="hover:text-amber-900 cursor-pointer"
                      title="Clear rating filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {onlyOpenNow && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                    Open Now
                    <button
                      type="button"
                      onClick={() => setOnlyOpenNow(false)}
                      className="hover:text-emerald-900 cursor-pointer"
                      title="Clear open now filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedRadius !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                    Radius: &lt; {selectedRadius} km
                    <button
                      type="button"
                      onClick={() => setSelectedRadius('all')}
                      className="hover:text-slate-900 cursor-pointer"
                      title="Clear radius filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                    &quot;{searchQuery}&quot;
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSubmittedQuery('');
                      }}
                      className="hover:text-slate-900 cursor-pointer"
                      title="Clear search query"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Category-Specific Spotlight Banner */}
          {selectedCategory !== 'All' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-indigo-50/60 border border-indigo-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  {(() => {
                    const IconComp = CATEGORY_SPOTLIGHTS[selectedCategory]?.icon || Filter;
                    return <IconComp className="w-5 h-5" />;
                  })()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Category Active</span>
                    <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                      {processedBusinesses.length} {processedBusinesses.length === 1 ? 'provider' : 'providers'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {CATEGORY_SPOTLIGHTS[selectedCategory]?.title || `${selectedCategory} Directory`}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                    {CATEGORY_SPOTLIGHTS[selectedCategory]?.subtitle || `Showing verified local providers matching ${selectedCategory}. Browse services, view live available slots, or pinpoint locations on the map.`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Show All Categories</span>
                </button>
              </div>
            </div>
          )}

          {/* Listings Content Area */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse space-y-4">
                  <div className="h-44 bg-slate-200 rounded-xl" />
                  <div className="h-5 bg-slate-200 rounded w-2/3" />
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-8 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : processedBusinesses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No businesses match your criteria</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Try selecting a different category in the sidebar, choosing &quot;All Categories&quot;, or widening your distance radius.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <>
              {/* 1. MAP ONLY VIEW */}
              {viewMode === 'map' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <BusinessMap
                    businesses={processedBusinesses}
                    userLocation={userLocation}
                    selectedBusinessId={selectedBusinessId}
                    onSelectBusiness={handleFocusBusiness}
                    onLocationSelect={(loc) => {
                      setUserLocation(loc);
                      saveUserLocation(loc);
                      setSortBy('distance');
                    }}
                    height="600px"
                  />

                  {/* Horizontal Scroll Quick-Select Strip below map */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                      <span>Matching Service Providers ({processedBusinesses.length})</span>
                      <span className="text-[11px] font-normal text-slate-400">Click any card to pan map</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                      {processedBusinesses.map((b) => {
                        const isSelected = selectedBusinessId === b.id;
                        const bookingLink = b.slug ? `/b/${b.slug}` : `/b/${b.id}`;
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleFocusBusiness(b)}
                            className={`w-72 shrink-0 bg-white rounded-2xl border p-3.5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/30'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  b.image ||
                                  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80'
                                }
                                alt={b.name}
                                className="w-14 h-14 rounded-xl object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase">
                                  {b.category}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 truncate">{b.name}</h4>
                                <div className="flex items-center gap-1 text-amber-500 text-[11px] font-semibold">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{b.rating || 4.9}</span>
                                  {b.distanceFormatted && (
                                    <span className="text-emerald-700 ml-auto font-bold bg-emerald-50 px-1 rounded">
                                      {b.distanceFormatted}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                              <span className="text-[11px] text-slate-500 truncate max-w-[90px]">
                                {b.city}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickViewBusiness(b);
                                  }}
                                  className="text-[11px] font-semibold text-slate-600 hover:text-indigo-600 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                                  title="View full business profile & services"
                                >
                                  <Eye className="w-3 h-3 text-slate-400" />
                                  <span>Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFocusBusiness(b);
                                  }}
                                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-1.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                                  title="Focus pin on map"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Pin</span>
                                </button>
                                <Link
                                  to={bookingLink}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-0.5 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                                >
                                  <span>Book</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SPLIT VIEW */}
              {viewMode === 'split' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start animate-in fade-in duration-200">
                  {/* Left Column: Businesses Scrollable List */}
                  <div className="xl:col-span-6 space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
                    {processedBusinesses.map((b) => {
                      const isSelected = selectedBusinessId === b.id;
                      const bookingLink = b.slug ? `/b/${b.slug}` : `/b/${b.id}`;
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleFocusBusiness(b)}
                          className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20'
                              : 'border-slate-200 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex gap-3.5">
                            <img
                              src={
                                b.image ||
                                'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80'
                              }
                              alt={b.name}
                              className="w-18 h-18 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {b.category}
                                </span>
                                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  <span>{b.rating || 4.9}</span>
                                </div>
                              </div>

                              <h3 className="text-sm font-bold text-slate-900 truncate">{b.name}</h3>
                              <p className="text-xs text-slate-500 truncate mt-0.5">{b.address}, {b.city}</p>

                              <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                                {b.distanceFormatted ? (
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-emerald-600" />
                                    {b.distanceFormatted}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Verified Provider</span>
                                )}
                                <span className={`font-semibold ${b.isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                                  {b.isOpen ? '● Open Now' : 'Closed'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickViewBusiness(b);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                                title="View full profile, services & hours"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                <span>Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFocusBusiness(b);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Map</span>
                              </button>
                            </div>

                            <Link
                              to={bookingLink}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-xs"
                            >
                              <span>Book</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Sticky Interactive Leaflet Map */}
                  <div className="xl:col-span-6 sticky top-24">
                    <BusinessMap
                      businesses={processedBusinesses}
                      userLocation={userLocation}
                      selectedBusinessId={selectedBusinessId}
                      onSelectBusiness={handleFocusBusiness}
                      onLocationSelect={(loc) => {
                        setUserLocation(loc);
                        saveUserLocation(loc);
                        setSortBy('distance');
                      }}
                      height="720px"
                    />
                  </div>
                </div>
              )}

              {/* 3. STANDARD GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-200">
                  {processedBusinesses.map((b) => {
                    const bookingLink = b.slug ? `/b/${b.slug}` : `/b/${b.id}`;
                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col hover:border-indigo-300 hover:shadow-md transition-all group"
                      >
                        {/* Card Image */}
                        <div
                          onClick={() => setQuickViewBusiness(b)}
                          className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer"
                          title="Click to view full details"
                        >
                          <img
                            src={
                              b.image ||
                              'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80'
                            }
                            alt={b.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {/* Category / Service Type Pill */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur text-xs font-bold text-slate-800 shadow-xs flex items-center gap-1">
                            <Tag className="w-3 h-3 text-indigo-600" />
                            <span>{b.category}</span>
                          </div>

                          {/* Distance Badge */}
                          {b.distanceFormatted ? (
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-950/85 backdrop-blur text-xs font-bold text-emerald-300 shadow-xs flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span>{b.distanceFormatted}</span>
                            </div>
                          ) : null}

                          {/* Open / Closed status */}
                          <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur shadow-xs flex items-center gap-1.5 bg-slate-900/80 text-white">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                b.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                              }`}
                            />
                            <span>{b.isOpen ? 'Open Now' : 'Closed Now'}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <h3
                                onClick={() => setQuickViewBusiness(b)}
                                className="text-base sm:text-lg font-bold text-slate-900 hover:text-indigo-600 transition-colors leading-tight cursor-pointer"
                                title="Click to view details"
                              >
                                {b.name}
                              </h3>
                              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                <Star className="w-3.5 h-3.5 fill-amber-400" />
                                <span>{b.rating || 4.9}</span>
                                <span className="text-slate-400 font-normal">({b.reviewCount || 40})</span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                              {b.description || b.tagline}
                            </p>

                            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{b.address}, {b.city}</span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => setQuickViewBusiness(b)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                  title="Quick view full details & hours"
                                >
                                  <Eye className="w-3 h-3 text-slate-400" />
                                  <span>Details</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedBusinessId(b.id);
                                    handleViewModeChange('split');
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-semibold text-[11px] flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors"
                                  title="Locate on map"
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Map</span>
                                </button>
                              </div>
                            </div>

                            {/* Today's Live Slots Strip */}
                            {Array.isArray(b.availableSlotsToday) && b.availableSlotsToday.length > 0 && (
                              <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                  <span className="flex items-center gap-1 text-indigo-600">
                                    <Clock className="w-3 h-3" />
                                    Today's Open Slots
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal">1-click pick</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(b.availableSlotsToday || []).slice(0, 3).map((slot: string, sIdx: number) => (
                                    <Link
                                      key={sIdx}
                                      to={`${bookingLink}?slot=${encodeURIComponent(slot)}`}
                                      className="px-2 py-0.5 rounded-md bg-indigo-50/80 border border-indigo-200/60 text-indigo-700 font-bold text-[11px] hover:bg-indigo-600 hover:text-white transition-colors"
                                      title={`Book ${slot} today`}
                                    >
                                      {slot}
                                    </Link>
                                  ))}
                                  {b.availableSlotsToday.length > 3 && (
                                    <button
                                      type="button"
                                      onClick={() => setQuickViewBusiness(b)}
                                      className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold hover:bg-slate-200 cursor-pointer"
                                      title="View all slots"
                                    >
                                      +{b.availableSlotsToday.length - 3} more
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Services preview & interactive expander */}
                            {Array.isArray(b.services) && b.services.length > 0 && (
                              <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3 text-indigo-500" />
                                    Services ({b.services.length})
                                  </span>
                                  {b.services.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={(e) => toggleCardServices(b.id, e)}
                                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer font-bold text-[11px]"
                                    >
                                      <span>{expandedCardServices[b.id] ? 'Collapse' : `+${b.services.length - 2} more`}</span>
                                      {expandedCardServices[b.id] ? (
                                        <ChevronUp className="w-3 h-3" />
                                      ) : (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <div className="space-y-1.5">
                                  {(expandedCardServices[b.id] ? b.services : (b.services || []).slice(0, 2)).map(
                                    (s: any, idx: number) => (
                                      <div
                                        key={idx}
                                        onClick={() => setQuickViewBusiness(b)}
                                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/60 hover:border-indigo-200 transition-colors cursor-pointer group/srv"
                                      >
                                        <div className="min-w-0 pr-2">
                                          <span className="text-xs font-semibold text-slate-800 block truncate group-hover/srv:text-indigo-700">
                                            {s.name}
                                          </span>
                                          {expandedCardServices[b.id] && s.description && (
                                            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                                              {s.description}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {s.duration && (
                                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                                              {s.duration}
                                            </span>
                                          )}
                                          <span className="text-xs font-bold text-indigo-700">
                                            ${s.price}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Link Row */}
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuickViewBusiness(b)}
                              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Details</span>
                            </button>

                            <Link
                              to={bookingLink}
                              className="flex-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-xs"
                            >
                              <span>Book Appointment</span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Business Details Quick View Modal */}
      <BusinessQuickViewModal
        business={quickViewBusiness}
        onClose={() => setQuickViewBusiness(null)}
        onShowOnMap={(b) => {
          setSelectedBusinessId(b.id);
          handleViewModeChange('split');
        }}
      />

      {/* Exact Location Picker Map Modal */}
      {showLocationPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto">
            <LocationPickerMap
              initialLatitude={userLocation?.latitude || 37.7901}
              initialLongitude={userLocation?.longitude || -122.4205}
              initialAddress={userLocation?.label || ''}
              markerLabel="My Exact Location"
              title="Pin Your Exact Location on Map"
              description="Click anywhere on the map, drag the pin, or search your street to set your exact location without any wrong locations."
              height="400px"
              onSaveLocation={(loc) => {
                const locData = {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  label: loc.address,
                  isManual: true,
                  isExactPin: true,
                };
                setUserLocation(locData);
                saveUserLocation(locData);
                setSortBy('distance');
                setShowLocationPickerModal(false);
                setLocationError(null);
              }}
              onCancel={() => setShowLocationPickerModal(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) to Toggle Map View Layer */}
      <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-8 z-30 flex items-center gap-2">
        <button
          id="fab-toggle-map"
          type="button"
          onClick={toggleMapLayer}
          aria-label={isMapLayerVisible ? 'Hide map view layer' : 'Show map view layer'}
          aria-pressed={isMapLayerVisible}
          className={`group relative flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-full shadow-2xl transition-all duration-200 cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 backdrop-blur-md ${
            isMapLayerVisible
              ? 'bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700/80 shadow-slate-900/30'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-400/40 shadow-indigo-600/35 hover:shadow-indigo-600/45'
          }`}
          title={
            isMapLayerVisible
              ? 'Hide map view layer for a cleaner cards interface'
              : 'Show map view layer with interactive business pins'
          }
        >
          {isMapLayerVisible ? (
            <>
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
                <LayoutGrid className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold tracking-tight">Hide Map</span>
                  <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold text-slate-300">
                    Clean View
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="relative w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white">
                <MapIcon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold tracking-tight">Show Map</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-700/80 border border-indigo-400/40 text-[10px] font-extrabold text-white">
                    {processedBusinesses.length}
                  </span>
                </div>
              </div>
            </>
          )}
        </button>

        {/* When map layer is active, quick-toggle between Split and Full Map on tablet/desktop */}
        {isMapLayerVisible && (
          <div className="hidden sm:flex items-center p-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl">
            <button
              type="button"
              onClick={() => handleViewModeChange('split')}
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Split Map & List View"
            >
              <Columns2 className="w-3.5 h-3.5 inline mr-1" />
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('map')}
              className={`px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Full Map View"
            >
              <MapIcon className="w-3.5 h-3.5 inline mr-1" />
              <span>Map</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
