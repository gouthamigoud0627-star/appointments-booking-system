/**
 * LocationPickerMap Component
 * Interactive map for setting exact geographic coordinates by:
 * 1. Clicking anywhere on the map
 * 2. Dragging a high-visibility pin
 * 3. Searching any street address, landmark, or postal code
 * 4. Detecting device GPS
 * Eliminates wrong locations for customers and business storefronts.
 */

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Search,
  Check,
  X,
  Compass,
  AlertCircle,
  Building2,
  Crosshair,
  Loader2,
} from 'lucide-react';
import {
  getCurrentLocation,
  reverseGeocode,
  searchLocationAddress,
} from '../lib/location.js';

export interface LocationPickerMapProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialAddress?: string;
  markerLabel?: string;
  title?: string;
  description?: string;
  height?: string;
  onSaveLocation: (loc: { latitude: number; longitude: number; address: string }) => void;
  onCancel?: () => void;
  showSaveButton?: boolean;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLatitude = 37.7901,
  initialLongitude = -122.4205,
  initialAddress = '',
  markerLabel = 'Exact Location',
  title = 'Pin Exact Location on Map',
  description = 'Click anywhere on the map or drag the pin to set your exact location.',
  height = '420px',
  onSaveLocation,
  onCancel,
  showSaveButton = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number }>({
    latitude: Number(initialLatitude) || 37.7901,
    longitude: Number(initialLongitude) || -122.4205,
  });
  const [currentAddress, setCurrentAddress] = useState<string>(initialAddress);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ latitude: number; longitude: number; label: string }>>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  // GPS detecting state
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Update address when coordinates change
  const updateAddressForCoords = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const addr = await reverseGeocode(lat, lng);
      setCurrentAddress(addr);
    } catch (_) {
      setCurrentAddress(`Exact Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const lat = Number(initialLatitude) || 37.7901;
    const lng = Number(initialLongitude) || -122.4205;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom Draggable Location Pin Icon
    const pinIcon = L.divIcon({
      className: 'location-picker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: grab;">
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 9999px;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border: 3px solid #ffffff;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.45);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid #7c3aed;
            margin-top: -2px;
          "></div>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

    const marker = L.marker([lat, lng], {
      icon: pinIcon,
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    marker.bindTooltip(`<strong>${markerLabel}</strong><br/>Drag to adjust exact position`, {
      direction: 'top',
      offset: [0, -42],
    });

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Handle marker drag end
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      const newLat = parseFloat(position.lat.toFixed(6));
      const newLng = parseFloat(position.lng.toFixed(6));
      setCurrentCoords({ latitude: newLat, longitude: newLng });
      updateAddressForCoords(newLat, newLng);
    });

    // Handle map click to place pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      marker.setLatLng([newLat, newLng]);
      setCurrentCoords({ latitude: newLat, longitude: newLng });
      updateAddressForCoords(newLat, newLng);
    });

    // Initial address lookup if empty
    if (!initialAddress) {
      updateAddressForCoords(lat, lng);
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle address search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchLocationAddress(searchQuery);
      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (_) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Select search result
  const handleSelectSearchResult = (result: { latitude: number; longitude: number; label: string }) => {
    const lat = parseFloat(result.latitude.toFixed(6));
    const lng = parseFloat(result.longitude.toFixed(6));

    setCurrentCoords({ latitude: lat, longitude: lng });
    setCurrentAddress(result.label);
    setShowResults(false);
    setSearchQuery(result.label);

    const map = mapInstanceRef.current;
    const marker = markerRef.current;

    if (map && marker) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 17, { animate: true });
    }
  };

  // Detect GPS
  const handleDetectGPS = async () => {
    setIsDetectingGps(true);
    setGpsError(null);
    try {
      const pos = await getCurrentLocation({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      const lat = parseFloat(pos.latitude.toFixed(6));
      const lng = parseFloat(pos.longitude.toFixed(6));

      setCurrentCoords({ latitude: lat, longitude: lng });

      const map = mapInstanceRef.current;
      const marker = markerRef.current;

      if (map && marker) {
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 17, { animate: true });
      }

      await updateAddressForCoords(lat, lng);
    } catch (err: any) {
      setGpsError('Could not detect device GPS. You can search an address or click anywhere on the map.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Confirm and Save
  const handleConfirm = () => {
    onSaveLocation({
      latitude: currentCoords.latitude,
      longitude: currentCoords.longitude,
      address: currentAddress || `Lat ${currentCoords.latitude}, Lng ${currentCoords.longitude}`,
    });
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col space-y-3 p-4 sm:p-5">
      {/* Title & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={isDetectingGps}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
            title="Use device GPS location"
          >
            {isDetectingGps ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>{isDetectingGps ? 'Locating...' : 'Use My GPS'}</span>
          </button>
        </div>
      </div>

      {/* Address Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search street address, building, or area name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isSearching ? 'Searching...' : 'Find on Map'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in">
            {searchResults.map((item, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {gpsError && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Interactive Map Canvas */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

        {/* Floating crosshair prompt badge */}
        <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 pointer-events-none">
          <Crosshair className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <span>Click anywhere to move pin • Drag pin to refine</span>
        </div>
      </div>

      {/* Coordinates & Resolved Address Readout */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            Selected Location Coordinates:
          </span>
          <span className="font-mono text-slate-900 dark:text-white font-bold">
            Lat: {currentCoords.latitude.toFixed(6)}, Lng: {currentCoords.longitude.toFixed(6)}
          </span>
        </div>

        <div className="text-slate-700 dark:text-slate-200 flex items-start gap-1.5 pt-1 border-t border-slate-200/60 dark:border-slate-700">
          <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">Street Address:</span>
          {isGeocoding ? (
            <span className="text-slate-400 italic flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
            </span>
          ) : (
            <span className="font-medium text-slate-900 dark:text-white">{currentAddress || 'No address resolved'}</span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      {showSaveButton && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Exact Location</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationPickerMap;
