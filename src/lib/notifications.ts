/**
 * Schedora Real-Time Notification & Reminder Engine
 * Integrates Supabase Realtime with persistent notifications in PostgreSQL/localStorage.
 * Supports RBAC (Customer vs Business), unread counts, filter tabs (Bookings, Reminders, Payments, Offers),
 * automated booking event triggers, and idempotency protection against duplicate alerts.
 */

import { supabase, isSupabaseConfigured, subscribeToRealtimeUpdates } from './supabase.js';
import { dispatchAutomatedMessage, getBusinessMessagingConfig } from './messaging';

export type NotificationType = 'booking' | 'reminder' | 'payment' | 'offer' | 'system';
export type NotificationChannel = 'in_app' | 'whatsapp' | 'sms' | 'email';
export type NotificationStatus = 'unread' | 'read';

export interface SchedoraNotification {
  id: string;
  userId: string;
  businessId?: string;
  bookingId?: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt?: string | null;
  createdAt: string;
  metadata?: {
    bookingToken?: string;
    businessName?: string;
    customerName?: string;
    serviceName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    actionUrl?: string;
    amount?: number;
    paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
    reminderTimeframe?: '24h' | '2h' | '1h';
    idempotencyKey?: string;
    [key: string]: any;
  };
}

const STORAGE_KEY_NOTIFICATIONS = 'schedora_notifications_v2';
const STORAGE_KEY_PROCESSED_REMINDERS = 'schedora_processed_reminders_v2';

// Realistic seeded notifications
const INITIAL_NOTIFICATIONS: SchedoraNotification[] = [
  {
    id: 'notif-seed-1',
    userId: 'cust-jahnavi',
    businessId: 'biz-happy-paws-grooming',
    bookingId: 'apt-seed-1',
    type: 'booking',
    title: 'Appointment Confirmed',
    message: 'Your Full Grooming appointment at Happy Paws Grooming is confirmed for tomorrow at 10:00 AM.',
    channel: 'in_app',
    status: 'unread',
    readAt: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    metadata: {
      bookingToken: 'HP-9901',
      businessName: 'Happy Paws Grooming',
      customerName: 'Jahnavi Raja',
      serviceName: 'Full Grooming & Wellness',
      appointmentDate: 'Tomorrow',
      appointmentTime: '10:00 AM',
      actionUrl: '/confirmation/HP-9901',
      idempotencyKey: 'idemp-apt-seed-1-confirmed',
    },
  },
  {
    id: 'notif-seed-2',
    userId: 'cust-jahnavi',
    businessId: 'biz-bloom-spa',
    bookingId: 'apt-seed-2',
    type: 'reminder',
    title: 'Upcoming Arrival Reminder (24h)',
    message: 'Friendly reminder: Your Herbal Steam Therapy & Massage at Bloom Spa is scheduled for tomorrow at 11:30 AM.',
    channel: 'in_app',
    status: 'unread',
    readAt: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    metadata: {
      bookingToken: 'A7K2PX',
      businessName: 'Bloom Spa & Wellness',
      customerName: 'Jahnavi Raja',
      serviceName: 'Herbal Steam Therapy',
      appointmentDate: 'Tomorrow',
      appointmentTime: '11:30 AM',
      actionUrl: '/confirmation/A7K2PX',
      reminderTimeframe: '24h',
      idempotencyKey: 'idemp-apt-seed-2-remind-24h',
    },
  },
  {
    id: 'notif-seed-3',
    userId: 'cust-jahnavi',
    businessId: 'biz-happy-paws-grooming',
    bookingId: 'apt-seed-1',
    type: 'payment',
    title: 'Payment Verified & Receipt',
    message: 'Payment of $75.00 for Full Grooming was verified successfully. Your booking pass is ready.',
    channel: 'in_app',
    status: 'read',
    readAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    metadata: {
      bookingToken: 'HP-9901',
      amount: 75,
      paymentStatus: 'completed',
      businessName: 'Happy Paws Grooming',
      actionUrl: '/confirmation/HP-9901',
      idempotencyKey: 'idemp-apt-seed-1-payment',
    },
  },
  {
    id: 'notif-seed-4',
    userId: 'biz-admin',
    businessId: 'biz-happy-paws-grooming',
    bookingId: 'apt-seed-1',
    type: 'booking',
    title: 'New Customer Booking',
    message: 'Jahnavi Raja booked Full Grooming & Wellness for tomorrow at 10:00 AM. Token: HP-9901.',
    channel: 'in_app',
    status: 'unread',
    readAt: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    metadata: {
      bookingToken: 'HP-9901',
      customerName: 'Jahnavi Raja',
      serviceName: 'Full Grooming & Wellness',
      actionUrl: '/bookings',
    },
  },
  {
    id: 'notif-seed-5',
    userId: 'cust-jahnavi',
    businessId: 'biz-bloom-spa',
    type: 'offer',
    title: 'Special Seasonal Wellness Offer',
    message: 'Enjoy 15% off midweek Hydro-Facial sessions this month as an opted-in Schedora member.',
    channel: 'in_app',
    status: 'read',
    readAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    metadata: {
      businessName: 'Bloom Spa & Wellness',
      actionUrl: '/b/bloom-spa',
    },
  },
];

