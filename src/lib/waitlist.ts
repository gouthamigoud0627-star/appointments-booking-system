/**
 * Schedora Standby Waitlist Engine
 * Handles customer waitlist registration for fully booked services/dates,
 * automated slot vacancy matching, and WhatsApp / SMS opening alerts.
 */

import { sendMessage } from './messaging';

export interface WaitlistEntry {
  id: string;
  token: string; // e.g. WL-7K2P9
  businessId: string;
  businessName: string;
  businessSlug?: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  staffId?: string;
  staffName?: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTime: string; // 'any' | 'morning' | 'afternoon' | 'evening' | specific slot time
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'waiting' | 'notified' | 'converted' | 'cancelled';
  queuePosition: number;
  createdAt: string;
  notifiedAt?: string | null;
  convertedAt?: string | null;
  convertedBookingId?: string | null;
  matchedSlot?: {
    date: string;
    startTime: string;
    staffName?: string;
    claimUrl?: string;
  } | null;
}

const STORAGE_KEY_WAITLIST = 'schedora_waitlist_entries_v1';

// Seed initial realistic waitlist entries for demonstration
const SEEDED_WAITLIST: WaitlistEntry[] = [
  {
    id: 'wt-seed-1',
    token: 'WL-8F2Q9',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming',
    businessSlug: 'happy-paws-grooming',
    serviceId: 'srv-paws-1',
    serviceName: 'Full Canine Spa Grooming',
    servicePrice: 75,
    staffId: 'any',
    staffName: 'First Available Specialist',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: 'morning',
    customerName: 'Jahnavi Raja',
    customerEmail: 'jahnaviaraja0909@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    notes: 'Golden retriever, prefers early slot if someone cancels.',
    channel: 'whatsapp',
    status: 'waiting',
    queuePosition: 1,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notifiedAt: null,
    convertedAt: null,
  },
  {
    id: 'wt-seed-2',
    token: 'WL-3M4X1',
    businessId: 'biz-bloom-spa',
    businessName: 'The Bloom Sanctuary & Day Spa',
    businessSlug: 'bloom-sanctuary-day-spa',
    serviceId: 'srv-bloom-1',
    serviceName: 'Herbal Steam Therapy & Massage',
    servicePrice: 95,
    staffId: 'st-1',
    staffName: 'Elena Rostova',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferredTime: 'afternoon',
    customerName: 'Claire Beauchamp',
    customerEmail: 'claire.b@example.com',
    customerPhone: '+1 (415) 555-8910',
    notes: 'Looking for 2pm slot if possible.',
    channel: 'whatsapp',
    status: 'waiting',
    queuePosition: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notifiedAt: null,
    convertedAt: null,
  },
  {
    id: 'wt-seed-3',
    token: 'WL-5V9K2',
    businessId: 'biz-bloom-spa',
    businessName: 'The Bloom Sanctuary & Day Spa',
    businessSlug: 'bloom-sanctuary-day-spa',
    serviceId: 'srv-bloom-2',
    serviceName: 'Organic Botanical Hydro-Facial',
    servicePrice: 110,
    staffId: 'any',
    staffName: 'First Available Specialist',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: 'any',
    customerName: 'Ethan Wright',
    customerEmail: 'ewright@example.com',
    customerPhone: '+1 (415) 555-4321',
    channel: 'sms',
    status: 'notified',
    queuePosition: 1,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    notifiedAt: new Date(Date.now() - 3600000).toISOString(),
    convertedAt: null,
    matchedSlot: {
      date: new Date().toISOString().split('T')[0],
      startTime: '14:30',
      staffName: 'Elena Rostova',
      claimUrl: '/book/bloom-sanctuary-day-spa?service=srv-bloom-2&date=' + new Date().toISOString().split('T')[0] + '&slot=14:30&claimToken=WL-5V9K2',
    },
  },
];

/**
 * Fetch all entries from local storage or seeds
 */
export function getAllWaitlistEntries(): WaitlistEntry[] {
  if (typeof window === 'undefined') return SEEDED_WAITLIST;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WAITLIST);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(SEEDED_WAITLIST));
      return SEEDED_WAITLIST;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse waitlist from storage:', e);
    return SEEDED_WAITLIST;
  }
}

/**
 * Save waitlist entries
 */
export function saveWaitlistEntries(entries: WaitlistEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save waitlist entries:', e);
  }
}

/**
 * Get waitlist for a specific business
 */
