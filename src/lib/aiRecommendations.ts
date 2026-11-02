/**
 * Schedora Proactive AI Service Recommendation Engine
 * Analyzes customer booking history, past visit notes, and personalized preferences
 * to proactively recommend complementary add-ons and relevant service upgrades during booking.
 */

import {
  AiServiceRecommendation,
  AiRecommendationResponse,
  CustomerAiPreferences,
  Service,
} from '../types';
import { getBookingsByCustomer, getAllBookings } from './bookings.js';

export const AI_PREFERENCES_KEY = 'schedora_customer_ai_preferences';

export const DEFAULT_CUSTOMER_PREFERENCES: CustomerAiPreferences = {
  enabled: true,
  favoriteCategories: ['Salon', 'Spa', 'Beauty', 'Clinic'],
  treatmentGoalsNotes: 'Prefers organic botanicals and gentle pressure. Interested in restorative scalp therapy, deep hydration, and tension release.',
  hairPreferences: 'Shoulder length, wavy, benefits from deep moisture conditioning and gloss treatments',
  skinPreferences: 'Sensitive complexion, allergic to citrus and harsh chemical peels',
  wellnessGoals: 'Stress reduction, posture alignment, and preventative self-care',
  sensitivitiesAllergies: 'Mild sensitivity to synthetic fragrances; prefers lavender and chamomile essences',
  preferredPressure: 'Gentle to Medium',
};

/**
 * Retrieve saved Customer AI preferences
 */
export function getCustomerAiPreferences(customerEmail?: string): CustomerAiPreferences {
  try {
    const raw = localStorage.getItem(AI_PREFERENCES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.enabled === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse AI preferences:', err);
  }
  return DEFAULT_CUSTOMER_PREFERENCES;
}

/**
 * Save Customer AI preferences
 */
export function saveCustomerAiPreferences(prefs: CustomerAiPreferences): void {
  try {
    localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(prefs));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_ai_prefs_updated', { detail: prefs }));
    }
  } catch (err) {
    console.warn('Failed to save AI preferences:', err);
  }
}

/**
 * Core Proactive AI Recommendation Request
 */
export async function fetchServiceRecommendations({
  selectedService,
  availableServices = [],
  customerEmail = '',
  customerName = '',
  businessName = '',
  businessCategory = '',
}: {
  selectedService: any;
  availableServices: any[];
  customerEmail?: string;
  customerName?: string;
  businessName?: string;
  businessCategory?: string;
}): Promise<AiRecommendationResponse> {
  if (!selectedService) {
    return {
      success: false,
      source: 'heuristic-engine',
      headline: 'Recommendations',
      conciergeNote: 'Select a service to view smart recommendations.',
      recommendations: [],
    };
  }

  // 1. Gather Customer Past Booking History
  let bookingHistory: any[] = [];
  try {
    if (customerEmail) {
      const past = await getBookingsByCustomer(customerEmail);
      if (Array.isArray(past)) {
        bookingHistory = past.slice(0, 6);
      }
    }
    if (bookingHistory.length === 0) {
      // Fallback to all local bookings if same email
      const all = getAllBookings();
      const matched = all.filter(
        (b) =>
          customerEmail &&
          b.customerEmail &&
          b.customerEmail.toLowerCase() === customerEmail.toLowerCase()
      );
      bookingHistory = matched.slice(0, 6);
    }
  } catch (err) {
    console.warn('Could not load booking history for AI:', err);
  }

  // 2. Gather Customer Stored Preferences
  const preferences = getCustomerAiPreferences(customerEmail);

  // If user disabled AI recommendations in settings, return empty list gracefully
  if (preferences.enabled === false) {
    return {
      success: true,
      source: 'heuristic-engine',
      headline: 'Recommendations Disabled',
      conciergeNote: 'Proactive AI recommendations are currently paused in your preferences.',
      recommendations: [],
    };
  }

  // 3. Request Server-side AI (Gemini 3.8 Flash via backend)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/ai/recommend-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        selectedService: {
          id: selectedService.id,
          name: selectedService.name,
          category: selectedService.category || businessCategory,
          durationMinutes: selectedService.durationMinutes || parseInt(selectedService.duration, 10) || 45,
          price: selectedService.price,
          description: selectedService.description,
        },
        availableServices: availableServices.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category || businessCategory,
          duration: s.duration,
          durationMinutes: s.durationMinutes || parseInt(s.duration, 10) || 45,
          price: s.price,
          description: s.description,
        })),
        customerEmail,
        customerName,
        bookingHistory: bookingHistory.map((b) => ({
          serviceName: b.serviceName,
          date: b.date,
          notes: b.notes,
        })),
        customerPreferences: preferences,
        businessName,
        businessCategory,
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // Graceful fallback to client-side heuristic engine
    console.warn('Server AI recommendation endpoint skipped, using client engine:', err);
  }

  // 4. Client-side Heuristic Engine Fallback
  return generateClientHeuristicRecommendations(
    selectedService,
    availableServices,
    bookingHistory,
    preferences,
    businessCategory
  );
}

