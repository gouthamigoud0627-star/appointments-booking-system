import React, { useState, useEffect, useCallback } from 'react';
import { History, Clock, X, Trash2 } from 'lucide-react';

export const RECENT_SEARCHES_STORAGE_KEY = 'recentSearches';
export const FALLBACK_STORAGE_KEYS = ['schedora_search_history', 'recent_searches'];
export const MAX_RECENT_SEARCHES = 5;

// Custom event for cross-component immediate state updates
const RECENT_SEARCHES_EVENT = 'schedora_recent_searches_updated';

/**
 * Safely retrieves stored search queries from localStorage
 * Returns up to 5 unique recent search queries
 */
export function getStoredRecentSearches(): string[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    // Try primary key first
    let raw = localStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
    
    // Fall back to alternative keys if empty
    if (!raw) {
      for (const fallbackKey of FALLBACK_STORAGE_KEYS) {
        const fallbackRaw = localStorage.getItem(fallbackKey);
        if (fallbackRaw) {
          raw = fallbackRaw;
          break;
        }
      }
    }

    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const results: string[] = [];
    for (const item of parsed) {
      let queryStr = '';
      if (typeof item === 'string') {
        queryStr = item.trim();
      } else if (item && typeof item.query === 'string') {
        queryStr = item.query.trim();
      }

      if (queryStr && !results.some((r) => r.toLowerCase() === queryStr.toLowerCase())) {
        results.push(queryStr);
        if (results.length >= MAX_RECENT_SEARCHES) break;
      }
    }

    return results;
  } catch (err) {
    console.warn('Failed to parse recent searches from localStorage:', err);
    return [];
  }
}

/**
 * Persists recent searches array to all synchronized localStorage keys
 */
function persistRecentSearches(searches: string[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  const capped = searches.slice(0, MAX_RECENT_SEARCHES);
  const json = JSON.stringify(capped);

  try {
    localStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, json);
    // Sync with fallback keys for universal compatibility
    for (const key of FALLBACK_STORAGE_KEYS) {
      localStorage.setItem(key, json);
    }
    // Dispatch event for instant reactive UI updates
    window.dispatchEvent(
      new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { searches: capped } })
    );
  } catch (err) {
    console.warn('Failed to persist recent searches to localStorage:', err);
  }
}

/**
 * Saves a new query to localStorage:
 * - Trims whitespace
 * - Deduplicates (case-insensitive) and moves query to index 0
 * - Enforces max 5 items
 */
export function saveRecentSearch(query: string): string[] {
  if (!query || typeof query !== 'string') return getStoredRecentSearches();
  const trimmed = query.trim();
  if (!trimmed) return getStoredRecentSearches();

  const current = getStoredRecentSearches();
  const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
  const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

  persistRecentSearches(updated);
  return updated;
}

/**
 * Removes a single query from localStorage
 */
export function removeRecentSearch(queryToRemove: string): string[] {
  if (!queryToRemove) return getStoredRecentSearches();
  const trimmed = queryToRemove.trim().toLowerCase();

  const current = getStoredRecentSearches();
  const updated = current.filter((item) => item.toLowerCase() !== trimmed);

  persistRecentSearches(updated);
  return updated;
}

/**
 * Clears all recent searches from localStorage
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    localStorage.removeItem(RECENT_SEARCHES_STORAGE_KEY);
    for (const key of FALLBACK_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    window.dispatchEvent(
      new CustomEvent(RECENT_SEARCHES_EVENT, { detail: { searches: [] } })
    );
  } catch (err) {
    console.warn('Failed to clear recent searches from localStorage:', err);
  }
}

/**
 * React hook to manage recent searches state and sync across the application
 */
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>(() => getStoredRecentSearches());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ searches?: string[] }>;
      if (customEvent.detail && Array.isArray(customEvent.detail.searches)) {
        setSearches(customEvent.detail.searches);
      } else {
        setSearches(getStoredRecentSearches());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === RECENT_SEARCHES_STORAGE_KEY ||
        (e.key && FALLBACK_STORAGE_KEYS.includes(e.key))
      ) {
        setSearches(getStoredRecentSearches());
      }
    };

    window.addEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(RECENT_SEARCHES_EVENT, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const addSearch = useCallback((query: string) => {
    const updated = saveRecentSearch(query);
    setSearches(updated);
  }, []);

  const removeSearch = useCallback((query: string) => {
    const updated = removeRecentSearch(query);
    setSearches(updated);
  }, []);

  const clear = useCallback(() => {
    clearRecentSearches();
    setSearches([]);
  }, []);

  return {
    searches,
    addSearch,
    removeSearch,
    clearSearches: clear,
  };
}

export interface RecentSearchesProps {
  searches?: string[];
  activeQuery?: string;
  currentQuery?: string;
  onSelectSearch?: (query: string) => void;
  onSelectQuery?: (query: string) => void;
  onSelect?: (query: string) => void;
  onSearch?: (query: string) => void;
  onRemove?: (query: string) => void;
  onClear?: () => void;
  className?: string;
  maxItems?: number;
  showClear?: boolean;
  label?: string;
}

/**
 * RecentSearches Component
 * Interacts with localStorage to save and display the user's last 5 search queries
 */
export const RecentSearches: React.FC<RecentSearchesProps> = ({
  searches: controlledSearches,
  activeQuery,
  currentQuery,
  onSelectSearch,
  onSelectQuery,
  onSelect,
  onSearch,
  onRemove,
  onClear,
  className = '',
  maxItems = MAX_RECENT_SEARCHES,
  showClear = true,
  label = 'Recent Searches:',
}) => {
  const { searches: internalSearches, removeSearch, clearSearches } = useRecentSearches();

  // Support both controlled and uncontrolled usage
  const list = (controlledSearches ?? internalSearches).slice(0, maxItems);
  const active = (activeQuery ?? currentQuery ?? '').trim().toLowerCase();

  const handleSelect = (query: string) => {
    if (onSelectSearch) onSelectSearch(query);
    else if (onSelectQuery) onSelectQuery(query);
    else if (onSelect) onSelect(query);
    else if (onSearch) onSearch(query);
  };

  const handleRemove = (e: React.MouseEvent, query: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove(query);
    } else {
      removeSearch(query);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else {
      clearSearches();
    }
  };

  if (list.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="recent-searches"
      aria-label="Recent search queries"
      className={`flex flex-wrap items-center gap-2 pt-2 text-xs animate-in fade-in duration-200 ${className}`}
    >
      <div className="inline-flex items-center gap-1.5 text-slate-500 font-medium shrink-0">
        <Clock className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1" role="list">
        {list.map((query) => {
          const isSelected = active === query.toLowerCase();
          return (
            <span
              key={query}
              role="listitem"
              className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium transition-all group ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/90 hover:text-slate-900 border border-slate-200/70'
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelect(query)}
                className="hover:underline flex items-center gap-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded"
                title={`Search for "${query}"`}
              >
                <span>{query}</span>
              </button>

              <button
                type="button"
                aria-label={`Remove "${query}" from recent searches`}
                onClick={(e) => handleRemove(e, query)}
                className={`p-0.5 rounded-full transition-colors focus:outline-none ${
                  isSelected
                    ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white'
                    : 'hover:bg-slate-300 text-slate-400 hover:text-rose-600'
                }`}
                title="Remove from recent searches"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        {showClear && list.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-600 transition-colors ml-1.5 font-medium underline underline-offset-2 focus:outline-none"
            title="Clear all recent searches"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default RecentSearches;
