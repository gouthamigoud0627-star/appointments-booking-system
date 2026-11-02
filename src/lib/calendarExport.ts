/**
 * Schedora Calendar Export Engine
 * Generates RFC 5545 compliant .ics files for Apple Calendar, Outlook, and universal iCal apps,
 * as well as one-click direct Google Calendar event generation.
 */

import { timeToMinutes } from './availability.js';

export interface BookingCalendarData {
  id?: string;
  token?: string;
  serviceName: string;
  businessName?: string;
  staffName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:00" or "10:00 AM"
  endTime?: string;
  duration?: number | string;
  price?: number | string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  address?: string;
  city?: string;
}

export interface BusinessCalendarData {
  name?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Escapes characters for iCalendar RFC 5545 compliance
 */
function escapeIcsText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Pad numbers with leading zeros
 */
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats date into iCalendar UTC format: YYYYMMDDTHHMMSSZ
 */
function formatIcsDateTime(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Parses booking date and start/end times into JavaScript Date objects
 */
export function getBookingDates(booking: BookingCalendarData): { startDate: Date; endDate: Date } {
  const [yearStr, monthStr, dayStr] = (booking.date || new Date().toISOString().split('T')[0]).split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) - 1 || 0;
  const day = parseInt(dayStr, 10) || 1;

  const startMins = timeToMinutes(booking.startTime || '10:00');
  const startHour = Math.floor(startMins / 60);
  const startMin = startMins % 60;

  const startDate = new Date(year, month, day, startHour, startMin, 0);

  let endDate: Date;
  if (booking.endTime) {
    const endMins = timeToMinutes(booking.endTime);
    const endHour = Math.floor(endMins / 60);
    const endMin = endMins % 60;
    endDate = new Date(year, month, day, endHour, endMin, 0);
  } else {
    const durationMins = typeof booking.duration === 'number' ? booking.duration : parseInt(String(booking.duration), 10) || 45;
    endDate = new Date(startDate.getTime() + durationMins * 60000);
  }

  // Fallback if end is somehow earlier or equal
  if (endDate.getTime() <= startDate.getTime()) {
    endDate = new Date(startDate.getTime() + 45 * 60000);
  }

  return { startDate, endDate };
}

/**
 * Builds rich, formatted description for calendar events
 */
function buildEventDescription(booking: BookingCalendarData, business?: BusinessCalendarData): string {
  const lines: string[] = [
    `Schedora Appointment Confirmation Pass`,
    `Arrival Token: ${booking.token || 'N/A'}`,
    `Service: ${booking.serviceName}`,
    `Specialist / Staff: ${booking.staffName || 'Available Specialist'}`,
  ];

  if (booking.customerName) {
    lines.push(`Customer: ${booking.customerName}`);
  }

  if (business?.name || booking.businessName) {
    lines.push(`Business: ${business?.name || booking.businessName}`);
  }

  const location = business?.address || booking.address;
  if (location) {
    const city = business?.city || booking.city || '';
    lines.push(`Location: ${location}${city ? `, ${city}` : ''}`);
  }

  if (booking.notes) {
    lines.push(`Client Notes: ${booking.notes}`);
  }

  lines.push('');
  lines.push(`Present your 6-character arrival token or QR code at reception for instant check-in.`);
  lines.push(`Powered by Schedora`);

  return lines.join('\n');
}

/**
 * Builds event location string
 */
function buildEventLocation(booking: BookingCalendarData, business?: BusinessCalendarData): string {
  const parts: string[] = [];
  const bizName = business?.name || booking.businessName;
  const addr = business?.address || booking.address;
  const city = business?.city || booking.city;

  if (bizName) parts.push(bizName);
  if (addr) parts.push(addr);
  if (city) parts.push(city);

  return parts.join(', ') || 'Business Location';
}

/**
 * Generates single VEVENT block RFC 5545 compliant lines
 */
function generateVEventBlock(
  booking: BookingCalendarData,
  business?: BusinessCalendarData,
  now: Date = new Date()
): string[] {
  const { startDate, endDate } = getBookingDates(booking);
  const title = `${booking.serviceName} - ${business?.name || booking.businessName || 'Schedora'}`;
  const description = buildEventDescription(booking, business);
  const location = buildEventLocation(booking, business);
  const uid = `schedora-${booking.token || booking.id || Date.now()}-${Math.random().toString(36).substring(2, 7)}@schedora.io`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsDateTime(now)}`,
    `DTSTART:${formatIcsDateTime(startDate)}`,
    `DTEND:${formatIcsDateTime(endDate)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    // 24-hour reminder alarm
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Reminder: ${title} tomorrow`)}`,
    'TRIGGER:-P1D',
    'END:VALARM',
    // 1-hour reminder alarm
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(`Reminder: ${title} in 1 hour`)}`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
  ];
}

/**
 * Generates RFC 5545 compliant .ics string for Apple Calendar / universal iCal
 */
export function generateIcsContent(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): string {
  const now = new Date();
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedora Smart Booking//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Schedora Appointments',
    ...generateVEventBlock(booking, business, now),
    'END:VCALENDAR',
  ];

  return icsLines.join('\r\n');
}

/**
 * Generates RFC 5545 compliant multi-event .ics calendar string
 */
export function generateBulkIcsContent(
  bookings: BookingCalendarData[],
  calendarName: string = 'Schedora Appointments',
  business?: BusinessCalendarData
): string {
  const now = new Date();
  const icsLines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedora Smart Booking//Calendar Bulk Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-WR-TIMEZONE:UTC',
  ];

  for (const booking of bookings) {
    icsLines.push(...generateVEventBlock(booking, business, now));
  }

  icsLines.push('END:VCALENDAR');
  return icsLines.join('\r\n');
}

/**
 * Downloads .ics file to client device
 * Opens natively in Apple Calendar (macOS, iOS, iPadOS) and Outlook (Windows)
 */
export function downloadIcsFile(
  booking: BookingCalendarData,
  business?: BusinessCalendarData,
  customFilename?: string
): void {
  const icsContent = generateIcsContent(booking, business);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename =
    customFilename ||
    `schedora-${(booking.serviceName || 'appointment')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')}-${booking.token || 'pass'}.ics`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Downloads bulk .ics calendar file containing multiple appointments
 */
export function downloadBulkIcsFile(
  bookings: BookingCalendarData[],
  filename?: string,
  calendarName?: string,
  business?: BusinessCalendarData
): void {
  if (!bookings || bookings.length === 0) return;
  const icsContent = generateBulkIcsContent(bookings, calendarName, business);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const exportFilename =
    filename || `schedora-schedule-${new Date().toISOString().split('T')[0]}.ics`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', exportFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generates one-click Google Calendar web creation URL
 */
export function getGoogleCalendarUrl(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): string {
  const { startDate, endDate } = getBookingDates(booking);
  const title = `${booking.serviceName} at ${business?.name || booking.businessName || 'Schedora'}`;
  const details = buildEventDescription(booking, business);
  const location = buildEventLocation(booking, business);

  const datesParam = `${formatIcsDateTime(startDate)}/${formatIcsDateTime(endDate)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Opens Google Calendar event in a new browser tab
 */
export function openGoogleCalendar(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): void {
  const url = getGoogleCalendarUrl(booking, business);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Generates one-click Outlook Web calendar deep link URL
 */
export function getOutlookCalendarUrl(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): string {
  const { startDate, endDate } = getBookingDates(booking);
  const title = `${booking.serviceName} - ${business?.name || booking.businessName || 'Schedora'}`;
  const details = buildEventDescription(booking, business);
  const location = buildEventLocation(booking, business);

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: details,
    location: location,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Opens Outlook Web Calendar event in a new browser tab
 */
export function openOutlookCalendar(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): void {
  const url = getOutlookCalendarUrl(booking, business);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Export specifically formatted for Apple Calendar
 * Triggering .ics download automatically launches Calendar.app on macOS & iOS
 */
export function exportToAppleCalendar(
  booking: BookingCalendarData,
  business?: BusinessCalendarData
): void {
  downloadIcsFile(booking, business, `apple-calendar-${booking.token || 'appointment'}.ics`);
}