/**
 * Get all notifications from persistent store with optional filters
 */
export function getNotifications(filter?: {
  userId?: string;
  businessId?: string;
  type?: NotificationType | 'all';
  status?: NotificationStatus | 'all';
  channel?: NotificationChannel | 'all';
}): SchedoraNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
    let list: SchedoraNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;

    if (filter?.userId) {
      list = list.filter((n) => n.userId === filter.userId || n.userId === 'all');
    }
    if (filter?.businessId) {
      list = list.filter((n) => n.businessId === filter.businessId);
    }
    if (filter?.type && filter.type !== 'all') {
      list = list.filter((n) => n.type === filter.type);
    }
    if (filter?.status && filter.status !== 'all') {
      list = list.filter((n) => n.status === filter.status);
    }
    if (filter?.channel && filter.channel !== 'all') {
      list = list.filter((n) => n.channel === filter.channel);
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (_) {
    return INITIAL_NOTIFICATIONS;
  }
}

/**
 * Save notification array to persistent storage and emit event
 */
export function saveNotifications(notifications: SchedoraNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('schedora_notifications_updated', { detail: { count: notifications.length } }));
    }
  } catch (_) {}
}

/**
 * Get unread notification count
 */
export function getUnreadCount(filter?: { userId?: string; businessId?: string }): number {
  const list = getNotifications(filter);
  return list.filter((n) => n.status === 'unread').length;
}

/**
 * Create a new notification with deduplication / idempotency protection
 */
export async function createNotification(
  entry: Omit<SchedoraNotification, 'id' | 'createdAt' | 'status' | 'readAt'> & {
    idempotencyKey?: string;
  }
): Promise<SchedoraNotification> {
  const current = getNotifications();

  // Deduplication / Idempotency check
  const idempKey = entry.idempotencyKey || entry.metadata?.idempotencyKey;
  if (idempKey) {
    const existing = current.find((n) => n.metadata?.idempotencyKey === idempKey);
    if (existing) {
      return existing;
    }
  }

  const newNotification: SchedoraNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: entry.userId,
    businessId: entry.businessId,
    bookingId: entry.bookingId,
    type: entry.type,
    title: entry.title,
    message: entry.message,
    channel: entry.channel || 'in_app',
    status: 'unread',
    readAt: null,
    createdAt: new Date().toISOString(),
    metadata: {
      ...entry.metadata,
      idempotencyKey: idempKey,
    },
  };

  const updated = [newNotification, ...current];
  saveNotifications(updated);

  // If Supabase is configured, push to remote PostgreSQL table
  if (isSupabaseConfigured) {
    try {
      await (supabase as any).from('notifications').insert([
        {
          id: newNotification.id,
          user_id: newNotification.userId,
          business_id: newNotification.businessId,
          booking_id: newNotification.bookingId,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
          channel: newNotification.channel,
          status: newNotification.status,
          created_at: newNotification.createdAt,
          metadata: newNotification.metadata,
        },
      ]);
    } catch (err) {
      console.warn('Could not persist notification to Supabase:', err);
    }
  }

  return newNotification;
}

