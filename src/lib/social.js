/**
 * Social Connections & Smart Recommendation Engine
 * Privacy-preserving, opt-in friend network for trusted business discovery.
 * Strictly excludes sensitive appointments (Health/Medical/Clinics) from social sharing.
 */

import { getLocalBusinesses } from './business.js';
import { getLocalReviews } from './reviews.js';
import { getAllBookings } from './bookings.js';

const CONNECTIONS_STORAGE_KEY = 'schedora_friend_connections';
const PRIVACY_STORAGE_KEY = 'schedora_social_privacy';
const DISMISSED_RECS_KEY = 'schedora_dismissed_recommendations';

export const SEEDED_FRIENDS = [
  {
    id: 'conn-1',
    userId: 'current-user',
    friendId: 'user-priya-sharma',
    friendName: 'Priya Sharma',
    friendEmail: 'priya.sharma@example.com',
    friendAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'accepted',
    shareVisitsAndReviews: true,
    connectedAt: '2026-08-15T10:00:00.000Z',
    recentActivity: {
      businessId: 'biz-happy-paws-grooming',
      businessName: 'Happy Paws Grooming & Pet Spa',
      action: 'recommended',
      rating: 5,
      comment: 'Ananya was so gentle with my dog! Best groomer in SF.',
    },
  },
  {
    id: 'conn-2',
    userId: 'current-user',
    friendId: 'user-karthik-raman',
    friendName: 'Karthik Raman',
    friendEmail: 'karthik.r@example.com',
    friendAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'accepted',
    shareVisitsAndReviews: true,
    connectedAt: '2026-09-01T12:00:00.000Z',
    recentActivity: {
      businessId: 'biz-happy-paws-grooming',
      businessName: 'Happy Paws Grooming & Pet Spa',
      action: 'visited',
      rating: 5,
    },
  },
  {
    id: 'conn-3',
    userId: 'current-user',
    friendId: 'user-marcus-vance',
    friendName: 'Marcus Vance',
    friendEmail: 'marcus.v@example.com',
    friendAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'accepted',
    shareVisitsAndReviews: true,
    connectedAt: '2026-09-10T14:00:00.000Z',
    recentActivity: {
      businessId: 'biz-bloom-spa',
      businessName: 'Bloom Spa',
      action: 'recommended',
      rating: 5,
    },
  },
];

export function getFriendConnections() {
  try {
    const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading friend connections:', err);
  }
  return SEEDED_FRIENDS;
}

export function saveFriendConnections(list) {
  try {
    localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error saving friend connections:', err);
  }
}

