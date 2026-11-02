/**
 * Interactive Business Location Map
 * Built with Leaflet & OpenStreetMap for visualizing nearby services.
 * Features:
 * 1. Business pins with category colors & interactive popups
 * 2. Exact user location pin placement: click anywhere on map or drag pin
 * 3. In-map address search with autocomplete suggestions
 * 4. Live GPS detection button on map controls
 * 5. Real-time reverse geocoding and distance recalculation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  ChevronRight,
  Maximize2,
  Layers,
  Compass,
  Building2,
  X,
  Crosshair,
  Search,
  Check,
  Loader2,
} from 'lucide-react';
import {
  reverseGeocode,
  searchLocationAddress,
  saveUserLocation,
  getCurrentLocation,
} from '../lib/location.js';

export interface BusinessMapProps {
  businesses: any[];
  userLocation?: { latitude: number; longitude: number; label?: string; isManual?: boolean; isExactPin?: boolean } | null;
  selectedBusinessId?: string | null;
  onSelectBusiness?: (business: any) => void;
  onLocationSelect?: (location: { latitude: number; longitude: number; label: string; isExactPin: boolean }) => void;
  className?: string;
  height?: string;
  autoFit?: boolean;
  enablePinPlacement?: boolean;
}

// Category color mappings for map pins
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Spa: { bg: '#8b5cf6', text: '#ffffff', border: '#7c3aed' },
  Dental: { bg: '#0284c7', text: '#ffffff', border: '#0369a1' },
  Clinic: { bg: '#059669', text: '#ffffff', border: '#047857' },
  Salon: { bg: '#db2777', text: '#ffffff', border: '#be185d' },
  Veterinary: { bg: '#d97706', text: '#ffffff', border: '#b45309' },
  'Auto Care': { bg: '#ea580c', text: '#ffffff', border: '#c2410c' },
  Fitness: { bg: '#10b981', text: '#ffffff', border: '#059669' },
  Advisory: { bg: '#4f46e5', text: '#ffffff', border: '#4338ca' },
  Photography: { bg: '#6366f1', text: '#ffffff', border: '#4f46e5' },
  Tattoo: { bg: '#334155', text: '#ffffff', border: '#1e293b' },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || { bg: '#4f46e5', text: '#ffffff', border: '#3730a3' };
}

export const BusinessMap: React.FC<BusinessMapProps> = ({
  businesses,
  userLocation,
  selectedBusinessId,
  onSelectBusiness,
  onLocationSelect,
  className = '',
  height = '500px',
  autoFit = true,
  enablePinPlacement = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const [activePopupBusiness, setActivePopupBusiness] = useState<any | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Pin placement mode: when true, clicking on map sets user's exact location
  const [isPinModeActive, setIsPinModeActive] = useState(false);
  const [pinFeedbackToast, setPinFeedbackToast] = useState<string | null>(null);

  // In-map search bar state
  const [showMapSearch, setShowMapSearch] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<Array<{ latitude: number; longitude: number; label: string }>>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Helper to apply exact location pin
  const handleApplyLocation = async (lat: number, lng: number, manualLabel?: string) => {
    let resolvedLabel = manualLabel;
    if (!resolvedLabel) {
      try {
        resolvedLabel = await reverseGeocode(lat, lng);
      } catch (_) {
        resolvedLabel = `Exact Pin: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }

    const locData = {
      latitude: lat,
      longitude: lng,
      label: resolvedLabel || `Exact Pin: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      isManual: true,
      isExactPin: true,
    };

    saveUserLocation(locData);

    if (onLocationSelectRef.current) {
      onLocationSelectRef.current(locData);
    }

    setPinFeedbackToast(`📍 Exact location set: ${locData.label}`);
    setTimeout(() => setPinFeedbackToast(null), 4000);
  };

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on first business with coordinates or SF downtown default
    const firstWithCoords = businesses.find((b) => b.latitude && b.longitude);
    const initialCenter: [number, number] = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : firstWithCoords
      ? [firstWithCoords.latitude, firstWithCoords.longitude]
      : [37.79, -122.405];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Add Tile Layer (OpenStreetMap CartoDB Positron / OSM Standard)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Zoom controls at top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Map Click Listener: When in pin mode (or always if enabled)
    map.on('click', async (e: L.LeafletMouseEvent) => {
      const lat = parseFloat(e.latlng.lat.toFixed(6));
      const lng = parseFloat(e.latlng.lng.toFixed(6));
      await handleApplyLocation(lat, lng);
    });

    // Invalidate size after layout mounts
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
      } else {
        const userIcon = L.divIcon({
          className: 'leaflet-user-marker',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 32px; height: 32px; cursor: grab;">
              <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: rgba(56, 189, 248, 0.45); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 18px; height: 18px; border-radius: 9999px; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); border: 3px solid #ffffff; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
                <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: #ffffff;"></div>
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([userLocation.latitude, userLocation.longitude], {
          icon: userIcon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        marker.bindTooltip('<strong>📍 Your Exact Location</strong><br/>Drag to move or click anywhere on map', {
          direction: 'top',
          offset: [0, -14],
        });

        // Listen for drag end
        marker.on('dragend', async () => {
          const pos = marker.getLatLng();
          const lat = parseFloat(pos.lat.toFixed(6));
          const lng = parseFloat(pos.lng.toFixed(6));
          await handleApplyLocation(lat, lng);
        });

        userMarkerRef.current = marker;
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update business markers when businesses or selectedBusinessId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const validBusinesses = businesses.filter((b) => b.latitude && b.longitude);
    if (validBusinesses.length === 0) return;

    const bounds = L.latLngBounds([]);

    validBusinesses.forEach((b) => {
      const isSelected = selectedBusinessId === b.id;
      const color = getCategoryColor(b.category);

      const markerHtml = `
        <div class="business-marker-pin" style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isSelected ? '38px' : '32px'};
          height: ${isSelected ? '38px' : '32px'};
          border-radius: 9999px;
          background-color: ${color.bg};
          border: 2.5px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
          color: ${color.text};
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          transition: transform 0.15s ease;
          ${isSelected ? 'transform: scale(1.15); box-shadow: 0 0 0 3px #6366f1, 0 6px 14px rgba(0,0,0,0.3); z-index: 999;' : ''}
        ">
          <span>${b.rating ? b.rating.toFixed(1) : '★'}</span>
          <div style="
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid ${color.bg};
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: `custom-biz-pin-${b.id}`,
        html: markerHtml,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 38 : 32],
        popupAnchor: [0, isSelected ? -38 : -32],
      });

      const marker = L.marker([b.latitude, b.longitude], {
        icon: customIcon,
      }).addTo(layer);

      bounds.extend([b.latitude, b.longitude]);

      marker.on('click', () => {
        setActivePopupBusiness(b);
        if (onSelectBusiness) {
          onSelectBusiness(b);
        }
      });
    });

    // Auto-pan if a specific business is selected
    if (selectedBusinessId) {
      const selected = validBusinesses.find((b) => b.id === selectedBusinessId);
      if (selected) {
        map.setView([selected.latitude, selected.longitude], 15, { animate: true });
        setActivePopupBusiness(selected);
      }
    }
  }, [businesses, selectedBusinessId]);

  // Recenter button
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const bounds = L.latLngBounds([]);
    businesses
      .filter((b) => b.latitude && b.longitude)
      .forEach((b) => bounds.extend([b.latitude, b.longitude]));

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      bounds.extend([userLocation.latitude, userLocation.longitude]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  };

  // In-map search submit
  const handleMapSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    try {
      const results = await searchLocationAddress(mapSearchQuery);
      setMapSearchResults(results);
    } catch (_) {
      setMapSearchResults([]);
    } finally {
      setIsSearchingMap(false);
    }
  };

  // Select place from in-map search
  const handleSelectMapSearchResult = async (result: { latitude: number; longitude: number; label: string }) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.setView([result.latitude, result.longitude], 16, { animate: true });
    }
    await handleApplyLocation(result.latitude, result.longitude, result.label);
    setMapSearchResults([]);
    setShowMapSearch(false);
  };

  // Quick GPS detection on map
  const handleLiveGPS = async () => {
    setIsLocatingGPS(true);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
      const map = mapInstanceRef.current;
      if (map) {
        map.setView([pos.latitude, pos.longitude], 16, { animate: true });
      }
      await handleApplyLocation(pos.latitude, pos.longitude);
    } catch (err: any) {
      setPinFeedbackToast('GPS unavailable. Click anywhere on the map to place your pin manually.');
      setTimeout(() => setPinFeedbackToast(null), 4000);
    } finally {
      setIsLocatingGPS(false);
    }
  };

  const validCount = businesses.filter((b) => b.latitude && b.longitude).length;

  return (
    <div
      data-testid="business-map-view"
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-slate-100 ${
        isPinModeActive ? 'cursor-crosshair' : ''
      } ${className}`}
      style={{ height }}
    >
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className={`w-full h-full z-0 ${isPinModeActive ? 'cursor-crosshair' : ''}`} />

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Fit All Button */}
        <button
          type="button"
          onClick={handleRecenter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-850/95 backdrop-blur text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fit all businesses on map"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Fit All ({validCount})</span>
        </button>

        {/* Pin Exact Location Mode Toggle */}
        {enablePinPlacement && (
          <button
            type="button"
            onClick={() => setIsPinModeActive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border transition-all cursor-pointer ${
              isPinModeActive
                ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-400/50'
                : 'bg-white/95 dark:bg-slate-850/95 backdrop-blur text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            title="Click map to pin your exact location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isPinModeActive ? 'animate-pulse text-white' : 'text-indigo-600'}`} />
            <span>{isPinModeActive ? 'Click Map to Pin' : 'Pin Exact Location'}</span>
          </button>
        )}

        {/* Live GPS Button */}
        <button
          type="button"
          onClick={handleLiveGPS}
          disabled={isLocatingGPS}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-850/95 backdrop-blur text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-md border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Detect device GPS coordinates"
        >
          {isLocatingGPS ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-sky-600" />
          )}
          <span className="hidden sm:inline">{isLocatingGPS ? 'GPS...' : 'My GPS'}</span>
        </button>

        {/* Search Map Toggle */}
        <button
          type="button"
          onClick={() => setShowMapSearch((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border transition-colors cursor-pointer ${
            showMapSearch
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-white/95 dark:bg-slate-850/95 backdrop-blur text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Search address on map"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search Map</span>
        </button>

        {/* Legend Toggle */}
        <button
          type="button"
          onClick={() => setShowLegend((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md border transition-colors cursor-pointer ${
            showLegend
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-white/95 dark:bg-slate-850/95 backdrop-blur text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
          title="Toggle map category legend"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Legend</span>
        </button>
      </div>

      {/* In-Map Address Search Dropdown */}
      {showMapSearch && (
        <div className="absolute top-14 left-3 z-30 w-72 sm:w-84 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-xl space-y-2 animate-in fade-in">
          <form onSubmit={handleMapSearchSubmit} className="flex items-center gap-1.5">
            <input
              type="text"
              value={mapSearchQuery}
              onChange={(e) => setMapSearchQuery(e.target.value)}
              placeholder="Search street or landmark..."
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearchingMap}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shrink-0 cursor-pointer"
            >
              {isSearchingMap ? '...' : 'Go'}
            </button>
            <button
              type="button"
              onClick={() => setShowMapSearch(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </form>

          {mapSearchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {mapSearchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectMapSearchResult(res)}
                  className="w-full text-left p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg flex items-start gap-1.5 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 text-[11px] leading-snug">{res.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Active Pin Instruction Banner */}
      {isPinModeActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-indigo-900/95 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border border-indigo-700 animate-in slide-in-from-top-2">
          <Crosshair className="w-4 h-4 text-amber-300 animate-spin" />
          <span>Click anywhere on the map to place your exact location</span>
          <button
            type="button"
            onClick={() => setIsPinModeActive(false)}
            className="ml-2 px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[11px]"
          >
            Done
          </button>
        </div>
      )}

      {/* Location Pinned Toast Notification */}
      {pinFeedbackToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-emerald-900/95 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-emerald-700 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-300 shrink-0" />
          <span className="line-clamp-1">{pinFeedbackToast}</span>
        </div>
      )}

      {/* Category Legend Overlay Panel */}
      {showLegend && (
        <div className="absolute top-14 left-3 z-20 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-lg text-xs max-w-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span>Category Pins</span>
            <button
              type="button"
              onClick={() => setShowLegend(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(CATEGORY_COLORS).map(([cat, colors]) => (
              <div key={cat} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="truncate">{cat}</span>
              </div>
            ))}
            {userLocation && (
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-[11px] col-span-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0 animate-pulse" />
                <span className="font-semibold text-sky-700 dark:text-sky-400 truncate">
                  {userLocation.isExactPin ? 'Exact Pinned Location' : 'Your Location'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Business Popup Card Preview */}
      {activePopupBusiness && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-20 bg-white/95 dark:bg-slate-850/95 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <div className="relative">
            <button
              type="button"
              onClick={() => setActivePopupBusiness(null)}
              className="absolute -top-1 -right-1 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              {/* Business Image */}
              <img
                src={
                  activePopupBusiness.image ||
                  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&auto=format&fit=crop&q=80'
                }
                alt={activePopupBusiness.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />

              <div className="flex-1 min-w-0 pr-4">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{activePopupBusiness.category}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {activePopupBusiness.name}
                </h4>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{activePopupBusiness.rating || 4.9}</span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] font-normal">
                    ({activePopupBusiness.reviewCount || 40})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 truncate pr-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activePopupBusiness.address}</span>
              </div>
              {activePopupBusiness.distanceFormatted && (
                <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  {activePopupBusiness.distanceFormatted}
                </span>
              )}
            </div>

            <div className="mt-3">
              <Link
                to={
                  activePopupBusiness.slug
                    ? `/b/${activePopupBusiness.slug}`
                    : `/b/${activePopupBusiness.id}`
                }
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <span>View & Book Appointment</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Zero match overlay */}
      {validCount === 0 && (
        <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
          <Building2 className="w-10 h-10 text-slate-400 mb-2" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Service Locations Found</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
            No businesses with geographic coordinates match your current filters. Try resetting filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessMap;