export function getWaitlistForBusiness(businessId: string): WaitlistEntry[] {
  const all = getAllWaitlistEntries();
  return all.filter((w) => w.businessId === businessId);
}

/**
 * Get waitlist entries for a specific customer (by email or phone)
 */
export function getWaitlistForCustomer(customerEmail?: string, customerPhone?: string): WaitlistEntry[] {
  const all = getAllWaitlistEntries();
  const cleanEmail = (customerEmail || '').toLowerCase().trim();
  const cleanPhone = (customerPhone || '').replace(/\D/g, '');

  return all.filter((w) => {
    if (cleanEmail && w.customerEmail.toLowerCase().trim() === cleanEmail) return true;
    if (cleanPhone && (w.customerPhone || '').replace(/\D/g, '').includes(cleanPhone)) return true;
    return false;
  });
}

/**
 * Add a new standby client to the waitlist
 */
export async function addToWaitlist(data: {
  businessId: string;
  businessName: string;
  businessSlug?: string;
  serviceId: string;
  serviceName: string;
  servicePrice?: number;
  staffId?: string;
  staffName?: string;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  channel?: 'whatsapp' | 'sms' | 'email';
}): Promise<WaitlistEntry> {
  const all = getAllWaitlistEntries();

  // Generate unique 5-char alphanumeric token e.g. WL-9X3F1
  const token = 'WL-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  // Calculate queue position for this business and date
  const existingQueue = all.filter(
    (w) =>
      w.businessId === data.businessId &&
      w.preferredDate === data.preferredDate &&
      w.status === 'waiting'
  );
  const queuePosition = existingQueue.length + 1;

  const newEntry: WaitlistEntry = {
    id: 'wt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    token,
    businessId: data.businessId,
    businessName: data.businessName,
    businessSlug: data.businessSlug || data.businessId.replace('biz-', ''),
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    servicePrice: data.servicePrice || 0,
    staffId: data.staffId || 'any',
    staffName: data.staffName || 'First Available Specialist',
    preferredDate: data.preferredDate,
    preferredTime: data.preferredTime || 'any',
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    customerPhone: data.customerPhone || '',
    notes: data.notes || '',
    channel: data.channel || 'whatsapp',
    status: 'waiting',
    queuePosition,
    createdAt: new Date().toISOString(),
    notifiedAt: null,
    convertedAt: null,
  };

  const updated = [newEntry, ...all];
  saveWaitlistEntries(updated);

  // Sync with server if online
  try {
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    });
  } catch (err) {
    // offline/dev fallback
  }

  // Automatically dispatch automated WhatsApp / SMS confirmation for joining the waitlist
  try {
    sendMessage({
      business: {
        id: newEntry.businessId,
        name: newEntry.businessName,
      },
      appointment: {
        id: newEntry.id,
        serviceName: newEntry.serviceName,
        servicePrice: newEntry.servicePrice,
        date: newEntry.preferredDate,
        startTime: newEntry.preferredTime,
      },
      customer: {
        name: newEntry.customerName,
        phone: newEntry.customerPhone || '+1 (555) 234-5678',
        email: newEntry.customerEmail,
      },
      channel: newEntry.channel === 'sms' ? 'sms' : 'whatsapp',
      messageType: 'waitlist_joined',
      additionalDetails: {
        preferredDate: newEntry.preferredDate,
        preferredTime: formatTimePreference(newEntry.preferredTime),
        waitlistToken: newEntry.token,
        queuePosition: newEntry.queuePosition,
      },
    });
  } catch (err) {
    console.error('Failed to dispatch waitlist join notification:', err);
  }

  return newEntry;
}

/**
 * Manually or automatically notify a standby client when a slot opens
 */
