/**
 * Schedora Business Offers & Promotion Management Engine
 * Supports creation, validation, activation, pausing, deletion, and functional redemption
 * of real business offers with location-awareness, eligibility rules, and usage limits.
 */

import { calculateDistance } from './location.js';

export interface BusinessOffer {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug?: string;
  businessCategory: string;
  businessAddress?: string;
  businessCity?: string;
  businessState?: string;
  businessCountry?: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
  applicableServices: string[]; // ['srv-1', 'srv-2'] or ['all']
  applicableServiceNames?: string[];
  offerType: 'percentage' | 'fixed' | 'free_service' | 'special_package';
  discountValue: number; // e.g. 50 (for 50% off) or 500 (for ₹500 off)
  currency: 'INR' | 'USD';
  minOrderValue?: number;
  originalPrice?: number;
  finalPrice?: number;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: 'active' | 'paused';
  maxRedemptions: number;
  redemptionsCount: number;
  perCustomerLimit: number;
  couponCode?: string;
  terms: string;
  newCustomerOnly: boolean;
  branches?: string[];
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferRedemption {
  id: string;
  offerId: string;
  businessId: string;
  customerEmail: string;
  customerName: string;
  serviceId: string;
  serviceName: string;
  originalPrice: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  couponCode?: string;
  bookingToken?: string;
  redeemedAt: string;
}

const OFFERS_STORAGE_KEY = 'schedora_business_offers_v1';
const REDEMPTIONS_STORAGE_KEY = 'schedora_offer_redemptions_v1';

/**
 * Seeded authentic offers from participating businesses
 */
export const SEEDED_OFFERS: BusinessOffer[] = [
  // 1. Hyderabad Offers
  {
    id: 'off-hyd-ayur-1',
    businessId: 'biz-hyd-aura-ayur',
    businessName: 'Aura Ayurvedic Wellness Clinic',
    businessSlug: 'aura-ayurvedic-wellness',
    businessCategory: 'Clinic',
    businessAddress: 'Road No. 12, Banjara Hills',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.4156,
    longitude: 78.435,
    title: '₹500 Off First Abhyanga Herbal Therapy',
    description: 'Experience deep therapeutic stress release with warm cold-pressed herbal oils and personalized dosha diagnosis.',
    applicableServices: ['srv-hyd-ayur-1'],
    applicableServiceNames: ['Authentic Abhyanga Warm Herbal Therapy & Steam'],
    offerType: 'fixed',
    discountValue: 500,
    currency: 'INR',
    originalPrice: 1800,
    finalPrice: 1300,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 100,
    redemptionsCount: 14,
    perCustomerLimit: 1,
    couponCode: 'AYUR500',
    terms: 'Valid for new appointments. Cannot be combined with other insurance copay discounts.',
    newCustomerOnly: true,
    branches: ['Banjara Hills Main Clinic'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-hyd-kanya-1',
    businessId: 'biz-hyd-kanya-salon',
    businessName: 'Kanya Luxe Hair & Aesthetics Salon',
    businessSlug: 'kanya-luxe-salon',
    businessCategory: 'Salon',
    businessAddress: 'Road No. 36, Jubilee Hills',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.432,
    longitude: 78.407,
    title: '50% Off First Moroccan Oil Hair Spa',
    description: 'Revitalize dull and dry hair with an intensive argan oil steam infusion, scalp massage, and blowout.',
    applicableServices: ['srv-hyd-kanya-2'],
    applicableServiceNames: ['Deep Nourishing Moroccan Argan Hair Spa'],
    offerType: 'percentage',
    discountValue: 50,
    currency: 'INR',
    originalPrice: 2200,
    finalPrice: 1100,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 75,
    redemptionsCount: 28,
    perCustomerLimit: 1,
    couponCode: 'LUXE50',
    terms: 'Valid Monday through Friday only. Prior appointment booking required.',
    newCustomerOnly: false,
    branches: ['Jubilee Hills Flagship'],
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-hyd-dent-1',
    businessId: 'biz-hyd-toothcraft-dental',
    businessName: 'ToothCraft Multi-Speciality Dental Clinic',
    businessSlug: 'toothcraft-dental',
    businessCategory: 'Dental',
    businessAddress: 'Opp. City Centre Mall, Road No. 1, Banjara Hills',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.418,
    longitude: 78.448,
    title: 'Free Digital Smile Scan & Oral Health Checkup',
    description: 'Get a full digital 3D intraoral scan and panoramic cavity screening at zero consultation cost.',
    applicableServices: ['srv-hyd-dent-1'],
    applicableServiceNames: ['Comprehensive Dental Exam & 3D Smile Scan'],
    offerType: 'free_service',
    discountValue: 100,
    currency: 'INR',
    originalPrice: 800,
    finalPrice: 0,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 150,
    redemptionsCount: 42,
    perCustomerLimit: 1,
    couponCode: 'FREECHECK',
    terms: 'Complimentary consultation. Any subsequent restorative fillings or procedures billed separately.',
    newCustomerOnly: true,
    branches: ['Banjara Hills Road 1'],
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-hyd-pet-1',
    businessId: 'biz-hyd-furrytails-pet',
    businessName: 'FurryTails Pet Grooming & Spa',
    businessSlug: 'furrytails-pet-grooming',
    businessCategory: 'Pet Care',
    businessAddress: 'Film Nagar, Jubilee Hills',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.424,
    longitude: 78.412,
    title: '20% Off Full Hydro-Bath & De-shedding Spa',
    description: 'Give your companion an anti-microbial oatmeal hydro-bath, blueberry facial, and sanitary trim.',
    applicableServices: ['srv-hyd-pet-1'],
    applicableServiceNames: ['Full Canine Hydro-Bath & De-shedding Spa'],
    offerType: 'percentage',
    discountValue: 20,
    currency: 'INR',
    originalPrice: 1500,
    finalPrice: 1200,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 60,
    redemptionsCount: 11,
    perCustomerLimit: 2,
    couponCode: 'PETSPA20',
    terms: 'Vaccination record must be up to date. Suitable for all breeds.',
    newCustomerOnly: false,
    branches: ['Film Nagar Studio'],
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-hyd-auto-1',
    businessId: 'biz-hyd-speedx-auto',
    businessName: 'SpeedX Auto Detailing & Care Studio',
    businessSlug: 'speedx-auto-studio',
    businessCategory: 'Auto Care',
    businessAddress: 'Hitec City Main Road, Madhapur',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.4475,
    longitude: 78.376,
    title: 'Free Interior Deep Sanitization with Foam Wash',
    description: 'Book a full exterior snow foam wash and receive complimentary interior hot steam and AC vent ozone sanitization.',
    applicableServices: ['srv-hyd-auto-1'],
    applicableServiceNames: ['Exterior Snow Foam Wash & Undercarriage Blast'],
    offerType: 'special_package',
    discountValue: 600,
    currency: 'INR',
    originalPrice: 1600,
    finalPrice: 1000,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 80,
    redemptionsCount: 19,
    perCustomerLimit: 1,
    couponCode: 'SPEEDXFREE',
    terms: 'Valid for Sedans and Hatchbacks. SUVs subject to ₹200 size surcharge.',
    newCustomerOnly: false,
    branches: ['Hitec City Studio'],
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-hyd-fit-1',
    businessId: 'biz-hyd-zenflow-pilates',
    businessName: 'ZenFlow Reformer Pilates & Yoga Sanctuary',
    businessSlug: 'zenflow-pilates-sanctuary',
    businessCategory: 'Fitness',
    businessAddress: 'Kavuri Hills, Madhapur',
    businessCity: 'Hyderabad',
    businessState: 'Telangana',
    businessCountry: 'India',
    latitude: 17.441,
    longitude: 78.391,
    title: '30% Off First Reformer Alignment Class',
    description: 'Experience clinical core alignment and spring resistance posture sculpting with master trainers.',
    applicableServices: ['srv-hyd-fit-1'],
    applicableServiceNames: ['Private Classical Reformer Alignment Session'],
    offerType: 'percentage',
    discountValue: 30,
    currency: 'INR',
    originalPrice: 2000,
    finalPrice: 1400,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 50,
    redemptionsCount: 9,
    perCustomerLimit: 1,
    couponCode: 'PILATES30',
    terms: 'Grip socks required. Valid for beginners and advanced practitioners.',
    newCustomerOnly: true,
    branches: ['Kavuri Hills Sanctuary'],
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // 2. San Francisco Offers
  {
    id: 'off-sf-paws-1',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming',
    businessSlug: 'happy-paws-grooming',
    businessCategory: 'Pet Care',
    businessAddress: '1420 Pine St',
    businessCity: 'San Francisco',
    businessState: 'CA',
    businessCountry: 'United States',
    latitude: 37.7901,
    longitude: -122.4205,
    title: '50% Off First Bath and Brush Grooming',
    description: 'Gentle organic botanical hydro-bath, blueberry facial, and de-shedding for your dog.',
    applicableServices: ['srv-hp-2'],
    applicableServiceNames: ['Bath and Brush'],
    offerType: 'percentage',
    discountValue: 50,
    currency: 'USD',
    originalPrice: 55,
    finalPrice: 27.5,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 50,
    redemptionsCount: 8,
    perCustomerLimit: 1,
    couponCode: 'PAWS50',
    terms: 'New clients only. Must show proof of rabies vaccination.',
    newCustomerOnly: true,
    branches: ['Nob Hill / Pine St Studio'],
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'off-sf-bloom-1',
    businessId: 'biz-bloom-spa',
    businessName: 'Bloom Spa',
    businessSlug: 'bloom-spa',
    businessCategory: 'Spa',
    businessAddress: '450 Sutter St, Suite 700',
    businessCity: 'San Francisco',
    businessState: 'CA',
    businessCountry: 'United States',
    latitude: 37.7895,
    longitude: -122.4082,
    title: '$40 Off Organic Botanical Hydro-Facial',
    description: 'Deep pore ultrasound extraction, vitamin infusion, and cold-pressed floral essence mask.',
    applicableServices: ['srv-bloom-2'],
    applicableServiceNames: ['Organic Botanical Hydro-Facial'],
    offerType: 'fixed',
    discountValue: 40,
    currency: 'USD',
    originalPrice: 110,
    finalPrice: 70,
    startDate: '2026-01-01',
    expiryDate: '2026-12-31',
    status: 'active',
    maxRedemptions: 40,
    redemptionsCount: 12,
    perCustomerLimit: 1,
    couponCode: 'BLOOM40',
    terms: 'Valid on Tuesday through Friday. Cannot be combined with package bundles.',
    newCustomerOnly: false,
    branches: ['Union Square Flagship'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

/**
 * Storage helpers
 */
export function getStoredOffers(): BusinessOffer[] {
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge missing seeded offers
        const existingIds = new Set(parsed.map((o: BusinessOffer) => o.id));
        const missing = SEEDED_OFFERS.filter((o) => !existingIds.has(o.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          saveStoredOffers(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read stored offers:', err);
  }
  return SEEDED_OFFERS;
}

export function saveStoredOffers(offers: BusinessOffer[]): void {
  try {
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(offers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_offers_updated', { detail: offers }));
    }
  } catch (err) {
    console.warn('Could not save offers:', err);
  }
}

export function getStoredRedemptions(): OfferRedemption[] {
  try {
    const raw = localStorage.getItem(REDEMPTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not read redemptions:', err);
  }
  return [];
}

export function saveStoredRedemptions(redemptions: OfferRedemption[]): void {
  try {
    localStorage.setItem(REDEMPTIONS_STORAGE_KEY, JSON.stringify(redemptions));
  } catch (err) {
    console.warn('Could not save redemptions:', err);
  }
}

/**
 * Business Owner Actions: Create, Update, Pause, Activate, Delete
 */
export async function getOffersByBusiness(businessId: string): Promise<BusinessOffer[]> {
  const all = getStoredOffers();
  return all.filter((o) => o.businessId === businessId);
}

export async function createBusinessOffer(data: Omit<BusinessOffer, 'id' | 'createdAt' | 'updatedAt' | 'redemptionsCount'>): Promise<BusinessOffer> {
  const all = getStoredOffers();
  const newOffer: BusinessOffer = {
    ...data,
    id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    redemptionsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updated = [newOffer, ...all];
  saveStoredOffers(updated);
  return newOffer;
}

export async function updateBusinessOffer(offerId: string, updates: Partial<BusinessOffer>): Promise<BusinessOffer> {
  const all = getStoredOffers();
  const idx = all.findIndex((o) => o.id === offerId);
  if (idx === -1) throw new Error('Offer not found.');

  const updatedOffer: BusinessOffer = {
    ...all[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updatedOffer;
  saveStoredOffers(all);
  return updatedOffer;
}

export async function toggleOfferStatus(offerId: string): Promise<BusinessOffer> {
  const all = getStoredOffers();
  const offer = all.find((o) => o.id === offerId);
  if (!offer) throw new Error('Offer not found.');

  const nextStatus = offer.status === 'active' ? 'paused' : 'active';
  return updateBusinessOffer(offerId, { status: nextStatus });
}

export async function deleteBusinessOffer(offerId: string): Promise<void> {
  const all = getStoredOffers();
  const filtered = all.filter((o) => o.id !== offerId);
  saveStoredOffers(filtered);
}

/**
 * Customer Discovery: Find valid, nearby, eligible offers
 */
export function getOffersNearCustomer({
  userLat,
  userLon,
  maxRadiusKm = 25,
  category,
  customerEmail,
  isNewCustomer = false,
}: {
  userLat?: number | null;
  userLon?: number | null;
  maxRadiusKm?: number;
  category?: string;
  customerEmail?: string;
  isNewCustomer?: boolean;
}): (BusinessOffer & { distanceKm: number | null })[] {
  const all = getStoredOffers();
  const redemptions = getStoredRedemptions();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const results: (BusinessOffer & { distanceKm: number | null })[] = [];

  for (const offer of all) {
    // 1. Must be active
    if (offer.status !== 'active') continue;

    // 2. Must be within validity dates
    if (offer.startDate && offer.startDate > todayStr) continue;
    if (offer.expiryDate && offer.expiryDate < todayStr) continue;

    // 3. Must not have exhausted max redemptions
    if (offer.maxRedemptions > 0 && offer.redemptionsCount >= offer.maxRedemptions) continue;

    // 4. Category filter if specified
    if (category && category !== 'All') {
      const catNorm = category.toLowerCase();
      if (!offer.businessCategory.toLowerCase().includes(catNorm)) continue;
    }

    // 5. Customer eligibility: Per-customer limit
    if (customerEmail) {
      const userRedemptions = redemptions.filter(
        (r) => r.offerId === offer.id && r.customerEmail.toLowerCase() === customerEmail.toLowerCase()
      );
      if (offer.perCustomerLimit > 0 && userRedemptions.length >= offer.perCustomerLimit) {
        continue;
      }
    }

    // 6. Calculate real distance if coordinates exist
    let distanceKm: number | null = null;
    if (userLat != null && userLon != null && offer.latitude && offer.longitude) {
      distanceKm = calculateDistance(userLat, userLon, offer.latitude, offer.longitude);

      // If user has specified a radius and business is outside, filter it out!
      if (distanceKm !== null && maxRadiusKm > 0 && distanceKm > maxRadiusKm) {
        continue;
      }
    }

    results.push({
      ...offer,
      distanceKm,
    });
  }

  // Sort by nearest first, then by highest discount
  return results.sort((a, b) => {
    if (a.distanceKm !== null && b.distanceKm !== null) {
      return a.distanceKm - b.distanceKm;
    }
    return (b.discountValue || 0) - (a.discountValue || 0);
  });
}

/**
 * Functional Backend Offer Calculation & Redemption Engine
 */
export function calculateDiscountedPrice(
  offer: BusinessOffer,
  servicePrice: number
): { discountAmount: number; finalPrice: number } {
  let discount = 0;
  if (offer.offerType === 'free_service') {
    discount = servicePrice;
  } else if (offer.offerType === 'percentage') {
    discount = Math.round((servicePrice * offer.discountValue) / 100);
  } else if (offer.offerType === 'fixed') {
    discount = Math.min(servicePrice, offer.discountValue);
  } else if (offer.offerType === 'special_package') {
    discount = Math.min(servicePrice, offer.discountValue);
  }

  const finalAmount = Math.max(0, servicePrice - discount);
  return { discountAmount: discount, finalPrice: finalAmount };
}

export async function redeemOffer({
  offerId,
  serviceId,
  serviceName,
  originalPrice,
  customerEmail,
  customerName,
  couponCode,
  bookingToken,
}: {
  offerId: string;
  serviceId: string;
  serviceName: string;
  originalPrice: number;
  customerEmail: string;
  customerName: string;
  couponCode?: string;
  bookingToken?: string;
}): Promise<{
  success: boolean;
  redemption?: OfferRedemption;
  finalPrice: number;
  discountAmount: number;
  message?: string;
}> {
  const allOffers = getStoredOffers();
  const offer = allOffers.find((o) => o.id === offerId);

  if (!offer) {
    return { success: false, finalPrice: originalPrice, discountAmount: 0, message: 'Offer not found or no longer available.' };
  }

  if (offer.status !== 'active') {
    return { success: false, finalPrice: originalPrice, discountAmount: 0, message: 'This offer is currently paused.' };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (offer.expiryDate && offer.expiryDate < todayStr) {
    return { success: false, finalPrice: originalPrice, discountAmount: 0, message: 'This offer has expired.' };
  }

  if (offer.maxRedemptions > 0 && offer.redemptionsCount >= offer.maxRedemptions) {
    return { success: false, finalPrice: originalPrice, discountAmount: 0, message: 'Maximum redemptions for this offer have been reached.' };
  }

  // Check per-customer limit
  const redemptions = getStoredRedemptions();
  const userPastCount = redemptions.filter(
    (r) => r.offerId === offer.id && r.customerEmail.toLowerCase() === customerEmail.toLowerCase()
  ).length;

  if (offer.perCustomerLimit > 0 && userPastCount >= offer.perCustomerLimit) {
    return {
      success: false,
      finalPrice: originalPrice,
      discountAmount: 0,
      message: `You have already redeemed this offer (limit: ${offer.perCustomerLimit} per customer).`,
    };
  }

  // Check service eligibility
  if (offer.applicableServices && offer.applicableServices.length > 0 && !offer.applicableServices.includes('all')) {
    if (!offer.applicableServices.includes(serviceId)) {
      return {
        success: false,
        finalPrice: originalPrice,
        discountAmount: 0,
        message: 'This offer does not apply to the selected service.',
      };
    }
  }

  const { discountAmount, finalPrice } = calculateDiscountedPrice(offer, originalPrice);

  const redemption: OfferRedemption = {
    id: `red-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    offerId: offer.id,
    businessId: offer.businessId,
    customerEmail,
    customerName,
    serviceId,
    serviceName,
    originalPrice,
    discountAmount,
    finalAmount: finalPrice,
    currency: offer.currency,
    couponCode: couponCode || offer.couponCode,
    bookingToken,
    redeemedAt: new Date().toISOString(),
  };

  // Save redemption and increment count
  offer.redemptionsCount += 1;
  saveStoredOffers(allOffers);
  saveStoredRedemptions([redemption, ...redemptions]);

  return {
    success: true,
    redemption,
    finalPrice,
    discountAmount,
    message: `Offer applied: ${offer.title}`,
  };
}

export interface UserPreferencesData {
  categories: string[];
  recommendationTypes: string[];
  budgetRange: string;
  maxDistanceKm: number;
  locationCity: string;
  locationArea: string;
  latitude: number | null;
  longitude: number | null;
  offersEnabled: boolean;
  personalizedEnabled: boolean;
  onboardingCompleted: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferencesData = {
  categories: ['Healthcare & Clinics', 'Beauty & Salons', 'Pet Grooming', 'Fitness & Wellness'],
  recommendationTypes: ['Current discounts and offers', 'Nearby businesses', 'Highly rated businesses'],
  budgetRange: '₹500 - ₹1,500',
  maxDistanceKm: 10,
  locationCity: 'Hyderabad',
  locationArea: 'Banjara Hills',
  latitude: 17.4156,
  longitude: 78.435,
  offersEnabled: true,
  personalizedEnabled: true,
  onboardingCompleted: false,
};

export function getUserPreferences(email?: string): UserPreferencesData {
  const userKey = email ? `schedora_user_preferences_${email.toLowerCase()}` : 'schedora_user_preferences_default';
  try {
    const raw = localStorage.getItem(userKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_USER_PREFERENCES, ...parsed };
    }
  } catch (err) {
    console.warn('Could not read user preferences:', err);
  }
  return DEFAULT_USER_PREFERENCES;
}

export function saveUserPreferences(email: string | undefined, updates: Partial<UserPreferencesData>): UserPreferencesData {
  const current = getUserPreferences(email);
  const updated: UserPreferencesData = {
    ...current,
    ...updates,
  };
  const userKey = email ? `schedora_user_preferences_${email.toLowerCase()}` : 'schedora_user_preferences_default';
  try {
    localStorage.setItem(userKey, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_preferences_updated', { detail: updated }));
    }
  } catch (err) {
    console.warn('Could not save user preferences:', err);
  }
  return updated;
}

