/**
 * Calendar Events Compatibility Adapter
 * Bridges appointments and bookings to calendar view structures.
 */

import { getAllBookings, getBookingsByBusiness } from './bookings.js';

export async function getEvents(businessId) {
  const bookings = await getBookingsByBusiness(businessId);
  return bookings.map((b) => ({
    id: b.id,
    title: `${b.serviceName} - ${b.customerName}`,
    start: `${b.date}T${b.startTime}:00`,
    end: `${b.date}T${b.endTime || b.startTime}:00`,
    customerName: b.customerName,
    serviceName: b.serviceName,
    status: b.status,
    token: b.token,
    price: b.price,
    notes: b.notes,
    businessId: b.businessId,
  }));
}