export async function notifyWaitlistCustomer(
  waitlistId: string,
  slotDetails: {
    date: string;
    startTime: string;
    staffName?: string;
  }
): Promise<WaitlistEntry | null> {
  const all = getAllWaitlistEntries();
  const index = all.findIndex((w) => w.id === waitlistId);
  if (index === -1) return null;

  const entry = all[index];
  const claimUrl = `/book/${entry.businessSlug || entry.businessId}?service=${entry.serviceId}&date=${slotDetails.date}&slot=${slotDetails.startTime}&claimToken=${entry.token}`;

  const updatedEntry: WaitlistEntry = {
    ...entry,
    status: 'notified',
    notifiedAt: new Date().toISOString(),
    matchedSlot: {
      date: slotDetails.date,
      startTime: slotDetails.startTime,
      staffName: slotDetails.staffName || entry.staffName,
      claimUrl,
    },
  };

  all[index] = updatedEntry;
  saveWaitlistEntries(all);

  // Sync with server if online
  try {
    await fetch(`/api/waitlist/${waitlistId}/notify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotDetails, claimUrl }),
    });
  } catch (e) {
    // fallback
  }

  // Dispatch WhatsApp or SMS notification
  try {
    sendMessage({
      business: {
        id: entry.businessId,
        name: entry.businessName,
      },
      appointment: {
        id: entry.id,
        serviceName: entry.serviceName,
        date: slotDetails.date,
        startTime: slotDetails.startTime,
      },
      customer: {
        name: entry.customerName,
        phone: entry.customerPhone || '+1 (555) 234-5678',
        email: entry.customerEmail,
      },
      channel: entry.channel === 'sms' ? 'sms' : 'whatsapp',
      messageType: 'waitlist_slot_available',
      additionalDetails: {
        date: slotDetails.date,
        startTime: slotDetails.startTime,
        waitlistToken: entry.token,
        claimUrl: typeof window !== 'undefined' ? `${window.location.origin}${claimUrl}` : claimUrl,
      },
    });
  } catch (err) {
    console.error('Failed to send slot available message:', err);
  }

  return updatedEntry;
}

/**
 * Mark a waitlist entry as converted into a confirmed booking
 */
export async function convertWaitlistBooking(
  waitlistId: string,
  bookingId: string
): Promise<WaitlistEntry | null> {
  const all = getAllWaitlistEntries();
  const index = all.findIndex((w) => w.id === waitlistId);
  if (index === -1) return null;

  const updatedEntry: WaitlistEntry = {
    ...all[index],
    status: 'converted',
    convertedAt: new Date().toISOString(),
    convertedBookingId: bookingId,
  };

  all[index] = updatedEntry;
  saveWaitlistEntries(all);

  try {
    await fetch(`/api/waitlist/${waitlistId}/convert`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
  } catch (e) {}

  return updatedEntry;
}

/**
 * Remove or cancel a standby entry
 */
export async function cancelWaitlistEntry(waitlistId: string): Promise<boolean> {
  const all = getAllWaitlistEntries();
  const filtered = all.filter((w) => w.id !== waitlistId);
  saveWaitlistEntries(filtered);

  try {
    await fetch(`/api/waitlist/${waitlistId}`, { method: 'DELETE' });
  } catch (e) {}

  return true;
}

/**
 * Automatically find matching waiting standby clients when a slot opens up
 * (e.g., when an appointment is cancelled or rescheduled)
 */
export async function checkAndNotifyWaitlistForSlot(params: {
  businessId: string;
  serviceId?: string;
  date: string;
  startTime: string;
  staffId?: string;
  staffName?: string;
}): Promise<WaitlistEntry | null> {
  const all = getAllWaitlistEntries();

  // Find waiting entries for this business and date
  const candidates = all.filter((w) => {
    if (w.businessId !== params.businessId) return false;
    if (w.status !== 'waiting') return false;
    if (w.preferredDate !== params.date) return false;

    // If service matches or no service constraint
    if (params.serviceId && w.serviceId && w.serviceId !== params.serviceId) {
      return false;
    }

    // Check time window match
    if (w.preferredTime && w.preferredTime !== 'any') {
      const startHour = parseInt(params.startTime.split(':')[0], 10);
      if (w.preferredTime === 'morning' && (startHour < 6 || startHour >= 12)) return false;
      if (w.preferredTime === 'afternoon' && (startHour < 12 || startHour >= 17)) return false;
      if (w.preferredTime === 'evening' && startHour < 17) return false;
    }

    return true;
  });

  if (candidates.length === 0) return null;

  // Pick the customer who has been waiting the longest (or lowest queue position)
  candidates.sort((a, b) => a.queuePosition - b.queuePosition || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const selectedCandidate = candidates[0];

  return await notifyWaitlistCustomer(selectedCandidate.id, {
    date: params.date,
    startTime: params.startTime,
    staffName: params.staffName,
  });
}

function formatTimePreference(pref: string): string {
  switch (pref) {
    case 'morning':
      return 'Morning (8:00 AM – 12:00 PM)';
    case 'afternoon':
      return 'Afternoon (12:00 PM – 5:00 PM)';
    case 'evening':
      return 'Evening (5:00 PM – 9:00 PM)';
    case 'any':
      return 'Any open slot';
    default:
      return pref;
  }
}
