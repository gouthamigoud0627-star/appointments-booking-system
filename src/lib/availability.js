/**
 * Availability & Staff-Specific Slot Generation Engine
 * Handles weekly working hours, staff schedules, break periods,
 * closing cutoffs, gender filters, and collision-free slot generation.
 */

/**
 * Converts "HH:MM" (24h or with AM/PM) or "09:00 AM" string to total minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const clean = timeStr.trim().toUpperCase();

  // Check for AM/PM
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const numericPart = clean.replace(/AM|PM/g, '').trim();
  const [hStr, mStr] = numericPart.split(':');
  let hours = parseInt(hStr, 10) || 0;
  const minutes = parseInt(mStr, 10) || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * Converts total minutes from midnight to "HH:MM AM/PM" or 24-hour "HH:MM"
 */
export function minutesToTime(totalMinutes, format24 = false) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const paddedMins = mins < 10 ? `0${mins}` : mins;

  if (format24) {
    const paddedHours = hours24 < 10 ? `0${hours24}` : hours24;
    return `${paddedHours}:${paddedMins}`;
  }

  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const paddedHours12 = hours12 < 10 ? `0${hours12}` : hours12;
  return `${paddedHours12}:${paddedMins} ${period}`;
}

/**
 * Map weekday number (0=Sun, 1=Mon, ..., 6=Sat) to availability day key
 */
export function getDayKeyFromDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayIndex = date.getDay();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[dayIndex];
}

/**
 * Get weekday index 0..6 from date string
 */
export function getDayIndexFromDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay();
}

/**
 * Checks if two time intervals overlap:
 * startA < endB && endA > startB
 */
export function hasTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Check if a date string is in the past compared to today (in local timezone)
 */
export function isPastDate(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  return target < today;
}

/**
 * Core Slot Generation Function with Staff-Specific Availability
 * @param {object} params
 * @param {object} params.business - Business entity
 * @param {string} [params.serviceId] - ID of selected service
 * @param {number} [params.serviceDurationMinutes=45] - Duration in minutes
 * @param {string} params.dateStr - Target date in YYYY-MM-DD format
 * @param {Array} [params.existingBookings=[]] - List of active bookings for collision check
 * @param {string} [params.selectedStaffId] - Specific staff ID or 'any' / 'no_preference'
 * @param {string} [params.genderPreference] - 'female' | 'male' | 'no_preference'
 * @returns {Array<{ time: string, formattedTime: string, startMinutes: number, endMinutes: number, available: boolean, availableStaff: Array, assignedStaff: object }>}
 */