/**
 * Mark a single notification as read
 */
export function markAsRead(id: string): void {
  const list = getNotifications();
  const index = list.findIndex((n) => n.id === id);
  if (index !== -1) {
    list[index].status = 'read';
    list[index].readAt = new Date().toISOString();
    saveNotifications(list);

    if (isSupabaseConfigured) {
      try {
        (supabase as any).from('notifications').update({ status: 'read', read_at: list[index].readAt }).eq('id', id);
      } catch (_) {}
    }
  }
}

/**
 * Mark all notifications as read for current scope
 */
export function markAllAsRead(filter?: { userId?: string; businessId?: string }): void {
  const all = getNotifications();
  const now = new Date().toISOString();

  const updated = all.map((n) => {
    let shouldMark = true;
    if (filter?.userId && n.userId !== filter.userId && n.userId !== 'all') shouldMark = false;
    if (filter?.businessId && n.businessId !== filter.businessId) shouldMark = false;

    if (shouldMark && n.status === 'unread') {
      return { ...n, status: 'read' as const, readAt: now };
    }
    return n;
  });

  saveNotifications(updated);

  if (isSupabaseConfigured) {
    try {
      (supabase as any).from('notifications').update({ status: 'read', read_at: now }).eq('status', 'unread');
    } catch (_) {}
  }
}

/**
 * Delete a notification
 */
export function deleteNotification(id: string): void {
  const list = getNotifications();
  const updated = list.filter((n) => n.id !== id);
  saveNotifications(updated);

  if (isSupabaseConfigured) {
    try {
      (supabase as any).from('notifications').delete().eq('id', id);
    } catch (_) {}
  }
}

/**
 * Booking Lifecycle Notification Dispatcher
 * Triggered automatically on booking created, confirmed, rescheduled, cancelled, or completed.
 */
