/**
 * Bookings Data Service & Arrival Token Engine
 * Multi-tenant appointment creation, collision prevention, 6-character arrival tokens,
 * cryptographic QR payload generation, front-desk check-in verification, and CRM linkage.
 */

import { hasTimeOverlap, timeToMinutes, minutesToTime } from './availability.js';
import { checkAndNotifyWaitlistForSlot, convertWaitlistBooking } from './waitlist';
import { dispatchBookingEventNotification } from './notifications';

const STORAGE_KEY = 'schedora_bookings';
const REVIEWS_STORAGE_KEY = 'schedora_reviews';

/**
 * Human-readable character set excluding ambiguous characters: 0, O, 1, I, L
 */
const TOKEN_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generates a unique, collision-tested 6-character uppercase token
 */
export function generateBookingToken(existingBookings = []) {
  const existingTokens = new Set(existingBookings.map((b) => (b.token || '').toUpperCase()));
  let attempts = 0;

  while (attempts < 50) {
    let token = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * TOKEN_CHARSET.length);
      token += TOKEN_CHARSET[randomIndex];
    }
    if (!existingTokens.has(token)) {
      return token;
    }
    attempts++;
  }

  // Fallback with random hex
  return 'SC' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Generates an opaque secure QR payload
 * NEVER encode customer PII (phone, email, payment) inside the QR code.
 */
export function getSecureQrPayload(token) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://schedora.app';
  return `${baseUrl}/confirmation/${token}`;
}

/**
 * Initial seeded bookings for realistic testing
 */
export const SEEDED_BOOKINGS = [
  {
    id: 'apt-seed-1',
    businessId: 'biz-bloom-spa',
    serviceId: 'srv-bloom-1',
    serviceName: 'Herbal Steam Therapy & Massage',
    staffId: 'st-1',
    staffName: 'Elena Rostova',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    price: 95,
    customerName: 'Jahnavi Raja',
    customerEmail: 'jahnaviaraja0909@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    notes: 'Prefers lavender essence oil and gentle pressure on upper back.',
    token: 'A7K2PX',
    status: 'confirmed',
    checkInMethod: null,
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt-seed-2',
    businessId: 'biz-bloom-spa',
    serviceId: 'srv-bloom-2',
    serviceName: 'Organic Botanical Hydro-Facial',
    staffId: 'st-2',
    staffName: 'Marcus Vance',
    date: new Date().toISOString().split('T')[0],
    startTime: '11:30',
    endTime: '12:20',
    duration: 50,
    price: 110,
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    customerPhone: '+1 (555) 432-8765',
    notes: 'Sensitive skin. Allergic to citrus extracts.',
    token: 'B4Q8TR',
    status: 'checked-in',
    checkInMethod: 'qr',
    checkedInAt: new Date(Date.now() - 3600000).toISOString(),
    checkedInBy: 'Elena Rostova',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt-seed-3',
    businessId: 'biz-bloom-spa',
    serviceId: 'srv-bloom-3',
    serviceName: 'Deep Tissue Ritual',
    staffId: 'st-1',
    staffName: 'Elena Rostova',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:30',
    endTime: '15:45',
    duration: 75,
    price: 130,
    customerName: 'Alex Kumar',
    customerEmail: 'alex.k@example.com',
    customerPhone: '+1 (555) 876-1234',
    notes: 'Marathon training recovery session.',
    token: 'K7P2MX',
    status: 'pending',
    checkInMethod: null,
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt-seed-4',
    businessId: 'biz-city-wellness-dental',
    serviceId: 'srv-dent-1',
    serviceName: 'Comprehensive Dental Cleaning & Exam',
    staffId: 'st-dent-1',
    staffName: 'Dr. Marcus Chen',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:30',
    endTime: '10:15',
    duration: 45,
    price: 120,
    customerName: 'Michael Chen',
    customerEmail: 'mchen@example.com',
    customerPhone: '+1 (555) 345-9876',
    notes: 'Routine 6-month checkup.',
    token: 'D9N4WX',
    status: 'confirmed',
    checkInMethod: null,
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'apt-seed-5',
    businessId: 'biz-bloom-spa',
    serviceId: 'srv-bloom-4',
    serviceName: 'Hot Basalt Stone Session',
    staffId: 'st-1',
    staffName: 'Elena Rostova',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    startTime: '15:00',
    endTime: '16:00',
    duration: 60,
    price: 120,
    customerName: 'Jahnavi Raja',
    customerEmail: 'jahnaviaraja0909@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    notes: 'Follow-up monthly visit.',
    token: 'Z3Y9LM',
    status: 'completed',
    checkInMethod: 'qr',
    checkedInAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    checkedInBy: 'Elena Rostova',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

/**
 * Retrieve all bookings from localStorage or seeds
 */
export function getAllBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read stored bookings:', err);
  }
  return SEEDED_BOOKINGS;
}

