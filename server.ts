import express, { Request, Response } from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import {
  Appointment,
  BusinessSettings,
  NotificationLog,
  Service,
  StaffMember,
  SuggestedSlot,
  ClientProfile,
  CloudScalingStatus,
  DaySchedule,
  AuthUser,
  UserRole,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// In-Memory Database Store with Pre-seeded Small Business Records
const initialServices: Service[] = [
  // 1. Clinic & Integrative Wellness
  {
    id: 'srv-1',
    name: 'Comprehensive Health & Wellness Consultation',
    category: 'Clinic',
    durationMinutes: 45,
    price: 95,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'Detailed diagnostic session with lifestyle review, personalized recommendations, and treatment plan.',
    color: '#3B82F6',
  },
  {
    id: 'srv-6',
    name: 'Dermatological Skin & Mole Mapping Assessment',
    category: 'Clinic',
    durationMinutes: 30,
    price: 140,
    depositRequired: 35,
    cancellationFee: 40,
    description: 'Full-body digital dermoscopy, mole risk profiling, and preventative skin health diagnostic.',
    color: '#0284C7',
  },
  {
    id: 'srv-7',
    name: 'Sports Injury Physical Rehabilitation',
    category: 'Clinic',
    durationMinutes: 50,
    price: 110,
    depositRequired: 30,
    cancellationFee: 35,
    description: 'Targeted mobility restoration, dry needling, postural realignment, and muscle recovery therapy.',
    color: '#06B6D4',
  },
  {
    id: 'srv-8',
    name: 'Restorative Acupuncture & Meridian Balance',
    category: 'Clinic',
    durationMinutes: 60,
    price: 100,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'Traditional Chinese medicine assessment, sterile micro-needle placement, and stress relief.',
    color: '#0D9488',
  },

  // 2. Dental & Smile Care
  {
    id: 'srv-3',
    name: 'Dental Hygiene & Preventative Examination',
    category: 'Dentist',
    durationMinutes: 50,
    price: 150,
    depositRequired: 40,
    cancellationFee: 50,
    description: 'Gentle ultrasonic scaling, enamel polishing, digital photographic checkup, and fluoridation.',
    color: '#10B981',
  },
  {
    id: 'srv-10',
    name: 'Laser Enamel Whitening & Polish',
    category: 'Dentist',
    durationMinutes: 60,
    price: 220,
    depositRequired: 50,
    cancellationFee: 60,
    description: 'Advanced in-office cold-light laser whitening treatment for gentle, multi-shade brightening.',
    color: '#059669',
  },
  {
    id: 'srv-11',
    name: 'Digital 3D Smile Scan & Clear Aligner Consultation',
    category: 'Dentist',
    durationMinutes: 30,
    price: 80,
    depositRequired: 20,
    cancellationFee: 25,
    description: 'High-resolution intraoral 3D scan, bite analysis, and personalized orthodontic simulation.',
    color: '#34D399',
  },

  // 3. Hair, Barber & Salon
  {
    id: 'srv-2',
    name: 'Executive Haircut & Scalp Treatment',
    category: 'Salon',
    durationMinutes: 60,
    price: 75,
    depositRequired: 20,
    cancellationFee: 25,
    description: 'Precision scissor cut, hot towel cleanse, organic scalp stimulation, and artisan styling.',
    color: '#8B5CF6',
  },
  {
    id: 'srv-13',
    name: 'Artisan Balayage Coloring & Gloss Glaze',
    category: 'Salon',
    durationMinutes: 90,
    price: 185,
    depositRequired: 50,
    cancellationFee: 50,
    description: 'Hand-painted dimensional color transition, pH balancing gloss, and blow dry finish.',
    color: '#A855F7',
  },
  {
    id: 'srv-14',
    name: 'Classic Beard Sculpting & Straight-Razor Shave',
    category: 'Salon',
    durationMinutes: 40,
    price: 55,
    depositRequired: 15,
    cancellationFee: 20,
    description: 'Steamed lavender towel wrap, essential oil conditioning, and hand-honed blade contouring.',
    color: '#7C3AED',
  },
  {
    id: 'srv-15',
    name: 'Keratin Botanical Smoothing & Protein Infusion',
    category: 'Salon',
    durationMinutes: 90,
    price: 195,
    depositRequired: 50,
    cancellationFee: 50,
    description: 'Formaldehyde-free organic smoothing treatment for frizz control and intense hydration.',
    color: '#9333EA',
  },

  // 4. Spa & Aesthetics
  {
    id: 'srv-16',
    name: 'Organic Botanical Hydro-Facial',
    category: 'Spa',
    durationMinutes: 50,
    price: 115,
    depositRequired: 30,
    cancellationFee: 35,
    description: 'Deep pore vacuum extraction, antioxidant serum infusion, and cryo-firming lymphatic massage.',
    color: '#EC4899',
  },
  {
    id: 'srv-17',
    name: 'Deep Tissue Recovery & Muscle Release Massage',
    category: 'Spa',
    durationMinutes: 60,
    price: 125,
    depositRequired: 35,
    cancellationFee: 40,
    description: 'Therapeutic pressure targeting chronic tension points with warming arnica and cypress botanicals.',
    color: '#DB2777',
  },
  {
    id: 'srv-18',
    name: 'Thermal Himalayan Hot Stone Soak & Bodywork',
    category: 'Spa',
    durationMinutes: 75,
    price: 145,
    depositRequired: 40,
    cancellationFee: 45,
    description: 'Smooth volcanic basalt stones heated to 130°F, paired with warm botanical jojoba oil massage.',
    color: '#F43F5E',
  },

  // 5. Veterinary & Pet Care
  {
    id: 'srv-20',
    name: 'Comprehensive Veterinary Pet Wellness Exam',
    category: 'Veterinary',
    durationMinutes: 40,
    price: 85,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'Nose-to-tail physical evaluation, vaccination booster review, parasite screening, and dietary plan.',
    color: '#14B8A6',
  },
  {
    id: 'srv-21',
    name: 'Full-Service Canine Grooming & De-Shedding Spa',
    category: 'Veterinary',
    durationMinutes: 60,
    price: 75,
    depositRequired: 20,
    cancellationFee: 25,
    description: 'Hydro-massage blueberry facial bath, blow-out, hygienic sanitary trim, ear cleaning, and nail buffing.',
    color: '#059669',
  },

  // 6. Automotive & Mechanics
  {
    id: 'srv-23',
    name: 'Multi-Point Vehicle Inspection & Diagnostics',
    category: 'Auto Care',
    durationMinutes: 45,
    price: 90,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'OBD-II computer fault code scan, battery load test, fluid analysis, and mechanical brake check.',
    color: '#EA580C',
  },
  {
    id: 'srv-24',
    name: 'Full Synthetic Oil Service & Filter Replacement',
    category: 'Auto Care',
    durationMinutes: 35,
    price: 85,
    depositRequired: 20,
    cancellationFee: 25,
    description: 'Premium synthetic motor oil change, OEM filter renewal, tire pressure top-up, and safety check.',
    color: '#F97316',
  },
  {
    id: 'srv-25',
    name: 'Brake System Safety Overhaul & Pad Replacement',
    category: 'Auto Care',
    durationMinutes: 60,
    price: 160,
    depositRequired: 40,
    cancellationFee: 50,
    description: 'Ceramic brake pad installation, rotor resurfacing inspection, fluid flush, and road test.',
    color: '#C2410C',
  },

  // 7. Advisory & Legal
  {
    id: 'srv-4',
    name: 'Personalized Legal & Business Strategy',
    category: 'Advisory',
    durationMinutes: 60,
    price: 220,
    depositRequired: 60,
    cancellationFee: 75,
    description: 'Contract review, corporate compliance roadmap, risk audit, and growth legal advisement.',
    color: '#F59E0B',
  },
  {
    id: 'srv-26',
    name: 'CPA Small Business Tax Planning & Audit Review',
    category: 'Advisory',
    durationMinutes: 60,
    price: 180,
    depositRequired: 50,
    cancellationFee: 60,
    description: 'Deduction optimization strategy, quarterly estimate filings, entity structure audit, and tax forecast.',
    color: '#D97706',
  },

  // 8. Fitness & Athletic Coaching
  {
    id: 'srv-5',
    name: '1-on-1 High Performance Athletic Training',
    category: 'Fitness',
    durationMinutes: 60,
    price: 85,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'Biomechanics evaluation, posture alignment, functional strength conditioning, and mobility drill.',
    color: '#E11D48',
  },
  {
    id: 'srv-28',
    name: 'Private Reformer Pilates Alignment Session',
    category: 'Fitness',
    durationMinutes: 50,
    price: 95,
    depositRequired: 25,
    cancellationFee: 30,
    description: 'Spring resistance core sculpting, spinal articulation, pelvic stabilization, and flexibility work.',
    color: '#BE123C',
  },

  // 9. Creative, Photography & Studio
  {
    id: 'srv-30',
    name: 'Executive Studio Portrait & Headshot Session',
    category: 'Photography',
    durationMinutes: 45,
    price: 150,
    depositRequired: 40,
    cancellationFee: 50,
    description: 'Pro 3-point studio lighting, 3 wardrobe changes, live monitor review, and 4 retouched high-res masters.',
    color: '#6366F1',
  },

  // 10. Tattoo & Body Piercing
  {
    id: 'srv-32',
    name: 'Custom Tattoo Consultation & Needle Session',
    category: 'Tattoo',
    durationMinutes: 90,
    price: 180,
    depositRequired: 50,
    cancellationFee: 60,
    description: 'Custom fine-line ink stencil drafting, sterile single-use setup, and initial linework sitting.',
    color: '#475569',
  },
  {
    id: 'srv-33',
    name: 'Precision Piercing & Titanium Jewelry Fitting',
    category: 'Tattoo',
    durationMinutes: 30,
    price: 65,
    depositRequired: 20,
    cancellationFee: 25,
    description: 'Aseptic needle piercing, implant-grade titanium or 14k gold jewelry fitting, and aftercare regimen.',
    color: '#334155',
  },
];

const initialStaff: StaffMember[] = [
  {
    id: 'st-hp-ananya',
    businessId: 'biz-happy-paws-grooming',
    name: 'Ananya',
    role: 'Pet Groomer',
    email: 'ananya@happypawsgrooming.com',
    phone: '+1 (415) 555-0195',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    genderPreference: 'female',
    qualifications: ['Certified Professional Pet Stylist', 'Fear-Free Certified Professional'],
    experienceYears: 6,
    rating: 4.9,
    reviewCount: 38,
    serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-3', 'srv-hp-4', 'srv-hp-5'],
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5, 6],
    },
    breakTimes: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    bio: 'Gentle handling specialist with 6 years experience in low-stress grooming for nervous pups and rescue dogs.',
    active: true,
  },
  {
    id: 'st-hp-rahul',
    businessId: 'biz-happy-paws-grooming',
    name: 'Rahul',
    role: 'Senior Pet Groomer',
    email: 'rahul@happypawsgrooming.com',
    phone: '+1 (415) 555-0196',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    genderPreference: 'male',
    qualifications: ['Master Canine Stylist', 'Large Breed & Double Coat Specialist'],
    experienceYears: 8,
    rating: 4.8,
    reviewCount: 45,
    serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-3', 'srv-hp-4', 'srv-hp-5'],
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: [2, 3, 4, 5, 6],
    },
    breakTimes: [{ start: '12:30', end: '13:30', label: 'Lunch Break' }],
    bio: 'Senior stylist celebrated for breed-standard pattern cuts, double-coat shedding management, and large dogs.',
    active: true,
  },
  {
    id: 'st-hp-priya',
    businessId: 'biz-happy-paws-grooming',
    name: 'Priya',
    role: 'Pet Groomer',
    email: 'priya@happypawsgrooming.com',
    phone: '+1 (415) 555-0197',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    genderPreference: 'female',
    qualifications: ['Puppy & Kitten Gentle Care', 'Canine CPR & First Aid'],
    experienceYears: 4,
    rating: 4.9,
    reviewCount: 29,
    serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-4'],
    workingHours: {
      start: '10:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5],
    },
    breakTimes: [{ start: '14:00', end: '15:00', label: 'Rest Break' }],
    bio: 'Gentle and patient groomer, perfect for puppies experiencing their first spa day and small gentle breeds.',
    active: true,
  },
  {
    id: 'st-1',
    name: 'Dr. Elena Rostova',
    role: 'Lead Specialist & Medical Director',
    email: 'elena@schedulabusiness.com',
    phone: '+1 (555) 234-5678',
    avatar: 'https://images.unsplash.com/photo-1594824813627-8152504b2b23?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-1', 'srv-3', 'srv-6', 'srv-7', 'srv-8', 'srv-10', 'srv-11'],
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5],
      daySchedule: [
        { day: 1, enabled: true, start: '09:00', end: '17:00' },
        { day: 2, enabled: true, start: '09:00', end: '17:00' },
        { day: 3, enabled: true, start: '09:00', end: '17:00' },
        { day: 4, enabled: true, start: '09:00', end: '17:00' },
        { day: 5, enabled: true, start: '09:00', end: '16:00' },
        { day: 6, enabled: false, start: '09:00', end: '17:00' },
        { day: 0, enabled: false, start: '09:00', end: '17:00' },
      ],
    },
    breakTimes: [{ start: '12:30', end: '13:30', label: 'Lunch Break' }],
    bio: 'Board-certified medical practitioner specializing in integrative diagnostics and preventative therapy.',
    active: true,
  },
  {
    id: 'st-2',
    name: 'Marcus Vance',
    role: 'Senior Master Stylist & Esthetics Director',
    email: 'marcus@schedulabusiness.com',
    phone: '+1 (555) 345-6789',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-2', 'srv-13', 'srv-14', 'srv-15', 'srv-16', 'srv-17', 'srv-18'],
    workingHours: {
      start: '10:00',
      end: '18:00',
      days: [1, 2, 3, 4, 5, 6],
      daySchedule: [
        { day: 1, enabled: true, start: '10:00', end: '18:00' },
        { day: 2, enabled: true, start: '10:00', end: '18:00' },
        { day: 3, enabled: true, start: '10:00', end: '18:00' },
        { day: 4, enabled: true, start: '10:00', end: '18:00' },
        { day: 5, enabled: true, start: '10:00', end: '18:00' },
        { day: 6, enabled: true, start: '10:00', end: '16:00' },
        { day: 0, enabled: false, start: '10:00', end: '18:00' },
      ],
    },
    breakTimes: [{ start: '13:00', end: '14:00', label: 'Sanitization & Break' }],
    bio: 'Artisan aesthetician with over a decade of precision scissor styling, scalp renewal, and organic treatments.',
    active: true,
  },
  {
    id: 'st-3',
    name: 'Sophia Chen, Esq.',
    role: 'Principal Partner & Executive Coach',
    email: 'sophia@schedulabusiness.com',
    phone: '+1 (555) 456-7890',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-4', 'srv-5', 'srv-26', 'srv-28'],
    workingHours: {
      start: '09:00',
      end: '16:00',
      days: [1, 2, 3, 4],
      daySchedule: [
        { day: 1, enabled: true, start: '09:00', end: '16:00' },
        { day: 2, enabled: true, start: '09:00', end: '16:00' },
        { day: 3, enabled: true, start: '09:00', end: '16:00' },
        { day: 4, enabled: true, start: '09:00', end: '16:00' },
        { day: 5, enabled: false, start: '09:00', end: '16:00' },
        { day: 6, enabled: false, start: '09:00', end: '16:00' },
        { day: 0, enabled: false, start: '09:00', end: '16:00' },
      ],
    },
    breakTimes: [{ start: '12:00', end: '13:00', label: 'Case Prep & Recess' }],
    bio: 'Corporate counsel and high-performance strategist advising growing founders and executives.',
    active: true,
  },
  {
    id: 'st-4',
    name: 'Dr. Michael Aris, DVM',
    role: 'Chief Veterinary Surgeon',
    email: 'michael.aris@schedulabusiness.com',
    phone: '+1 (555) 678-1234',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-20', 'srv-21'],
    workingHours: {
      start: '08:30',
      end: '17:30',
      days: [1, 2, 3, 4, 5, 6],
      daySchedule: [
        { day: 1, enabled: true, start: '08:30', end: '17:30' },
        { day: 2, enabled: true, start: '08:30', end: '17:30' },
        { day: 3, enabled: true, start: '08:30', end: '17:30' },
        { day: 4, enabled: true, start: '08:30', end: '17:30' },
        { day: 5, enabled: true, start: '08:30', end: '17:30' },
        { day: 6, enabled: true, start: '09:00', end: '15:00' },
        { day: 0, enabled: false, start: '08:30', end: '17:30' },
      ],
    },
    breakTimes: [{ start: '12:30', end: '13:30', label: 'Surgical Prep & Lunch' }],
    bio: 'Experienced veterinary surgeon dedicated to companion pet diagnostics, preventive care, and surgical recovery.',
    active: true,
  },
  {
    id: 'st-5',
    name: 'Dave Hendricks',
    role: 'Master Automotive Diagnostic Technician',
    email: 'dave@schedulabusiness.com',
    phone: '+1 (555) 789-2345',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-23', 'srv-24', 'srv-25'],
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5],
      daySchedule: [
        { day: 1, enabled: true, start: '08:00', end: '17:00' },
        { day: 2, enabled: true, start: '08:00', end: '17:00' },
        { day: 3, enabled: true, start: '08:00', end: '17:00' },
        { day: 4, enabled: true, start: '08:00', end: '17:00' },
        { day: 5, enabled: true, start: '08:00', end: '17:00' },
        { day: 6, enabled: false, start: '08:00', end: '17:00' },
        { day: 0, enabled: false, start: '08:00', end: '17:00' },
      ],
    },
    breakTimes: [{ start: '12:00', end: '13:00', label: 'Shop Lunch' }],
    bio: 'ASE Master Certified Technician specializing in computerized vehicle diagnostics, brake safety, and powertrain tuning.',
    active: true,
  },
  {
    id: 'st-6',
    name: 'Jordan Rivera',
    role: 'Creative Director & Fine Body Artist',
    email: 'jordan@schedulabusiness.com',
    phone: '+1 (555) 890-3456',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    serviceIds: ['srv-30', 'srv-32', 'srv-33'],
    workingHours: {
      start: '11:00',
      end: '19:00',
      days: [2, 3, 4, 5, 6],
      daySchedule: [
        { day: 1, enabled: false, start: '11:00', end: '19:00' },
        { day: 2, enabled: true, start: '11:00', end: '19:00' },
        { day: 3, enabled: true, start: '11:00', end: '19:00' },
        { day: 4, enabled: true, start: '11:00', end: '19:00' },
        { day: 5, enabled: true, start: '11:00', end: '19:00' },
        { day: 6, enabled: true, start: '11:00', end: '19:00' },
        { day: 0, enabled: false, start: '11:00', end: '19:00' },
      ],
    },
    breakTimes: [{ start: '14:30', end: '15:15', label: 'Studio Sanitization' }],
    bio: 'Celebrated portrait photographer and fine-line tattoo artist with a focus on custom minimalist aesthetics.',
    active: true,
  },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dayAfter = new Date(today);
