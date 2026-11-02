/**
 * Staff & Practitioners Service
 * Supports CRUD operations, active status toggles, service assignments,
 * break management, gender preference, and business persistence.
 */

import { getLocalBusinesses, saveLocalBusinesses } from './business.js';

export function getStaffForBusiness(businessId) {
  if (!businessId) return [];
  const businesses = getLocalBusinesses();
  const biz = businesses.find((b) => b.id === businessId);
  return (biz && biz.staff) || [];
}

export function saveStaffMember(businessId, staffData) {
  if (!businessId || !staffData) return null;
  const businesses = getLocalBusinesses();
  const bizIndex = businesses.findIndex((b) => b.id === businessId);
  if (bizIndex === -1) return null;

  const currentStaff = businesses[bizIndex].staff || [];
  let updatedStaff;

  if (staffData.id) {
    // Update existing
    updatedStaff = currentStaff.map((s) => (s.id === staffData.id ? { ...s, ...staffData } : s));
  } else {
    // Create new
    const newStaff = {
      ...staffData,
      id: 'st-' + Date.now(),
      businessId,
      rating: staffData.rating || 5.0,
      reviewCount: staffData.reviewCount || 0,
      active: staffData.active !== undefined ? staffData.active : true,
    };
    updatedStaff = [...currentStaff, newStaff];
  }

  businesses[bizIndex].staff = updatedStaff;
  saveLocalBusinesses(businesses);

  // Sync to API backend if available
  try {
    fetch('/api/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...staffData, businessId }),
    }).catch(() => {});
  } catch (_) {}

  return updatedStaff;
}

export function toggleStaffActive(businessId, staffId) {
  if (!businessId || !staffId) return [];
  const businesses = getLocalBusinesses();
  const bizIndex = businesses.findIndex((b) => b.id === businessId);
  if (bizIndex === -1) return [];

  const currentStaff = businesses[bizIndex].staff || [];
  const updatedStaff = currentStaff.map((s) =>
    s.id === staffId ? { ...s, active: !s.active } : s
  );

  businesses[bizIndex].staff = updatedStaff;
  saveLocalBusinesses(businesses);
  return updatedStaff;
}