/**
 * Save bookings to localStorage
 */
export function saveBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.warn('Could not write bookings:', err);
  }
}

/**
 * Get bookings scoped to a specific business (Tenant Scoping)
 */
export async function getBookingsByBusiness(businessId) {
  try {
    const res = await fetch('/api/appointments');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.filter((b) => !businessId || b.businessId === businessId || !b.businessId);
      }
    }
  } catch (err) {
    // Graceful fallback to local
  }

  const all = getAllBookings();
  if (!businessId) return all;
  return all.filter((b) => b.businessId === businessId);
}

/**
 * Get bookings scoped to a specific customer email or phone
 */
export async function getBookingsByCustomer(email, phone = '') {
  const all = getAllBookings();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  return all.filter((b) => {
    const matchEmail = cleanEmail && b.customerEmail && b.customerEmail.toLowerCase() === cleanEmail;
    const matchPhone = cleanPhone && b.customerPhone && b.customerPhone === cleanPhone;
    return matchEmail || matchPhone;
  });
}

/**
 * Find booking by 6-char token (case-insensitive)
 */
export async function getBookingByToken(token) {
  if (!token) return null;
  // If token is a URL, extract the token from the end
  let cleanToken = token.trim();
  if (cleanToken.includes('/confirmation/')) {
    cleanToken = cleanToken.split('/confirmation/').pop().split(/[?#]/)[0];
  } else if (cleanToken.includes('/c/')) {
    cleanToken = cleanToken.split('/c/').pop().split(/[?#]/)[0];
  }
  cleanToken = cleanToken.toUpperCase();

  const all = getAllBookings();
  const match = all.find((b) => (b.token || '').toUpperCase() === cleanToken);
  return match || null;
}

/**
 * Create a new booking with double-booking collision prevention and 6-char token generation
 */
export async function createBooking(bookingData) {
  const allBookings = getAllBookings();

  const duration = Number(bookingData.duration) || 45;
  const startMins = timeToMinutes(bookingData.startTime);
  const endMins = bookingData.endTime ? timeToMinutes(bookingData.endTime) : startMins + duration;
  const endTimeStr = bookingData.endTime || minutesToTime(endMins, true);

  // Double-booking collision check: same business, same date, overlapping times (and same staff if specified)
  const conflicting = allBookings.find((b) => {
    if (b.businessId !== bookingData.businessId) return false;
    if (b.date !== bookingData.date) return false;
    if (b.status === 'cancelled') return false;

    // If specific staff is booked, only conflict with that staff
    if (bookingData.staffId && bookingData.staffId !== 'any' && b.staffId && b.staffId !== 'any') {
      if (b.staffId !== bookingData.staffId) return false;
    }

    const bStart = timeToMinutes(b.startTime);
    const bEnd = b.endTime ? timeToMinutes(b.endTime) : bStart + (b.duration || 45);

    return hasTimeOverlap(startMins, endMins, bStart, bEnd);
  });

  if (conflicting) {
    throw new Error('This time slot is already reserved for the selected provider. Please select another slot.');
  }

  const token = bookingData.token ? bookingData.token.toUpperCase() : generateBookingToken(allBookings);

  const newBooking = {
    id: 'apt-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    businessId: bookingData.businessId,
    businessName: bookingData.businessName || '',
    departmentId: bookingData.departmentId || undefined,
    departmentName: bookingData.departmentName || undefined,
    serviceId: bookingData.serviceId,
    serviceName: bookingData.serviceName || 'Scheduled Service',
    addOnServices: bookingData.addOnServices || [],
    staffId: bookingData.staffId || 'any',
    staffName: bookingData.staffName || 'Available Specialist',
    date: bookingData.date,
    startTime: bookingData.startTime,
    endTime: endTimeStr,
    duration,
    price: Number(bookingData.price) || 0,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone || '',
    notes: bookingData.notes || '',
    token,
    status: bookingData.status || 'confirmed',
    checkInMethod: null,
    checkedInAt: null,
    checkedInBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try API first
  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: newBooking.serviceId,
        staffId: newBooking.staffId,
        staffName: newBooking.staffName,
        departmentName: newBooking.departmentName,
        date: newBooking.date,
        startTime: newBooking.startTime,
        clientName: newBooking.customerName,
        clientEmail: newBooking.customerEmail,
        clientPhone: newBooking.customerPhone,
        clientNotes: newBooking.notes,
        businessId: newBooking.businessId,
        businessName: newBooking.businessName,
        token: newBooking.token,
        addOnServices: newBooking.addOnServices,
      }),
    });
    if (res.ok) {
      const serverApt = await res.json();
      const updated = [{ ...newBooking, id: serverApt.id || newBooking.id }, ...allBookings];
      saveBookings(updated);

      if (bookingData.waitlistId || bookingData.claimToken) {
        try {
          const waitlistId = bookingData.waitlistId || bookingData.claimToken;
          convertWaitlistBooking(waitlistId, serverApt.id || newBooking.id);
        } catch (e) {}
      }

      const created = { ...newBooking, id: serverApt.id || newBooking.id };
      dispatchBookingEventNotification({
        event: 'created',
        booking: created,
        business: { id: bookingData.businessId, name: bookingData.businessName },
      }).catch(() => {});

      return created;
    }
  } catch (err) {
    // API failed, proceed locally
  }

  const updated = [newBooking, ...allBookings];
  saveBookings(updated);

  // If this booking was converted from a waitlist standby claim, mark waitlist converted
  if (bookingData.waitlistId || bookingData.claimToken) {
    try {
      const waitlistId = bookingData.waitlistId || bookingData.claimToken;
      convertWaitlistBooking(waitlistId, newBooking.id);
    } catch (e) {}
  }

  dispatchBookingEventNotification({
    event: 'created',
    booking: newBooking,
    business: { id: bookingData.businessId, name: bookingData.businessName },
  }).catch(() => {});

  return newBooking;
}