dayAfter.setDate(today.getDate() + 2);
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

let services: Service[] = [...initialServices];
let staff: StaffMember[] = [...initialStaff];

let businessSettings: BusinessSettings = {
  businessName: 'Apex Precision Care & Studio',
  businessEmail: 'appointments@apexstudio.io',
  businessPhone: '+1 (555) 901-2244',
  businessAddress: '742 Montgomery St, Suite 400',
  city: 'San Francisco',
  state: 'CA',
  pincode: '94111',
  latitude: 37.7963,
  longitude: -122.4035,
  category: 'Clinic',
  description: 'Integrative health consultations, executive physical assessments, and personalized preventative care therapy.',
  currency: 'USD',
  timezone: 'America/Los_Angeles',
  autoConfirmBookings: false, // Default: owner quick confirmation workflow
  depositPolicy: 'flat',
  depositValue: 25,
  cancellationWindowHours: 24,
  cancellationFeePercent: 50,
  emailNotificationsEnabled: true,
  smsNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  reminderSchedule: {
    send24hBefore: true,
    send2hBefore: true,
  },
  emailTemplateConfirmation: 'Hi {customer_name}, your appointment for {service} with {staff} on {date} at {time} is confirmed! Ref: {code}.',
  emailTemplateReminder: 'Reminder: You have an upcoming session for {service} tomorrow at {time} with {staff}. Reply to reschedule.',
  smsTemplateConfirmation: 'Confirmed: {service} on {date} at {time}. Code: {code}. Need to change? Visit our portal.',
  smsTemplateReminder: 'Hi {customer_name}, your appointment at Apex Studio is coming up in 2 hours ({time}). See you soon!',
};

let businesses = [
  {
    id: 'biz-happy-paws-grooming',
    name: 'Happy Paws Grooming',
    category: 'Pet Care',
    rating: 4.9,
    reviewCount: 112,
    description: 'Boutique pet salon offering gentle one-on-one grooming, soothing oatmeal hydro-baths, and master breed-standard haircutting.',
    address: '1420 Pine St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94109',
    latitude: 37.7901,
    longitude: -122.4205,
    phone: '+1 (415) 555-0195',
    email: 'care@happypawsgrooming.com',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '09:00 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '01:30 PM', '03:15 PM', '04:45 PM'],
    services: [
      { id: 'srv-hp-1', name: 'Basic Grooming', duration: '30 min', price: 45 },
      { id: 'srv-hp-2', name: 'Bath and Brush', duration: '45 min', price: 55 },
      { id: 'srv-hp-3', name: 'Full Grooming', duration: '60 min', price: 75 },
      { id: 'srv-hp-4', name: 'Nail Trimming', duration: '20 min', price: 25 },
      { id: 'srv-hp-5', name: 'Breed-Specific Grooming', duration: '75 min', price: 90 },
    ],
  },
  {
    id: 'biz-bloom-spa',
    name: 'Bloom Spa',
    category: 'Spa',
    rating: 4.9,
    reviewCount: 142,
    description: 'Relaxation & Wellness sanctuary offering organic hydro-facials, thermal stone bodywork, and aromatherapy.',
    address: '450 Sutter St, Suite 700',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94108',
    latitude: 37.7895,
    longitude: -122.4082,
    phone: '+1 (415) 555-0192',
    email: 'hello@bloomspa.io',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '09:00 AM',
    closingTime: '06:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '01:30 PM', '03:15 PM', '05:00 PM'],
    services: [
      { name: 'Herbal Steam Therapy & Massage', duration: '60 min', price: 95 },
      { name: 'Organic Botanical Hydro-Facial', duration: '50 min', price: 110 },
      { name: 'Deep Tissue Ritual', duration: '75 min', price: 130 },
    ],
  },
  {
    id: 'biz-apex-precision',
    name: 'Apex Precision Care & Studio',
    category: 'Clinic',
    rating: 4.8,
    reviewCount: 98,
    description: 'Integrative health consultations, executive physical assessments, and personalized preventative care therapy.',
    address: '742 Montgomery St, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94111',
    latitude: 37.7963,
    longitude: -122.4035,
    phone: '+1 (555) 901-2244',
    email: 'appointments@apexstudio.io',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '08:30 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:45 PM'],
    services: [
      { name: 'Comprehensive Health & Wellness Consultation', duration: '45 min', price: 95 },
      { name: 'Preventative Wellness Assessment', duration: '30 min', price: 65 },
      { name: 'Targeted Therapeutic Follow-Up', duration: '30 min', price: 50 },
    ],
  },
  {
    id: 'biz-bay-dental',
    name: 'Bay Dental Studio',
    category: 'Dentist',
    rating: 4.9,
    reviewCount: 210,
    description: 'Gentle aesthetic and preventive dental hygiene, digital smile scanning, and enamel-safe laser whitening.',
    address: '220 Montgomery St, 5th Floor',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94104',
    latitude: 37.7909,
    longitude: -122.4026,
    phone: '+1 (415) 555-0144',
    email: 'care@baydentalstudio.com',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '09:00 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:00 AM', '10:45 AM', '01:15 PM', '03:00 PM', '04:15 PM'],
    services: [
      { name: 'Preventive Dental Exam & Cleaning', duration: '45 min', price: 120 },
      { name: 'Digital Smile Scan & Consultation', duration: '30 min', price: 80 },
      { name: 'Laser Enamel Teeth Whitening', duration: '60 min', price: 220 },
    ],
  },
  {
    id: 'biz-lumiere-salon',
    name: 'Lumière Hair & Beauty Salon',
    category: 'Salon',
    rating: 4.7,
    reviewCount: 167,
    description: 'Precision scissor styling, organic balayage coloring, scalp renewal treatments, and artisan blowouts.',
    address: '580 Geary St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94102',
    latitude: 37.7869,
    longitude: -122.4131,
    phone: '+1 (415) 555-0188',
    email: 'stylist@lumieresalon.com',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '10:00 AM',
    closingTime: '07:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['11:00 AM', '01:00 PM', '02:45 PM', '04:30 PM', '06:00 PM'],
    services: [
      { name: 'Precision Hair Cut & Organic Styling', duration: '45 min', price: 65 },
      { name: 'Balayage Color & Gloss Treatment', duration: '90 min', price: 175 },
      { name: 'Botanical Scalp Rejuvenation Mask', duration: '30 min', price: 45 },
    ],
  },
  {
    id: 'biz-zenith-clinic',
    name: 'Zenith Physiotherapy & Sports Clinic',
    category: 'Clinic',
    rating: 4.9,
    reviewCount: 84,
    description: 'Sports injury rehabilitation, joint mobility restoration, posture alignment, and dry needling therapy.',
    address: '825 Battery St, Suite 200',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94111',
    latitude: 37.7986,
    longitude: -122.4012,
    phone: '+1 (415) 555-0167',
    email: 'team@zenithclinic.com',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:00 AM',
    closingTime: '05:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['08:30 AM', '10:15 AM', '12:00 PM', '02:30 PM', '04:00 PM'],
    services: [
      { name: 'Sports Injury Physical Assessment', duration: '50 min', price: 105 },
      { name: 'Targeted Postural Alignment Therapy', duration: '40 min', price: 85 },
      { name: 'Dry Needling & Myofascial Release', duration: '30 min', price: 70 },
    ],
  },
  {
    id: 'biz-serene-oasis',
    name: 'Serene Oasis Sanctuary Spa',
    category: 'Spa',
    rating: 4.8,
    reviewCount: 115,
    description: 'Thermal mineral soak rooms, Himalayan salt therapy, hot stone treatments, and botanical wraps.',
    address: '1350 Ocean Ave',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94112',
    latitude: 37.7231,
    longitude: -122.4542,
    phone: '+1 (415) 555-0133',
    email: 'relax@sereneoasis.com',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '09:30 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['10:00 AM', '12:30 PM', '03:00 PM', '05:15 PM', '06:45 PM'],
    services: [
      { name: 'Thermal Hot Stone Mineral Massage', duration: '60 min', price: 115 },
      { name: 'Himalayan Salt Scrub & Glow Bodywork', duration: '45 min', price: 90 },
      { name: 'Couples Sanctuary Retreat', duration: '90 min', price: 240 },
    ],
  },
  {
    id: 'biz-paws-whiskers',
    name: 'Paws & Whiskers Veterinary Hospital',
    category: 'Veterinary',
    rating: 4.9,
    reviewCount: 189,
    description: 'Full-service veterinary hospital offering comprehensive pet wellness exams, preventative vaccines, and hydro-bath grooming.',
    address: '1240 Lombard St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94109',
    latitude: 37.8018,
    longitude: -122.4231,
    phone: '+1 (415) 555-0177',
    email: 'hello@pawswhiskersvet.com',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:00 AM', '11:15 AM', '01:45 PM', '03:30 PM', '04:45 PM'],
    services: [
      { name: 'Comprehensive Veterinary Pet Wellness Exam', duration: '40 min', price: 85 },
      { name: 'Full-Service Canine Grooming & De-Shedding Spa', duration: '60 min', price: 75 },
      { name: 'Companion Animal Dental Care & Hygiene', duration: '50 min', price: 140 },
    ],
  },
  {
    id: 'biz-apex-auto',
    name: 'Apex Precision Auto & European Mechanics',
    category: 'Auto Care',
    rating: 4.8,
    reviewCount: 132,
    description: 'ASE-certified automotive service facility specializing in computerized diagnostics, synthetic fluid changes, and brake safety overhauls.',
    address: '980 Folsom St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94107',
    latitude: 37.7788,
    longitude: -122.4042,
    phone: '+1 (415) 555-0182',
    email: 'service@apexprecisionauto.com',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:00 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['08:30 AM', '10:00 AM', '01:00 PM', '02:45 PM', '04:15 PM'],
    services: [
      { name: 'Multi-Point Vehicle Inspection & Diagnostics', duration: '45 min', price: 90 },
      { name: 'Full Synthetic Oil Service & Filter Replacement', duration: '35 min', price: 85 },
      { name: 'Brake System Safety Overhaul & Pad Replacement', duration: '60 min', price: 160 },
    ],
  },
  {
    id: 'biz-pacific-advisory',
    name: 'Pacific Horizon Legal & Tax Advisory',
    category: 'Advisory',
    rating: 4.9,
    reviewCount: 94,
    description: 'Executive legal consultancy, small business compliance, corporate strategy, and certified CPA tax audit advisory.',
    address: '555 California St, Suite 3200',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94104',
    latitude: 37.7925,
    longitude: -122.4038,
    phone: '+1 (415) 555-0199',
    email: 'advisory@pacifichorizon.law',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '09:00 AM',
    closingTime: '05:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '02:00 PM', '03:30 PM'],
    services: [
      { name: 'Personalized Legal & Business Strategy', duration: '60 min', price: 220 },
      { name: 'CPA Small Business Tax Planning & Audit Review', duration: '60 min', price: 180 },
      { name: 'Notary Public & Estate Document Execution', duration: '30 min', price: 60 },
    ],
  },
  {
    id: 'biz-vanguard-fitness',
    name: 'Vanguard Athletic Lab & Pilates Studio',
    category: 'Fitness',
    rating: 4.9,
    reviewCount: 156,
    description: 'High-performance private strength training, biomechanics posture analysis, and custom Reformer Pilates instruction.',
    address: '300 Brannan St, Suite 105',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94107',
    latitude: 37.7824,
    longitude: -122.3929,
    phone: '+1 (415) 555-0125',
    email: 'coach@vanguardlab.fit',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '07:00 AM',
    closingTime: '07:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['07:30 AM', '09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'],
    services: [
      { name: '1-on-1 High Performance Athletic Training', duration: '60 min', price: 85 },
      { name: 'Private Reformer Pilates Alignment Session', duration: '50 min', price: 95 },
      { name: 'Targeted Core Stability & Mobility Screen', duration: '45 min', price: 75 },
    ],
  },
  {
    id: 'biz-lumina-creative',
    name: 'Lumina Creative & Portrait Studio',
    category: 'Photography',
    rating: 4.9,
    reviewCount: 88,
    description: 'Professional studio photography, executive headshots, personal branding portraits, and commercial visual sessions.',
    address: '1890 Bryant St, Studio 402',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94110',
    latitude: 37.7634,
    longitude: -122.4103,
    phone: '+1 (415) 555-0155',
    email: 'booking@luminacreative.studio',
    image: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '10:00 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['10:30 AM', '01:00 PM', '03:15 PM', '04:45 PM'],
    services: [
      { name: 'Executive Studio Portrait & Headshot Session', duration: '45 min', price: 150 },
      { name: 'Personal Branding & Commercial Studio Shoot', duration: '90 min', price: 260 },
      { name: 'Family & Creative Portrait Sitting', duration: '60 min', price: 195 },
    ],
  },
  {
    id: 'biz-iron-ink',
    name: 'Iron & Ink Custom Body Art Studio',
    category: 'Tattoo',
    rating: 4.8,
    reviewCount: 173,
    description: 'Sterile fine-line tattoo design sessions, custom artisan illustration, and precision body piercing with implant-grade titanium jewelry.',
    address: '1035 Market St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94103',
    latitude: 37.7816,
    longitude: -122.4109,
    phone: '+1 (415) 555-0162',
    email: 'ink@ironinkstudio.com',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=600&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '11:00 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['11:30 AM', '02:00 PM', '04:30 PM', '06:30 PM'],
    services: [
      { name: 'Custom Tattoo Consultation & Needle Session', duration: '90 min', price: 180 },
      { name: 'Precision Piercing & Titanium Jewelry Fitting', duration: '30 min', price: 65 },
      { name: 'Fine-Line Tattoo Touch-Up & Accent Work', duration: '45 min', price: 90 },
    ],
  },
];