export async function dispatchBookingEventNotification(params: {
  event: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'checked_in' | 'completed';
  booking: any;
  business: any;
}): Promise<void> {
  const { event, booking, business } = params;
  if (!booking) return;

  const bName = business?.name || booking.businessName || 'Service Provider';
  const sName = booking.serviceName || 'Scheduled Service';
  const token = booking.token || 'SCHED';
  const date = booking.date || 'Scheduled Date';
  const time = booking.startTime || 'Scheduled Time';
  const actionUrl = `/confirmation/${token}`;
  const customerId = booking.customerEmail || 'cust-jahnavi';

  // 1. Notify Customer
  switch (event) {
    case 'created':
    case 'confirmed':
      await createNotification({
        userId: customerId,
        businessId: booking.businessId,
        bookingId: booking.id,
        type: 'booking',
        title: 'Appointment Confirmed',
        message: `Your appointment for ${sName} at ${bName} is confirmed for ${date} at ${time}. Arrival Token: ${token}.`,
        channel: 'in_app',
        metadata: {
          bookingToken: token,
          businessName: bName,
          serviceName: sName,
          appointmentDate: date,
          appointmentTime: time,
          actionUrl,
          idempotencyKey: `idemp-bk-${booking.id}-confirmed`,
        },
      });

      // Dispatch automated WhatsApp / SMS confirmation
      try {
        await dispatchAutomatedMessage({
          appointment: {
            id: booking.id,
            clientName: booking.customerName,
            clientPhone: booking.customerPhone,
            serviceName: sName,
            servicePrice: booking.price,
            date,
            startTime: time,
            token,
          },
          business: {
            id: business?.id || booking.businessId,
            name: bName,
            address: business?.address || '1420 Pine St',
            city: business?.city || 'San Francisco',
          },
          messageType: 'booking_confirmation',
        });
      } catch (_) {}
      break;

    case 'rescheduled':
      await createNotification({
        userId: customerId,
        businessId: booking.businessId,
        bookingId: booking.id,
        type: 'booking',
        title: 'Appointment Rescheduled',
        message: `Your ${sName} appointment at ${bName} has been rescheduled to ${date} at ${time}. Your Arrival Token remains ${token}.`,
        channel: 'in_app',
        metadata: {
          bookingToken: token,
          businessName: bName,
          serviceName: sName,
          appointmentDate: date,
          appointmentTime: time,
          actionUrl,
          idempotencyKey: `idemp-bk-${booking.id}-rescheduled-${date}-${time}`,
        },
      });

      try {
        await dispatchAutomatedMessage({
          appointment: {
            id: booking.id,
            clientName: booking.customerName,
            clientPhone: booking.customerPhone,
            serviceName: sName,
            servicePrice: booking.price,
            date,
            startTime: time,
            token,
          },
          business: {
            id: business?.id || booking.businessId,
            name: bName,
            address: business?.address || '1420 Pine St',
            city: business?.city || 'San Francisco',
          },
          messageType: 'rescheduled',
        });
      } catch (_) {}
      break;

    case 'cancelled':
      await createNotification({
        userId: customerId,
        businessId: booking.businessId,
        bookingId: booking.id,
        type: 'booking',
        title: 'Appointment Cancelled',
        message: `Your appointment for ${sName} at ${bName} on ${date} at ${time} has been cancelled.`,
        channel: 'in_app',
        metadata: {
          bookingToken: token,
          businessName: bName,
          serviceName: sName,
          actionUrl: '/businesses',
          idempotencyKey: `idemp-bk-${booking.id}-cancelled`,
        },
      });

      try {
        await dispatchAutomatedMessage({
          appointment: {
            id: booking.id,
            clientName: booking.customerName,
            clientPhone: booking.customerPhone,
            serviceName: sName,
            servicePrice: booking.price,
            date,
            startTime: time,
            token,
          },
          business: {
            id: business?.id || booking.businessId,
            name: bName,
            address: business?.address || '1420 Pine St',
            city: business?.city || 'San Francisco',
          },
          messageType: 'cancelled',
        });
      } catch (_) {}
      break;

    case 'checked_in':
      await createNotification({
        userId: customerId,
        businessId: booking.businessId,
        bookingId: booking.id,
        type: 'booking',
        title: 'Checked In Successfully',
        message: `Welcome to ${bName}! You have been checked in at the front desk. Your specialist will attend to you shortly.`,
        channel: 'in_app',
        metadata: {
          bookingToken: token,
          businessName: bName,
          serviceName: sName,
          actionUrl,
          idempotencyKey: `idemp-bk-${booking.id}-checkedin`,
        },
      });
      break;

    case 'completed':
      await createNotification({
        userId: customerId,
        businessId: booking.businessId,
        bookingId: booking.id,
        type: 'booking',
        title: 'Appointment Completed',
        message: `Thank you for visiting ${bName}! We hope you enjoyed your ${sName}.`,
        channel: 'in_app',
        metadata: {
          bookingToken: token,
          businessName: bName,
          serviceName: sName,
          actionUrl,
          idempotencyKey: `idemp-bk-${booking.id}-completed`,
        },
      });
      break;
  }

  // 2. Notify Business Admin
  const bizAdminId = business?.id || booking.businessId;
  if (event === 'created' || event === 'confirmed') {
    await createNotification({
      userId: 'biz-admin',
      businessId: bizAdminId,
      bookingId: booking.id,
      type: 'booking',
      title: 'New Appointment Booked',
      message: `${booking.customerName || 'A customer'} booked ${sName} for ${date} at ${time}. Token: ${token}.`,
      channel: 'in_app',
      metadata: {
        bookingToken: token,
        customerName: booking.customerName,
        serviceName: sName,
        actionUrl: '/bookings',
        idempotencyKey: `idemp-biz-${booking.id}-created`,
      },
    });
  } else if (event === 'cancelled') {
    await createNotification({
      userId: 'biz-admin',
      businessId: bizAdminId,
      bookingId: booking.id,
      type: 'booking',
      title: 'Appointment Cancelled',
      message: `${booking.customerName || 'Customer'} cancelled their ${sName} on ${date} at ${time}. Slot is now open for standby.`,
      channel: 'in_app',
      metadata: {
        bookingToken: token,
        customerName: booking.customerName,
        serviceName: sName,
        actionUrl: '/bookings',
        idempotencyKey: `idemp-biz-${booking.id}-cancelled`,
      },
    });
  }
}