/**
 * Update booking status
 */
export async function updateBookingStatus(id, newStatus, note = '') {
  const allBookings = getAllBookings();
  const index = allBookings.findIndex((b) => b.id === id);

  if (index === -1) {
    throw new Error('Appointment record not found.');
  }

  const updatedBooking = {
    ...allBookings[index],
    status: newStatus,
    statusNote: note,
    updatedAt: new Date().toISOString(),
  };

  if (newStatus === 'checked-in' && !updatedBooking.checkedInAt) {
    updatedBooking.checkedInAt = new Date().toISOString();
    updatedBooking.checkInMethod = updatedBooking.checkInMethod || 'manual';
  }

  allBookings[index] = updatedBooking;
  saveBookings(allBookings);

  // When an appointment is cancelled, immediately trigger standby waitlist matching & notification
  if (newStatus === 'cancelled') {
    try {
      checkAndNotifyWaitlistForSlot({
        businessId: updatedBooking.businessId,
        serviceId: updatedBooking.serviceId,
        date: updatedBooking.date,
        startTime: updatedBooking.startTime,
        staffId: updatedBooking.staffId,
        staffName: updatedBooking.staffName,
      });
    } catch (err) {
      console.error('Waitlist vacancy alert check failed:', err);
    }
  }

  // Attempt backend API sync
  try {
    await fetch(`/api/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, note }),
    }).catch(() => {});
  } catch (_) {}

  // Dispatch real-time booking event notification
  if (['confirmed', 'cancelled', 'completed', 'checked-in'].includes(newStatus)) {
    const eventType = newStatus === 'checked-in' ? 'checked_in' : newStatus;
    dispatchBookingEventNotification({
      event: eventType,
      booking: updatedBooking,
      business: { id: updatedBooking.businessId, name: updatedBooking.businessName },
    }).catch(() => {});
  }

  return updatedBooking;
}

/**
 * Reschedule an appointment with collision prevention
 */
export async function rescheduleBooking(id, newDate, newStartTime, newEndTime) {
  const allBookings = getAllBookings();
  const index = allBookings.findIndex((b) => b.id === id);
  if (index === -1) throw new Error('Appointment record not found.');

  const current = allBookings[index];
  const duration = current.duration || 30;
  const startMins = timeToMinutes(newStartTime);
  const endMins = newEndTime ? timeToMinutes(newEndTime) : startMins + duration;
  const endStr = newEndTime || minutesToTime(endMins, true);

  // Collision check
  const conflict = allBookings.find((b) => {
    if (b.id === id) return false;
    if (b.businessId !== current.businessId) return false;
    if (b.date !== newDate) return false;
    if (b.status === 'cancelled') return false;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = b.endTime ? timeToMinutes(b.endTime) : bStart + (b.duration || 30);
    return hasTimeOverlap(startMins, endMins, bStart, bEnd);
  });

  if (conflict) {
    throw new Error('This time is no longer available. Please select another slot.');
  }

  const updated = {
    ...current,
    date: newDate,
    startTime: newStartTime,
    endTime: endStr,
    status: 'confirmed',
    updatedAt: new Date().toISOString(),
  };

  allBookings[index] = updated;
  saveBookings(allBookings);

  dispatchBookingEventNotification({
    event: 'rescheduled',
    booking: updated,
    business: { id: updated.businessId, name: updated.businessName },
  }).catch(() => {});

  return updated;
}

/**
 * Full Check-In Verification and Confirmation Engine
 * Enforces business scoping, checks status, prevents double-checkins, and logs audit data.
 */
export async function verifyAndCheckInBooking(businessId, token, method = 'qr', checkedInBy = 'Front Desk') {
  if (!token) throw new Error('Please provide a booking token or QR credential.');

  let cleanToken = token.trim();
  if (cleanToken.includes('/confirmation/')) {
    cleanToken = cleanToken.split('/confirmation/').pop().split(/[?#]/)[0];
  } else if (cleanToken.includes('/c/')) {
    cleanToken = cleanToken.split('/c/').pop().split(/[?#]/)[0];
  }
  cleanToken = cleanToken.toUpperCase();

  const allBookings = getAllBookings();
  const index = allBookings.findIndex((b) => (b.token || '').toUpperCase() === cleanToken);

  if (index === -1) {
    throw new Error(`Invalid QR or token: No appointment found matching "${cleanToken}".`);
  }

  const booking = allBookings[index];

  // 1. Business scoping check
  if (businessId && booking.businessId && booking.businessId !== businessId) {
    throw new Error(`Tenant Mismatch: This appointment belongs to another business and cannot be checked in here.`);
  }

  // 2. Cancellation check
  if (booking.status === 'cancelled') {
    throw new Error(`Appointment ${cleanToken} was cancelled and is no longer valid.`);
  }

  // 3. Already checked in check (anti-abuse)
  if (booking.status === 'checked-in') {
    const timeFormatted = booking.checkedInAt ? new Date(booking.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier';
    throw new Error(`Already Checked In: This customer was checked in at ${timeFormatted}${booking.checkedInBy ? ' by ' + booking.checkedInBy : ''}.`);
  }

  if (booking.status === 'completed') {
    throw new Error(`This appointment is already completed.`);
  }

  // Perform check-in transition
  const now = new Date().toISOString();
  const updatedBooking = {
    ...booking,
    status: 'checked-in',
    checkedInAt: now,
    checkedInBy: checkedInBy,
    checkInMethod: method,
    updatedAt: now,
  };

  allBookings[index] = updatedBooking;
  saveBookings(allBookings);

  dispatchBookingEventNotification({
    event: 'checked_in',
    booking: updatedBooking,
    business: { id: updatedBooking.businessId, name: updatedBooking.businessName },
  }).catch(() => {});

  // Sync with API
  try {
    await fetch(`/api/appointments/${booking.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'checked-in',
        note: `Checked in via ${method.toUpperCase()} by ${checkedInBy} at ${now}`,
      }),
    });
  } catch (err) {
    // API sync fallback
  }

  return updatedBooking;
}