let serverWaitlist: any[] = [
  {
    id: 'wt-seed-1',
    token: 'WL-8F2Q9',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming',
    businessSlug: 'happy-paws-grooming',
    serviceId: 'srv-paws-1',
    serviceName: 'Full Canine Spa Grooming',
    servicePrice: 75,
    staffId: 'any',
    staffName: 'First Available Specialist',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTime: 'morning',
    customerName: 'Jahnavi Raja',
    customerEmail: 'jahnaviaraja0909@gmail.com',
    customerPhone: '+1 (555) 234-5678',
    notes: 'Golden retriever, prefers early slot if someone cancels.',
    channel: 'whatsapp',
    status: 'waiting',
    queuePosition: 1,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    notifiedAt: null,
    convertedAt: null,
  },
  {
    id: 'wt-seed-2',
    token: 'WL-3M4X1',
    businessId: 'biz-bloom-spa',
    businessName: 'The Bloom Sanctuary & Day Spa',
    businessSlug: 'bloom-sanctuary-day-spa',
    serviceId: 'srv-bloom-1',
    serviceName: 'Herbal Steam Therapy & Massage',
    servicePrice: 95,
    staffId: 'st-1',
    staffName: 'Elena Rostova',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferredTime: 'afternoon',
    customerName: 'Claire Beauchamp',
    customerEmail: 'claire.b@example.com',
    customerPhone: '+1 (415) 555-8910',
    notes: 'Looking for 2pm slot if possible.',
    channel: 'whatsapp',
    status: 'waiting',
    queuePosition: 2,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    notifiedAt: null,
    convertedAt: null,
  },
];

let appointments: Appointment[] = [
  {
    id: 'apt-101',
    confirmationCode: 'APX-9821',
    tokenNumber: 'TK-9821',
    businessName: 'Apex Precision Care & Studio',
    businessAddress: '742 Montgomery St, Suite 400',
    physicallyCheckedIn: true,
    serviceId: 'srv-1',
    serviceName: 'Comprehensive Health & Wellness Consultation',
    staffId: 'st-1',
    staffName: 'Dr. Elena Rostova',
    clientName: 'Alexander Hayes',
    clientEmail: 'alex.hayes@example.com',
    clientPhone: '+1 (555) 832-1920',
    clientNotes: 'Focusing on seasonal fatigue and sleep metrics.',
    date: formatDate(today),
    startTime: '10:00',
    endTime: '10:45',
    status: 'in_progress',
    payment: {
      method: 'card',
      amountTotal: 95,
      depositPaid: 25,
      remainingDue: 70,
      status: 'paid_deposit',
      transactionId: 'tx_sec_991823',
      cardLast4: '4242',
    },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), note: 'Customer requested via booking portal', by: 'customer' },
      { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), note: 'Owner approved slot', by: 'owner' },
      { status: 'in_progress', timestamp: new Date().toISOString(), note: 'Client checked in', by: 'owner' },
    ],
    remindersSent: {
      confirmationEmail: true,
      confirmationSms: true,
      reminder24h: true,
      reminder2h: true,
    },
  },
  {
    id: 'apt-102',
    confirmationCode: 'APX-7410',
    tokenNumber: 'TK-7410',
    businessName: 'Apex Precision Care & Studio',
    businessAddress: '742 Montgomery St, Suite 400',
    physicallyCheckedIn: false,
    serviceId: 'srv-2',
    serviceName: 'Executive Haircut & Scalp Treatment',
    staffId: 'st-2',
    staffName: 'Marcus Vance',
    clientName: 'Julian Vance-Smith',
    clientEmail: 'julian.vs@example.com',
    clientPhone: '+1 (555) 912-4411',
    clientNotes: 'Preparing for board meeting interview.',
    date: formatDate(today),
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending',
    payment: {
      method: 'apple_pay',
      amountTotal: 75,
      depositPaid: 20,
      remainingDue: 55,
      status: 'paid_deposit',
      transactionId: 'tx_sec_771239',
      cardLast4: '8821',
    },
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 3).toISOString(), note: 'Requires owner confirmation', by: 'customer' },
    ],
    remindersSent: {
      confirmationEmail: false,
      confirmationSms: false,
      reminder24h: false,
      reminder2h: false,
    },
  },
  {
    id: 'apt-103',
    confirmationCode: 'APX-5532',
    tokenNumber: 'TK-5532',
    businessName: 'Bay Dental Studio',
    businessAddress: '220 Montgomery St, 5th Floor',
    physicallyCheckedIn: false,
    serviceId: 'srv-3',
    serviceName: 'Dental Hygiene & Preventative Examination',
    staffId: 'st-1',
    staffName: 'Dr. Elena Rostova',
    clientName: 'Claire Dupont',
    clientEmail: 'claire.dupont@example.com',
    clientPhone: '+1 (555) 778-9901',
    clientNotes: 'Sensitive lower left molar.',
    date: formatDate(tomorrow),
    startTime: '11:00',
    endTime: '11:50',
    status: 'confirmed',
    payment: {
      method: 'card',
      amountTotal: 150,
      depositPaid: 40,
      remainingDue: 110,
      status: 'paid_deposit',
      transactionId: 'tx_sec_338192',
      cardLast4: '1092',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 86400000).toISOString(), by: 'customer' },
      { status: 'confirmed', timestamp: new Date(Date.now() - 72000000).toISOString(), note: 'Auto-confirmed by rule', by: 'system' },
    ],
    remindersSent: {
      confirmationEmail: true,
      confirmationSms: true,
      reminder24h: false,
      reminder2h: false,
    },
  },
  {
    id: 'apt-104',
    confirmationCode: 'APX-4129',
    tokenNumber: 'TK-4129',
    businessName: 'Bloom Spa',
    businessAddress: '450 Sutter St, Suite 700',
    physicallyCheckedIn: true,
    serviceId: 'srv-4',
    serviceName: 'Personalized Legal & Business Strategy',
    staffId: 'st-3',
    staffName: 'Sophia Chen, Esq.',
    clientName: 'Nadia Thorne',
    clientEmail: 'nadia@thornemedia.co',
    clientPhone: '+1 (555) 662-8119',
    clientNotes: 'Series A term sheet evaluation.',
    date: formatDate(yesterday),
    startTime: '13:00',
    endTime: '14:00',
    status: 'completed',
    payment: {
      method: 'card',
      amountTotal: 220,
      depositPaid: 60,
      remainingDue: 0,
      status: 'paid_full',
      transactionId: 'tx_sec_119024',
      cardLast4: '5566',
    },
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), by: 'customer' },
      { status: 'confirmed', timestamp: new Date(Date.now() - 86400000 * 3.8).toISOString(), by: 'owner' },
      { status: 'completed', timestamp: new Date(Date.now() - 86400000).toISOString(), note: 'Consultation concluded satisfactorily', by: 'owner' },
    ],
    remindersSent: {
      confirmationEmail: true,
      confirmationSms: true,
      reminder24h: true,
      reminder2h: true,
    },
  },
  {
    id: 'apt-105',
    confirmationCode: 'APX-3301',
    tokenNumber: 'TK-3301',
    businessName: 'Apex Precision Care & Studio',
    businessAddress: '742 Montgomery St, Suite 400',
    physicallyCheckedIn: false,
    serviceId: 'srv-5',
    serviceName: '1-on-1 High Performance Athletic Training',
    staffId: 'st-3',
    staffName: 'Sophia Chen, Esq.',
    clientName: 'David Kelling',
    clientEmail: 'david.k@example.com',
    clientPhone: '+1 (555) 441-2099',
    date: formatDate(dayAfter),
    startTime: '15:00',
    endTime: '16:00',
    status: 'pending',
    payment: {
      method: 'card',
      amountTotal: 85,
      depositPaid: 25,
      remainingDue: 60,
      status: 'paid_deposit',
      transactionId: 'tx_sec_884912',
      cardLast4: '7110',
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    statusHistory: [
      { status: 'pending', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), note: 'Submitted via mobile web app', by: 'customer' },
    ],
    remindersSent: {
      confirmationEmail: false,
      confirmationSms: false,
      reminder24h: false,
      reminder2h: false,
    },
  },
];

let notifications: NotificationLog[] = [
  {
    id: 'nt-1',
    appointmentId: 'apt-102',
    type: 'push',
    recipient: 'Business Owner (Mobile & Desktop)',
    subject: 'New Booking Request Pending Confirmation',
    message: 'Julian Vance-Smith requested Executive Haircut & Scalp Treatment today at 14:00. Action required.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    status: 'delivered',
    read: false,
  },
  {
    id: 'nt-2',
    appointmentId: 'apt-103',
    type: 'email',
    recipient: 'claire.dupont@example.com',
    subject: 'Your Appointment Confirmation - Apex Studio [APX-5532]',
    message: 'Hi Claire Dupont, your appointment for Dental Hygiene on tomorrow at 11:00 is confirmed! Deposit of $40 received.',
    timestamp: new Date(Date.now() - 72000000).toISOString(),
    status: 'delivered',
    read: true,
  },
  {
    id: 'nt-3',
    appointmentId: 'apt-101',
    type: 'sms',
    recipient: '+1 (555) 832-1920',
    subject: 'SMS Dispatch',
    message: 'Hi Alexander, reminder: your session with Dr. Elena Rostova is today at 10:00. Apex Studio.',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: 'delivered',
    read: true,
  },
];

let clients: ClientProfile[] = [
  {
    id: 'cl-1',
    name: 'Alexander Hayes',
    email: 'alex.hayes@example.com',
    phone: '+1 (555) 832-1920',
    totalBookings: 6,
    totalSpent: 570,
    lastVisit: formatDate(today),
    notes: 'Prefers morning sessions. Allergic to eucalyptus oil.',
    isVip: true,
  },
  {
    id: 'cl-2',
    name: 'Julian Vance-Smith',
    email: 'julian.vs@example.com',
    phone: '+1 (555) 912-4411',
    totalBookings: 2,
    totalSpent: 150,
    lastVisit: formatDate(yesterday),
    notes: 'Attends tech industry events regularly.',
    isVip: false,
  },
  {
    id: 'cl-3',
    name: 'Claire Dupont',
    email: 'claire.dupont@example.com',
    phone: '+1 (555) 778-9901',
    totalBookings: 4,
    totalSpent: 600,
    lastVisit: formatDate(yesterday),
    notes: 'Requires 5-minute pre-numbing before treatments.',
    isVip: true,
  },
  {
    id: 'cl-4',
    name: 'Nadia Thorne',
    email: 'nadia@thornemedia.co',
    phone: '+1 (555) 662-8119',
    totalBookings: 5,
    totalSpent: 1100,
    lastVisit: formatDate(yesterday),
    notes: 'Managing partner at Thorne Media Group.',
    isVip: true,
  },
  {
    id: 'cl-5',
    name: 'David Kelling',
    email: 'david.k@example.com',
    phone: '+1 (555) 441-2099',
    totalBookings: 1,
    totalSpent: 85,
    lastVisit: formatDate(dayAfter),
    notes: 'Rehabilitation following shoulder sprain.',
    isVip: false,
  },
];

interface StoredUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  isVip?: boolean;
  totalBookings?: number;
  businessId?: string;
  businessName?: string;
  businessCategory?: string;
  businessAddress?: string;
}

let users: StoredUser[] = [
  // Demo Customers
  {
    id: 'usr-cust-1',
    name: 'Alexander Hayes',
    email: 'alex.hayes@example.com',
    phone: '+1 (555) 832-1920',
    role: 'customer',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVip: true,
    totalBookings: 6,
  },
  {
    id: 'usr-cust-2',
    name: 'Claire Dupont',
    email: 'claire.dupont@example.com',
    phone: '+1 (555) 778-9901',
    role: 'customer',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isVip: true,
    totalBookings: 4,
  },
  {
    id: 'usr-cust-3',
    name: 'Julian Vance-Smith',
    email: 'julian.vs@example.com',
    phone: '+1 (555) 912-4411',
    role: 'customer',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVip: false,
    totalBookings: 2,
  },
  // Demo Businesses
  {
    id: 'usr-biz-1',
    name: 'Dr. Elena Rostova',
    email: 'appointments@apexstudio.io',
    phone: '+1 (555) 901-2244',
    role: 'business',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1594824813627-8152504b2b23?w=150&auto=format&fit=crop&q=80',
    businessId: 'biz-apex-precision',
    businessName: 'Apex Precision Care & Studio',
    businessCategory: 'Clinic',
    businessAddress: '742 Montgomery St, Suite 400, San Francisco',
  },
  {
    id: 'usr-biz-2',
    name: 'Maya Lin',
    email: 'hello@bloomspa.io',
    phone: '+1 (415) 555-0192',
    role: 'business',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    businessId: 'biz-bloom-spa',
    businessName: 'Bloom Spa',
    businessCategory: 'Spa',
    businessAddress: '450 Sutter St, Suite 700, San Francisco',
  },
  {
    id: 'usr-biz-3',
    name: 'Jean-Luc Moreau',
    email: 'stylist@lumieresalon.com',
    phone: '+1 (415) 555-0188',
    role: 'business',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    businessId: 'biz-lumiere',
    businessName: 'Lumière Hair & Aesthetics',
    businessCategory: 'Salon',
    businessAddress: '120 Geary St, Fl 3, San Francisco',
  },
  {
    id: 'usr-biz-4',
    name: 'Dr. Marcus Vance',
    email: 'team@zenithclinic.com',
    phone: '+1 (415) 555-0167',
    role: 'business',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    businessId: 'biz-zenith-clinic',
    businessName: 'Zenith Physiotherapy & Sports Clinic',
    businessCategory: 'Clinic',
    businessAddress: '825 Battery St, Suite 200, San Francisco',
  },
];

