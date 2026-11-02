/**
 * SearchSuggestionsDropdown Component
 * Provides real-time search suggestions as the user types in the Business Directory:
 * - Matches business names, categories, services, and locations from directory data
 * - Highlights matching text tokens
 * - Supports keyboard navigation (Arrow Up, Arrow Down, Enter, Escape)
 * - Displays rich metadata (ratings, category pills, live distance, prices)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Building2,
  Tag,
  Star,
  MapPin,
  ChevronRight,
  History,
  X,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export interface ServiceSuggestion {
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  businessId: string;
  businessName: string;
  businessSlug?: string;
  businessImage?: string;
  businessCategory?: string;
}

export interface CategorySuggestion {
  categoryName: string;
  count: number;
}

export interface SuggestionItem {
  id: string;
  type: 'business' | 'service' | 'category' | 'recent';
  title: string;
  subtitle?: string;
  data: any;
}

/**
 * Calculates search suggestions based on current query and directory businesses
 */
export function getSearchSuggestions(
  businesses: any[] = [],
  query: string = '',
  recentSearches: string[] = []
): {
  flatItems: SuggestionItem[];
  matchedBusinesses: any[];
  matchedServices: ServiceSuggestion[];
  matchedCategories: CategorySuggestion[];
  filteredRecent: string[];
} {
  const trimmedQuery = (query || '').trim().toLowerCase();
  const hasQuery = trimmedQuery.length > 0;

  const matchedBusinesses: any[] = [];
  const matchedServices: ServiceSuggestion[] = [];
  const categoryCounts: Record<string, number> = {};

  if (hasQuery) {
    for (const b of businesses) {
      const nameMatch = (b.name || '').toLowerCase().includes(trimmedQuery);
      const descMatch = (b.description || '').toLowerCase().includes(trimmedQuery);
      const addressMatch = (b.address || '').toLowerCase().includes(trimmedQuery);
      const cityMatch = (b.city || '').toLowerCase().includes(trimmedQuery);

      if (nameMatch || descMatch || addressMatch || cityMatch) {
        if (matchedBusinesses.length < 5) {
          matchedBusinesses.push(b);
        }
      }

      // Check category match
      if (b.category && b.category.toLowerCase().includes(trimmedQuery)) {
        categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
      }

      // Check services
      if (b.services && Array.isArray(b.services)) {
        for (const s of b.services) {
          if (
            (s.name || '').toLowerCase().includes(trimmedQuery) ||
            (s.description || '').toLowerCase().includes(trimmedQuery)
          ) {
            if (matchedServices.length < 4) {
              matchedServices.push({
                serviceId: s.id,
                serviceName: s.name,
                servicePrice: s.price,
                businessId: b.id,
                businessName: b.name,
                businessSlug: b.slug,
                businessImage: b.image,
                businessCategory: b.category,
              });
            }
          }
        }
      }
    }
  }

  // Convert categories to array
  const matchedCategories: CategorySuggestion[] = Object.entries(categoryCounts).map(
    ([categoryName, count]) => ({ categoryName, count })
  );

  // Filter matching recent searches
  const safeRecent = Array.isArray(recentSearches) ? recentSearches : [];
  const filteredRecent = hasQuery
    ? safeRecent.filter((s) => s && typeof s === 'string' && s.toLowerCase().includes(trimmedQuery)).slice(0, 3)
    : safeRecent.slice(0, 5);

  // Build unified flattened suggestion list for keyboard navigation
  const flatItems: SuggestionItem[] = [];

  // Add businesses
  for (const b of matchedBusinesses) {
    flatItems.push({
      id: `biz-${b.id}`,
      type: 'business',
      title: b.name,
      subtitle: `${b.category} • ${b.city}`,
      data: b,
    });
  }

  // Add services
  for (const s of matchedServices) {
    flatItems.push({
      id: `svc-${s.serviceId}-${s.businessId}`,
      type: 'service',
      title: s.serviceName,
      subtitle: `at ${s.businessName}${s.servicePrice ? ` ($${s.servicePrice})` : ''}`,
      data: s,
    });
  }

  // Add categories
  for (const c of matchedCategories) {
    flatItems.push({
      id: `cat-${c.categoryName}`,
      type: 'category',
      title: c.categoryName,
      subtitle: `${c.count} service provider${c.count > 1 ? 's' : ''}`,
      data: c,
    });
  }

  // Add recent searches if no query or if room
  if (!hasQuery || flatItems.length < 3) {
    for (const r of filteredRecent) {
      flatItems.push({
        id: `rec-${r}`,
        type: 'recent',
        title: r,
        subtitle: 'Recent search',
        data: r,
      });
    }
  }

  return {
    flatItems,
    matchedBusinesses,
    matchedServices,
    matchedCategories,
    filteredRecent,
  };
}

/**
 * Helper component to highlight matching substring within text
 */
export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query || !query.trim() || !text || typeof text !== 'string') {
    return <span>{text || ''}</span>;
  }

  const trimmed = query.trim();
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, index);
  const match = text.slice(index, index + trimmed.length);
  const after = text.slice(index + trimmed.length);

  return (
    <span>
      {before}
      <mark className="bg-amber-100 text-amber-950 font-bold px-0.5 rounded">
        {match}
      </mark>
      {after}
    </span>
  );
}

interface SearchSuggestionsDropdownProps {
  isOpen: boolean;
  query: string;
  businesses: any[];
  userLocation: { latitude: number; longitude: number } | null;
  recentSearches: string[];
  activeIndex: number;
  onSelectSuggestion: (item: SuggestionItem) => void;
  onRemoveRecentSearch: (query: string) => void;
  onClearRecentSearches: () => void;
  onClose: () => void;
}

