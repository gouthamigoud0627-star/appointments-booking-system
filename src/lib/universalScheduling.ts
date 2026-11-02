/**
 * Schedora 2.0 Universal Scheduling Engine
 * Core scheduling logic, multi-tenant organization isolation, conflict prevention,
 * smart meeting match, conflict rescue, and multi-mode workflows.
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

export type OrganizationType =
  | 'business'
  | 'corporate'
  | 'education'
  | 'recruitment'
  | 'sales'
  | 'personal';

export type UserRole =
  | 'admin'
  | 'individual_user'
  | 'business_owner'
  | 'business_staff'
  | 'institution_admin'
  | 'faculty_member'
  | 'recruiter'
  | 'candidate'
  | 'sales_manager'
  | 'sales_rep'
  | 'external_guest'
  | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  timezone: string;
  language: string;
  isVerified: boolean;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  brandColor: string;
  logoUrl?: string;
  website?: string;
  timezone: string;
  subscriptionPlan: 'free' | 'professional' | 'team' | 'institution' | 'enterprise';
  ownerId: string;
  ownerName?: string;
  servicesEnabledCount?: number;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  title: string;
  departmentId?: string;
  status: 'active' | 'pending' | 'suspended';
}

export interface Resource {
  id: string;
  organizationId: string;
  name: string;
  type: 'room' | 'conference_hall' | 'lab' | 'equipment';
  capacity: number;
  location: string;
  amenities: string[];
  isActive: boolean;
}

export interface Meeting {
  id: string;
  organizationId: string;
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  title: string;
  description: string;
  meetingType:
    | 'one_to_one'
    | 'team_meeting'
    | 'group_meeting'
    | 'recurring_meeting'
    | 'client_consultation'
    | 'video_conference'
    | 'in_person'
    | 'phone_call'
    | 'interview'
    | 'panel_interview'
    | 'parent_teacher'
    | 'department_review'
    | 'sales_demo'
    | 'discovery_call';
  startTime: string; // ISO string
  endTime: string;   // ISO string
  duration: number;  // minutes
  timezone: string;
  locationType: 'video' | 'in_person' | 'phone';
  videoUrl?: string;
  address?: string;
  resourceId?: string;
  resourceName?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
  requiredAttendees: string[]; // emails
  optionalAttendees: string[]; // emails
  agenda?: string;
  readinessScore: number;
  readinessChecklist: {
    agenda: boolean;
    attendeesConfirmed: boolean;
    locationReady: boolean;
    materialsReady: boolean;
  };
  cancellationPolicy?: string;
  notes?: string;
  inconvenientHourFlag?: boolean;
}

export interface FollowUpTask {
  id: string;
  organizationId: string;
  meetingId?: string;
  meetingTitle?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedToName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface MeetingDecision {
  id: string;
  meetingId: string;
  recordedBy: string;
  recordedByName: string;
  decisionText: string;
  createdAt: string;
}

export interface InterviewFeedback {
  interviewerId: string;
  interviewerName: string;
  rating: number; // 1-5
  notes: string; // STRICTLY PRIVATE TO HIRING TEAM
  recommendation: 'strong_hire' | 'hire' | 'neutral' | 'no_hire' | 'strong_no_hire';
  submittedAt: string;
}

export interface InterviewStage {
  id: string;
  stageName: string;
  stageOrder: number;
  meetingId?: string;
  interviewerEmails: string[];
  interviewerNames: string[];
  duration: number;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  feedback?: InterviewFeedback[];
}

export interface InterviewProcess {
  id: string;
  organizationId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  currentStage: string;
  status: 'active' | 'hired' | 'rejected' | 'withdrawn';
  stages: InterviewStage[];
}

export interface SalesLead {
  id: string;
  organizationId: string;
  leadName: string;
  company: string;
  email: string;
  phone?: string;
  demoDate?: string;
  assignedRepId?: string;
  assignedRepName?: string;
  status: 'new' | 'demo_scheduled' | 'consultation_done' | 'converted' | 'lost';
  outcomeNotes?: string;
}

export interface BusinessServiceItem {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  duration: number; // minutes
  price: number;
  description: string;
  isActive: boolean; // BUSINESS SERVICE TOGGLE: can be disabled by business
}

// ------------------------------------------------------------------------------
// INITIAL SEED DATA FOR DEMO & TESTING
// ------------------------------------------------------------------------------

export const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-bloom-wellness',
    slug: 'bloom-spa',
    name: 'Bloom Wellness & Spa',
    type: 'business',
    brandColor: '#4f46e5',
    timezone: 'America/Los_Angeles',
    subscriptionPlan: 'team',
    ownerId: 'user-elena',
    ownerName: 'Elena Rostova',
  },
  {
    id: 'org-apex-corp',
    slug: 'apex-technologies',
    name: 'Apex Global Technologies',
    type: 'corporate',
    brandColor: '#2563eb',
    timezone: 'America/New_York',
    subscriptionPlan: 'enterprise',
    ownerId: 'user-janvi',
    ownerName: 'Janvi Patel',
  },
  {
    id: 'org-stanford-edu',
    slug: 'bay-academy',
    name: 'Bay Area Institute of Technology',
    type: 'education',
    brandColor: '#059669',
    timezone: 'America/Los_Angeles',
    subscriptionPlan: 'institution',
    ownerId: 'user-prof-chen',
    ownerName: 'Dean Marcus Chen',
  },
  {
    id: 'org-talent-hq',
    slug: 'nexushr',
    name: 'Nexus Talent & HR Partners',
    type: 'recruitment',
    brandColor: '#7c3aed',
    timezone: 'America/Chicago',
    subscriptionPlan: 'team',
    ownerId: 'user-sarah-hr',
    ownerName: 'Sarah Jenkins',
  },
  {
    id: 'org-cloudscale-sales',
    slug: 'cloudscale',
    name: 'CloudScale SaaS Solutions',
    type: 'sales',
    brandColor: '#ea580c',
    timezone: 'America/Los_Angeles',
    subscriptionPlan: 'professional',
    ownerId: 'user-alex-sales',
    ownerName: 'Alex Rivera',
  },
];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'res-conf-a',
    organizationId: 'org-apex-corp',
    name: 'Boardroom Horizon (Level 4)',
    type: 'conference_hall',
    capacity: 24,
    location: 'Building B, Floor 4',
    amenities: ['4K Video Wall', 'Polycom Speakerphone', 'Whiteboard'],
    isActive: true,
  },
  {
    id: 'res-room-b',
    organizationId: 'org-apex-corp',
    name: 'Huddle Room Orion',
    type: 'room',
    capacity: 6,
    location: 'Building A, Floor 2',
    amenities: ['Zoom Rooms Display', 'Whiteboard'],
    isActive: true,
  },
  {
    id: 'res-lab-physics',
    organizationId: 'org-stanford-edu',
    name: 'Advanced Computing Lab 101',
    type: 'lab',
    capacity: 35,
    location: 'Science Hall, Room 101',
    amenities: ['High Performance Workstations', 'Projection System'],
    isActive: true,
  },
  {
    id: 'res-parent-room',
    organizationId: 'org-stanford-edu',
    name: 'Faculty Conference Lounge',
    type: 'room',
    capacity: 12,
    location: 'Admin Wing Room 204',
    amenities: ['Coffee Station', 'Display Monitor'],
    isActive: true,
  },
];

export const INITIAL_SERVICES: BusinessServiceItem[] = [
  {
    id: 'srv-haircut-luxury',
    organizationId: 'org-bloom-wellness',
    name: 'Signature Precision Cut & Styling',
    category: 'Hair Care',
    duration: 45,
    price: 65,
    description: 'Bespoke precision consultation, clarifying botanical wash, and blow dry.',
    isActive: true,
  },
  {
    id: 'srv-deep-tissue',
    organizationId: 'org-bloom-wellness',
    name: 'Therapeutic Deep Tissue Massage',
    category: 'Wellness',
    duration: 60,
    price: 95,
    description: 'Targeted muscle recovery utilizing certified organic arnica essential oils.',
    isActive: true,
  },
  {
    id: 'srv-balayage',
    organizationId: 'org-bloom-wellness',
    name: 'Balayage Glow & Tone Session',
    category: 'Hair Color',
    duration: 120,
    price: 180,
    description: 'Custom sun-kissed hand-painted highlights with nourishing gloss glaze.',
    isActive: false, // Disabled initially to demonstrate service toggle feature
  },
];

export const INITIAL_MEMBERS: OrganizationMember[] = [
  {
    id: 'mem-1',
    organizationId: 'org-apex-corp',
    userId: 'user-janvi',
    userName: 'Janvi Patel',
    userEmail: 'janvi@schedora.io',
    role: 'admin',
    title: 'Director of Product & Engineering',
    status: 'active',
  },
  {
    id: 'mem-2',
    organizationId: 'org-apex-corp',
    userId: 'user-marcus',
    userName: 'Dr. Marcus Chen',
    userEmail: 'marcus.chen@apex.io',
    role: 'business_staff',
    title: 'Senior Systems Architect',
    status: 'active',
  },
  {
    id: 'mem-3',
    organizationId: 'org-apex-corp',
    userId: 'user-elena',
    userName: 'Elena Rostova',
    userEmail: 'elena@apex.io',
    role: 'business_staff',
    title: 'Design Director',
    status: 'active',
  },
  {
    id: 'mem-edu-1',
    organizationId: 'org-stanford-edu',
    userId: 'user-prof-chen',
    userName: 'Dean Marcus Chen',
    userEmail: 'mchen@bayacademy.edu',
    role: 'institution_admin',
    title: 'Dean of Academic Affairs',
    status: 'active',
  },
  {
    id: 'mem-edu-2',
    organizationId: 'org-stanford-edu',
    userId: 'user-faculty-sarah',
    userName: 'Prof. Sarah Jenkins',
    userEmail: 'sjenkins@bayacademy.edu',
    role: 'faculty_member',
    title: 'Chair of Computer Science',
    status: 'active',
  },
  {
    id: 'mem-sales-1',
    organizationId: 'org-cloudscale-sales',
    userId: 'user-alex-sales',
    userName: 'Alex Rivera',
    userEmail: 'alex@cloudscale.io',
    role: 'sales_manager',
    title: 'Head of Enterprise Sales',
    status: 'active',
  },
  {
    id: 'mem-sales-2',
    organizationId: 'org-cloudscale-sales',
    userId: 'user-rep-taylor',
    userName: 'Taylor Brooks',
    userEmail: 'taylor@cloudscale.io',
    role: 'sales_rep',
    title: 'Senior Account Executive',
    status: 'active',
  },
];

export const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'meet-sync-1',
    organizationId: 'org-apex-corp',
    organizerId: 'user-janvi',
    organizerName: 'Janvi Patel',
    organizerEmail: 'janvi@schedora.io',
    title: 'Q4 Product Roadmap & Architecture Sync',
    description: 'Alignment on universal scheduling engine rollout, API endpoints, and client deliverables.',
    meetingType: 'team_meeting',
    startTime: new Date(Date.now() + 3600000 * 24).toISOString(), // Tomorrow +24h
    endTime: new Date(Date.now() + 3600000 * 24 + 1800000).toISOString(),
    duration: 30,
    timezone: 'America/New_York',
    locationType: 'video',
    videoUrl: 'https://meet.google.com/sch-apex-sync',
    resourceId: 'res-conf-a',
    resourceName: 'Boardroom Horizon (Level 4)',
    status: 'confirmed',
    requiredAttendees: ['janvi@schedora.io', 'marcus.chen@apex.io'],
    optionalAttendees: ['elena@apex.io'],
    agenda: '1. Schedora 2.0 MVP readiness\n2. Conflict rescue heuristics\n3. Supabase RLS test suite',
    readinessScore: 100,
    readinessChecklist: {
      agenda: true,
      attendeesConfirmed: true,
      locationReady: true,
      materialsReady: true,
    },
    cancellationPolicy: 'Please notify 2 hours in advance.',
    notes: 'Elena will present the new dashboard design prototypes.',
  },
  {
    id: 'meet-edu-review',
    organizationId: 'org-stanford-edu',
    organizerId: 'user-prof-chen',
    organizerName: 'Dean Marcus Chen',
    organizerEmail: 'mchen@bayacademy.edu',
    title: 'Faculty Curriculum Review & Lab Timetable',
    description: 'Semester curriculum coordination between CS and Engineering departments.',
    meetingType: 'department_review',
    startTime: new Date(Date.now() + 3600000 * 48).toISOString(),
    endTime: new Date(Date.now() + 3600000 * 48 + 3600000).toISOString(),
    duration: 60,
    timezone: 'America/Los_Angeles',
    locationType: 'in_person',
    address: 'Science Hall Room 101',
    resourceId: 'res-lab-physics',
    resourceName: 'Advanced Computing Lab 101',
    status: 'scheduled',
    requiredAttendees: ['mchen@bayacademy.edu', 'sjenkins@bayacademy.edu'],
    optionalAttendees: [],
    agenda: 'Timetable non-conflict validation with 3rd year practical periods.',
    readinessScore: 85,
    readinessChecklist: {
      agenda: true,
      attendeesConfirmed: false,
      locationReady: true,
      materialsReady: true,
    },
    notes: 'Ensure lab workstations are reserved.',
  },
];

export const INITIAL_TASKS: FollowUpTask[] = [
  {
    id: 'task-1',
    organizationId: 'org-apex-corp',
    meetingId: 'meet-sync-1',
    meetingTitle: 'Q4 Product Roadmap & Architecture Sync',
    title: 'Review and benchmark Supabase RLS query performance',
    description: 'Ensure row level security policies complete in under 20ms under heavy concurrency.',
    assignedTo: 'user-marcus',
    assignedToName: 'Dr. Marcus Chen',
    dueDate: new Date(Date.now() + 3600000 * 72).toISOString().split('T')[0],
    priority: 'high',
    status: 'in_progress',
  },
  {
    id: 'task-2',
    organizationId: 'org-apex-corp',
    meetingId: 'meet-sync-1',
    meetingTitle: 'Q4 Product Roadmap & Architecture Sync',
    title: 'Finalize multilingual strings for Telugu and Kannada',
    description: 'Ensure complete UI translation without missing button labels.',
    assignedTo: 'user-janvi',
    assignedToName: 'Janvi Patel',
    dueDate: new Date(Date.now() + 3600000 * 96).toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
  },
];

export const INITIAL_INTERVIEWS: InterviewProcess[] = [
  {
    id: 'rec-1',
    organizationId: 'org-talent-hq',
    jobTitle: 'Senior Full-Stack Engineer',
    candidateName: 'Priya Sharma',
    candidateEmail: 'priya.sharma@example.com',
    candidatePhone: '+1 (555) 349-2918',
    currentStage: 'Technical Panel',
    status: 'active',
    stages: [
      {
        id: 'stg-1',
        stageName: 'Screening Call',
        stageOrder: 1,
        duration: 30,
        interviewerEmails: ['sarah.hr@nexushr.io'],
        interviewerNames: ['Sarah Jenkins'],
        status: 'completed',
        feedback: [
          {
            interviewerId: 'user-sarah-hr',
            interviewerName: 'Sarah Jenkins',
            rating: 5,
            notes: 'Strong technical communicator. 6 years hands-on React/PostgreSQL experience.',
            recommendation: 'strong_hire',
            submittedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
          },
        ],
      },
      {
        id: 'stg-2',
        stageName: 'Technical Panel',
        stageOrder: 2,
        duration: 60,
        interviewerEmails: ['marcus.chen@apex.io', 'alex@cloudscale.io'],
        interviewerNames: ['Dr. Marcus Chen', 'Alex Rivera'],
        status: 'scheduled',
      },
    ],
  },
];

export const INITIAL_SALES_LEADS: SalesLead[] = [
  {
    id: 'lead-1',
    organizationId: 'org-cloudscale-sales',
    leadName: 'David Vance',
    company: 'FinTech Orbit Corp',
    email: 'dvance@fintechorbit.com',
    phone: '+1 (555) 789-0123',
    demoDate: new Date(Date.now() + 3600000 * 30).toISOString(),
    assignedRepId: 'user-rep-taylor',
    assignedRepName: 'Taylor Brooks',
    status: 'demo_scheduled',
    outcomeNotes: 'Interested in enterprise SSO and round-robin multi-team dispatch.',
  },
  {
    id: 'lead-2',
    organizationId: 'org-cloudscale-sales',
    leadName: 'Rachel Green',
    company: 'Apex Health Systems',
    email: 'rachel@apexhealth.org',
    assignedRepId: 'user-alex-sales',
    assignedRepName: 'Alex Rivera',
    status: 'consultation_done',
    outcomeNotes: 'Follow-up requested with security compliance questionnaire.',
  },
];

// ------------------------------------------------------------------------------
// PERSISTENT STORAGE MANAGEMENT LAYER
// ------------------------------------------------------------------------------

const STORAGE_KEYS = {
  ORGANIZATIONS: 'schedora_v2_organizations',
  ACTIVE_ORG_ID: 'schedora_v2_active_org_id',
  MEETINGS: 'schedora_v2_meetings',
  SERVICES: 'schedora_v2_services',
  RESOURCES: 'schedora_v2_resources',
  MEMBERS: 'schedora_v2_members',
  TASKS: 'schedora_v2_tasks',
  INTERVIEWS: 'schedora_v2_interviews',
  SALES_LEADS: 'schedora_v2_sales_leads',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`Storage read error for ${key}:`, err);
  }
  return fallback;
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Storage write error for ${key}:`, err);
  }
}

// ------------------------------------------------------------------------------
// UNIVERSAL SCHEDULING SERVICE EXPORTS
// ------------------------------------------------------------------------------

export class UniversalSchedulingService {
  /**
   * Get all organizations
   */
  static getOrganizations(): Organization[] {
    return readStorage<Organization[]>(STORAGE_KEYS.ORGANIZATIONS, INITIAL_ORGANIZATIONS);
  }

  /**
   * Get currently active organization
   */
  static getActiveOrganization(): Organization {
    const orgs = this.getOrganizations();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORG_ID);
    const found = orgs.find((o) => o.id === activeId);
    return found || orgs[0] || INITIAL_ORGANIZATIONS[0];
  }

  /**
   * Switch active organization
   */
  static setActiveOrganization(orgId: string): Organization {
    const orgs = this.getOrganizations();
    const found = orgs.find((o) => o.id === orgId) || orgs[0];
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ORG_ID, found.id);
    window.dispatchEvent(new CustomEvent('schedora_org_switched', { detail: found }));
    return found;
  }

  /**
   * Create a new Organization
   */
  static createOrganization(newOrg: Omit<Organization, 'id'>): Organization {
    const orgs = this.getOrganizations();
    const created: Organization = {
      ...newOrg,
      id: `org-${Date.now()}`,
    };
    const updated = [created, ...orgs];
    writeStorage(STORAGE_KEYS.ORGANIZATIONS, updated);
    this.setActiveOrganization(created.id);
    return created;
  }

  /**
   * Get meetings for an organization
   */
  static getMeetings(orgId?: string): Meeting[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<Meeting[]>(STORAGE_KEYS.MEETINGS, INITIAL_MEETINGS);
    return all.filter((m) => m.organizationId === targetOrgId);
  }

  /**
   * Conflict Detection Engine: Validates attendee overlap and room double-booking
   */
  static checkMeetingConflicts(params: {
    organizationId: string;
    startTime: string; // ISO
    endTime: string;   // ISO
    requiredAttendees: string[];
    resourceId?: string;
    excludeMeetingId?: string;
  }): {
    hasConflict: boolean;
    conflictReason?: string;
    conflictingMeeting?: Meeting;
    conflictingResource?: Resource;
  } {
    const meetings = this.getMeetings(params.organizationId);
    const newStart = new Date(params.startTime).getTime();
    const newEnd = new Date(params.endTime).getTime();

    for (const m of meetings) {
      if (params.excludeMeetingId && m.id === params.excludeMeetingId) continue;
      if (m.status === 'cancelled') continue;

      const mStart = new Date(m.startTime).getTime();
      const mEnd = new Date(m.endTime).getTime();

      // Check time overlap: (StartA < EndB) and (EndA > StartB)
      const overlaps = newStart < mEnd && newEnd > mStart;
      if (overlaps) {
        // 1. Room/Resource Conflict
        if (params.resourceId && m.resourceId && params.resourceId === m.resourceId) {
          const resources = this.getResources(params.organizationId);
          const res = resources.find((r) => r.id === params.resourceId);
          return {
            hasConflict: true,
            conflictReason: `Resource Double-Booking: "${res?.name || 'Selected Room'}" is already reserved for "${m.title}" during this time window.`,
            conflictingMeeting: m,
            conflictingResource: res,
          };
        }

        // 2. Required Attendee Conflict
        const overlappingAttendees = params.requiredAttendees.filter((email) =>
          m.requiredAttendees.includes(email)
        );
        if (overlappingAttendees.length > 0) {
          return {
            hasConflict: true,
            conflictReason: `Attendee Schedule Conflict: ${overlappingAttendees.join(', ')} has a confirmed conflicting meeting ("${m.title}") from ${new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(m.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
            conflictingMeeting: m,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  /**
   * Schedule a new Meeting with strict conflict verification
   */
  static createMeeting(meetingData: Omit<Meeting, 'id' | 'readinessScore' | 'readinessChecklist'>): {
    success: boolean;
    meeting?: Meeting;
    error?: string;
  } {
    // Conflict verification
    const conflict = this.checkMeetingConflicts({
      organizationId: meetingData.organizationId,
      startTime: meetingData.startTime,
      endTime: meetingData.endTime,
      requiredAttendees: meetingData.requiredAttendees,
      resourceId: meetingData.resourceId,
    });

    if (conflict.hasConflict) {
      return {
        success: false,
        error: conflict.conflictReason || 'Meeting conflict detected.',
      };
    }

    // Calculate readiness checklist
    const checklist = {
      agenda: Boolean(meetingData.agenda && meetingData.agenda.trim().length > 5),
      attendeesConfirmed: meetingData.requiredAttendees.length > 0,
      locationReady: Boolean(meetingData.videoUrl || meetingData.address || meetingData.resourceId),
      materialsReady: true,
    };
    const readinessScore = Object.values(checklist).filter(Boolean).length * 25;

    const all = readStorage<Meeting[]>(STORAGE_KEYS.MEETINGS, INITIAL_MEETINGS);
    const newMeeting: Meeting = {
      ...meetingData,
      id: `meet-${Date.now()}`,
      readinessScore,
      readinessChecklist: checklist,
    };

    writeStorage(STORAGE_KEYS.MEETINGS, [newMeeting, ...all]);
    window.dispatchEvent(new CustomEvent('schedora_meeting_created', { detail: newMeeting }));
    return { success: true, meeting: newMeeting };
  }

  /**
   * Reschedule an existing meeting
   */
  static rescheduleMeeting(
    meetingId: string,
    newStartTime: string,
    newEndTime: string
  ): { success: boolean; meeting?: Meeting; error?: string } {
    const all = readStorage<Meeting[]>(STORAGE_KEYS.MEETINGS, INITIAL_MEETINGS);
    const target = all.find((m) => m.id === meetingId);
    if (!target) return { success: false, error: 'Meeting not found' };

    const conflict = this.checkMeetingConflicts({
      organizationId: target.organizationId,
      startTime: newStartTime,
      endTime: newEndTime,
      requiredAttendees: target.requiredAttendees,
      resourceId: target.resourceId,
      excludeMeetingId: meetingId,
    });

    if (conflict.hasConflict) {
      return { success: false, error: conflict.conflictReason };
    }

    target.startTime = newStartTime;
    target.endTime = newEndTime;
    target.status = 'rescheduled';
    writeStorage(STORAGE_KEYS.MEETINGS, all);
    return { success: true, meeting: target };
  }

  /**
   * Cancel an existing meeting
   */
  static cancelMeeting(meetingId: string, reason?: string): boolean {
    const all = readStorage<Meeting[]>(STORAGE_KEYS.MEETINGS, INITIAL_MEETINGS);
    const target = all.find((m) => m.id === meetingId);
    if (!target) return false;
    target.status = 'cancelled';
    if (reason) target.notes = `${target.notes || ''}\nCancellation Reason: ${reason}`;
    writeStorage(STORAGE_KEYS.MEETINGS, all);
    return true;
  }

  /**
   * Smart Meeting Match ("Find a Time"):
   * Intelligent slot finder scanning working hours across attendees, ranking optimal conflict-free windows.
   */
  static findSmartMeetingSlots(params: {
    organizationId: string;
    attendees: string[];
    durationMinutes: number;
    daysAhead?: number;
    resourceId?: string;
  }): Array<{
    slotStart: string;
    slotEnd: string;
    score: number;
    explanation: string;
    hasInconvenientHours?: boolean;
  }> {
    const daysAhead = params.daysAhead || 5;
    const duration = params.durationMinutes || 30;
    const slots = [];
    const now = new Date();

    for (let dayOffset = 1; dayOffset <= daysAhead; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);

      // Check Mon-Fri standard business hours
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

      // Candidate hours: 09:30, 11:00, 14:00, 15:30, 16:30
      const candidateHours = [
        { hour: 9, min: 30, desc: 'Optimal morning focus window' },
        { hour: 11, min: 0, desc: 'High attendance pre-lunch slot' },
        { hour: 14, min: 0, desc: 'Post-lunch productivity window' },
        { hour: 15, min: 30, desc: 'Mid-afternoon collaboration slot' },
        { hour: 16, min: 30, desc: 'Late afternoon wrap-up' },
      ];

      for (const ch of candidateHours) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(ch.hour, ch.min, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + duration * 60000);

        const check = this.checkMeetingConflicts({
          organizationId: params.organizationId,
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          requiredAttendees: params.attendees,
          resourceId: params.resourceId,
        });

        if (!check.hasConflict) {
          slots.push({
            slotStart: slotStart.toISOString(),
            slotEnd: slotEnd.toISOString(),
            score: ch.hour === 11 || ch.hour === 14 ? 98 : 92,
            explanation: `100% attendee availability • No room overlap • ${ch.desc}`,
            hasInconvenientHours: ch.hour < 9 || ch.hour >= 18,
          });
        }
      }
    }

    return slots.sort((a, b) => b.score - a.score).slice(0, 6);
  }

  /**
   * Conflict Rescue:
   * When a conflict occurs, calculates minimal reasonable schedule shift with explanation.
   */
  static rescueConflict(meeting: Meeting): Array<{
    alternativeStart: string;
    alternativeEnd: string;
    shiftMinutes: number;
    explanation: string;
  }> {
    const candidates = [];
    const origStart = new Date(meeting.startTime);

    // Shifts: +1 hour, +2 hours, next day same time
    const shifts = [
      { shiftMins: 60, desc: '1-hour delay today' },
      { shiftMins: 120, desc: '2-hour delay today' },
      { shiftMins: 1440, desc: 'Tomorrow same time' },
    ];

    for (const s of shifts) {
      const altStart = new Date(origStart.getTime() + s.shiftMins * 60000);
      const altEnd = new Date(altStart.getTime() + meeting.duration * 60000);

      const check = this.checkMeetingConflicts({
        organizationId: meeting.organizationId,
        startTime: altStart.toISOString(),
        endTime: altEnd.toISOString(),
        requiredAttendees: meeting.requiredAttendees,
        resourceId: meeting.resourceId,
        excludeMeetingId: meeting.id,
      });

      if (!check.hasConflict) {
        candidates.push({
          alternativeStart: altStart.toISOString(),
          alternativeEnd: altEnd.toISOString(),
          shiftMinutes: s.shiftMins,
          explanation: `Resolves attendee and room conflict • ${s.desc} • Preserves all required attendees.`,
        });
      }
    }

    return candidates;
  }

  /**
   * Resources & Rooms Management
   */
  static getResources(orgId?: string): Resource[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    return all.filter((r) => r.organizationId === targetOrgId);
  }

  static createResource(resData: Omit<Resource, 'id'>): Resource {
    const all = readStorage<Resource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    const created: Resource = { ...resData, id: `res-${Date.now()}` };
    writeStorage(STORAGE_KEYS.RESOURCES, [created, ...all]);
    return created;
  }

  /**
   * Services (Business Appointments Mode):
   * Includes instant Enable/Disable service toggle requested by prompt
   */
  static getServices(orgId?: string): BusinessServiceItem[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<BusinessServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    return all.filter((s) => s.organizationId === targetOrgId);
  }

  static toggleServiceAvailability(serviceId: string, isActive: boolean): boolean {
    const all = readStorage<BusinessServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const item = all.find((s) => s.id === serviceId);
    if (!item) return false;
    item.isActive = isActive;
    writeStorage(STORAGE_KEYS.SERVICES, all);
    window.dispatchEvent(new CustomEvent('schedora_service_toggled', { detail: item }));
    return true;
  }

  static createService(serviceData: Omit<BusinessServiceItem, 'id'>): BusinessServiceItem {
    const all = readStorage<BusinessServiceItem[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
    const created: BusinessServiceItem = { ...serviceData, id: `srv-${Date.now()}` };
    writeStorage(STORAGE_KEYS.SERVICES, [created, ...all]);
    return created;
  }

  /**
   * Tasks & Decision-to-Action Tracking
   */
  static getTasks(orgId?: string): FollowUpTask[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<FollowUpTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    return all.filter((t) => t.organizationId === targetOrgId);
  }

  static createTask(taskData: Omit<FollowUpTask, 'id'>): FollowUpTask {
    const all = readStorage<FollowUpTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const created: FollowUpTask = { ...taskData, id: `task-${Date.now()}` };
    writeStorage(STORAGE_KEYS.TASKS, [created, ...all]);
    return created;
  }

  static updateTaskStatus(taskId: string, status: FollowUpTask['status']): boolean {
    const all = readStorage<FollowUpTask[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const target = all.find((t) => t.id === taskId);
    if (!target) return false;
    target.status = status;
    writeStorage(STORAGE_KEYS.TASKS, all);
    return true;
  }

  /**
   * Recruitment Mode (Interview Processes & Confidential Feedback)
   */
  static getInterviewProcesses(orgId?: string): InterviewProcess[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<InterviewProcess[]>(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    return all.filter((p) => p.organizationId === targetOrgId);
  }

  static addInterviewStage(
    processId: string,
    stageData: Omit<InterviewStage, 'id'>
  ): InterviewStage | null {
    const all = readStorage<InterviewProcess[]>(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    const proc = all.find((p) => p.id === processId);
    if (!proc) return null;
    const created: InterviewStage = { ...stageData, id: `stg-${Date.now()}` };
    proc.stages.push(created);
    proc.currentStage = created.stageName;
    writeStorage(STORAGE_KEYS.INTERVIEWS, all);
    return created;
  }

  static submitInterviewFeedback(
    processId: string,
    stageId: string,
    feedback: InterviewFeedback
  ): boolean {
    const all = readStorage<InterviewProcess[]>(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS);
    const proc = all.find((p) => p.id === processId);
    if (!proc) return false;
    const stage = proc.stages.find((s) => s.id === stageId);
    if (!stage) return false;
    if (!stage.feedback) stage.feedback = [];
    stage.feedback.push(feedback);
    stage.status = 'completed';
    writeStorage(STORAGE_KEYS.INTERVIEWS, all);
    return true;
  }

  /**
   * Sales Mode (Leads, Round-Robin Assignment, Demos)
   */
  static getSalesLeads(orgId?: string): SalesLead[] {
    const targetOrgId = orgId || this.getActiveOrganization().id;
    const all = readStorage<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, INITIAL_SALES_LEADS);
    return all.filter((l) => l.organizationId === targetOrgId);
  }

  static assignRoundRobinSalesDemo(leadData: Omit<SalesLead, 'id' | 'assignedRepId' | 'assignedRepName'>): SalesLead {
    const all = readStorage<SalesLead[]>(STORAGE_KEYS.SALES_LEADS, INITIAL_SALES_LEADS);
    const members = readStorage<OrganizationMember[]>(STORAGE_KEYS.MEMBERS, INITIAL_MEMBERS)
      .filter((m) => m.role === 'sales_rep' || m.role === 'sales_manager');

    // Round-robin selection based on lead count
    const assignedRep = members[all.length % (members.length || 1)] || {
      userId: 'user-rep-taylor',
      userName: 'Taylor Brooks',
    };

    const created: SalesLead = {
      ...leadData,
      id: `lead-${Date.now()}`,
      assignedRepId: assignedRep.userId,
      assignedRepName: assignedRep.userName,
    };

    writeStorage(STORAGE_KEYS.SALES_LEADS, [created, ...all]);
    return created;
  }
}