// Helper: AI Client initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (err) {
      console.warn('Gemini client initialization failed, fallback active:', err);
    }
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Health check & Cloud Native Autoscaling Metrics
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'schedora-core-engine',
    version: '3.0.0-cloudrun',
  });
});

// 1b. Authentication Endpoints: Business Login & Customer Login
app.get('/api/auth/demo-accounts', (req: Request, res: Response) => {
  const sanitize = (u: StoredUser): AuthUser => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    avatar: u.avatar,
    isVip: u.isVip,
    totalBookings: u.totalBookings,
    businessId: u.businessId,
    businessName: u.businessName,
    businessCategory: u.businessCategory,
    businessAddress: u.businessAddress,
  });

  res.json({
    customers: users.filter((u) => u.role === 'customer').map(sanitize),
    businesses: users.filter((u) => u.role === 'business').map(sanitize),
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { role, email, password, demoId } = req.body;

  let user: StoredUser | undefined;

  if (demoId) {
    user = users.find((u) => u.id === demoId);
  } else if (email) {
    const cleanEmail = String(email).trim().toLowerCase();
    user = users.find(
      (u) => u.email.toLowerCase() === cleanEmail && (!role || u.role === role)
    );

    // If custom user not in initial pre-seed, gracefully instantiate account
    if (!user) {
      const generatedId = `usr-${role || 'customer'}-${Date.now() % 100000}`;
      const defaultName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const capitalized = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      user = {
        id: generatedId,
        name: capitalized,
        email: cleanEmail,
        role: (role as UserRole) || 'customer',
        password: password || 'defaultpass',
        avatar: role === 'business'
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        businessName: role === 'business' ? `${capitalized} Studio` : undefined,
        businessCategory: role === 'business' ? 'Wellness' : undefined,
      };
      users.push(user);
    }
  }

  if (!user) {
    return res.status(400).json({ error: 'Please provide valid credentials or select a demo account' });
  }

  const safeUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    isVip: user.isVip,
    totalBookings: user.totalBookings,
    businessId: user.businessId,
    businessName: user.businessName,
    businessCategory: user.businessCategory,
    businessAddress: user.businessAddress,
  };

  res.json({
    success: true,
    user: safeUser,
    token: `sdr_sess_${Date.now()}_${user.id}`,
    message: `Signed in successfully as ${safeUser.name} (${safeUser.role === 'business' ? 'Business Owner' : 'Customer'})`,
  });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { role = 'customer', name, email, phone, businessName, businessCategory, businessAddress } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Name and email are required for registration' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    // Return existing user
    return res.json({
      success: true,
      user: existing,
      token: `sdr_sess_${Date.now()}_${existing.id}`,
      message: 'Logged in with existing account',
    });
  }

  let bizId: string | undefined;
  if (role === 'business') {
    bizId = `biz-${Date.now() % 100000}`;
    const newBizRecord = {
      id: bizId,
      name: businessName || `${name}'s Studio`,
      category: businessCategory || 'Wellness',
      rating: 5.0,
      reviewCount: 1,
      description: 'Dedicated client-first appointment services.',
      address: businessAddress || '100 Market St',
      city: 'San Francisco',
      state: 'CA',
      pincode: '94105',
      latitude: 37.7915,
      longitude: -122.3995,
      phone: phone || '+1 (415) 555-0100',
      email: cleanEmail,
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      priceRange: '$$',
      openingTime: '09:00 AM',
      closingTime: '06:00 PM',
      daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlotsToday: ['09:30 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
      services: [
        { name: 'Standard Consultation', duration: '45 min', price: 75 },
        { name: 'Comprehensive Session', duration: '60 min', price: 110 },
      ],
      createdAt: new Date().toISOString(),
    };
    businesses.unshift(newBizRecord);
  }

  const newUser: StoredUser = {
    id: `usr-${role}-${Date.now() % 100000}`,
    name,
    email: cleanEmail,
    phone: phone || '',
    role: role as UserRole,
    avatar: role === 'business'
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isVip: false,
    totalBookings: 0,
    businessId: bizId,
    businessName: businessName || (role === 'business' ? `${name}'s Studio` : undefined),
    businessCategory: businessCategory || (role === 'business' ? 'Wellness' : undefined),
    businessAddress: businessAddress,
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    user: newUser,
    token: `sdr_sess_${Date.now()}_${newUser.id}`,
    message: `Account created for ${newUser.name}`,
  });
});

// 1c. Customer appointments feed (with Token passes)
app.get('/api/customer/appointments', (req: Request, res: Response) => {
  const email = (req.query.email as string)?.trim().toLowerCase();
  if (!email) {
    return res.json(appointments);
  }

  let matched = appointments.filter((a) => a.clientEmail.toLowerCase() === email);
  if (matched.length === 0) {
    // Demo fallback so new customer views sample active passes
    matched = appointments.slice(0, 3);
  }

  res.json(matched);
});

app.get('/api/system/scaling', (req: Request, res: Response) => {
  const activeCount = appointments.length;
  const metrics: CloudScalingStatus = {
    instanceId: 'cr-schedora-prod-asia-east1-' + Math.floor(Math.random() * 899 + 100),
    activeNodes: Math.max(2, Math.ceil(activeCount / 10)),
    autoScaleMin: 2,
    autoScaleMax: 30,
    cpuUtilization: Math.round(18 + (activeCount % 15) * 2.5),
    memoryUtilization: Math.round(24 + (activeCount % 10) * 1.8),
    requestsPerSecond: Math.round(14 + Math.random() * 8),
    dbReplicaHealth: 'synced',
    averageLatencyMs: 16 + Math.floor(Math.random() * 6),
    uptimeSeconds: Math.floor(process.uptime()),
  };
  res.json(metrics);
});

// 2. Services
app.get('/api/services', (req: Request, res: Response) => {
  res.json(services);
});

app.post('/api/services', (req: Request, res: Response) => {
  const { name, category, durationMinutes, price, depositRequired, cancellationFee, description, color } = req.body;
  if (!name || !price || !durationMinutes) {
    return res.status(400).json({ error: 'Missing required service parameters' });
  }
  const newService: Service = {
    id: 'srv-' + (services.length + 1),
    name,
    category: category || 'General',
    durationMinutes: Number(durationMinutes),
    price: Number(price),
    depositRequired: Number(depositRequired || 20),
    cancellationFee: Number(cancellationFee || 25),
    description: description || '',
    color: color || '#3B82F6',
  };
  services.push(newService);
  res.status(201).json(newService);
});

// 3. Staff Management APIs (Full CRUD + Working Hours & Services Allocation)
app.get('/api/staff', (req: Request, res: Response) => {
  res.json(staff);
});

app.post('/api/staff', (req: Request, res: Response) => {
  const { name, role, email, phone, avatar, serviceIds, workingHours, bio } = req.body;
  if (!name || !role) {
    return res.status(400).json({ error: 'Name and role are required' });
  }

  const defaultSchedule: DaySchedule[] = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => ({
    day: dayNum,
    enabled: dayNum >= 1 && dayNum <= 5, // Mon-Fri by default
    start: workingHours?.start || '09:00',
    end: workingHours?.end || '17:00',
  }));

  const newStaff: StaffMember = {
    id: `st-${Date.now() % 100000}`,
    name,
    role,
    email: email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@schedulabusiness.com`,
    phone: phone || '+1 (555) 000-1234',
    avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    serviceIds: Array.isArray(serviceIds) && serviceIds.length > 0 ? serviceIds : services.map((s) => s.id),
    workingHours: {
      start: workingHours?.start || '09:00',
      end: workingHours?.end || '17:00',
      days: workingHours?.days || [1, 2, 3, 4, 5],
      daySchedule: workingHours?.daySchedule || defaultSchedule,
    },
    breakTimes: workingHours?.breakTimes || [{ start: '12:30', end: '13:30', label: 'Lunch Break' }],
    bio: bio || 'Certified professional dedicated to exceptional client outcomes.',
    active: true,
  };

  staff.push(newStaff);
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = staff.findIndex((s) => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Staff member not found' });
  }

  staff[index] = {
    ...staff[index],
    ...req.body,
    id, // protect immutable ID
  };

  res.json(staff[index]);
});

app.delete('/api/staff/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const activeBookings = appointments.filter(
    (a) => a.staffId === id && (a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress')
  );

  if (activeBookings.length > 0) {
    return res.status(400).json({
      error: `Cannot delete staff member with ${activeBookings.length} active or pending appointment(s). Reassign them first.`,
      activeCount: activeBookings.length,
    });
  }

  staff = staff.filter((s) => s.id !== id);
  res.json({ success: true, removedId: id });
});

// 3b. Assign / Reassign Staff on an Appointment
app.patch('/api/appointments/:id/assign-staff', (req: Request, res: Response) => {
  const { id } = req.params;
  const { staffId, note } = req.body;

  const aptIndex = appointments.findIndex((a) => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const targetStaff = staff.find((s) => s.id === staffId);
  if (!targetStaff) {
    return res.status(404).json({ error: 'Assigned staff member not found' });
  }

  const previousStaffName = appointments[aptIndex].staffName;
  appointments[aptIndex] = {
    ...appointments[aptIndex],
    staffId: targetStaff.id,
    staffName: targetStaff.name,
    updatedAt: new Date().toISOString(),
    statusHistory: [
      ...appointments[aptIndex].statusHistory,
      {
        status: appointments[aptIndex].status,
        timestamp: new Date().toISOString(),
        note: note || `Reassigned from ${previousStaffName} to ${targetStaff.name} (${targetStaff.role})`,
        by: 'owner',
      },
    ],
  };

  // Add notification log
  const log: NotificationLog = {
    id: 'ntf-' + Date.now(),
    appointmentId: id,
    type: 'push',
    recipient: targetStaff.email,
    subject: `New Appointment Assigned: ${appointments[aptIndex].clientName}`,
    message: `You have been assigned to ${appointments[aptIndex].serviceName} on ${appointments[aptIndex].date} at ${appointments[aptIndex].startTime}.`,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    read: false,
  };
  notifications.unshift(log);

  res.json(appointments[aptIndex]);
});

// 4. Availability Engine: Calculates slots strictly adhering to individual staff working hours & services
app.get('/api/availability', (req: Request, res: Response) => {
  const date = (req.query.date as string) || formatDate(new Date());
  const serviceId = req.query.serviceId as string;
  const staffId = req.query.staffId as string;

  const targetService = services.find((s) => s.id === serviceId) || services[0];
  const serviceDuration = targetService ? targetService.durationMinutes : 45;

  // Filter staff who provide this service and are active
  let qualifiedStaff = staff.filter((st) => st.active !== false);
  if (serviceId) {
    qualifiedStaff = qualifiedStaff.filter((st) => st.serviceIds.includes(serviceId));
    if (qualifiedStaff.length === 0) qualifiedStaff = staff.filter((st) => st.active !== false);
  }
  if (staffId && staffId !== 'any') {
    qualifiedStaff = qualifiedStaff.filter((st) => st.id === staffId);
  }

  // Determine day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const [y, m, d] = date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay();

  // Filter staff who are scheduled to work on this specific day
  const workingStaffOnDate = qualifiedStaff.filter((st) => {
    if (st.workingHours?.daySchedule && st.workingHours.daySchedule.length > 0) {
      const daySched = st.workingHours.daySchedule.find((ds) => ds.day === dayOfWeek);
      return daySched ? daySched.enabled : false;
    }
    return st.workingHours?.days ? st.workingHours.days.includes(dayOfWeek) : true;
  });

  // Candidate times across 09:00 - 18:00
  const candidateTimes = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Check appointments on this date
  const bookedOnDate = appointments.filter(
    (apt) => apt.date === date && apt.status !== 'cancelled'
  );

  const slotResults = candidateTimes.map((time) => {
    const [h, min] = time.split(':').map(Number);
    const slotStartMin = h * 60 + min;
    const slotEndMin = slotStartMin + serviceDuration;

    // Check which working staff members can take this slot
    const availableStaffForSlot = workingStaffOnDate.filter((st) => {
      // 1. Get staff working window for this day
      let staffStart = st.workingHours?.start || '09:00';
      let staffEnd = st.workingHours?.end || '17:00';

      if (st.workingHours?.daySchedule) {
        const ds = st.workingHours.daySchedule.find((d) => d.day === dayOfWeek);
        if (ds && ds.enabled) {
          staffStart = ds.start;
          staffEnd = ds.end;
        }
      }

      const [startH, startM] = staffStart.split(':').map(Number);
      const [endH, endM] = staffEnd.split(':').map(Number);
      const staffShiftStart = startH * 60 + startM;
      const staffShiftEnd = endH * 60 + endM;

      // Slot must fit within staff's working hours
      if (slotStartMin < staffShiftStart || slotEndMin > staffShiftEnd) {
        return false;
      }

      // 2. Check break times
      if (st.breakTimes && st.breakTimes.length > 0) {
        for (const brk of st.breakTimes) {
          const [bsh, bsm] = brk.start.split(':').map(Number);
          const [beh, bem] = brk.end.split(':').map(Number);
          const breakStartMin = bsh * 60 + bsm;
          const breakEndMin = beh * 60 + bem;

          // If overlapping with break
          if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
            return false;
          }
        }
      }

      // 3. Check for existing appointment conflicts for this staff member
      const hasConflict = bookedOnDate.some((apt) => {
        if (apt.staffId !== st.id) return false;
        const [ah, am] = apt.startTime.split(':').map(Number);
        const [aeh, aem] = apt.endTime.split(':').map(Number);
        const aptStart = ah * 60 + am;
        const aptEnd = aeh * 60 + aem;
        return slotStartMin < aptEnd && slotEndMin > aptStart;
      });

      return !hasConflict;
    });

    return {
      time,
      available: availableStaffForSlot.length > 0,
      availableStaff: availableStaffForSlot.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
        avatar: s.avatar,
      })),
      bookedCount: bookedOnDate.filter((apt) => apt.startTime === time).length,
    };
  });

  res.json({
    date,
    dayOfWeek,
    service: targetService,
    slots: slotResults,
    workingStaffCount: workingStaffOnDate.length,
    fullyBooked: slotResults.every((s) => !s.available),
  });
});

// 5. Smart Date & Time Suggestion API (AI + Heuristic slot matchmaking)
app.post('/api/suggest-slots', async (req: Request, res: Response) => {
  const { date, serviceId, staffId, clientPreference } = req.body;
  const targetService = services.find((s) => s.id === serviceId) || services[0];
  const requestedDate = new Date(date || Date.now());

  // Search over the next 7 days for open slots
  const suggestions: SuggestedSlot[] = [];
  const candidateStaff = staff.filter((st) => !staffId || staffId === 'any' || st.id === staffId);

  const preferredHours = ['10:00', '11:30', '14:00', '15:30', '09:30'];

  for (let offset = 1; offset <= 6; offset++) {
    const candidateDateObj = new Date(requestedDate);
    candidateDateObj.setDate(requestedDate.getDate() + offset);
    const dateStr = formatDate(candidateDateObj);

    // Skip Sundays
    if (candidateDateObj.getDay() === 0) continue;

    const existingAppointments = appointments.filter(
      (a) => a.date === dateStr && a.status !== 'cancelled'
    );

    for (const st of candidateStaff) {
      for (const time of preferredHours) {
        const isConflict = existingAppointments.some(
          (a) => a.staffId === st.id && a.startTime === time
        );
        if (!isConflict && suggestions.length < 4) {
          // Calculate end time
          const [h, m] = time.split(':').map(Number);
          const endMinutesTotal = h * 60 + m + targetService.durationMinutes;
          const endH = String(Math.floor(endMinutesTotal / 60)).padStart(2, '0');
          const endM = String(endMinutesTotal % 60).padStart(2, '0');

          let reason = `High availability day with ${st.name}. Ideal for undisturbed ${targetService.durationMinutes} min session.`;
          if (offset === 1) reason = `Next day immediate availability: Beat the queue with ${st.name}!`;
          else if (time.startsWith('10') || time.startsWith('11')) reason = `Prime morning focus window with ${st.name}.`;
          else if (time.startsWith('14') || time.startsWith('15')) reason = `Relaxed afternoon slot with zero overlap buffer.`;

          suggestions.push({
            date: dateStr,
            startTime: time,
            endTime: `${endH}:${endM}`,
            staffId: st.id,
            staffName: st.name,
            reason,
            confidenceScore: Math.round(92 - offset * 4),
          });
        }
      }
    }
  }

  // If Gemini API is available, optionally enrich reason with AI personalization
  const ai = getAI();
  if (ai && suggestions.length > 0) {
    try {
      const prompt = `You are an executive scheduling concierge for ${businessSettings.businessName}.
The client requested an appointment on ${date} for ${targetService.name}, but that slot was congested.
We found these 3 alternative slots:
${suggestions.slice(0, 3).map((s, i) => `${i + 1}. ${s.date} at ${s.startTime} with ${s.staffName}`).join('\n')}

Generate a concise, warm 1-sentence concierge note explaining why these alternatives provide a smooth, prompt experience. Keep it under 25 words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });

      const note = response.text ? response.text.trim() : '';
      if (note) {
        suggestions[0].reason = `${note} (Recommended by Schedula AI)`;
      }
    } catch (e) {
      console.warn('Gemini enrichment skipped:', e);
    }
  }

  res.json({
    originalRequestedDate: date,
    service: targetService,
    suggestions,
  });
});