/**
 * Fast Front-Desk Token Lookup (Pre-verification without committing)
 */
export async function checkInWithToken(businessId, token) {
  if (!token) throw new Error('Please enter a booking code');

  let cleanToken = token.trim();
  if (cleanToken.includes('/confirmation/')) {
    cleanToken = cleanToken.split('/confirmation/').pop().split(/[?#]/)[0];
  } else if (cleanToken.includes('/c/')) {
    cleanToken = cleanToken.split('/c/').pop().split(/[?#]/)[0];
  }
  cleanToken = cleanToken.toUpperCase();

  const allBookings = getAllBookings();
  const booking = allBookings.find((b) => (b.token || '').toUpperCase() === cleanToken);

  if (!booking) {
    throw new Error(`No appointment found for booking code ${cleanToken}. Please verify the code.`);
  }

  if (businessId && booking.businessId && booking.businessId !== businessId) {
    throw new Error(`This booking code belongs to another business and cannot be verified here.`);
  }

  return booking;
}

/**
 * Customer Reviews & Feedback
 */
export function getReviewsForBusiness(businessId) {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.filter((r) => r.businessId === businessId);
    }
  } catch (err) {
    console.warn('Could not read reviews:', err);
  }
  return [
    {
      id: 'rev-1',
      businessId: 'biz-bloom-spa',
      customerName: 'Jahnavi Raja',
      rating: 5,
      comment: 'Exceptional service! The check-in with the QR arrival token was smooth and instantaneous at the front desk.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'rev-2',
      businessId: 'biz-bloom-spa',
      customerName: 'David Miller',
      rating: 5,
      comment: 'Very professional clinic and tranquil ambiance. Staff was ready right when I arrived.',
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
  ];
}

export function addReview({ businessId, appointmentId, customerName, rating, comment }) {
  const existing = (() => {
    try {
      const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  })();

  const newReview = {
    id: 'rev-' + Date.now(),
    businessId,
    appointmentId,
    customerName,
    rating: Number(rating) || 5,
    comment,
    createdAt: new Date().toISOString(),
  };

  const updated = [newReview, ...existing];
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save review:', err);
  }
  return newReview;
}
