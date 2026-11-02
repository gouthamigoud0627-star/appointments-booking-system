/**
 * Category-based Filter Sidebar for Business Directory
 * Organizes businesses into major sectors (Health, Beauty, Fitness, Professional Services, Auto)
 * and detailed subcategories, with rating, availability, and distance refinements.
 */

import React, { useState } from 'react';
import {
  HeartPulse,
  Sparkles,
  Dumbbell,
  Briefcase,
  Wrench,
  Layers,
  Check,
  ChevronDown,
  ChevronRight,
  Star,
  Clock,
  MapPin,
  RotateCcw,
  X,
  Filter,
} from 'lucide-react';
import { DISTANCE_OPTIONS } from '../lib/business.js';

export interface CategoryGroup {
  id: string;
  name: string;
  shortName: string;
  icon: React.ElementType;
  colorClass: string;
  bgLightClass: string;
  subcategories: string[];
}

export const MACRO_CATEGORIES: CategoryGroup[] = [
  {
    id: 'Health',
    name: 'Health & Medical',
    shortName: 'Health',
    icon: HeartPulse,
    colorClass: 'text-emerald-600',
    bgLightClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    subcategories: ['Clinic', 'Dental', 'Veterinary'],
  },
  {
    id: 'Beauty',
    name: 'Beauty & Wellness',
    shortName: 'Beauty',
    icon: Sparkles,
    colorClass: 'text-purple-600',
    bgLightClass: 'bg-purple-50 text-purple-700 border-purple-200',
    subcategories: ['Spa', 'Salon', 'Tattoo'],
  },
  {
    id: 'Fitness',
    name: 'Fitness & Recreation',
    shortName: 'Fitness',
    icon: Dumbbell,
    colorClass: 'text-sky-600',
    bgLightClass: 'bg-sky-50 text-sky-700 border-sky-200',
    subcategories: ['Fitness'],
  },
  {
    id: 'Professional Services',
    name: 'Professional Services',
    shortName: 'Professional Services',
    icon: Briefcase,
    colorClass: 'text-indigo-600',
    bgLightClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    subcategories: ['Advisory', 'Photography'],
  },
  {
    id: 'Auto Care',
    name: 'Auto & Specialized',
    shortName: 'Auto Care',
    icon: Wrench,
    colorClass: 'text-amber-600',
    bgLightClass: 'bg-amber-50 text-amber-700 border-amber-200',
    subcategories: ['Auto Care'],
  },
];

export interface CategoryFilterSidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalCount: number;
  minRating: number;
  onSelectMinRating: (rating: number) => void;
  onlyOpenNow: boolean;
  onToggleOpenNow: () => void;
  selectedRadius: string;
  onSelectRadius: (radius: string) => void;
  userLocation: { latitude: number; longitude: number } | null;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  className?: string;
}

export const CategoryFilterSidebar: React.FC<CategoryFilterSidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalCount,
  minRating,
  onSelectMinRating,
  onlyOpenNow,
  onToggleOpenNow,
  selectedRadius,
  onSelectRadius,
  userLocation,
  onResetFilters,
  hasActiveFilters,
  isOpenMobile = false,
  onCloseMobile,
  className = '',
}) => {
  // Collapsed state for each macro category accordion
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper to compute total businesses in a macro group without double counting
  const getGroupTotal = (group: CategoryGroup) => {
    const uniqueCats = new Set([...group.subcategories, group.shortName]);
    let sum = 0;
    uniqueCats.forEach((cat) => {
      sum += categoryCounts[cat] || 0;
    });
    return sum;
  };

  const sidebarContent = (
    <div className="space-y-6">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 font-extrabold text-sm text-slate-900 tracking-tight">
          <Filter className="w-4 h-4 text-indigo-600" />
          <span>Filter by Category</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Main Categories Section */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
          Categories & Sectors
        </span>

        {/* All Categories Option */}
        <button
          type="button"
          onClick={() => onSelectCategory('All')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-indigo-600 text-white shadow-sm font-bold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className={`w-4 h-4 ${selectedCategory === 'All' ? 'text-white' : 'text-slate-400'}`} />
            <span>All Categories</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedCategory === 'All'
                ? 'bg-indigo-700 text-white'
                : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            {totalCount}
          </span>
        </button>

        {/* Macro Category Groups (Health, Beauty, Fitness, Professional Services, Auto) */}
        <div className="space-y-1 pt-1">
          {MACRO_CATEGORIES.map((group) => {
            const Icon = group.icon;
            const groupTotal = getGroupTotal(group);
            const isGroupSelected = selectedCategory === group.shortName || selectedCategory === group.id;
            const isSubSelected = group.subcategories.includes(selectedCategory);
            const isAnyActive = isGroupSelected || isSubSelected;
            const isCollapsed = Boolean(collapsedGroups[group.id]);

            return (
              <div key={group.id} className="rounded-xl border border-transparent overflow-hidden">
                {/* Macro Group Row */}
                <div
                  onClick={() => onSelectCategory(group.shortName)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                    isGroupSelected
                      ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold shadow-xs'
                      : isSubSelected
                      ? 'bg-slate-100/90 text-slate-900 font-medium'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isGroupSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600 transition-colors'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{group.shortName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isGroupSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {groupTotal}
                    </span>

                    {group.subcategories.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => toggleGroupCollapse(group.id, e)}
                        className="p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 transition-colors"
                        title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories List */}
                {!isCollapsed && group.subcategories.length > 0 && (
                  <div className="pl-9 pr-1 py-1 space-y-0.5">
                    {group.subcategories.map((sub) => {
                      const isSelected = selectedCategory === sub;
                      const count = categoryCounts[sub] || 0;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => onSelectCategory(sub)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 shrink-0" />
                            <span className="truncate">{sub}</span>
                          </div>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                              isSelected
                                ? 'bg-indigo-700 text-indigo-100'
                                : 'text-slate-400'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Refine Filters: Rating */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
          Minimum Rating
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { value: 0, label: 'All Ratings' },
            { value: 4.0, label: '4.0+ ★' },
            { value: 4.5, label: '4.5+ ★' },
            { value: 4.8, label: '4.8+ ★' },
          ].map((r) => {
            const isSelected = minRating === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => onSelectMinRating(r.value)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/50'
                }`}
              >
                {r.value > 0 && <Star className="w-3 h-3 fill-current" />}
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Refine Filters: Availability */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
          Availability
        </span>
        <button
          type="button"
          onClick={onToggleOpenNow}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            onlyOpenNow
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock className={`w-3.5 h-3.5 ${onlyOpenNow ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Open Now</span>
          </div>
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
              onlyOpenNow ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
            }`}
          >
            {onlyOpenNow && <Check className="w-2.5 h-2.5" />}
          </div>
        </button>
      </div>

      {/* Refine Filters: Distance Radius (When user location is present) */}
      {userLocation && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-1">
            Distance Radius
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {DISTANCE_OPTIONS.map((opt: any) => {
              const isSelected = selectedRadius === String(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onSelectRadius(String(opt.value))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer truncate ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/50'
                  }`}
                  title={opt.label}
                >
                  {opt.value === 'all' ? 'All' : `< ${opt.value} km`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        data-testid="category-filter-sidebar"
        className={`hidden md:block w-64 lg:w-72 shrink-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm self-start sticky top-24 ${className}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer Backdrop & Panel */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <span className="font-extrabold text-base text-slate-900">Filter Businesses</span>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryFilterSidebar;