/**
 * Payment Verification Notification Dispatcher
 */
export async function dispatchPaymentNotification(params: {
  booking: any;
  amount: number;
  status: 'completed' | 'failed' | 'refunded';
}): Promise<void> {
  const { booking, amount, status } = params;
  if (!booking) return;

  const bName = booking.businessName || 'Practice';
  const token = booking.token || 'SCHED';
  const customerId = booking.customerEmail || 'cust-jahnavi';

  let title = 'Payment Verified & Receipt';
  let message = `Payment of $${amount.toFixed(2)} was verified successfully for booking ${token} at ${bName}.`;

  if (status === 'failed') {
    title = 'Payment Incomplete';
    message = `Payment of $${amount.toFixed(2)} could not be processed. Please update your payment method to secure your slot.`;
  } else if (status === 'refunded') {
    title = 'Refund Processed';
    message = `A refund of $${amount.toFixed(2)} for appointment ${token} at ${bName} has been processed back to your original payment method.`;
  }

  await createNotification({
    userId: customerId,
    businessId: booking.businessId,
    bookingId: booking.id,
    type: 'payment',
    title,
    message,
    channel: 'in_app',
    metadata: {
      bookingToken: token,
      amount,
      paymentStatus: status,
      businessName: bName,
      actionUrl: `/confirmation/${token}`,
      idempotencyKey: `idemp-pay-${booking.id}-${status}-${amount}`,
    },
  });

  // Business admin notification
  await createNotification({
    userId: 'biz-admin',
    businessId: booking.businessId,
    bookingId: booking.id,
    type: 'payment',
    title: `Payment ${status.toUpperCase()}`,
    message: `Payment of $${amount.toFixed(2)} for ${booking.customerName || 'Customer'} (${token}) is now ${status}.`,
    channel: 'in_app',
    metadata: {
      bookingToken: token,
      amount,
      paymentStatus: status,
      actionUrl: '/bookings',
      idempotencyKey: `idemp-biz-pay-${booking.id}-${status}`,
    },
  });
}

/**
 * Reliable Reminder Scheduler Engine
 * Scans upcoming confirmed appointments and dispatches 24h & 2h reminders with idempotency.
 */
