/**
 * BusinessQuickViewModal Component
 * Provides an in-depth instant preview modal for any business in the directory:
 * - Operating hours & live open status
 * - Contact information (phone, address, email)
 * - Available slots today with 1-click booking
 * - Complete service catalog with durations and prices
 * - Direct "Show on Map" interaction
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Star,
  Tag,
  ChevronRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Navigation,
} from 'lucide-react';

interface BusinessQuickViewModalProps {
  business: any | null;
  onClose: () => void;
  onShowOnMap?: (business: any) => void;
}

export const BusinessQuickViewModal: React.FC<BusinessQuickViewModalProps> = ({
  business,
  onClose,
  onShowOnMap,
}) => {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (business) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [business, onClose]);

  if (!business) return null;

  const bookingLink = business.slug ? `/b/${business.slug}` : `/b/${business.id}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-business-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header & Hero Image */}
        <div className="relative h-48 sm:h-56 bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={
              business.image ||
              'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80'
            }
            alt={business.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md transition-colors cursor-pointer"
            title="Close details (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Hero Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-white/95 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-600" />
              <span>{business.category}</span>
            </span>

            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-sm flex items-center gap-1 ${
                business.isOpen
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-slate-800/80 text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>{business.isOpen ? 'Open Now' : 'Closed'}</span>
            </span>
          </div>

          {/* Bottom Hero Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h2 id="modal-business-title" className="text-xl sm:text-2xl font-extrabold tracking-tight truncate">
              {business.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs mt-1 text-slate-200">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{business.rating || 4.9}</span>
                <span className="text-slate-300 font-normal">({business.reviewCount || 40} reviews)</span>
              </div>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{business.city}, {business.state}</span>
              </span>
              {business.distanceFormatted && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{business.distanceFormatted} away</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Description & Tagline */}
          <div className="space-y-1">
            {business.tagline && (
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                {business.tagline}
              </p>
            )}
            <p className="text-sm text-slate-600 leading-relaxed">
              {business.description}
            </p>
          </div>

          {/* Today's Live Slots Strip */}
          {business.availableSlotsToday && business.availableSlotsToday.length > 0 && (
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Live Available Slots Today
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold">1-Click Booking</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {business.availableSlotsToday.map((slot: string, idx: number) => (
                  <Link
                    key={idx}
                    to={`${bookingLink}?slot=${encodeURIComponent(slot)}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-2xs group"
                  >
                    <span>{slot}</span>
                    <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:text-white" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contact & Location Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Storefront Address</span>
              <p className="font-semibold text-slate-900 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>{business.address}, {business.city}, {business.state} {business.pincode}</span>
              </p>
              {business.latitude && business.longitude && (
                <div className="pt-1.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
                  </span>
                  {onShowOnMap && (
                    <button
                      type="button"
                      onClick={() => {
                        onShowOnMap(business);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Focus on Map</span>
                    </button>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Phone & Hours</span>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{business.phone || '+1 (415) 555-0100'}</span>
              </p>
              <p className="text-slate-500 flex items-center gap-1.5 text-[11px]">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{business.openingTime || '09:00 AM'} - {business.closingTime || '06:00 PM'}</span>
              </p>
            </div>
          </div>

          {/* Full Services Menu */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Available Services Menu ({business.services?.length || 0})
              </h3>
              <span className="text-[11px] text-slate-400">Fixed pricing & clear durations</span>
            </div>

            <div className="space-y-2.5">
              {(business.services || []).map((srv: any) => (
                <div
                  key={srv.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{srv.name}</h4>
                      {srv.duration && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {srv.duration}
                        </span>
                      )}
                    </div>
                    {srv.description && (
                      <p className="text-xs text-slate-500 mt-1 leading-snug">
                        {srv.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <span className="text-base font-extrabold text-indigo-700">
                      ${srv.price}
                    </span>
                    <Link
                      to={`${bookingLink}?service=${srv.id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-2xs"
                    >
                      <span>Book</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {onShowOnMap && (
              <button
                type="button"
                onClick={() => {
                  onShowOnMap(business);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                <span>Show on Map</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold"
            >
              <span>Close</span>
            </button>
          </div>

          <Link
            to={bookingLink}
            onClick={onClose}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md transition-all hover:scale-105"
          >
            <span>Proceed to Full Booking Engine</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BusinessQuickViewModal;