// Heuristic Recommendation Engine for Proactive AI Service Matchmaking
function generateHeuristicRecommendations(
  selectedService: any,
  availableServices: any[] = [],
  bookingHistory: any[] = [],
  customerPreferences: any = {},
  businessCategory: string = ''
) {
  const pool = availableServices.filter((s: any) => s && s.id !== selectedService.id);
  const sName = (selectedService.name || '').toLowerCase();
  const sDesc = (selectedService.description || '').toLowerCase();
  const sCat = (selectedService.category || businessCategory || '').toLowerCase();

  const userNotes = (
    (customerPreferences?.treatmentGoalsNotes || '') +
    ' ' +
    (customerPreferences?.sensitivitiesAllergies || '') +
    ' ' +
    (customerPreferences?.hairPreferences || '') +
    ' ' +
    (customerPreferences?.skinPreferences || '')
  ).toLowerCase();

  const historyText = (bookingHistory || [])
    .map((b: any) => (b.serviceName || '') + ' ' + (b.notes || ''))
    .join(' ')
    .toLowerCase();

  const recommendations: any[] = [];

  for (const item of pool) {
    const itemName = (item.name || '').toLowerCase();
    const itemDesc = (item.description || '').toLowerCase();
    let score = 72;
    let type: 'add_on' | 'alternative' | 'upgrade' = 'add_on';
    let badge = '✨ Perfect Add-on';
    let reason = '';

    // 1. Haircut / Salon logic (proactively recommend conditioning treatment or styling session)
    if (sName.includes('cut') || sName.includes('hair') || sCat.includes('salon')) {
      if (
        itemName.includes('condition') ||
        itemName.includes('masque') ||
        itemName.includes('repair') ||
        itemName.includes('ritual') ||
        itemName.includes('detox') ||
        itemName.includes('keratin')
      ) {
        score = 97;
        type = 'add_on';
        badge = '✨ Proactive Add-on';
        reason = `Pairing this conditioning & scalp treatment locks in moisture, repairs cuticle bonds, and extends your haircut shape.`;
      } else if (
        itemName.includes('blowout') ||
        itemName.includes('styling') ||
        itemName.includes('gloss') ||
        itemName.includes('finish')
      ) {
        score = 93;
        type = 'add_on';
        badge = '💇 Styling Session';
        reason = `Complete your fresh cut with a professional styling & botanical blowout for a camera-ready finish.`;
      } else if (itemName.includes('balayage') || itemName.includes('color')) {
        score = 86;
        type = 'upgrade';
        badge = '💎 Dimensional Upgrade';
        reason = `Looking for vibrant multi-tonal depth? Upgrade your haircut appointment with hand-painted sun-kissed balayage.`;
      }
    }

    // 2. Spa / Massage logic
    else if (
      sName.includes('massage') ||
      sName.includes('steam') ||
      sName.includes('bodywork') ||
      sCat.includes('spa')
    ) {
      if (itemName.includes('stone') || itemName.includes('basalt')) {
        score = 98;
        type = 'add_on';
        badge = '🔥 Heated River Stones';
        reason = `Smooth basalt river stones melt deep chronic muscle knots and amplify blood microcirculation.`;
      } else if (itemName.includes('facial') || itemName.includes('hydro')) {
        score = 94;
        type = 'add_on';
        badge = '🌿 Head-to-Toe Wellness';
        reason = `Combine your bodywork with an organic botanical hydro-facial for a complete restorative transformation.`;
      } else if (itemName.includes('deep tissue') || itemName.includes('ritual')) {
        score = 90;
        type = 'upgrade';
        badge = '⭐ Therapeutic Upgrade';
        reason = `Target chronic spinal tightness and upper back knots with focused clinical myofascial release.`;
      }
    }

    // 3. Facial / Skincare logic
    else if (sName.includes('facial') || sName.includes('skin') || sName.includes('esthetic')) {
      if (itemName.includes('steam') || itemName.includes('massage')) {
        score = 96;
        type = 'add_on';
        badge = '💆 Synergistic Pairing';
        reason = `Herbal sauna steam and neck tension release open pores for deeper nutrient absorption.`;
      } else if (itemName.includes('detox') || itemName.includes('masque') || itemName.includes('hydro')) {
        score = 92;
        type = 'add_on';
        badge = '✨ Hydration Booster';
        reason = `Intensive cold-pressed floral essence mask to lock in long-lasting clarity and supple elasticity.`;
      }
    }

    // 4. Dental logic
    else if (sName.includes('dental') || sName.includes('cleaning') || sCat.includes('dent')) {
      if (itemName.includes('whiten') || itemName.includes('laser')) {
        score = 97;
        type = 'add_on';
        badge = '✨ Brighten Your Smile';
        reason = `Chairside enamel whitening immediately following scaling delivers optimal shade brightening.`;
      } else if (itemName.includes('scan') || itemName.includes('orthodontic') || itemName.includes('aesthetic')) {
        score = 91;
        type = 'alternative';
        badge = '🔍 3D Digital Check';
        reason = `High-definition digital orthodontic scan to inspect alignment and prevent bite wear.`;
      }
    }

    // 5. Pet Grooming logic
    else if (sName.includes('groom') || sName.includes('bath') || sCat.includes('pet')) {
      if (itemName.includes('nail') || itemName.includes('trim')) {
        score = 97;
        type = 'add_on';
        badge = '🐾 Essential Add-on';
        reason = `Gentle nail clipping and dremel smoothing prevents paw pain and improves traction.`;
      } else if (itemName.includes('bath') || itemName.includes('brush') || itemName.includes('blueberry')) {
        score = 92;
        type = 'add_on';
        badge = '🛁 Coat Care';
        reason = `Oatmeal hydro-bath with hypoallergenic extracts relieves itchy skin and leaves coats silky.`;
      } else if (itemName.includes('breed') || itemName.includes('full')) {
        score = 88;
        type = 'upgrade';
        badge = '🏆 Master Breed Contour';
        reason = `Upgrade to master scissor breed contouring for tailored head and leg styling.`;
      }
    }

    // 6. Clinic / Medical Consultation logic
    else if (sName.includes('health') || sName.includes('consultation') || sCat.includes('clinic')) {
      if (itemName.includes('preventative') || itemName.includes('wellness') || itemName.includes('assessment')) {
        score = 95;
        type = 'add_on';
        badge = '🩺 Proactive Diagnostic';
        reason = `Comprehensive cardiovascular and biomarker risk profiling to complement your lifestyle review.`;
      } else if (itemName.includes('acupuncture') || itemName.includes('rehabilitation')) {
        score = 89;
        type = 'alternative';
        badge = '⚡ Active Recovery';
        reason = `Sterile micro-needle meridian balance and targeted physical mobility therapy for fast recovery.`;
      }
    }

    // Personalization adjustments based on customer history and stored preferences
    if (historyText && historyText.includes(itemName.slice(0, 7))) {
      score += 6;
      badge = '🌿 Based on Past Visits';
      reason = `You frequently book and enjoy this service. Pairing it today maintains your personalized wellness routine.`;
    }

    if (
      userNotes &&
      (userNotes.includes(itemName.slice(0, 6)) ||
        userNotes.includes('lavender') ||
        userNotes.includes('organic') ||
        userNotes.includes('conditioning') ||
        userNotes.includes('styling') ||
        userNotes.includes('sensitive'))
    ) {
      score += 5;
      badge = '🎯 Matches Your Preferences';
      reason = `Proactively recommended to align with your personal care preferences and treatment goals.`;
    }

    if (!reason) {
      if (item.price && item.price <= selectedService.price) {
        type = 'add_on';
        badge = '✨ Complementary Add-on';
        reason = `Frequently paired together by Schedora clients for a complete, elevated appointment experience.`;
      } else {
        type = 'upgrade';
        badge = '⭐ Popular Upgrade';
        reason = `Provides an extended, comprehensive treatment session tailored to your visit.`;
      }
    }

    recommendations.push({
      serviceId: item.id,
      serviceName: item.name,
      type,
      badge,
      reason,
      suggestedAddOnPrice: item.price || 30,
      suggestedAddOnDurationMinutes: item.durationMinutes || parseInt(item.duration, 10) || 20,
      confidenceScore: Math.min(score, 99),
    });
  }

  recommendations.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));

  let headline = `Personalized Enhancements for ${selectedService.name}`;
  let conciergeNote = `Our AI concierge analyzed your service selection, booking history, and personal preferences to recommend these complementary enhancements.`;

  if (bookingHistory.length > 0) {
    conciergeNote = `Tailored using your ${bookingHistory.length} previous visit${
      bookingHistory.length > 1 ? 's' : ''
    } and stored service preferences.`;
  }

  return {
    headline,
    conciergeNote,
    recommendations: recommendations.slice(0, 3),
  };
}

// 5b. AI Service Recommendation Engine Endpoint
app.post('/api/ai/recommend-services', async (req: Request, res: Response) => {
  try {
    const {
      selectedService,
      availableServices = [],
      customerEmail = '',
      customerName = '',
      bookingHistory = [],
      customerPreferences = {},
      businessName = '',
      businessCategory = '',
    } = req.body;

    if (!selectedService) {
      return res.status(400).json({ error: 'selectedService is required' });
    }

    // Try Gemini API first (Server-side Gemini 3.8 Flash)
    const ai = getAI();
    if (ai) {
      try {
        const pool = availableServices.filter((s: any) => s && s.id !== selectedService.id);
        if (pool.length > 0) {
          const prompt = `You are Schedora's proactive smart appointment concierge AI.
A client (${customerName || 'Customer'}) is currently booking an appointment.
Business: "${businessName}" (Category: "${businessCategory}").

Current Selected Service:
- Name: "${selectedService.name}"
- Category: "${selectedService.category || businessCategory}"
- Duration: ${selectedService.durationMinutes || selectedService.duration || 45} mins
- Price: $${selectedService.price}
- Description: "${selectedService.description || ''}"

Client Past Booking History:
${
  bookingHistory && bookingHistory.length > 0
    ? bookingHistory
        .slice(0, 5)
        .map(
          (b: any) =>
            `- ${b.serviceName || b.service} on ${b.date || 'past visit'}${
              b.notes ? ` (Client notes: "${b.notes}")` : ''
            }`
        )
        .join('\n')
    : 'No past recorded bookings for this client (first visit).'
}

Client Stored Preferences & Sensitivities:
${JSON.stringify(customerPreferences, null, 2)}

Available Services at this business:
${pool
  .map(
    (s: any) =>
      `- ID: "${s.id}", Name: "${s.name}", Price: $${s.price}, Duration: ${
        s.duration || `${s.durationMinutes} min`
      }, Description: "${s.description || ''}"`
  )
  .join('\n')}

Task:
Analyze the client's current selection, past booking history, and personal preferences.
Proactively recommend 1 to 3 complementary services:
1. "add_on": Services that can be added onto the current booking to enhance results (e.g., if haircut, recommend conditioning treatment or styling session; if facial, recommend hydro-therapy or eye mask; if massage, recommend hot stone; if pet groom, recommend nail trim).
2. "alternative" or "upgrade": Services that might better match their history or provide an upgraded experience.

Respond with ONLY valid JSON strictly adhering to this schema:
{
  "headline": "Personalized Recommendations for You",
  "conciergeNote": "1-sentence friendly concierge insight explaining why these match the client",
  "recommendations": [
    {
      "serviceId": "exact ID from available services list",
      "serviceName": "exact service name",
      "type": "add_on",
      "badge": "Perfect Add-on",
      "reason": "1 clear sentence explaining why this matches their booking or history",
      "suggestedAddOnPrice": 25,
      "suggestedAddOnDurationMinutes": 15,
      "confidenceScore": 95
    }
  ]
}`;

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API timeout')), 3500)
          );

          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const response: any = await Promise.race([geminiPromise, timeoutPromise]);

          const rawText = response.text ? response.text.trim() : '';
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
              return res.json({
                success: true,
                source: 'gemini-3.8-flash',
                ...parsed,
              });
            }
          }
        }
      } catch (geminiError) {
        console.warn('Gemini recommendation failed, falling back to heuristic engine:', geminiError);
      }
    }

    // Heuristic Smart Fallback Engine
    const fallback = generateHeuristicRecommendations(
      selectedService,
      availableServices,
      bookingHistory,
      customerPreferences,
      businessCategory
    );

    return res.json({
      success: true,
      source: 'heuristic-engine',
      ...fallback,
    });
  } catch (err: any) {
    console.error('AI Recommendation endpoint error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations', message: err?.message });
  }
});

// 6. Appointments CRUD
app.get('/api/appointments', (req: Request, res: Response) => {
  const { status, date, search } = req.query;
  let list = [...appointments];

  if (status && status !== 'all') {
    list = list.filter((a) => a.status === status);
  }
  if (date) {
    list = list.filter((a) => a.date === date);
  }
  if (search) {
    const term = (search as string).toLowerCase();
    list = list.filter(
      (a) =>
        a.clientName.toLowerCase().includes(term) ||
        a.clientEmail.toLowerCase().includes(term) ||
        a.confirmationCode.toLowerCase().includes(term) ||
        (a.tokenNumber && a.tokenNumber.toLowerCase().includes(term)) ||
        a.serviceName.toLowerCase().includes(term)
    );
  }

  // Sort by date and time
  list.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  res.json(list);
});