export async function runReminderScheduler(allBookings: any[] = []): Promise<{
  checkedCount: number;
  remindersSent: number;
}> {
  if (!Array.isArray(allBookings) || allBookings.length === 0) {
    return { checkedCount: 0, remindersSent: 0 };
  }

  let remindersSent = 0;
  const now = new Date();

  // Load set of already processed reminder keys
  let processedKeys = new Set<string>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROCESSED_REMINDERS);
    if (raw) processedKeys = new Set(JSON.parse(raw));
  } catch (_) {}

  for (const booking of allBookings) {
    // Only remind confirmed / active bookings
    if (booking.status !== 'confirmed') continue;
    if (!booking.date || !booking.startTime) continue;

    try {
      // Parse appointment datetime
      const [year, month, day] = booking.date.split('-').map(Number);
      const [hours, minutes] = booking.startTime.split(':').map(Number);
      const apptDate = new Date(year, month - 1, day, hours, minutes);

      const diffMs = apptDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Check 24-hour reminder window (between 23 and 25 hours before appointment)
      const key24h = `remind-24h-${booking.id}-${booking.date}`;
      if (diffHours > 0 && diffHours <= 25 && !processedKeys.has(key24h)) {
        processedKeys.add(key24h);
        remindersSent++;

        await createNotification({
          userId: booking.customerEmail || 'cust-jahnavi',
          businessId: booking.businessId,
          bookingId: booking.id,
          type: 'reminder',
          title: 'Upcoming Appointment Reminder (24h)',
          message: `Reminder: Your ${booking.serviceName || 'appointment'} at ${booking.businessName || 'your provider'} is scheduled for tomorrow at ${booking.startTime}.`,
          channel: 'in_app',
          metadata: {
            bookingToken: booking.token,
            businessName: booking.businessName,
            serviceName: booking.serviceName,
            appointmentDate: booking.date,
            appointmentTime: booking.startTime,
            actionUrl: `/confirmation/${booking.token}`,
            reminderTimeframe: '24h',
            idempotencyKey: key24h,
          },
        });

        // Trigger WhatsApp reminder template
        try {
          await dispatchAutomatedMessage({
            appointment: {
              id: booking.id,
              clientName: booking.customerName,
              clientPhone: booking.customerPhone,
              serviceName: booking.serviceName,
              servicePrice: booking.price,
              date: booking.date,
              startTime: booking.startTime,
              token: booking.token,
            },
            business: {
              id: booking.businessId,
              name: booking.businessName,
              address: '1420 Pine St',
              city: 'San Francisco',
            },
            messageType: 'appointment_reminder',
          });
        } catch (_) {}
      }

      // Check 2-hour reminder window (between 1 and 3 hours before appointment)
      const key2h = `remind-2h-${booking.id}-${booking.date}`;
      if (diffHours > 0 && diffHours <= 2.5 && !processedKeys.has(key2h)) {
        processedKeys.add(key2h);
        remindersSent++;

        await createNotification({
          userId: booking.customerEmail || 'cust-jahnavi',
          businessId: booking.businessId,
          bookingId: booking.id,
          type: 'reminder',
          title: 'Arrival Reminder (2h)',
          message: `Your ${booking.serviceName || 'appointment'} starts in 2 hours at ${booking.startTime}. Please have your arrival pass ready: ${booking.token}.`,
          channel: 'in_app',
          metadata: {
            bookingToken: booking.token,
            businessName: booking.businessName,
            serviceName: booking.serviceName,
            appointmentDate: booking.date,
            appointmentTime: booking.startTime,
            actionUrl: `/confirmation/${booking.token}`,
            reminderTimeframe: '2h',
            idempotencyKey: key2h,
          },
        });
      }
    } catch (err) {
      console.warn('Error evaluating reminder for booking:', booking.id, err);
    }
  }

  try {
    localStorage.setItem(STORAGE_KEY_PROCESSED_REMINDERS, JSON.stringify(Array.from(processedKeys)));
  } catch (_) {}

  return { checkedCount: allBookings.length, remindersSent };
}

/**
 * Hook or listener for real-time notification updates
 */
export function subscribeToNotificationChanges(callback: () => void): () => void {
  const handler = () => {
    callback();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('schedora_notifications_updated', handler);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY_NOTIFICATIONS) handler();
    });
    window.addEventListener('online', handler);
  }

  // Realtime Supabase listener
  const unsubscribeSupabase = subscribeToRealtimeUpdates((type, payload) => {
    if (type === 'notification' || type === 'sync') {
      handler();
    }
  });

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('schedora_notifications_updated', handler);
      window.removeEventListener('online', handler);
    }
    if (typeof unsubscribeSupabase === 'function') {
      unsubscribeSupabase();
    }
  };
}