export function generateAvailableSlots({
  business,
  serviceId,
  serviceDurationMinutes = 45,
  dateStr,
  existingBookings = [],
  selectedStaffId = 'any',
  genderPreference = 'no_preference',
}) {
  if (!business || !dateStr) return [];

  // Reject past dates
  if (isPastDate(dateStr)) return [];

  const dayKey = getDayKeyFromDate(dateStr);
  const dayIndex = getDayIndexFromDate(dateStr);
  const weekly = business.weeklyAvailability || {};
  const daySchedule = weekly[dayKey];

  // If business day is explicitly disabled or closed
  if (daySchedule && !daySchedule.enabled) {
    return [];
  }

  const openTimeStr = (daySchedule && daySchedule.open) || business.openingTime || '09:00';
  const closeTimeStr = (daySchedule && daySchedule.close) || business.closingTime || '17:00';
  const businessBreaks = (daySchedule && daySchedule.breaks) || [];

  const openMinutes = timeToMinutes(openTimeStr);
  const closeMinutes = timeToMinutes(closeTimeStr);
  const duration = Number(serviceDurationMinutes) || 45;

  // Step increment for slots
  const stepMinutes = duration <= 30 ? 15 : 30;

  // Active bookings on this date for this business
  const activeBookingsOnDate = existingBookings.filter((b) => {
    if (b.date !== dateStr) return false;
    if (b.status === 'cancelled') return false;
    if (business.id && b.businessId && b.businessId !== business.id) return false;
    return true;
  });

  // Get business staff list
  const allStaff = (business.staff && business.staff.length > 0) ? business.staff : [];

  // Filter staff qualified for the service & active
  let candidateStaff = allStaff.filter((st) => st.active !== false);

  if (serviceId && candidateStaff.length > 0) {
    const withService = candidateStaff.filter(
      (st) => !st.serviceIds || st.serviceIds.length === 0 || st.serviceIds.includes(serviceId)
    );
    if (withService.length > 0) {
      candidateStaff = withService;
    }
  }

  // Filter by gender preference if explicitly requested
  if (genderPreference && genderPreference !== 'no_preference' && candidateStaff.length > 0) {
    const withGender = candidateStaff.filter(
      (st) => st.genderPreference && st.genderPreference.toLowerCase() === genderPreference.toLowerCase()
    );
    if (withGender.length > 0) {
      candidateStaff = withGender;
    }
  }

  // Filter by specific staff member if one was picked
  if (selectedStaffId && selectedStaffId !== 'any' && selectedStaffId !== 'no_preference') {
    candidateStaff = candidateStaff.filter((st) => st.id === selectedStaffId);
  }

  const slots = [];
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isToday = dateStr === todayStr;
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();

  for (let slotStart = openMinutes; slotStart < closeMinutes; slotStart += stepMinutes) {
    const slotEnd = slotStart + duration;

    // Rule 1: Service duration MUST fit before closing time
    if (slotEnd > closeMinutes) {
      continue;
    }

    // Rule 2: If booking for today, slot must be at least 15 minutes in the future
    if (isToday && slotStart <= currentMinutesToday + 15) {
      continue;
    }

    // Rule 3: Slot must not overlap with scheduled business breaks
    let overlapsBizBreak = false;
    for (const brk of businessBreaks) {
      const bStart = timeToMinutes(brk.start);
      const bEnd = timeToMinutes(brk.end);
      if (hasTimeOverlap(slotStart, slotEnd, bStart, bEnd)) {
        overlapsBizBreak = true;
        break;
      }
    }
    if (overlapsBizBreak) {
      continue;
    }

    // Rule 4: If staff are defined, check which staff are working and available for this slot
    if (candidateStaff.length > 0) {
      const freeStaffForSlot = candidateStaff.filter((st) => {
        // Check staff working days
        if (st.workingHours?.days && !st.workingHours.days.includes(dayIndex)) {
          return false;
        }

        // Check staff shift hours
        const staffStart = timeToMinutes(st.workingHours?.start || '09:00');
        const staffEnd = timeToMinutes(st.workingHours?.end || '17:00');
        if (slotStart < staffStart || slotEnd > staffEnd) {
          return false;
        }

        // Check staff breaks
        if (st.breakTimes && st.breakTimes.length > 0) {
          for (const sBrk of st.breakTimes) {
            const sbStart = timeToMinutes(sBrk.start);
            const sbEnd = timeToMinutes(sBrk.end);
            if (hasTimeOverlap(slotStart, slotEnd, sbStart, sbEnd)) {
              return false;
            }
          }
        }

        // Check staff existing appointment collisions
        const hasStaffCollision = activeBookingsOnDate.some((b) => {
          if (b.staffId !== st.id) return false;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = b.endTime ? timeToMinutes(b.endTime) : bStart + (b.duration || duration);
          return hasTimeOverlap(slotStart, slotEnd, bStart, bEnd);
        });

        return !hasStaffCollision;
      });

      if (freeStaffForSlot.length > 0) {
        const formattedTime = minutesToTime(slotStart);
        slots.push({
          time: minutesToTime(slotStart, true), // "09:30"
          formattedTime, // "09:30 AM"
          startMinutes: slotStart,
          endMinutes: slotEnd,
          available: true,
          availableStaff: freeStaffForSlot,
          assignedStaff: freeStaffForSlot[0], // First available qualified staff member
        });
      }
    } else {
      // General business slot calculation when no staff roster defined
      let conflictsWithBooking = false;
      for (const booking of activeBookingsOnDate) {
        const bStart = timeToMinutes(booking.startTime);
        const bEnd = booking.endTime ? timeToMinutes(booking.endTime) : bStart + (booking.duration || duration);

        if (hasTimeOverlap(slotStart, slotEnd, bStart, bEnd)) {
          conflictsWithBooking = true;
          break;
        }
      }

      if (!conflictsWithBooking) {
        const formattedTime = minutesToTime(slotStart);
        slots.push({
          time: minutesToTime(slotStart, true),
          formattedTime,
          startMinutes: slotStart,
          endMinutes: slotEnd,
          available: true,
          availableStaff: [],
          assignedStaff: null,
        });
      }
    }
  }

  return slots;
}

/**
 * Determine if a business is open right now
 */
export function isBusinessOpenNow(business) {
  if (!business) return false;
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayKey = days[now.getDay()];

  const weekly = business.weeklyAvailability;
  if (weekly && weekly[todayKey]) {
    const sched = weekly[todayKey];
    if (!sched.enabled) return false;
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const openMins = timeToMinutes(sched.open);
    const closeMins = timeToMinutes(sched.close);
    return currentMins >= openMins && currentMins < closeMins;
  }

  // Fallback to daysOpen array
  const dayAbbrs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayAbbr = dayAbbrs[now.getDay()];
  if (business.daysOpen && !business.daysOpen.includes(todayAbbr)) return false;

  const currentMins = now.getHours() * 60 + now.getMinutes();
  const openMins = timeToMinutes(business.openingTime || '09:00 AM');
  const closeMins = timeToMinutes(business.closingTime || '06:00 PM');
  return currentMins >= openMins && currentMins < closeMins;
}
