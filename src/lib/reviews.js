/**
 * Reviews & Ratings Service
 * Manages verified reviews linked to completed appointments,
 * customer ratings, service-specific feedback, business replies, and moderation.
 */

import { getLocalBusinesses, saveLocalBusinesses } from './business.js';

const STORAGE_KEY = 'schedora_verified_reviews';

export const SEEDED_REVIEWS = [
  // Happy Paws Grooming
  {
    id: 'rev-hp-1',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming & Pet Spa',
    appointmentId: 'apt-demo-hp1',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Ananya was incredibly gentle with my anxious rescue pup! The de-shedding bath and teddy bear trim turned out perfect. He didn’t want to leave!',
    serviceName: 'Full Grooming',
    staffName: 'Ananya',
    createdAt: '2026-09-28T14:30:00.000Z',
    verifiedBooking: true,
    businessReply: {
      text: 'Thank you so much Priya! It was an absolute joy pampering your sweet pup. See you next month!',
      repliedAt: '2026-09-29T09:15:00.000Z',
      repliedBy: 'Happy Paws Team',
    },
  },
  {
    id: 'rev-hp-2',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming & Pet Spa',
    appointmentId: 'apt-demo-hp2',
    customerName: 'Karthik Raman',
    customerEmail: 'karthik.r@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Rahul handled our giant Golden Retriever with such skill. Best breed-specific contour cut we have ever gotten in San Francisco.',
    serviceName: 'Breed-Specific Grooming',
    staffName: 'Rahul',
    createdAt: '2026-10-02T11:00:00.000Z',
    verifiedBooking: true,
  },
  {
    id: 'rev-hp-3',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming & Pet Spa',
    appointmentId: 'apt-demo-hp3',
    customerName: 'Sneha Patel',
    customerEmail: 'sneha.patel@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Priya was so patient with our 4-month-old kitten for her first bath and nail trim. Zero stress and clean ears!',
    serviceName: 'Bath and Brush',
    staffName: 'Priya',
    createdAt: '2026-10-05T16:20:00.000Z',
    verifiedBooking: true,
  },

  // Bloom Spa
  {
    id: 'rev-bloom-1',
    businessId: 'biz-bloom-spa',
    businessName: 'Bloom Spa',
    appointmentId: 'apt-demo-bl1',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.v@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'The Herbal Steam & Hot Stone treatment relieved three weeks of desk strain in one session. Dr. Elena and her staff maintain the highest standards.',
    serviceName: 'Herbal Steam Therapy & Massage',
    staffName: 'Dr. Elena Rostova',
    createdAt: '2026-09-20T10:15:00.000Z',
    verifiedBooking: true,
  },
  {
    id: 'rev-bloom-2',
    businessId: 'biz-bloom-spa',
    businessName: 'Bloom Spa',
    appointmentId: 'apt-demo-bl2',
    customerName: 'Ananya Rao',
    customerEmail: 'ananya.r@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'The Organic Hydro-Facial left my skin radiant for days. The atmosphere is quiet, serene, and luxurious.',
    serviceName: 'Organic Botanical Hydro-Facial',
    staffName: 'Sophia Chen',
    createdAt: '2026-10-01T15:45:00.000Z',
    verifiedBooking: true,
  },

  // City Wellness Dental
  {
    id: 'rev-dent-1',
    businessId: 'biz-city-wellness-dental',
    businessName: 'City Wellness Dental',
    appointmentId: 'apt-demo-dt1',
    customerName: 'David Kim',
    customerEmail: 'david.kim@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Dr. Marcus Chen explained every step of the 3D smile scan and laser whitening. Zero pain and noticeable brightness.',
    serviceName: 'Laser Teeth Whitening Treatment',
    staffName: 'Dr. Marcus Chen',
    createdAt: '2026-09-15T09:00:00.000Z',
    verifiedBooking: true,
  },

  // Apex Precision Auto Care
  {
    id: 'rev-auto-1',
    businessId: 'biz-apex-auto',
    businessName: 'Apex European Auto Care',
    appointmentId: 'apt-demo-au1',
    customerName: 'Vikram Joshi',
    customerEmail: 'vikram.j@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Dave Hendricks provided an honest multi-point diagnosis with clear photos. No surprise fees. My brakes are smooth and silent.',
    serviceName: 'Brake System Safety Overhaul & Pad Replacement',
    staffName: 'Dave Hendricks',
    createdAt: '2026-10-03T13:30:00.000Z',
    verifiedBooking: true,
  },
];

export function getLocalReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge missing seeded reviews
        const existingIds = new Set(parsed.map((r) => r.id));
        const missing = SEEDED_REVIEWS.filter((r) => !existingIds.has(r.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          saveLocalReviews(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading reviews from localStorage:', err);
  }
  return SEEDED_REVIEWS;
}

export function saveLocalReviews(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving reviews to localStorage:', err);
  }
}