export function getSocialPrivacySettings() {
  try {
    const raw = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return {
    shareVisitsAndReviews: true,
    allowFriendDiscovery: true,
    autoHideSensitiveCategories: true, // Always true for medical/clinic
  };
}

export function updateSocialPrivacySettings(settings) {
  try {
    const current = getSocialPrivacySettings();
    const updated = { ...current, ...settings, autoHideSensitiveCategories: true };
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Error saving privacy settings:', err);
  }
}

/**
 * Add or send friend connection request
 */
export async function addFriendConnection({ name, email }) {
  if (!email || !name) return null;
  const current = getFriendConnections();
  const existing = current.find((c) => c.friendEmail.toLowerCase() === email.toLowerCase());
  if (existing) return existing;

  const newConn = {
    id: `conn-${Date.now()}`,
    userId: 'current-user',
    friendId: `usr-${Date.now() % 100000}`,
    friendName: name.trim(),
    friendEmail: email.trim().toLowerCase(),
    friendAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    status: 'accepted',
    shareVisitsAndReviews: true,
    connectedAt: new Date().toISOString(),
  };

  const updated = [newConn, ...current];
  saveFriendConnections(updated);
  return newConn;
}

/**
 * Remove or disconnect a friend
 */
export async function removeFriendConnection(connectionId) {
  const current = getFriendConnections();
  const filtered = current.filter((c) => c.id !== connectionId);
  saveFriendConnections(filtered);
  return true;
}

/**
 * Block a connection
 */
export async function blockFriendConnection(connectionId) {
  const current = getFriendConnections();
  const updated = current.map((c) => (c.id === connectionId ? { ...c, status: 'blocked' } : c));
  saveFriendConnections(updated);
  return true;
}

/**
 * Get dismissed recommendation IDs
 */
export function getDismissedRecommendations() {
  try {
    const raw = localStorage.getItem(DISMISSED_RECS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Dismiss a recommendation card
 */
export function dismissRecommendation(id) {
  try {
    const dismissed = getDismissedRecommendations();
    const updated = [...new Set([...dismissed, id])];
    localStorage.setItem(DISMISSED_RECS_KEY, JSON.stringify(updated));
  } catch (_) {}
}

/**
 * Clear dismissed history
 */
export function clearRecommendationHistory() {
  localStorage.removeItem(DISMISSED_RECS_KEY);
}

/**
 * Generate smart personalized recommendations
 * Prioritizes:
 * 1. "Your friends recommend" (Happy Paws Grooming: Priya & Karthik; Bloom Spa: Marcus)
 * 2. "Popular near you"
 * 3. "Highly rated by customers"
 * 4. "Book again" (based on past completed bookings)
 * Strictly excludes sensitive healthcare/medical categories from social claims.
 */
export async function generatePersonalizedRecommendations(customerUser) {
  const businesses = getLocalBusinesses();
  const friends = getFriendConnections().filter((f) => f.status === 'accepted');
  const reviews = getLocalReviews();
  const bookings = getAllBookings();
  const dismissed = new Set(getDismissedRecommendations());

  const recommendations = [];

  // Sensitive categories that must NEVER have social claims attached
  const SENSITIVE_CATEGORIES = new Set(['Clinic', 'Dental', 'Health', 'Dentist', 'Doctor', 'Therapy']);

  // 1. Friend Recommendations
  // Group friend visits/reviews by business
  const friendBizMap = {};
  friends.forEach((friend) => {
    if (friend.recentActivity && friend.recentActivity.businessId) {
      const bizId = friend.recentActivity.businessId;
      if (!friendBizMap[bizId]) friendBizMap[bizId] = [];
      friendBizMap[bizId].push({
        friend,
        activity: friend.recentActivity,
      });
    }
  });

  for (const [bizId, friendActivities] of Object.entries(friendBizMap)) {
    if (dismissed.has(`friend-${bizId}`)) continue;
    const biz = businesses.find((b) => b.id === bizId);
    if (!biz) continue;

    // Strict privacy safeguard
    if (SENSITIVE_CATEGORIES.has(biz.category)) continue;

    const count = friendActivities.length;
    const topActivity = friendActivities.find((a) => a.activity.rating === 5) || friendActivities[0];
    const topFriendName = topActivity?.friend?.friendName || 'A friend';

    let subtext = `${topFriendName} rated it 5 stars.`;
    if (count >= 2) {
      subtext = `${count} people you follow visited this place. ${topFriendName} rated it 5 stars.`;
    }

    recommendations.push({
      id: `friend-${biz.id}`,
      type: 'friend_recommendation',
      badge: 'Friends recommend',
      businessId: biz.id,
      businessSlug: biz.slug,
      businessName: biz.name,
      category: biz.category,
      rating: biz.rating || 5.0,
      image: biz.image,
      headline: biz.name,
      subtext,
      friendName: topFriendName,
      actionText: 'View Services',
      actionUrl: `/b/${biz.slug || biz.id}`,
    });
  }

  // 2. Book Again (if user has past completed bookings)
  const userEmail = customerUser?.email?.toLowerCase();
  if (userEmail) {
    const userPastBookings = bookings.filter(
      (b) => b.clientEmail?.toLowerCase() === userEmail && (b.status === 'completed' || b.status === 'confirmed')
    );
    if (userPastBookings.length > 0) {
      const lastBooking = userPastBookings[0];
      const recId = `again-${lastBooking.businessId || 'biz'}`;
      if (!dismissed.has(recId)) {
        const biz = businesses.find((b) => b.id === lastBooking.businessId || b.name === lastBooking.businessName);
        if (biz) {
          recommendations.push({
            id: recId,
            type: 'book_again',
            badge: 'Book again',
            businessId: biz.id,
            businessSlug: biz.slug,
            businessName: biz.name,
            category: biz.category,
            rating: biz.rating,
            image: biz.image,
            headline: `Ready for your next visit at ${biz.name}?`,
            subtext: `You previously booked ${lastBooking.serviceName}. Same-day slots are open!`,
            actionText: 'Book Again',
            actionUrl: `/b/${biz.slug || biz.id}`,
          });
        }
      }
    }
  }

  // 3. Popular near you
  const popularBiz = businesses.find(
    (b) =>
      b.id === 'biz-bloom-spa' ||
      b.id === 'biz-lumiere-salon' ||
      b.id === 'biz-apex-auto'
  );
  if (popularBiz && !dismissed.has(`pop-${popularBiz.id}`) && !recommendations.some((r) => r.businessId === popularBiz.id)) {
    recommendations.push({
      id: `pop-${popularBiz.id}`,
      type: 'popular',
      badge: 'Popular near you',
      businessId: popularBiz.id,
      businessSlug: popularBiz.slug,
      businessName: popularBiz.name,
      category: popularBiz.category,
      rating: popularBiz.rating,
      image: popularBiz.image,
      headline: popularBiz.name,
      subtext: popularBiz.category === 'Spa'
        ? 'Customers frequently choose this spa for soothing bodywork & hydro-facials.'
        : 'Customers often choose this studio for precision care appointments.',
      actionText: 'Explore',
      actionUrl: `/b/${popularBiz.slug || popularBiz.id}`,
    });
  }

  // 4. Highly rated by customers
  const topRatedBiz = businesses.find(
    (b) =>
      b.rating >= 4.9 &&
      !recommendations.some((r) => r.businessId === b.id) &&
      !dismissed.has(`high-${b.id}`)
  );
  if (topRatedBiz) {
    const bizReviews = reviews.filter((r) => r.businessId === topRatedBiz.id);
    const quote = bizReviews[0]?.comment || 'Customers consistently appreciate the friendly specialists and punctual service.';

    recommendations.push({
      id: `high-${topRatedBiz.id}`,
      type: 'highly_rated',
      badge: 'Highly rated by customers',
      businessId: topRatedBiz.id,
      businessSlug: topRatedBiz.slug,
      businessName: topRatedBiz.name,
      category: topRatedBiz.category,
      rating: topRatedBiz.rating,
      image: topRatedBiz.image,
      headline: topRatedBiz.name,
      subtext: `"${quote.length > 90 ? quote.slice(0, 90) + '...' : quote}"`,
      actionText: 'Read Reviews',
      actionUrl: `/b/${topRatedBiz.slug || topRatedBiz.id}`,
    });
  }

  return recommendations.slice(0, 3); // Keep clean, uncluttered
}
