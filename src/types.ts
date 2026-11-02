export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';

export interface Service {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  depositRequired: number; // in USD
  cancellationFee: number;
  description: string;
  color: string;
}

export interface DaySchedule {
  day: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  start: string; // "09:00"
  end: string;   // "17:00"
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  businessId?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  businessId?: string;
  departmentId?: string;
  departmentName?: string;
  serviceIds: string[];
  genderPreference?: 'female' | 'male' | 'non_binary' | 'unspecified';
  qualifications?: string[];
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
    days: number[]; // 0 = Sunday, 1 = Monday, etc.
    daySchedule?: DaySchedule[]; // Individual per-day working hours
  };
  breakTimes?: Array<{ start: string; end: string; label: string }>;
  bio?: string;
  active?: boolean;
}

export interface Review {
  id: string;
  businessId: string;
  businessName?: string;
  appointmentId?: string;
  customerName: string;
  customerEmail: string;
  customerAvatar?: string;
  rating: number; // 1-5
  comment: string;
  serviceName?: string;
  staffName?: string;
  createdAt: string;
  verifiedBooking: boolean;
  businessReply?: {
    text: string;
    repliedAt: string;
    repliedBy?: string;
  };
  reported?: boolean;
}

export interface FriendConnection {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendEmail: string;
  friendAvatar?: string;
  status: 'accepted' | 'pending' | 'blocked';
  shareVisitsAndReviews: boolean;
  connectedAt: string;
}

export interface SocialRecommendation {
  type: 'friend_recommendation' | 'popular' | 'highly_rated' | 'book_again';
  businessId: string;
  businessName: string;
  category: string;
  image?: string;
  headline: string;
  subtext: string;
  friendName?: string;
  rating?: number;
  actionText: string;
  actionUrl: string;
}

export type VoiceSessionStatus = 'disconnected' | 'connecting' | 'connected' | 'listening' | 'speaking' | 'error';

export interface VoiceTranscriptMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

export interface PaymentDetails {
  method: 'card' | 'apple_pay' | 'google_pay' | 'cash_on_arrival';
  amountTotal: number;
  depositPaid: number;
  remainingDue: number;
  status: 'paid_deposit' | 'paid_full' | 'pending' | 'refunded' | 'fee_charged';
  transactionId?: string;
  cardLast4?: string;
}

export interface NotificationLog {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'sent' | 'queued' | 'failed';
  read?: boolean;
}

export interface Appointment {
  id: string;
  confirmationCode: string;
  tokenNumber?: string; // Physical arrival token, e.g. "TK-7821"
  serviceId: string;
  serviceName: string;
  staffId: string;
  staffName: string;
  businessId?: string;
  businessName?: string;
  businessAddress?: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  status: AppointmentStatus;
  physicallyCheckedIn?: boolean;
  checkedInAt?: string;
  addOnServices?: Array<{
    id: string;
    name: string;
    price: number;
    durationMinutes?: number;
    reason?: string;
  }>;
  payment: PaymentDetails;
  createdAt: string;
  updatedAt: string;
  statusHistory: Array<{
    status: AppointmentStatus;
    timestamp: string;
    note?: string;
    by: 'customer' | 'owner' | 'system';
  }>;
  remindersSent: {
    confirmationEmail: boolean;
    confirmationSms: boolean;
    reminder24h: boolean;
    reminder2h: boolean;
  };
}

export interface SuggestedSlot {
  date: string;
  startTime: string;
  endTime: string;
  staffId: string;
  staffName: string;
  reason: string;
  confidenceScore: number;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  rating?: number;
  reviewCount?: number;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  image?: string;
  priceRange?: string;
  openingTime?: string; // e.g. "09:00 AM"
  closingTime?: string; // e.g. "06:00 PM"
  daysOpen?: string[]; // e.g. ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  slotIntervalMinutes?: number; // e.g. 45
  availableSlotsToday?: string[]; // e.g. ["09:30 AM", "11:00 AM", "02:00 PM", "03:45 PM"]
  slug?: string;
  departments?: Department[];
  staff?: StaffMember[];
  services?: Array<any>;
  distanceKm?: number | null;
  createdAt?: string;
}

export interface BusinessSettings {
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  description?: string;
  currency: string;
  timezone: string;
  autoConfirmBookings: boolean;
  depositPolicy: 'flat' | 'percentage' | 'none';
  depositValue: number; // e.g. 25 or 20 (%)
  cancellationWindowHours: number; // e.g. 24
  cancellationFeePercent: number; // e.g. 50%
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  reminderSchedule: {
    send24hBefore: boolean;
    send2hBefore: boolean;
  };
  emailTemplateConfirmation: string;
  emailTemplateReminder: string;
  smsTemplateConfirmation: string;
  smsTemplateReminder: string;
}

export interface AnalyticsSummary {
  totalBookings: number;
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  depositCollected: number;
  cancellationFeesCollected: number;
  avgBookingValue: number;
  completionRate: number;
  busiestHours: Array<{ hour: string; count: number }>;
  weeklyTrend: Array<{ date: string; day: string; bookings: number; revenue: number }>;
  servicePerformance: Array<{ serviceName: string; count: number; revenue: number; color: string }>;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit?: string;
  notes: string;
  isVip: boolean;
}

export interface CloudScalingStatus {
  instanceId: string;
  activeNodes: number;
  autoScaleMin: number;
  autoScaleMax: number;
  cpuUtilization: number;
  memoryUtilization: number;
  requestsPerSecond: number;
  dbReplicaHealth: 'synced' | 'replicating' | 'degraded';
  averageLatencyMs: number;
  uptimeSeconds: number;
}

export type SupportedLocale = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'ml' | 'es' | 'fr' | 'de' | 'ja';

export type UserRole = 'customer' | 'business' | 'business_owner';

export interface CustomerNotificationPreferences {
  appointmentConfirmations: boolean;
  appointmentReminders: boolean;
  reschedulingUpdates: boolean;
  cancellationUpdates: boolean;
  businessMessages: boolean;
  promotionalNotifications: boolean;
  channelEmail: boolean;
  channelPush: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  age?: number | string;
  dob?: string;
  gender?: 'female' | 'male' | 'other' | 'prefer_not_to_say';
  locationCity?: string;
  locationArea?: string;
  locationPermissionGranted?: boolean;
  language: SupportedLocale;
  notificationPreferences: CustomerNotificationPreferences;
  aiPreferences?: CustomerAiPreferences;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  age?: number | string;
  gender?: string;
  locationCity?: string;
  locationArea?: string;
  language?: SupportedLocale;
  // Specific to customer
  isVip?: boolean;
  totalBookings?: number;
  notificationPreferences?: CustomerNotificationPreferences;
  aiPreferences?: CustomerAiPreferences;
  // Specific to business
  businessId?: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
}

export interface AiServiceRecommendation {
  serviceId: string;
  serviceName: string;
  type: 'add_on' | 'alternative' | 'upgrade';
  badge: string;
  reason: string;
  suggestedAddOnPrice?: number;
  suggestedAddOnDurationMinutes?: number;
  confidenceScore?: number;
}

export interface AiRecommendationResponse {
  success: boolean;
  source: 'gemini-3.8-flash' | 'heuristic-engine';
  headline: string;
  conciergeNote: string;
  recommendations: AiServiceRecommendation[];
}

export interface CustomerAiPreferences {
  enabled: boolean;
  favoriteCategories: string[];
  treatmentGoalsNotes: string;
  hairPreferences?: string;
  skinPreferences?: string;
  wellnessGoals?: string;
  sensitivitiesAllergies?: string;
  preferredPressure?: string;
}

