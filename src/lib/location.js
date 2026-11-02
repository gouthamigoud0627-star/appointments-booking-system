/**
 * Distance and Geolocation Utilities
 * Computes exact Great-Circle distance using Haversine formula in kilometers.
 * Handles permission-based GPS location, manual city/area search, reverse geocoding,
 * and user consent controls without hardcoded fallbacks or silent country substitution.
 */

export const STORAGE_KEY_LOCATION = 'schedora_user_location_v2';
export const STORAGE_KEY_LOCATION_CONSENT = 'schedora_location_consent_v2';

/**
 * Common major metro areas for instant 1-click selection when GPS is disabled
 * Does not contain hardcoded demo fallbacks.
 */
export const POPULAR_LOCALITIES = [
  { id: 'in-hyd-banjara', name: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.4155, longitude: 78.4411 },
  { id: 'in-hyd-hitec', name: 'HITEC City / Madhapur', city: 'Hyderabad', state: 'Telangana', country: 'India', latitude: 17.4474, longitude: 78.3762 },
  { id: 'in-blr-koramangala', name: 'Koramangala', city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9352, longitude: 77.6245 },
  { id: 'in-blr-indiranagar', name: 'Indiranagar', city: 'Bengaluru', state: 'Karnataka', country: 'India', latitude: 12.9784, longitude: 77.6408 },
  { id: 'in-mum-bkc', name: 'BKC / Bandra', city: 'Mumbai', state: 'Maharashtra', country: 'India', latitude: 19.0657, longitude: 72.8687 },
  { id: 'in-del-cp', name: 'Connaught Place', city: 'New Delhi', state: 'Delhi', country: 'India', latitude: 28.6315, longitude: 77.2167 },
];

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula.
 * Returns null if any coordinate is missing, invalid, or NaN.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return null;
  }

  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    return null;
  }

  // Validate real latitude (-90 to 90) and longitude (-180 to 180) bounds
  if (numLat1 < -90 || numLat1 > 90 || numLat2 < -90 || numLat2 > 90) return null;
  if (numLon1 < -180 || numLon1 > 180 || numLon2 < -180 || numLon2 > 180) return null;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Formats a distance in kilometers to user-friendly label
 */
export function formatDistance(km, isApproximate = false) {
  if (km === null || km === undefined || isNaN(km)) return '';
  const prefix = isApproximate ? 'Approx. ' : '';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${prefix}${meters} m away`;
  }
  return `${prefix}${km.toFixed(1)} km away`;
}

/**
 * Converts GeolocationPositionError into clear, user-facing error message
 */
export function getGeolocationErrorMessage(error) {
  if (!error) return 'Unable to retrieve location.';
  // GeolocationPositionError codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
  if (error.code === 1 || error.code === 'PERMISSION_DENIED' || (error.message && error.message.toLowerCase().includes('denied'))) {
    return 'Location permission was denied. You can search your city or area manually.';
  }
  if (error.code === 2 || error.code === 'POSITION_UNAVAILABLE' || (error.message && error.message.toLowerCase().includes('unavailable'))) {
    return 'Your location is currently unavailable. Please enter your city or area manually.';
  }
  if (error.code === 3 || error.code === 'TIMEOUT' || (error.message && error.message.toLowerCase().includes('timeout'))) {
    return 'Location request timed out. Please try again or search your area manually.';
  }
  if (error.code === 0 || (error.message && error.message.toLowerCase().includes('not supported'))) {
    return 'Geolocation is not supported by your browser environment. Please search your city or area manually.';
  }
  return error.message || 'Unable to retrieve location. Please search your city or area manually.';
}

/**
 * Request device location via standard browser API with explicit user consent
 * Does NOT substitute fake/demo coordinates if denied or timed out.
 */
export function getCurrentLocation(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      const err = new Error('Geolocation is not supported by your browser environment.');
      err.code = 0;
      reject(err);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
}

/**
 * Get saved user location from localStorage with consent verification
 */
export function getSavedUserLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

/**
 * Save user location with explicit consent
 */
export function saveUserLocation(location) {
  try {
    const data = {
      ...location,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_LOCATION_CONSENT, 'true');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_location_updated', { detail: data }));
    }
  } catch (_) {}
}

/**
 * Clear and remove saved user location
 */
export function clearSavedUserLocation() {
  try {
    localStorage.removeItem(STORAGE_KEY_LOCATION);
    localStorage.removeItem(STORAGE_KEY_LOCATION_CONSENT);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_location_cleared'));
    }
  } catch (_) {}
}

/**
 * Reverse geocodes coordinates safely using Nominatim OpenStreetMap
 * Returns resolved location string ONLY when reliably determined.
 * Returns null if network fails or lookup is inconclusive (never fakes a city).
 */
export async function reverseGeocode(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const neighborhood = address.neighbourhood || address.suburb || address.quarter || address.subdistrict;
      const city = address.city || address.town || address.village || address.municipality || address.county;
      const state = address.state;
      const country = address.country;

      const parts = [neighborhood, city, country].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
      if (data.display_name) {
        const segs = data.display_name.split(',').map((s) => s.trim()).filter(Boolean);
        return segs.slice(0, 3).join(', ');
      }
    }
  } catch (_) {
    // Network or rate limit fallback
  }
  return null;
}

/**
 * Forward geocodes an address or city/area search query
 * @param {string} query
 * @returns {Promise<Array<{latitude: number, longitude: number, label: string, city: string, state: string, country: string}>>}
 */
export async function searchLocationAddress(query) {
  if (!query || typeof query !== 'string' || query.trim().length < 2) return [];
  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encoded}&limit=6&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    });
    if (res.ok) {
      const data = await res.json();
      return (data || []).map((item) => {
        const address = item.address || {};
        const city = address.city || address.town || address.village || address.county || address.municipality || '';
        const state = address.state || '';
        const country = address.country || '';
        return {
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          label: item.display_name,
          city,
          state,
          country,
          type: item.type,
        };
      });
    }
  } catch (_) {
    // Network fallback
  }
  return [];
}