// Physical Arrival Token Check-in Endpoint
app.post('/api/appointments/check-in-token', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Token or confirmation code is required' });
  }

  const raw = String(query).trim().toUpperCase();
  const digitsOnly = raw.replace(/[^0-9]/g, '');

  const appointment = appointments.find((a) => {
    if (a.tokenNumber && a.tokenNumber.toUpperCase() === raw) return true;
    if (a.confirmationCode.toUpperCase() === raw) return true;
    if (digitsOnly.length >= 3 && a.tokenNumber && a.tokenNumber.includes(digitsOnly)) return true;
    if (digitsOnly.length >= 3 && a.confirmationCode.includes(digitsOnly)) return true;
    return false;
  });

  if (!appointment) {
    return res.status(404).json({ error: 'No matching appointment found for physical token: ' + query });
  }

  appointment.physicallyCheckedIn = true;
  appointment.checkedInAt = new Date().toISOString();
  if (appointment.status === 'pending' || appointment.status === 'confirmed') {
    appointment.status = 'in_progress';
  }

  appointment.statusHistory.unshift({
    status: appointment.status,
    timestamp: new Date().toISOString(),
    note: `Client physically checked in with Token ${appointment.tokenNumber || appointment.confirmationCode}`,
    by: 'owner',
  });

  res.json({
    success: true,
    message: `Token verified. ${appointment.clientName} has physically arrived!`,
    appointment,
  });
});

app.post('/api/appointments', (req: Request, res: Response) => {
  const {
    serviceId,
    staffId,
    clientName,
    clientEmail,
    clientPhone,
    clientNotes,
    date,
    startTime,
    paymentMethod,
    businessId,
    businessName,
    businessAddress,
    addOnServices = [],
  } = req.body;

  if (!serviceId || !clientName || !clientEmail || !date || !startTime) {
    return res.status(400).json({ error: 'Missing required booking fields' });
  }

  const selectedService = services.find((s) => s.id === serviceId) || services[0];
  const selectedStaff =
    staff.find((st) => st.id === staffId) ||
    staff.find((st) => st.serviceIds.includes(selectedService.id)) ||
    staff[0];

  // Calculate Total Price and End Time including any Proactive Add-on Services
  const addOnsTotal = (addOnServices || []).reduce(
    (sum: number, a: any) => sum + (Number(a.price || a.suggestedAddOnPrice) || 0),
    0
  );
  const addOnsDuration = (addOnServices || []).reduce(
    (sum: number, a: any) => sum + (Number(a.durationMinutes || a.suggestedAddOnDurationMinutes) || 15),
    0
  );
  const totalDuration = selectedService.durationMinutes + addOnsDuration;
  const totalPrice = selectedService.price + addOnsTotal;

  // Calculate End Time
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + totalDuration;
  const endH = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const endM = String(totalMin % 60).padStart(2, '0');
  const endTime = `${endH}:${endM}`;

  // Check deposit requirement based on total
  let depositAmount = selectedService.depositRequired;
  if (businessSettings.depositPolicy === 'percentage') {
    depositAmount = Math.round((totalPrice * businessSettings.depositValue) / 100);
  } else if (businessSettings.depositPolicy === 'none') {
    depositAmount = 0;
  }

  const initialStatus = businessSettings.autoConfirmBookings ? 'confirmed' : 'pending';
  const confirmationCode = 'APX-' + Math.floor(1000 + Math.random() * 9000);
  const tokenNumber = 'TK-' + Math.floor(1000 + Math.random() * 9000);

  const newAppointment: Appointment = {
    id: 'apt-' + (Date.now() % 1000000),
    confirmationCode,
    tokenNumber,
    businessId: businessId || undefined,
    businessName: businessName || businessSettings.businessName,
    businessAddress: businessAddress || businessSettings.businessAddress,
    physicallyCheckedIn: false,
    serviceId: selectedService.id,
    serviceName: selectedService.name,
    addOnServices: addOnServices && addOnServices.length > 0 ? addOnServices : undefined,
    staffId: selectedStaff.id,
    staffName: selectedStaff.name,
    clientName,
    clientEmail,
    clientPhone: clientPhone || '+1 (555) 000-1122',
    clientNotes,
    date,
    startTime,
    endTime,
    status: initialStatus,
    payment: {
      method: paymentMethod || 'card',
      amountTotal: totalPrice,
      depositPaid: depositAmount,
      remainingDue: totalPrice - depositAmount,
      status: depositAmount > 0 ? 'paid_deposit' : 'pending',
      transactionId: 'tx_sec_' + Math.floor(100000 + Math.random() * 900000),
      cardLast4: '4242',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    statusHistory: [
      {
        status: initialStatus,
        timestamp: new Date().toISOString(),
        note: businessSettings.autoConfirmBookings
          ? 'Auto-confirmed via business setting'
          : 'Pending owner review and confirmation',
        by: businessSettings.autoConfirmBookings ? 'system' : 'customer',
      },
    ],
    remindersSent: {
      confirmationEmail: businessSettings.autoConfirmBookings,
      confirmationSms: businessSettings.autoConfirmBookings,
      reminder24h: false,
      reminder2h: false,
    },
  };

  appointments.unshift(newAppointment);

  // Update or insert client directory record
  const existingClient = clients.find((c) => c.email.toLowerCase() === clientEmail.toLowerCase());
  if (existingClient) {
    existingClient.totalBookings += 1;
    existingClient.totalSpent += selectedService.price;
    existingClient.lastVisit = date;
  } else {
    clients.push({
      id: 'cl-' + (clients.length + 1),
      name: clientName,
      email: clientEmail,
      phone: clientPhone || '',
      totalBookings: 1,
      totalSpent: selectedService.price,
      lastVisit: date,
      notes: clientNotes || 'New client registered via online booking.',
      isVip: false,
    });
  }

  // Create notifications
  // Push notification for Owner
  notifications.unshift({
    id: 'nt-' + Date.now(),
    appointmentId: newAppointment.id,
    type: 'push',
    recipient: 'Business Owner & Staff Dashboard',
    subject: businessSettings.autoConfirmBookings
      ? `New Auto-Confirmed Booking: ${clientName}`
      : `New Booking Request: ${clientName} requires confirmation`,
    message: `${clientName} booked ${selectedService.name} on ${date} at ${startTime}. Deposit $${depositAmount} authorized.`,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    read: false,
  });

  // Automated Email/SMS Notification for Client
  if (businessSettings.emailNotificationsEnabled) {
    notifications.unshift({
      id: 'nt-email-' + Date.now(),
      appointmentId: newAppointment.id,
      type: 'email',
      recipient: clientEmail,
      subject: `Your Booking at ${businessSettings.businessName} [${confirmationCode}]`,
      message: `Dear ${clientName}, your booking for ${selectedService.name} on ${date} at ${startTime} with ${selectedStaff.name} is ${newAppointment.status.toUpperCase()}.`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      read: true,
    });
  }

  res.status(201).json(newAppointment);
});

// 7. Update appointment status (Owner Quick Confirmation / Reschedule / Cancel / Complete)
app.patch('/api/appointments/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, note, by = 'owner', newDate, newStartTime } = req.body;

  const apt = appointments.find((a) => a.id === id);
  if (!apt) {
    return res.status(400).json({ error: 'Appointment not found' });
  }

  const previousStatus = apt.status;
  apt.status = status;
  apt.updatedAt = new Date().toISOString();

  if (newDate) apt.date = newDate;
  if (newStartTime) apt.startTime = newStartTime;

  // Handle cancellation fee logic if cancelled
  if (status === 'cancelled') {
    if (apt.payment.depositPaid > 0) {
      // If within 24 hours, retain fee
      apt.payment.status = 'fee_charged';
    }
  } else if (status === 'completed') {
    apt.payment.status = 'paid_full';
    apt.payment.remainingDue = 0;
  }

  apt.statusHistory.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status transitioned from ${previousStatus} to ${status} by ${by}`,
    by,
  });

  // Dispatch real-time push and customer email notification
  notifications.unshift({
    id: 'nt-status-' + Date.now(),
    appointmentId: apt.id,
    type: 'push',
    recipient: `${apt.clientName} & Team`,
    subject: `Appointment Status: ${status.toUpperCase()} (${apt.confirmationCode})`,
    message: `Appointment for ${apt.serviceName} has been ${status}. ${note || ''}`,
    timestamp: new Date().toISOString(),
    status: 'delivered',
    read: false,
  });

  if (status === 'confirmed') {
    apt.remindersSent.confirmationEmail = true;
    apt.remindersSent.confirmationSms = true;
  }

  // Automatic Standby Waitlist Notification on Cancellation:
  // When an appointment is cancelled, find any waiting clients and alert them immediately
  if (status === 'cancelled') {
    const candidate = serverWaitlist.find(
      (w) =>
        w.businessId === apt.businessId &&
        w.preferredDate === apt.date &&
        w.status === 'waiting'
    );
    if (candidate) {
      candidate.status = 'notified';
      candidate.notifiedAt = new Date().toISOString();
      const claimUrl = `/book/${candidate.businessSlug || candidate.businessId}?service=${candidate.serviceId}&date=${apt.date}&slot=${apt.startTime}&claimToken=${candidate.token}`;
      candidate.matchedSlot = {
        date: apt.date,
        startTime: apt.startTime,
        staffName: apt.staffName,
        claimUrl,
      };

      // Record automated delivery log
      messageLogs.unshift({
        id: `msg-waitlist-${Date.now()}`,
        appointmentId: apt.id,
        customerId: candidate.id,
        customerName: candidate.customerName,
        customerPhone: candidate.customerPhone || '+1 (555) 234-5678',
        businessId: apt.businessId,
        businessName: apt.businessName,
        channel: candidate.channel === 'sms' ? 'sms' : 'whatsapp',
        messageType: 'waitlist_slot_available',
        attemptCount: 1,
        deliveryStatus: 'delivered',
        providerMessageId: `wamid.WL${Date.now()}`,
        templateName: 'schedora_waitlist_slot_opened_v1',
        bodyContent: `A slot just opened up for ${candidate.serviceName} at ${apt.businessName} on ${apt.date} at ${apt.startTime}. Claim: ${claimUrl}`,
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
      });

      // Also create an in-app notification
      notifications.unshift({
        id: 'nt-wl-' + Date.now(),
        appointmentId: apt.id,
        type: 'push',
        recipient: `${candidate.customerName}`,
        subject: `Slot Opened: ${candidate.serviceName} at ${apt.businessName}`,
        message: `An appointment slot opened on ${apt.date} at ${apt.startTime}. Claim token: ${candidate.token}`,
        timestamp: new Date().toISOString(),
        status: 'delivered',
        read: false,
      });
    }
  }

  res.json(apt);
});

// 8. Automated reminder dispatch API (Email/SMS simulator)
app.post('/api/reminders/send', (req: Request, res: Response) => {
  const { appointmentId, reminderType = '24h', medium = 'both' } = req.body;
  const apt = appointments.find((a) => a.id === appointmentId);
  if (!apt) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const sentLogs: NotificationLog[] = [];

  if (medium === 'both' || medium === 'sms') {
    const smsLog: NotificationLog = {
      id: 'nt-sms-' + Date.now(),
      appointmentId: apt.id,
      type: 'sms',
      recipient: apt.clientPhone,
      subject: `Upcoming Session Reminder (${reminderType})`,
      message: `Hi ${apt.clientName}! Quick reminder from ${businessSettings.businessName}: Your appointment for ${apt.serviceName} is on ${apt.date} at ${apt.startTime}. We look forward to seeing you!`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      read: true,
    };
    notifications.unshift(smsLog);
    sentLogs.push(smsLog);
  }

  if (medium === 'both' || medium === 'email') {
    const emailLog: NotificationLog = {
      id: 'nt-email-' + Date.now(),
      appointmentId: apt.id,
      type: 'email',
      recipient: apt.clientEmail,
      subject: `Upcoming Appointment Reminder - ${businessSettings.businessName}`,
      message: `Hello ${apt.clientName},\nThis is a friendly reminder that you have an appointment booked for ${apt.serviceName} with ${apt.staffName} on ${apt.date} at ${apt.startTime}.\nLocation: ${businessSettings.businessAddress}.`,
      timestamp: new Date().toISOString(),
      status: 'delivered',
      read: true,
    };
    notifications.unshift(emailLog);
    sentLogs.push(emailLog);
  }

  if (reminderType === '24h') apt.remindersSent.reminder24h = true;
  if (reminderType === '2h') apt.remindersSent.reminder2h = true;

  res.json({
    success: true,
    sentCount: sentLogs.length,
    appointment: apt,
    logs: sentLogs,
  });
});

// 9. Real-time Analytics API
app.get('/api/analytics', (req: Request, res: Response) => {
  const totalBookings = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length;

  const totalRevenue = appointments.reduce((sum, a) => {
    if (a.status === 'completed') return sum + a.payment.amountTotal;
    if (a.status === 'confirmed' || a.status === 'in_progress') return sum + a.payment.depositPaid;
    if (a.status === 'cancelled' && a.payment.status === 'fee_charged') return sum + a.payment.depositPaid;
    return sum;
  }, 0);

  const depositCollected = appointments.reduce((sum, a) => sum + (a.payment.depositPaid || 0), 0);
  const cancellationFeesCollected = appointments.reduce((sum, a) => {
    return a.payment.status === 'fee_charged' ? sum + a.payment.depositPaid : sum;
  }, 0);

  const avgBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;

  // Busiest hours aggregation
  const hourMap: Record<string, number> = {
    '09:00': 3,
    '10:00': 8,
    '11:00': 12,
    '13:00': 7,
    '14:00': 15,
    '15:00': 11,
    '16:00': 6,
  };
  appointments.forEach((a) => {
    const h = a.startTime.split(':')[0] + ':00';
    hourMap[h] = (hourMap[h] || 0) + 1;
  });

  const busiestHours = Object.entries(hourMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([hour, count]) => ({ hour, count }));

  // Service performance
  const serviceStats = services.map((s) => {
    const matching = appointments.filter((a) => a.serviceId === s.id);
    return {
      serviceName: s.name,
      count: matching.length,
      revenue: matching.reduce((sum, a) => sum + a.payment.amountTotal, 0),
      color: s.color,
    };
  });

  // Weekly trend
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyTrend = daysOfWeek.map((day, idx) => ({
    date: `Day ${idx + 1}`,
    day,
    bookings: 4 + ((idx * 3 + 2) % 7),
    revenue: 320 + ((idx * 85 + 40) % 450),
  }));

  res.json({
    totalBookings,
    pendingCount,
    confirmedCount,
    completedCount,
    cancelledCount,
    totalRevenue,
    depositCollected,
    cancellationFeesCollected,
    avgBookingValue,
    completionRate,
    busiestHours,
    weeklyTrend,
    servicePerformance: serviceStats,
  });
});

// 10. Settings & Configuration
app.get('/api/settings', (req: Request, res: Response) => {
  res.json(businessSettings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  businessSettings = {
    ...businessSettings,
    ...req.body,
  };
  res.json(businessSettings);
});

// 10b. Business Directory & Registration
app.get('/api/businesses', (req: Request, res: Response) => {
  res.json(businesses);
});

app.post('/api/businesses', (req: Request, res: Response) => {
  const newBiz = {
    id: req.body.id || `biz-${Date.now()}`,
    name: req.body.name || 'New Business',
    category: req.body.category || 'Spa',
    rating: req.body.rating || 5.0,
    reviewCount: req.body.reviewCount || 1,
    description: req.body.description || 'Verified local provider.',
    address: req.body.address || '',
    city: req.body.city || '',
    state: req.body.state || '',
    pincode: req.body.pincode || '',
    latitude: Number(req.body.latitude) || 37.7895,
    longitude: Number(req.body.longitude) || -122.4082,
    phone: req.body.phone || '',
    email: req.body.email || '',
    image: req.body.image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    priceRange: req.body.priceRange || '$$',
    openingTime: req.body.openingTime || '09:00 AM',
    closingTime: req.body.closingTime || '06:00 PM',
    daysOpen: req.body.daysOpen || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: req.body.availableSlotsToday || ['09:30 AM', '11:00 AM', '02:00 PM', '03:45 PM', '05:15 PM'],
    services: req.body.services || [
      { name: 'Initial Standard Session', duration: '45 min', price: 65 },
      { name: 'Premium Full Care Service', duration: '60 min', price: 95 },
    ],
    createdAt: new Date().toISOString(),
  };
  businesses.unshift(newBiz);
  res.status(201).json(newBiz);
});

app.put('/api/businesses/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = businesses.findIndex((b) => b.id === id);
  if (index !== -1) {
    businesses[index] = {
      ...businesses[index],
      ...req.body,
      latitude: req.body.latitude !== undefined ? Number(req.body.latitude) : businesses[index].latitude,
      longitude: req.body.longitude !== undefined ? Number(req.body.longitude) : businesses[index].longitude,
    };
    res.json(businesses[index]);
  } else {
    res.status(404).json({ error: 'Business not found' });
  }
});

// 11. Notification Center Feed & Automated WhatsApp/SMS Engine
let messageLogs: any[] = [];

app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notifications);
});

app.post('/api/notifications/mark-read', (req: Request, res: Response) => {
  notifications = notifications.map((n) => ({ ...n, read: true }));
  res.json({ success: true });
});

// WhatsApp & SMS Message Logs
app.get('/api/messages/logs', (req: Request, res: Response) => {
  const { businessId, customerPhone } = req.query;
  let filtered = [...messageLogs];
  if (businessId) {
    filtered = filtered.filter((m) => m.businessId === businessId);
  }
  if (customerPhone) {
    filtered = filtered.filter((m) => m.customerPhone === customerPhone);
  }
  res.json(filtered);
});

app.post('/api/messages/log', (req: Request, res: Response) => {
  const newLog = {
    ...req.body,
    id: req.body.id || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: req.body.createdAt || new Date().toISOString(),
  };
  messageLogs.unshift(newLog);
  res.json({ success: true, log: newLog });
});

// WhatsApp Business Gateway Verification & Status
app.get('/api/messaging/whatsapp/status', (req: Request, res: Response) => {
  const hasToken = !!process.env.WHATSAPP_API_TOKEN;
  res.json({
    configured: true,
    provider: 'Meta Cloud API v19.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '108492019482910',
    wabaId: 'waba_994820198421',
    status: hasToken ? 'verified' : 'configured',
    approvedTemplates: [
      'schedora_booking_confirmation_v1',
      'schedora_appointment_reminder_v1',
      'schedora_payment_confirmation_v1',
      'schedora_reschedule_alert_v1',
      'schedora_cancellation_alert_v1',
      'schedora_waitlist_confirmation_v1',
      'schedora_waitlist_slot_opened_v1',
    ],
  });
});

// Standby Waitlist Endpoints
app.get('/api/waitlist', (req: Request, res: Response) => {
  const { businessId, customerEmail } = req.query;
  let filtered = [...serverWaitlist];
  if (businessId) {
    filtered = filtered.filter((w) => w.businessId === businessId);
  }
  if (customerEmail) {
    const clean = String(customerEmail).toLowerCase().trim();
    filtered = filtered.filter((w) => (w.customerEmail || '').toLowerCase().trim() === clean);
  }
  res.json(filtered);
});

app.post('/api/waitlist', (req: Request, res: Response) => {
  const newEntry = {
    ...req.body,
    id: req.body.id || `wt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    token: req.body.token || `WL-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    status: req.body.status || 'waiting',
    createdAt: req.body.createdAt || new Date().toISOString(),
  };
  serverWaitlist.unshift(newEntry);
  res.json({ success: true, entry: newEntry });
});

app.patch('/api/waitlist/:id/notify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { slotDetails, claimUrl } = req.body;
  const entry = serverWaitlist.find((w) => w.id === id);
  if (!entry) return res.status(404).json({ error: 'Waitlist entry not found' });

  entry.status = 'notified';
  entry.notifiedAt = new Date().toISOString();
  entry.matchedSlot = {
    ...slotDetails,
    claimUrl: claimUrl || `/book/${entry.businessSlug || entry.businessId}?service=${entry.serviceId}&date=${slotDetails?.date}&slot=${slotDetails?.startTime}&claimToken=${entry.token}`,
  };

  res.json({ success: true, entry });
});

app.patch('/api/waitlist/:id/convert', (req: Request, res: Response) => {
  const { id } = req.params;
  const { bookingId } = req.body;
  const entry = serverWaitlist.find((w) => w.id === id);
  if (!entry) return res.status(404).json({ error: 'Waitlist entry not found' });

  entry.status = 'converted';
  entry.convertedAt = new Date().toISOString();
  entry.convertedBookingId = bookingId;

  res.json({ success: true, entry });
});

app.delete('/api/waitlist/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  serverWaitlist = serverWaitlist.filter((w) => w.id !== id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 12. CUSTOMER FEEDBACK & RATINGS MODULE
// ----------------------------------------------------
interface CustomerFeedbackItem {
  id: string;
  businessId: string;
  businessName?: string;
  appointmentId: string;
  customerName: string;
  customerEmail?: string;
  customerAvatar?: string;
  rating: number; // 1 to 5
  comment: string;
  serviceName?: string;
  staffName?: string;
  tags?: string[];
  createdAt: string;
  verifiedBooking: boolean;
  businessReply?: {
    text: string;
    repliedAt: string;
    repliedBy: string;
  };
}

let serverFeedback: CustomerFeedbackItem[] = [
  {
    id: 'fb-seed-1',
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
    tags: ['Gentle Care', 'Punctual', 'Clean Facility'],
    createdAt: '2026-10-18T14:30:00.000Z',
    verifiedBooking: true,
    businessReply: {
      text: 'Thank you so much Priya! It was an absolute joy pampering your sweet pup. See you next month!',
      repliedAt: '2026-10-19T09:15:00.000Z',
      repliedBy: 'Happy Paws Team',
    },
  },
  {
    id: 'fb-seed-2',
    businessId: 'biz-bloom-spa',
    businessName: 'The Bloom Sanctuary & Day Spa',
    appointmentId: 'apt-demo-bl1',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.v@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'The Herbal Steam & Hot Stone treatment relieved three weeks of desk strain in one session. Dr. Elena and her staff maintain the highest standards.',
    serviceName: 'Herbal Steam Therapy & Massage',
    staffName: 'Dr. Elena Rostova',
    tags: ['Expert Specialist', 'Relaxing Ambiance', 'Highly Recommended'],
    createdAt: '2026-10-20T10:15:00.000Z',
    verifiedBooking: true,
  },
  {
    id: 'fb-seed-3',
    businessId: 'biz-city-wellness-dental',
    businessName: 'City Wellness Dental',
    appointmentId: 'apt-demo-dent1',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    rating: 5,
    comment: 'Ultrasonic cleaning was completely painless and thorough. Digital scanner showed exact problem areas without any discomfort.',
    serviceName: 'Dental Hygiene & Preventative Examination',
    staffName: 'Dr. Maya Lin',
    tags: ['Painless', 'Modern Tech', 'Detailed Explanation'],
    createdAt: '2026-10-22T16:00:00.000Z',
    verifiedBooking: true,
  },
];

// GET feedback (all or filtered by businessId / appointmentId)
app.get('/api/feedback', (req: Request, res: Response) => {
  const { businessId, appointmentId, customerEmail } = req.query;
  let results = [...serverFeedback];

  if (businessId) {
    results = results.filter((f) => f.businessId === businessId);
  }
  if (appointmentId) {
    results = results.filter((f) => f.appointmentId === appointmentId);
  }
  if (customerEmail) {
    const clean = String(customerEmail).toLowerCase().trim();
    results = results.filter((f) => (f.customerEmail || '').toLowerCase().trim() === clean);
  }

  res.json(results);
});

// POST feedback for an appointment
app.post('/api/feedback', (req: Request, res: Response) => {
  const {
    appointmentId,
    businessId,
    businessName,
    customerName,
    customerEmail,
    customerAvatar,
    rating,
    comment,
    serviceName,
    staffName,
    tags,
  } = req.body;

  if (!businessId || !rating || !comment) {
    return res.status(400).json({ error: 'businessId, rating (1-5), and comment are required.' });
  }

  const numRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const newFeedback: CustomerFeedbackItem = {
    id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    businessId,
    businessName: businessName || 'Schedora Partner Business',
    appointmentId: appointmentId || `apt-adhoc-${Date.now()}`,
    customerName: customerName?.trim() || 'Verified Client',
    customerEmail: customerEmail?.trim(),
    customerAvatar: customerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName || 'Client')}`,
    rating: numRating,
    comment: comment.trim(),
    serviceName: serviceName || 'General Consultation',
    staffName: staffName || 'Specialist Team',
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
    verifiedBooking: Boolean(appointmentId),
  };

  serverFeedback.unshift(newFeedback);

  // If this feedback is linked to an appointment, record it on the appointment
  if (appointmentId) {
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      (apt as any).hasFeedback = true;
      (apt as any).feedbackRating = numRating;
      (apt as any).feedbackComment = comment.trim();
    }
  }

  res.status(201).json({ success: true, feedback: newFeedback });
});