export const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  isOpen,
  query,
  businesses,
  recentSearches,
  activeIndex,
  onSelectSuggestion,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onClose,
}) => {
  if (!isOpen) return null;

  const trimmedQuery = (query || '').trim();
  const hasQuery = trimmedQuery.length > 0;

  const {
    flatItems,
    matchedBusinesses,
    matchedServices,
    matchedCategories,
    filteredRecent,
  } = getSearchSuggestions(businesses, query, recentSearches);

  const hasAnyResults = flatItems.length > 0;

  return (
    <div
      role="listbox"
      aria-label="Real-time search suggestions"
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-slate-100 max-h-[460px] overflow-y-auto"
    >
      {/* If empty query and no recent searches */}
      {!hasQuery && recentSearches.length === 0 && (
        <div className="p-4 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Type to search businesses or services</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            e.g., &quot;Bloom Spa&quot;, &quot;Dental Cleaning&quot;, &quot;San Francisco&quot;
          </p>
        </div>
      )}

      {/* No Matches Found */}
      {hasQuery && !hasAnyResults && (
        <div className="p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800">
            No direct matches for &quot;{query}&quot;
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Press <strong className="text-slate-700 font-bold">Enter</strong> to perform a broad search across all descriptions.
          </p>
        </div>
      )}

      {/* Section 1: Business Matches */}
      {matchedBusinesses.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Matching Businesses ({matchedBusinesses.length})</span>
          </div>

          {matchedBusinesses.map((b) => {
            const itemIndex = flatItems.findIndex((it) => it.id === `biz-${b.id}`);
            const isHighlighted = itemIndex === activeIndex;
            const bookingLink = b.slug ? `/b/${b.slug}` : `/b/${b.id}`;

            return (
              <div
                key={b.id}
                role="option"
                aria-selected={isHighlighted}
                onClick={() =>
                  onSelectSuggestion({
                    id: `biz-${b.id}`,
                    type: 'business',
                    title: b.name,
                    data: b,
                  })
                }
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer group ${
                  isHighlighted ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      b.image ||
                      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=100&auto=format&fit=crop&q=80'
                    }
                    alt={b.name}
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 truncate">
                        <HighlightMatch text={b.name} query={query} />
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                        {b.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{b.rating || 4.9}</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <span className="truncate flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {b.city}
                      </span>
                      {b.distanceFormatted && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-emerald-700 font-bold">{b.distanceFormatted}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={bookingLink}
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[11px] hover:bg-indigo-700 transition-all shadow-xs"
                    title="Direct Book Appointment"
                  >
                    <span>Book</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 2: Services Matches */}
      {matchedServices.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Matching Services ({matchedServices.length})</span>
          </div>

          {matchedServices.map((s) => {
            const itemIndex = flatItems.findIndex(
              (it) => it.id === `svc-${s.serviceId}-${s.businessId}`
            );
            const isHighlighted = itemIndex === activeIndex;

            return (
              <div
                key={`${s.serviceId}-${s.businessId}`}
                role="option"
                aria-selected={isHighlighted}
                onClick={() =>
                  onSelectSuggestion({
                    id: `svc-${s.serviceId}-${s.businessId}`,
                    type: 'service',
                    title: s.serviceName,
                    data: s,
                  })
                }
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer group ${
                  isHighlighted ? 'bg-purple-50 ring-1 ring-purple-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 truncate block">
                      <HighlightMatch text={s.serviceName} query={query} />
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      Offered by <strong className="text-slate-700 font-semibold">{s.businessName}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {s.servicePrice !== undefined && (
                    <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px] border border-indigo-100">
                      ${s.servicePrice}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 3: Categories Matches */}
      {matchedCategories.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600" />
            <span>Matching Categories ({matchedCategories.length})</span>
          </div>

          {matchedCategories.map((c) => {
            const itemIndex = flatItems.findIndex((it) => it.id === `cat-${c.categoryName}`);
            const isHighlighted = itemIndex === activeIndex;

            return (
              <div
                key={c.categoryName}
                role="option"
                aria-selected={isHighlighted}
                onClick={() =>
                  onSelectSuggestion({
                    id: `cat-${c.categoryName}`,
                    type: 'category',
                    title: c.categoryName,
                    data: c,
                  })
                }
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer group ${
                  isHighlighted ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-slate-800">
                    Filter by &quot;<HighlightMatch text={c.categoryName} query={query} />&quot;
                  </span>
                </div>

                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {c.count} business{c.count > 1 ? 'es' : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Section 4: Recent Searches (when present) */}
      {filteredRecent.length > 0 && (
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Recent Searches
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClearRecentSearches();
              }}
              className="text-[10px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>

          {filteredRecent.map((q) => {
            const itemIndex = flatItems.findIndex((it) => it.id === `rec-${q}`);
            const isHighlighted = itemIndex === activeIndex;

            return (
              <div
                key={q}
                role="option"
                aria-selected={isHighlighted}
                onClick={() =>
                  onSelectSuggestion({
                    id: `rec-${q}`,
                    type: 'recent',
                    title: q,
                    data: q,
                  })
                }
                className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer group ${
                  isHighlighted ? 'bg-indigo-50 ring-1 ring-indigo-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-700 truncate">
                    {hasQuery ? <HighlightMatch text={q} query={query} /> : q}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label={`Remove ${q}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveRecentSearch(q);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Navigation Tip */}
      <div className="px-3 py-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↓</kbd></span>
          <span>Select with <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px]">↵</kbd></span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 text-[10px] font-semibold cursor-pointer"
        >
          Close (Esc)
        </button>
      </div>
    </div>
  );
};

export default SearchSuggestionsDropdown;
