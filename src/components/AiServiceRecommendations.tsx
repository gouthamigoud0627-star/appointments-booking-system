/**
 * AiServiceRecommendations Component
 * Non-intrusive proactive AI recommendation panel on booking pages.
 * Analyzes customer past visits and preferences to suggest relevant add-ons or upgrades.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  ArrowRightLeft,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AiServiceRecommendation, AiRecommendationResponse } from '../types';
import { fetchServiceRecommendations } from '../lib/aiRecommendations';

export interface AiServiceRecommendationsProps {
  selectedService: any;
  availableServices: any[];
  customerEmail?: string;
  customerName?: string;
  businessName?: string;
  businessCategory?: string;
  selectedAddOns?: any[];
  onToggleAddOn?: (service: any, rec: AiServiceRecommendation) => void;
  onSelectAlternative?: (service: any) => void;
  className?: string;
}

export const AiServiceRecommendations: React.FC<AiServiceRecommendationsProps> = ({
  selectedService,
  availableServices = [],
  customerEmail = '',
  customerName = '',
  businessName = '',
  businessCategory = '',
  selectedAddOns = [],
  onToggleAddOn,
  onSelectAlternative,
  className = '',
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<AiRecommendationResponse | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  // Load recommendations whenever selected service or customer email changes
  useEffect(() => {
    if (!selectedService) {
      setData(null);
      return;
    }

    let active = true;
    async function loadRecs() {
      setLoading(true);
      try {
        const result = await fetchServiceRecommendations({
          selectedService,
          availableServices,
          customerEmail,
          customerName,
          businessName,
          businessCategory,
        });
        if (active) {
          setData(result);
          setIsDismissed(false);
        }
      } catch (err) {
        console.warn('Failed to load AI recommendations:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecs();
    return () => {
      active = false;
    };
  }, [selectedService?.id, customerEmail, businessName]);

  if (!selectedService || isDismissed) return null;
  if (!loading && (!data || !data.recommendations || data.recommendations.length === 0)) {
    return null;
  }

  // Count active add-ons
  const activeAddOnsCount = selectedAddOns.length;

  return (
    <div
      className={`rounded-2xl border border-indigo-150 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-indigo-50/50 dark:from-slate-850 dark:via-indigo-950/20 dark:to-slate-850 shadow-sm overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Non-intrusive Top Header Bar */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 border-b border-indigo-100/60 dark:border-indigo-900/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                Smart Add-ons for {selectedService.name}
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                <Zap className="w-2.5 h-2.5" />
                AI Proactive
              </span>
            </div>
            {data?.conciergeNote && !isCollapsed && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                {data.conciergeNote}
              </p>
            )}
          </div>
        </div>

        {/* Right side controls: Collapse / Expand & Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          {activeAddOnsCount > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mr-1">
              {activeAddOnsCount} Added
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-indigo-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand suggestions' : 'Minimize suggestions'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-indigo-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Dismiss recommendations for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed State Teaser */}
      {isCollapsed && (
        <div
          onClick={() => setIsCollapsed(false)}
          className="px-4 py-2.5 bg-white/50 dark:bg-slate-800/40 text-xs text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-between cursor-pointer hover:bg-white/80 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            {data?.recommendations?.length || 0} Proactive recommendations available for this service
          </span>
          <span className="text-[11px] text-slate-400 hover:underline">Tap to expand</span>
        </div>
      )}

      {/* Expanded Recommendations Grid */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-5 space-y-3">
          {loading ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">
                AI concierge is tailoring recommendations to your booking history...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data?.recommendations || []).map((rec) => {
                const matchedService = availableServices.find((s) => s.id === rec.serviceId);
                const isAdded = selectedAddOns.some((a) => a.id === rec.serviceId);
                const addOnPrice = rec.suggestedAddOnPrice || matchedService?.price || 25;
                const addOnDuration =
                  rec.suggestedAddOnDurationMinutes ||
                  matchedService?.durationMinutes ||
                  parseInt(matchedService?.duration, 10) ||
                  15;

                return (
                  <div
                    key={rec.serviceId}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2.5 ${
                      isAdded
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
                        : 'border-white/80 dark:border-slate-700/80 bg-white/90 dark:bg-slate-800/90 hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                          {rec.badge}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs shrink-0">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            +${addOnPrice}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {rec.serviceName}
                      </h4>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        +{addOnDuration} min
                      </span>

                      {rec.type === 'alternative' || rec.type === 'upgrade' ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (matchedService && onSelectAlternative) {
                              onSelectAlternative(matchedService);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Switch to this</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onToggleAddOn) {
                              const srv = matchedService || {
                                id: rec.serviceId,
                                name: rec.serviceName,
                                price: addOnPrice,
                                durationMinutes: addOnDuration,
                              };
                              onToggleAddOn(srv, rec);
                            }
                          }}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add to Booking</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Discreet Footer Note */}
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              Recommendations respect your personal care preferences & sensitivities
            </span>
            <span className="hidden sm:inline">Add-ons seamlessly extend appointment window</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiServiceRecommendations;