// Reply to customer feedback (admin)
app.post('/api/feedback/:id/reply', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, repliedBy } = req.body;
  const target = serverFeedback.find((f) => f.id === id);
  if (!target) {
    return res.status(404).json({ error: 'Feedback not found.' });
  }

  target.businessReply = {
    text: String(text || '').trim(),
    repliedAt: new Date().toISOString(),
    repliedBy: String(repliedBy || 'Business Owner').trim(),
  };

  res.json({ success: true, feedback: target });
});

// ----------------------------------------------------
// 13. AUDIO TRANSCRIPTION ENDPOINT (GEMINI 3.5 TRANSCRIBE)
// ----------------------------------------------------
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Missing audio base64 payload.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        text: 'Audio received. Connect your Gemini API Key in Settings > Secrets to activate real-time Gemini AI transcription.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const audioPart = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: audio,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this audio accurately and verbatim. Return only the transcription text without commentary or quotation marks.',
          },
        ],
      },
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('[Audio Transcription Error]:', err);
    res.status(500).json({ error: err.message || 'Failed to transcribe audio' });
  }
});

// 14. Clients Directory
app.get('/api/clients', (req: Request, res: Response) => {
  res.json(clients);
});

// 15. Calendar Sync (RFC 5545 iCalendar format with individual staff filtering)
app.get('/api/calendar.ics', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="schedora_appointments.ics"');

  const targetStaffId = req.query.staffId as string;
  let filteredAppointments = appointments.filter((a) => a.status !== 'cancelled');
  let calName = `${businessSettings.businessName} Master Schedule`;

  if (targetStaffId && targetStaffId !== 'all') {
    const targetStaff = staff.find((s) => s.id === targetStaffId);
    if (targetStaff) {
      filteredAppointments = filteredAppointments.filter((a) => a.staffId === targetStaffId);
      calName = `${targetStaff.name} Schedule - ${businessSettings.businessName}`;
    }
  }

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedora Core Engine//Appointment Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:America/Los_Angeles',
  ];

  filteredAppointments.forEach((apt) => {
    const dateClean = apt.date.replace(/-/g, '');
    const [sh, sm] = apt.startTime.split(':');
    const [eh, em] = apt.endTime.split(':');
    const dtStart = `${dateClean}T${sh}${sm}00`;
    const dtEnd = `${dateClean}T${eh}${em}00`;

    icsContent.push(
      'BEGIN:VEVENT',
      `UID:${apt.id}@schedora.io`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${apt.serviceName} - ${apt.clientName}`,
      `DESCRIPTION:Client: ${apt.clientName}\\nPhone: ${apt.clientPhone}\\nStaff: ${apt.staffName}\\nStatus: ${apt.status}\\nCode: ${apt.confirmationCode}`,
      `LOCATION:${businessSettings.businessAddress}`,
      `STATUS:${apt.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}`,
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');
  res.send(icsContent.join('\r\n'));
});

// Single confirmed appointment .ics export for Apple Calendar / universal calendars
app.get('/api/appointments/:id/calendar.ics', (req: Request, res: Response) => {
  const { id } = req.params;
  const apt = appointments.find((a) => a.id === id || a.tokenNumber === id || a.confirmationCode === id);
  if (!apt) {
    return res.status(404).send('Appointment not found');
  }

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="schedora-appointment-${apt.confirmationCode || apt.tokenNumber || 'pass'}.ics"`
  );

  const dateClean = apt.date.replace(/-/g, '');
  const [sh, sm] = (apt.startTime || '10:00').split(':');
  const [eh, em] = (apt.endTime || '11:00').split(':');
  const dtStart = `${dateClean}T${sh}${sm}00`;
  const dtEnd = `${dateClean}T${eh}${em}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Schedora//Appointment Arrival Pass//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${apt.id}@schedora.io`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${apt.serviceName} at ${apt.businessName || businessSettings.businessName}`,
    `DESCRIPTION:Arrival Token: ${apt.tokenNumber || apt.confirmationCode}\\nCustomer: ${apt.clientName}\\nStaff: ${apt.staffName}\\nStatus: ${apt.status}`,
    `LOCATION:${apt.businessAddress || businessSettings.businessAddress}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${apt.serviceName} tomorrow`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${apt.serviceName} in 1 hour`,
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  res.send(ics);
});

// ----------------------------------------------------
// BUSINESS OFFERS & REDEMPTIONS API
// ----------------------------------------------------
let serverOffers: any[] = [
  {
    id: 'off-hyd-ayur-1',
    businessId: 'biz-hyd-aura-ayur',
    businessName: 'Aura Ayurvedic Wellness Clinic',
    businessSlug: 'aura-ayurvedic-wellness',
    businessCategory: 'Clinic',
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
    latitude: 17.4156,
    longitude: 78.435,
  },
  {
    id: 'off-hyd-kanya-1',
    businessId: 'biz-hyd-kanya-salon',
    businessName: 'Kanya Luxe Hair & Aesthetics Salon',
    businessSlug: 'kanya-luxe-salon',
    businessCategory: 'Salon',
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
    latitude: 17.432,
    longitude: 78.407,
  },
  {
    id: 'off-hyd-dent-1',
    businessId: 'biz-hyd-toothcraft-dental',
    businessName: 'ToothCraft Multi-Speciality Dental Clinic',
    businessSlug: 'toothcraft-dental',
    businessCategory: 'Dental',
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
    latitude: 17.418,
    longitude: 78.448,
  },
  {
    id: 'off-hyd-pet-1',
    businessId: 'biz-hyd-furrytails-pet',
    businessName: 'FurryTails Pet Grooming & Spa',
    businessSlug: 'furrytails-pet-grooming',
    businessCategory: 'Pet Care',
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
    latitude: 17.424,
    longitude: 78.412,
  },
  {
    id: 'off-hyd-auto-1',
    businessId: 'biz-hyd-speedx-auto',
    businessName: 'SpeedX Auto Detailing & Care Studio',
    businessSlug: 'speedx-auto-studio',
    businessCategory: 'Auto Care',
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
    latitude: 17.4475,
    longitude: 78.376,
  },
  {
    id: 'off-hyd-fit-1',
    businessId: 'biz-hyd-zenflow-pilates',
    businessName: 'ZenFlow Reformer Pilates & Yoga Sanctuary',
    businessSlug: 'zenflow-pilates-sanctuary',
    businessCategory: 'Fitness',
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
    latitude: 17.441,
    longitude: 78.391,
  },
  {
    id: 'off-sf-paws-1',
    businessId: 'biz-happy-paws-grooming',
    businessName: 'Happy Paws Grooming',
    businessSlug: 'happy-paws-grooming',
    businessCategory: 'Pet Care',
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
    latitude: 37.7901,
    longitude: -122.4205,
  },
  {
    id: 'off-sf-bloom-1',
    businessId: 'biz-bloom-spa',
    businessName: 'Bloom Spa',
    businessSlug: 'bloom-spa',
    businessCategory: 'Spa',
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
    latitude: 37.7895,
    longitude: -122.4082,
  },
];