/**
 * Client-Side Heuristic Fallback Engine
 */
function generateClientHeuristicRecommendations(
  selectedService: any,
  availableServices: any[],
  bookingHistory: any[],
  preferences: CustomerAiPreferences,
  businessCategory: string
): AiRecommendationResponse {
  const pool = availableServices.filter((s) => s.id !== selectedService.id);
  const sName = (selectedService.name || '').toLowerCase();
  const sCat = (selectedService.category || businessCategory || '').toLowerCase();

  const historyText = bookingHistory
    .map((b) => (b.serviceName || '') + ' ' + (b.notes || ''))
    .join(' ')
    .toLowerCase();

  const userNotes = (
    (preferences.treatmentGoalsNotes || '') +
    ' ' +
    (preferences.sensitivitiesAllergies || '')
  ).toLowerCase();

  const recommendations: AiServiceRecommendation[] = [];

  for (const item of pool) {
    const itemName = (item.name || '').toLowerCase();
    let score = 70;
    let type: 'add_on' | 'alternative' | 'upgrade' = 'add_on';
    let badge = '✨ Proactive Add-on';
    let reason = '';

    // Haircut / Salon logic
    if (sName.includes('cut') || sName.includes('hair') || sCat.includes('salon')) {
      if (
        itemName.includes('condition') ||
        itemName.includes('masque') ||
        itemName.includes('detox') ||
        itemName.includes('ritual') ||
        itemName.includes('repair')
      ) {
        score = 97;
        type = 'add_on';
        badge = '✨ Recommended Add-on';
        reason = 'Pairing this conditioning treatment locks in moisture, seals cuticles, and prolongs your fresh haircut look.';
      } else if (itemName.includes('blowout') || itemName.includes('styling') || itemName.includes('gloss')) {
        score = 93;
        type = 'add_on';
        badge = '💇 Styling Session';
        reason = 'Complete your appointment with bespoke styling and shine glaze for an effortless salon-grade finish.';
      } else if (itemName.includes('balayage') || itemName.includes('color')) {
        score = 86;
        type = 'upgrade';
        badge = '💎 Color Upgrade';
        reason = 'Upgrade to hand-painted balayage dimension and bond-builder therapy for multi-tonal radiance.';
      }
    }

    // Spa / Massage logic
    else if (
      sName.includes('massage') ||
      sName.includes('steam') ||
      sName.includes('bodywork') ||
      sCat.includes('spa')
    ) {
      if (itemName.includes('stone') || itemName.includes('basalt')) {
        score = 98;
        type = 'add_on';
        badge = '🔥 Heated Stones';
        reason = 'Smooth volcanic basalt stones release deep chronic back tension and enhance circulation.';
      } else if (itemName.includes('facial') || itemName.includes('hydro')) {
        score = 94;
        type = 'add_on';
        badge = '🌿 Head-to-Toe Wellness';
        reason = 'Combine your bodywork with an organic botanical hydro-facial for a complete restorative experience.';
      } else if (itemName.includes('deep tissue') || itemName.includes('ritual')) {
        score = 90;
        type = 'upgrade';
        badge = '⭐ Therapeutic Upgrade';
        reason = 'Target stubborn neuromuscular knots with focused myofascial tension release.';
      }
    }

    // Facial / Skincare logic
    else if (sName.includes('facial') || sName.includes('skin')) {
      if (itemName.includes('steam') || itemName.includes('massage')) {
        score = 96;
        type = 'add_on';
        badge = '💆 Pore Opening Steam';
        reason = 'Herbal steam therapy and shoulder relaxation open pores for maximum serum nutrient absorption.';
      } else if (itemName.includes('detox') || itemName.includes('masque')) {
        score = 92;
        type = 'add_on';
        badge = '✨ Hydration Booster';
        reason = 'Cold-pressed floral essence mask to lock in elasticity and protect against environmental dryness.';
      }
    }

    // Dental logic
    else if (sName.includes('dental') || sName.includes('cleaning') || sCat.includes('dent')) {
      if (itemName.includes('whiten') || itemName.includes('laser')) {
        score = 97;
        type = 'add_on';
        badge = '✨ Enamel Brightening';
        reason = 'Chairside light-accelerated whitening immediately after cleaning ensures optimal shade brightening.';
      } else if (itemName.includes('scan') || itemName.includes('orthodontic')) {
        score = 91;
        type = 'alternative';
        badge = '🔍 3D Digital Scan';
        reason = 'High-definition digital orthodontic scan to inspect alignment and prevent long-term bite wear.';
      }
    }

    // Pet Care logic
    else if (sName.includes('groom') || sName.includes('bath') || sCat.includes('pet')) {
      if (itemName.includes('nail') || itemName.includes('trim')) {
        score = 97;
        type = 'add_on';
        badge = '🐾 Essential Add-on';
        reason = 'Gentle nail clipping and dremel smoothing prevents paw pain and protects sensitive pads.';
      } else if (itemName.includes('bath') || itemName.includes('brush')) {
        score = 92;
        type = 'add_on';
        badge = '🛁 Oatmeal Hydro-Spa';
        reason = 'Hypoallergenic de-shedding bath with soothing botanicals leaves coats ultra-soft and clean.';
      }
    }

    // History & preferences booster
    if (historyText && historyText.includes(itemName.slice(0, 7))) {
      score += 6;
      badge = '🌿 Based on Past Visits';
      reason = 'You previously booked this service. Pairing it today maintains your personalized self-care routine.';
    }

    if (
      userNotes &&
      (userNotes.includes(itemName.slice(0, 6)) ||
        userNotes.includes('lavender') ||
        userNotes.includes('organic') ||
        userNotes.includes('conditioning') ||
        userNotes.includes('styling'))
    ) {
      score += 5;
      badge = '🎯 Matches Your Profile';
      reason = 'Proactively suggested to align with your saved care preferences and treatment goals.';
    }

    if (!reason) {
      if (item.price <= selectedService.price) {
        type = 'add_on';
        badge = '✨ Frequently Paired';
        reason = `Commonly booked alongside ${selectedService.name} for an elevated client experience.`;
      } else {
        type = 'upgrade';
        badge = '⭐ Popular Upgrade';
        reason = 'Provides an extended, comprehensive treatment session tailored to your schedule.';
      }
    }

    recommendations.push({
      serviceId: item.id,
      serviceName: item.name,
      type,
      badge,
      reason,
      suggestedAddOnPrice: item.price,
      suggestedAddOnDurationMinutes: item.durationMinutes || parseInt(item.duration, 10) || 20,
      confidenceScore: Math.min(score, 99),
    });
  }

  recommendations.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  let headline = `Recommended Add-ons for ${selectedService.name}`;
  let conciergeNote = `Our AI analyzed your booking history and preferences to recommend these complementary enhancements.`;

  if (bookingHistory.length > 0) {
    conciergeNote = `Tailored using your ${bookingHistory.length} previous visit${
      bookingHistory.length > 1 ? 's' : ''
    } and saved care preferences.`;
  }

  return {
    success: true,
    source: 'heuristic-engine',
    headline,
    conciergeNote,
    recommendations: recommendations.slice(0, 3),
  };
}