/**
 * Fetch reviews for a specific business
 */
export async function getReviewsForBusiness(businessId) {
  const all = getLocalReviews();
  return all.filter((r) => r.businessId === businessId && !r.reported);
}

/**
 * Check if customer has already submitted a review for a specific appointment
 */
export function getReviewForAppointment(appointmentId) {
  if (!appointmentId) return null;
  const all = getLocalReviews();
  return all.find((r) => r.appointmentId === appointmentId) || null;
}

/**
 * Submit verified review
 */
export async function createReview({
  businessId,
  businessName,
  appointmentId,
  customerName,
  customerEmail,
  rating,
  comment,
  serviceName,
  staffName,
}) {
  const all = getLocalReviews();

  // One review per appointment
  if (appointmentId) {
    const existingIndex = all.findIndex((r) => r.appointmentId === appointmentId);
    if (existingIndex !== -1) {
      all[existingIndex] = {
        ...all[existingIndex],
        rating: Number(rating),
        comment: comment.trim(),
        serviceName: serviceName || all[existingIndex].serviceName,
        staffName: staffName || all[existingIndex].staffName,
        createdAt: new Date().toISOString(),
      };
      saveLocalReviews(all);
      updateBusinessRating(businessId);
      return all[existingIndex];
    }
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    businessId,
    businessName: businessName || 'Verified Business',
    appointmentId: appointmentId || `apt-manual-${Date.now()}`,
    customerName: customerName || 'Verified Client',
    customerEmail: customerEmail || 'client@schedora.io',
    customerAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName || 'Client')}`,
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    comment: comment.trim(),
    serviceName: serviceName || 'General Service',
    staffName: staffName || undefined,
    createdAt: new Date().toISOString(),
    verifiedBooking: Boolean(appointmentId),
  };

  const updated = [newReview, ...all];
  saveLocalReviews(updated);
  updateBusinessRating(businessId);

  // Sync to backend /api/feedback endpoint
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview),
    });
  } catch (_) {}

  return newReview;
}

/**
 * Check if a customer has already reviewed a specific appointment
 */
export function getFeedbackForAppointment(appointmentId) {
  if (!appointmentId) return null;
  const all = getLocalReviews();
  return all.find((r) => r.appointmentId === appointmentId) || null;
}

/**
 * Edit existing review
 */
export async function updateReview(reviewId, { rating, comment }) {
  const all = getLocalReviews();
  const index = all.findIndex((r) => r.id === reviewId);
  if (index === -1) return null;

  all[index] = {
    ...all[index],
    rating: Math.min(5, Math.max(1, Number(rating) || all[index].rating)),
    comment: comment !== undefined ? comment.trim() : all[index].comment,
    updatedAt: new Date().toISOString(),
  };

  saveLocalReviews(all);
  updateBusinessRating(all[index].businessId);
  return all[index];
}

/**
 * Delete review
 */
export async function deleteReview(reviewId) {
  const all = getLocalReviews();
  const target = all.find((r) => r.id === reviewId);
  const filtered = all.filter((r) => r.id !== reviewId);
  saveLocalReviews(filtered);
  if (target) {
    updateBusinessRating(target.businessId);
  }
  return true;
}

/**
 * Business response to a review
 */
export async function replyToReview(reviewId, replyText, repliedBy = 'Business Owner') {
  const all = getLocalReviews();
  const index = all.findIndex((r) => r.id === reviewId);
  if (index === -1) return null;

  all[index].businessReply = {
    text: replyText.trim(),
    repliedAt: new Date().toISOString(),
    repliedBy,
  };

  saveLocalReviews(all);
  return all[index];
}

/**
 * Report review for moderation
 */
export async function reportReview(reviewId, reason = 'Flagged by user') {
  const all = getLocalReviews();
  const index = all.findIndex((r) => r.id === reviewId);
  if (index === -1) return null;

  all[index].reported = true;
  all[index].reportReason = reason;
  saveLocalReviews(all);
  return all[index];
}

/**
 * Recalculate average rating and review count for a business
 */
function updateBusinessRating(businessId) {
  try {
    const allReviews = getLocalReviews().filter((r) => r.businessId === businessId && !r.reported);
    if (allReviews.length === 0) return;

    const totalStars = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalStars / allReviews.length).toFixed(1));

    const businesses = getLocalBusinesses();
    const updated = businesses.map((b) => {
      if (b.id === businessId) {
        return {
          ...b,
          rating: avg,
          reviewCount: allReviews.length,
        };
      }
      return b;
    });
    saveLocalBusinesses(updated);
  } catch (err) {
    console.warn('Failed to update business rating:', err);
  }
}
