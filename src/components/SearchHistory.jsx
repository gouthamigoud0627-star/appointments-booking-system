import React, { useState, useEffect, useCallback } from 'react';
import { Clock, History, X, Trash2, Search, ArrowUpRight, Sparkles } from 'lucide-react';

export const SEARCH_HISTORY_STORAGE_KEY = 'schedora_search_history';
export const MAX_HISTORY_ITEMS = 8;

/**
 * Format relative time in a human-friendly way
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diffMs = Date.now() - Number(timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return 'Recently';
}

/**
 * Safely retrieves stored search history from localStorage
 */
export function getStoredSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          return { id: item, query: item, timestamp: Date.now() };
        }
        if (item && typeof item.query === 'string') {
          return {
            id: item.id || `${item.query}-${item.timestamp || Date.now()}`,
            query: item.query.trim(),
            timestamp: item.timestamp || Date.now(),
          };
        }
        return null;
      })
      .filter((item) => Boolean(item && item.query));
  } catch (err) {
    console.warn('Failed to parse search history from localStorage:', err);
    return [];
  }
}

/**
 * Safely saves a search query to localStorage with deduplication and limit
 */
export function saveStoredSearchQuery(query) {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();
  if (trimmed.length < 1) return [];

  try {
    const existing = getStoredSearchHistory();
    // Remove any case-insensitive duplicates
    const filtered = existing.filter(
      (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
    );

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      query: trimmed,
      timestamp: Date.now(),
    };

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to save search history to localStorage:', err);
    return [];
  }
}

/**
 * Safely removes a specific query from localStorage
 */
export function removeStoredSearchQuery(queryOrId) {
  try {
    const existing = getStoredSearchHistory();
    const updated = existing.filter(
      (item) => item.id !== queryOrId && item.query.toLowerCase() !== queryOrId.toLowerCase()
    );
    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Failed to remove search item from localStorage:', err);
    return [];
  }
}

/**
 * Clears all stored search queries from localStorage
 */
export function clearStoredSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear search history from localStorage:', err);
  }
  return [];
}

/**
 * Custom React Hook for search history state management
 */
export function useSearchHistory() {
  const [history, setHistory] = useState(() => getStoredSearchHistory());

  // Reload history if other tabs update localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === SEARCH_HISTORY_STORAGE_KEY) {
        setHistory(getStoredSearchHistory());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addQuery = useCallback((query) => {
    const updated = saveStoredSearchQuery(query);
    setHistory(updated);
  }, []);

  const removeQuery = useCallback((queryOrId) => {
    const updated = removeStoredSearchQuery(queryOrId);
    setHistory(updated);
  }, []);

  const clearHistory = useCallback(() => {
    clearStoredSearchHistory();
    setHistory([]);
  }, []);

  return {
    history,
    addQuery,
    removeQuery,
    clearHistory,
  };
}

/**
 * SearchHistory Dropdown Menu
 * Renders underneath the search input with full interactive options
 */
export function SearchHistoryDropdown({
  history = [],
  isOpen = false,
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
  onClose,
  popularSuggestions = ['Dental Care', 'Yoga Studio', 'Auto Service', 'Hair Salon', 'Chiropractor'],
}) {
  if (!isOpen) return null;

  return (
    <div
      role="listbox"
      aria-label="Recent search history"
      className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-40 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <History className="w-3.5 h-3.5 text-indigo-600" />
          <span>Recent Searches</span>
          {history.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              {history.length}
            </span>
          )}
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClearHistory?.();
            }}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors p-1 rounded hover:bg-slate-100"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      {/* History Items List */}
      {history.length > 0 ? (
        <div className="py-1 max-h-64 overflow-y-auto divide-y divide-slate-50">
          {history.map((item) => (
            <div
              key={item.id}
              role="option"
              aria-selected="false"
              onClick={() => {
                onSelectQuery?.(item.query);
                onClose?.();
              }}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-indigo-50/60 cursor-pointer group transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 shrink-0 transition-colors" />
                <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-900 truncate">
                  {item.query}
                </span>
                <span className="text-[11px] text-slate-400 shrink-0 ml-auto mr-2">
                  {formatRelativeTime(item.timestamp)}
                </span>
              </div>
              <button
                type="button"
                aria-label={`Remove ${item.query} from search history`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveQuery?.(item.id || item.query);
                }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all ml-1 shrink-0"
                title="Remove from history"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center space-y-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500">No recent searches yet</p>
          {popularSuggestions.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Popular suggestions
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {popularSuggestions.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      onSelectQuery?.(sug);
                      onClose?.();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-xs text-slate-600 transition-colors"
                  >
                    <Search className="w-3 h-3 text-slate-400" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono text-slate-500">
            ↵
          </kbd>{' '}
          Press enter to search & save
        </span>
        <button
          type="button"
          onClick={onClose}
          className="hover:text-slate-600 underline cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * SearchHistory Chips Strip
 * Inline pill row displaying recent searches for instant 1-tap filtering
 */
export function SearchHistoryChips({
  history = [],
  activeQuery = '',
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
}) {
  if (!history || history.length === 0) return null;

  return (
    <div
      aria-label="Recent search queries"
      className="flex flex-wrap items-center gap-2 pt-2 text-xs"
    >
      <div className="inline-flex items-center gap-1 text-slate-500 font-medium shrink-0">
        <History className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Recent:
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 flex-1">
        {history.map((item) => {
          const isActive = activeQuery && activeQuery.trim().toLowerCase() === item.query.toLowerCase();
          return (
            <span
              key={item.id}
              className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectQuery?.(item.query)}
                className="hover:underline flex items-center gap-1"
                title={`Search for "${item.query}"`}
              >
                <span>{item.query}</span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${item.query} from history`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveQuery?.(item.id || item.query);
                }}
                className={`p-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white'
                    : 'hover:bg-slate-300 text-slate-400 hover:text-rose-600'
                }`}
                title="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={onClearHistory}
          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors ml-1 font-medium underline underline-offset-2"
          title="Clear all recent search queries"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/**
 * Main SearchHistory Component
 * Default export handles rendering both or specified variant ('chips', 'dropdown', or 'all')
 */
export default function SearchHistory({
  history = [],
  activeQuery = '',
  isOpen = false,
  variant = 'chips', // 'chips' | 'dropdown' | 'all'
  onSelectQuery,
  onRemoveQuery,
  onClearHistory,
  onClose,
  popularSuggestions,
}) {
  if (variant === 'dropdown') {
    return (
      <SearchHistoryDropdown
        history={history}
        isOpen={isOpen}
        onSelectQuery={onSelectQuery}
        onRemoveQuery={onRemoveQuery}
        onClearHistory={onClearHistory}
        onClose={onClose}
        popularSuggestions={popularSuggestions}
      />
    );
  }

  if (variant === 'chips') {
    return (
      <SearchHistoryChips
        history={history}
        activeQuery={activeQuery}
        onSelectQuery={onSelectQuery}
        onRemoveQuery={onRemoveQuery}
        onClearHistory={onClearHistory}
      />
    );
  }

  return (
    <>
      <SearchHistoryDropdown
        history={history}
        isOpen={isOpen}
        onSelectQuery={onSelectQuery}
        onRemoveQuery={onRemoveQuery}
        onClearHistory={onClearHistory}
        onClose={onClose}
        popularSuggestions={popularSuggestions}
      />
      <SearchHistoryChips
        history={history}
        activeQuery={activeQuery}
        onSelectQuery={onSelectQuery}
        onRemoveQuery={onRemoveQuery}
        onClearHistory={onClearHistory}
      />
    </>
  );
}