let serverRedemptions: any[] = [];
let userPreferencesStore: Record<string, any> = {};

app.get('/api/offers', (req: Request, res: Response) => {
  const { businessId, category } = req.query;
  let filtered = [...serverOffers];
  if (businessId) {
    filtered = filtered.filter((o) => o.businessId === businessId);
  }
  if (category && category !== 'All') {
    filtered = filtered.filter((o) => o.businessCategory.toLowerCase().includes(String(category).toLowerCase()));
  }
  res.json(filtered);
});

app.post('/api/offers', (req: Request, res: Response) => {
  const offerData = req.body;
  if (!offerData.title || !offerData.businessId) {
    return res.status(400).json({ error: 'Title and Business ID are required' });
  }
  const newOffer = {
    ...offerData,
    id: `off-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    redemptionsCount: 0,
    status: offerData.status || 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  serverOffers.unshift(newOffer);
  res.status(201).json(newOffer);
});

app.put('/api/offers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = serverOffers.findIndex((o) => o.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Offer not found' });
  serverOffers[idx] = { ...serverOffers[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(serverOffers[idx]);
});

app.patch('/api/offers/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = serverOffers.find((o) => o.id === id);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  offer.status = offer.status === 'active' ? 'paused' : 'active';
  offer.updatedAt = new Date().toISOString();
  res.json(offer);
});

app.delete('/api/offers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  serverOffers = serverOffers.filter((o) => o.id !== id);
  res.json({ success: true, message: 'Offer deleted successfully' });
});

app.post('/api/offers/validate', (req: Request, res: Response) => {
  const { offerId, couponCode, servicePrice = 0, customerEmail } = req.body;
  const offer = serverOffers.find(
    (o) => o.id === offerId || (couponCode && o.couponCode?.toUpperCase() === String(couponCode).toUpperCase())
  );
  if (!offer) {
    return res.status(404).json({ valid: false, error: 'Offer not found or invalid coupon code' });
  }
  if (offer.status !== 'active') {
    return res.status(400).json({ valid: false, error: 'This offer is currently paused' });
  }
  const todayStr = new Date().toISOString().split('T')[0];
  if (offer.expiryDate && offer.expiryDate < todayStr) {
    return res.status(400).json({ valid: false, error: 'This offer has expired' });
  }
  if (offer.maxRedemptions > 0 && offer.redemptionsCount >= offer.maxRedemptions) {
    return res.status(400).json({ valid: false, error: 'This offer has reached its maximum redemptions' });
  }
  if (customerEmail && offer.perCustomerLimit > 0) {
    const userPastCount = serverRedemptions.filter(
      (r) => r.offerId === offer.id && r.customerEmail.toLowerCase() === String(customerEmail).toLowerCase()
    ).length;
    if (userPastCount >= offer.perCustomerLimit) {
      return res.status(400).json({
        valid: false,
        error: `You have reached the redemption limit (${offer.perCustomerLimit}) for this offer`,
      });
    }
  }

  let discount = 0;
  if (offer.offerType === 'free_service') {
    discount = servicePrice;
  } else if (offer.offerType === 'percentage') {
    discount = Math.round((servicePrice * offer.discountValue) / 100);
  } else if (offer.offerType === 'fixed' || offer.offerType === 'special_package') {
    discount = Math.min(servicePrice, offer.discountValue);
  }

  const finalPrice = Math.max(0, servicePrice - discount);
  res.json({
    valid: true,
    offer,
    discountAmount: discount,
    finalPrice,
  });
});

app.post('/api/offers/redeem', (req: Request, res: Response) => {
  const { offerId, customerEmail, customerName, serviceId, serviceName, originalPrice, bookingToken } = req.body;
  const offer = serverOffers.find((o) => o.id === offerId);
  if (!offer) return res.status(404).json({ error: 'Offer not found' });
  if (offer.status !== 'active') return res.status(400).json({ error: 'Offer paused' });

  let discount = 0;
  if (offer.offerType === 'free_service') discount = originalPrice;
  else if (offer.offerType === 'percentage') discount = Math.round((originalPrice * offer.discountValue) / 100);
  else discount = Math.min(originalPrice, offer.discountValue);
  const finalPrice = Math.max(0, originalPrice - discount);

  const redemption = {
    id: `red-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    offerId: offer.id,
    businessId: offer.businessId,
    customerEmail,
    customerName,
    serviceId,
    serviceName,
    originalPrice,
    discountAmount: discount,
    finalAmount: finalPrice,
    currency: offer.currency,
    bookingToken,
    redeemedAt: new Date().toISOString(),
  };

  offer.redemptionsCount += 1;
  serverRedemptions.unshift(redemption);
  res.json({ success: true, redemption, finalPrice, discountAmount: discount });
});

app.get('/api/user/preferences', (req: Request, res: Response) => {
  const email = String(req.query.email || 'default');
  res.json(userPreferencesStore[email] || null);
});

app.post('/api/user/preferences', (req: Request, res: Response) => {
  const { email, preferences } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  userPreferencesStore[email] = { ...preferences, updatedAt: new Date().toISOString() };
  res.json({ success: true, preferences: userPreferencesStore[email] });
});

// Helper for Voice Assistant Natural Speech Generation
async function generateVoiceResponse(promptText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are Schedula's natural voice AI concierge for small businesses. Keep answers spoken, brief, pleasant, and helpful (1-3 conversational sentences).
Business: ${businessSettings.businessName} (${businessSettings.businessAddress}, Phone: ${businessSettings.businessPhone}).
Services: ${services.map((s) => `${s.name} ($${s.price}, ${s.durationMinutes}m)`).join(', ')}.
Specialists: ${staff.map((st) => `${st.name} (${st.role})`).join(', ')}.
User query: "${promptText}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response.text) return response.text.trim();
    } catch (e) {
      console.error('Gemini content generation error:', e);
    }
  }

  // Smart local fallback if API offline or no key
  const lower = promptText.toLowerCase();
  if (lower.includes('service') || lower.includes('offer') || lower.includes('cost') || lower.includes('price')) {
    return `We offer ${services.length} services including ${services.map((s) => `${s.name} for $${s.price}`).join(', ')}. Which would you like to book?`;
  }
  if (lower.includes('staff') || lower.includes('doctor') || lower.includes('specialist') || lower.includes('who')) {
    return `Our specialist team includes ${staff.map((s) => `${s.name}, ${s.role}`).join('; ')}. They have dedicated schedules you can book anytime!`;
  }
  if (lower.includes('hours') || lower.includes('open') || lower.includes('when')) {
    return `Our specialists are available Monday through Saturday starting at 9:00 AM. Would you like me to check an open slot for you this week?`;
  }
  return `I'm Schedula's voice assistant! You can ask me about our services, specialists like Dr. Elena and Marcus, or check available appointment slots. What can I help you schedule today?`;
}

// ----------------------------------------------------
// SERVER SETUP & WEBSOCKET ENGINES (GEMINI LIVE API & TRANSCRIBE)
// ----------------------------------------------------
const server = http.createServer(app);
const wssVoice = new WebSocketServer({ noServer: true });
const wssTranscribe = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws/live-voice') {
    wssVoice.handleUpgrade(request, socket, head, (ws) => {
      wssVoice.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/transcribe-live') {
    wssTranscribe.handleUpgrade(request, socket, head, (ws) => {
      wssTranscribe.emit('connection', ws, request);
    });
  }
});

// 1. LIVE VOICE API CONVERSATION ENGINE (gemini-3.8-live)
wssVoice.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live Voice] Client connected to live voice session');
  let liveSession: any = null;
  const apiKey = process.env.GEMINI_API_KEY;

  clientWs.send(
    JSON.stringify({
      type: 'status',
      status: 'connected',
      message: 'Voice session connected. Initializing Live audio channel with gemini-3.8-live...',
    })
  );

  // Try initiating Gemini Live session with gemini-3.8-live
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const systemInstruction = `You are Schedora's real-time voice assistant concierge for appointment bookings and local business scheduling.
Always respond in concise, warm, natural spoken English (1-2 sentences maximum per turn).
Current Business: ${businessSettings.businessName}, Address: ${businessSettings.businessAddress}.
Services available: ${services.map((s) => `${s.name} ($${s.price}, ${s.durationMinutes} min)`).join(', ')}.
Staff Specialists: ${staff
        .map(
          (st) =>
            `${st.name} (${st.role}) - Services: ${st.serviceIds
              .map((id) => services.find((s) => s.id === id)?.name)
              .filter(Boolean)
              .join(', ')}`
        )
        .join('; ')}.
You can assist clients with:
- Checking specialist schedules and business hours
- Booking appointments and checking waitlist availability
- Explaining services, deposits, and cancellation policies.`;

      liveSession = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
        callbacks: {
          onmessage: (message: any) => {
            if (message.serverContent?.modelTurn?.parts) {
              for (const part of message.serverContent.modelTurn.parts) {
                if (part.inlineData && part.inlineData.data) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType || 'audio/pcm;rate=24000',
                    })
                  );
                }
                if (part.text) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'transcript',
                      role: 'assistant',
                      text: part.text,
                    })
                  );
                }
              }
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
            }
          },
          onerror: (err: any) => {
            console.error('[Live Voice] Gemini Live error:', err);
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Live voice session error',
              })
            );
          },
          onclose: () => {
            console.log('[Live Voice] Live session closed');
            clientWs.send(JSON.stringify({ type: 'status', status: 'closed' }));
          },
        },
      });

      clientWs.send(
        JSON.stringify({
          type: 'status',
          status: 'ready',
          model: 'gemini-3.8-live',
          message: 'Gemini Live voice engine ready. Start speaking!',
        })
      );
    } catch (e: any) {
      console.warn('[Live Voice] Failed to connect to Gemini Live directly:', e?.message);
      clientWs.send(
        JSON.stringify({
          type: 'status',
          status: 'fallback',
          message: 'Voice conversational engine operational.',
        })
      );
    }
  } else {
    clientWs.send(
      JSON.stringify({
        type: 'status',
        status: 'fallback',
        message: 'Running in voice conversational mode with speech synthesis.',
      })
    );
  }

  clientWs.on('message', async (rawMsg: any) => {
    try {
      const data = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : JSON.parse(rawMsg.toString());

      // 1. Audio stream packet
      if (data.type === 'realtime_input' && data.audio) {
        if (liveSession && typeof liveSession.sendRealtimeInput === 'function') {
          await liveSession.sendRealtimeInput({
            mediaChunks: [
              {
                mimeType: data.mimeType || 'audio/pcm;rate=16000',
                data: data.audio,
              },
            ],
          });
        }
      }

      // 2. Text / Prompt input
      if (data.type === 'text_input' && data.text) {
        clientWs.send(
          JSON.stringify({
            type: 'transcript',
            role: 'user',
            text: data.text,
          })
        );

        if (liveSession && typeof liveSession.sendClientContent === 'function') {
          try {
            await liveSession.sendClientContent({
              turns: [
                {
                  role: 'user',
                  parts: [{ text: data.text }],
                },
              ],
              turnComplete: true,
            });
            return;
          } catch (e) {
            console.warn('[Live Voice] sendClientContent error, falling back:', e);
          }
        }

        const reply = await generateVoiceResponse(data.text);
        clientWs.send(
          JSON.stringify({
            type: 'transcript',
            role: 'assistant',
            text: reply,
          })
        );
      }
    } catch (err: any) {
      console.error('[Live Voice] Message handling error:', err);
    }
  });

  clientWs.on('close', () => {
    if (liveSession && typeof liveSession.close === 'function') {
      try {
        liveSession.close();
      } catch (_) {}
    }
  });
});

// 2. REAL-TIME AUDIO TRANSCRIPTION ENGINE (gemini-3.5-transcribe / gemini-3.5-transcribe-live)
wssTranscribe.on('connection', (clientWs: WebSocket) => {
  console.log('[Live Transcribe] Client connected to live transcription session');
  const apiKey = process.env.GEMINI_API_KEY;
  let audioBuffer: Buffer = Buffer.alloc(0);
  let isTranscribing = false;

  clientWs.send(
    JSON.stringify({
      type: 'status',
      status: 'ready',
      message: 'Real-time audio transcription stream ready. Stream microphone audio or audio feed.',
      model: 'gemini-3.5-transcribe',
    })
  );

  clientWs.on('message', async (rawMsg: any) => {
    try {
      const data = typeof rawMsg === 'string' ? JSON.parse(rawMsg) : JSON.parse(rawMsg.toString());

      if (data.type === 'audio_chunk' && data.audio) {
        const chunkBuf = Buffer.from(data.audio, 'base64');
        audioBuffer = Buffer.concat([audioBuffer, chunkBuf]);

        // When buffer reaches ~2-3 seconds of audio (or when triggered), transcribe segment
        if (audioBuffer.length > 48000 && !isTranscribing) {
          isTranscribing = true;
          const currentAudio = audioBuffer;
          audioBuffer = Buffer.alloc(0);

          if (apiKey) {
            try {
              const ai = new GoogleGenAI({ apiKey });
              const audioPart = {
                inlineData: {
                  mimeType: data.mimeType || 'audio/webm',
                  data: currentAudio.toString('base64'),
                },
              };

              const res = await ai.models.generateContent({
                model: 'gemini-3.5-transcribe',
                contents: {
                  parts: [
                    audioPart,
                    {
                      text: 'Transcribe this audio snippet accurately. Output only the transcribed text.',
                    },
                  ],
                },
              });

              const text = res.text?.trim();
              if (text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'transcript',
                    text,
                    isFinal: true,
                    timestamp: new Date().toISOString(),
                  })
                );
              }
            } catch (err: any) {
              console.warn('[Live Transcribe] Segment error:', err?.message);
            } finally {
              isTranscribing = false;
            }
          } else {
            isTranscribing = false;
          }
        }
      }

      if (data.type === 'flush') {
        if (audioBuffer.length > 0 && apiKey && !isTranscribing) {
          isTranscribing = true;
          const currentAudio = audioBuffer;
          audioBuffer = Buffer.alloc(0);
          try {
            const ai = new GoogleGenAI({ apiKey });
            const res = await ai.models.generateContent({
              model: 'gemini-3.5-transcribe',
              contents: {
                parts: [
                  {
                    inlineData: {
                      mimeType: data.mimeType || 'audio/webm',
                      data: currentAudio.toString('base64'),
                    },
                  },
                  { text: 'Transcribe this audio snippet accurately.' },
                ],
              },
            });
            if (res.text?.trim()) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript',
                  text: res.text.trim(),
                  isFinal: true,
                  timestamp: new Date().toISOString(),
                })
              );
            }
          } catch (_) {
          } finally {
            isTranscribing = false;
          }
        }
      }
    } catch (err: any) {
      console.error('[Live Transcribe] Error:', err);
    }
  });

  clientWs.on('close', () => {
    audioBuffer = Buffer.alloc(0);
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// ----------------------------------------------------
async function startServer() {
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} is already in use.`);
    } else {
      console.error('[Server Error]', err);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Development SPA fallback for client-side routing
    app.use('*', async (req: Request, res: Response, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/ws')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Schedora] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
