/**
 * Business Directory & Multi-Tenant Business Service
 * Manages business entities, unique slugs, locations, service menus, and availability profiles.
 */

export const BUSINESS_CATEGORIES = [
  'All',
  'Spa',
  'Dental',
  'Clinic',
  'Salon',
  'Veterinary',
  'Auto Care',
  'Advisory',
  'Fitness',
  'Photography',
  'Tattoo',
];

export const DISTANCE_OPTIONS = [
  { label: 'All Distances', value: 'all' },
  { label: 'Within 1 km', value: 1 },
  { label: 'Within 5 km', value: 5 },
  { label: 'Within 10 km', value: 10 },
  { label: 'Within 25 km', value: 25 },
  { label: 'Within 50 km', value: 50 },
];

/**
 * Standard weekly hours template
 */
export const DEFAULT_WEEKLY_AVAILABILITY = {
  monday: { enabled: true, open: '09:00', close: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
  tuesday: { enabled: true, open: '09:00', close: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
  wednesday: { enabled: true, open: '09:00', close: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
  thursday: { enabled: true, open: '09:00', close: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
  friday: { enabled: true, open: '09:00', close: '17:00', breaks: [{ start: '13:00', end: '14:00' }] },
  saturday: { enabled: true, open: '10:00', close: '15:00', breaks: [] },
  sunday: { enabled: false, open: '10:00', close: '14:00', breaks: [] },
};

/**
 * Seeded businesses with real geographic coordinates, unique slugs, and service catalogs
 */
export const SEEDED_BUSINESSES = [
  {
    id: 'biz-hyd-aura-ayur',
    ownerId: 'user-aura-ayur-owner',
    ownerName: 'Dr. Vasudha Sharma',
    name: 'Aura Ayurvedic Wellness Clinic',
    slug: 'aura-ayurvedic-wellness',
    category: 'Clinic',
    tagline: 'Authentic holistic Ayurvedic wellness, panchakarma & dosha therapy',
    rating: 4.9,
    reviewCount: 168,
    description: 'Bespoke Ayurvedic clinic in Banjara Hills specializing in warm herbal abhyanga therapy, Shirodhara rejuvenation, and lifestyle wellness consultations.',
    address: 'Road No. 12, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',
    latitude: 17.4156,
    longitude: 78.435,
    phone: '+91 40 2335 8890',
    email: 'namaste@aurawellness.in',
    logoColor: '#059669',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '08:30 AM',
    closingTime: '07:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '02:30 PM', '04:15 PM', '06:00 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-ayur-1', name: 'Authentic Abhyanga Warm Herbal Therapy & Steam', duration: '60 min', durationMinutes: 60, price: 1800, active: true, description: 'Deep tissue herbal oil body therapy followed by aromatic herbal steam detox.' },
      { id: 'srv-hyd-ayur-2', name: 'Shirodhara Mind Rejuvenation & Scalp Ritual', duration: '50 min', durationMinutes: 50, price: 2200, active: true, description: 'Continuous rhythmic pouring of medicated warm oil on the forehead third eye for mental calm.' },
      { id: 'srv-hyd-ayur-3', name: 'Ayurvedic Prakriti Diagnostic & Pulse Consultation', duration: '30 min', durationMinutes: 30, price: 600, active: true, description: 'Traditional pulse evaluation and customized dietary and lifestyle regimen.' },
    ],
    createdAt: '2025-01-01T10:00:00.000Z',
    updatedAt: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'biz-hyd-kanya-salon',
    ownerId: 'user-kanya-owner',
    ownerName: 'Kavitha Reddy',
    name: 'Kanya Luxe Hair & Aesthetics Salon',
    slug: 'kanya-luxe-salon',
    category: 'Salon',
    tagline: 'Artisanal hair styling, Moroccan hair spas & skin glow rituals',
    rating: 4.9,
    reviewCount: 220,
    description: 'Premier salon in Jubilee Hills featuring certified stylists, organic hair repair rituals, and bespoke color corrections.',
    address: 'Road No. 36, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500033',
    latitude: 17.432,
    longitude: 78.407,
    phone: '+91 40 2355 4421',
    email: 'atelier@kanyaluxe.com',
    logoColor: '#f43f5e',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '10:00 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['10:30 AM', '01:00 PM', '03:30 PM', '05:30 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-kanya-1', name: 'Kérastase Precision Cut & Botanical Blowout', duration: '50 min', durationMinutes: 50, price: 1500, active: true, description: 'Personalized haircut with diagnostic scalp ritual and salon blowout.' },
      { id: 'srv-hyd-kanya-2', name: 'Deep Nourishing Moroccan Argan Hair Spa', duration: '60 min', durationMinutes: 60, price: 2200, active: true, description: 'Intensive moisture infusion, warm towel wrap, and relaxing scalp pressure point therapy.' },
      { id: 'srv-hyd-kanya-3', name: 'Balayage Dimension Glow & Tonal Glaze', duration: '120 min', durationMinutes: 120, price: 4500, active: true, description: 'Sun-kissed hand-painted highlights with bond re-builder therapy.' },
    ],
    createdAt: '2025-01-02T10:00:00.000Z',
    updatedAt: '2025-01-02T10:00:00.000Z',
  },
  {
    id: 'biz-hyd-toothcraft-dental',
    ownerId: 'user-toothcraft-owner',
    ownerName: 'Dr. Siddharth Verma',
    name: 'ToothCraft Multi-Speciality Dental Clinic',
    slug: 'toothcraft-dental',
    category: 'Dental',
    tagline: 'Advanced painless dentistry, 3D intraoral scans & laser smile aesthetics',
    rating: 4.8,
    reviewCount: 145,
    description: 'High-tech dental studio near City Centre Mall, Banjara Hills, offering painless cavity detection, laser teeth whitening, and preventive hygiene.',
    address: 'Opp. City Centre Mall, Road No. 1, Banjara Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500034',
    latitude: 17.418,
    longitude: 78.448,
    phone: '+91 40 2331 9912',
    email: 'appointments@toothcraftdental.in',
    logoColor: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '09:00 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['10:00 AM', '11:45 AM', '02:15 PM', '04:30 PM', '06:00 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-dent-1', name: 'Comprehensive Dental Exam & 3D Smile Scan', duration: '30 min', durationMinutes: 30, price: 800, active: true, description: 'Digital intraoral photographic mapping and thorough periodontal health assessment.' },
      { id: 'srv-hyd-dent-2', name: 'Full Ultrasonic Teeth Scaling & Polish', duration: '45 min', durationMinutes: 45, price: 1500, active: true, description: 'Ultrasonic plaque and tartar clearance with gentle enamel-safe polish.' },
      { id: 'srv-hyd-dent-3', name: 'In-Clinic Laser Teeth Whitening Treatment', duration: '60 min', durationMinutes: 60, price: 6000, active: true, description: 'Single-session chairside laser light teeth brightening.' },
    ],
    createdAt: '2025-01-03T10:00:00.000Z',
    updatedAt: '2025-01-03T10:00:00.000Z',
  },
  {
    id: 'biz-hyd-furrytails-pet',
    ownerId: 'user-furrytails-owner',
    ownerName: 'Pooja Iyer',
    name: 'FurryTails Pet Grooming & Spa',
    slug: 'furrytails-pet-grooming',
    category: 'Pet Care',
    tagline: 'Gentle, stress-free grooming, canine hydro-spa & breed styling',
    rating: 4.9,
    reviewCount: 130,
    description: 'Boutique pet salon in Film Nagar, Jubilee Hills. Certified fear-free handling, oatmeal flea/tick baths, and breed contour styling.',
    address: 'Film Nagar, Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500096',
    latitude: 17.424,
    longitude: 78.412,
    phone: '+91 40 2360 7714',
    email: 'care@furrytailshyd.com',
    logoColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '09:00 AM',
    closingTime: '06:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['09:30 AM', '11:30 AM', '02:00 PM', '04:00 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-pet-1', name: 'Full Canine Hydro-Bath & De-shedding Spa', duration: '45 min', durationMinutes: 45, price: 1500, active: true, description: 'Deep botanical wash, blow dry, thorough de-shed brush, and ear cleansing.' },
      { id: 'srv-hyd-pet-2', name: 'Standard Breed Haircut & Scissor Styling', duration: '60 min', durationMinutes: 60, price: 1800, active: true, description: 'Full body haircut, sanitary trim, paw pad hygiene, and cologne mist.' },
      { id: 'srv-hyd-pet-3', name: 'Nail Clipping, Paw Balm & Ear Hygiene', duration: '20 min', durationMinutes: 20, price: 600, active: true, description: 'Gentle nail trim, Dremel edge smooth, and moisturizing coconut paw balm.' },
    ],
    createdAt: '2025-01-04T10:00:00.000Z',
    updatedAt: '2025-01-04T10:00:00.000Z',
  },
  {
    id: 'biz-hyd-speedx-auto',
    ownerId: 'user-speedx-owner',
    ownerName: 'Arjun Mehta',
    name: 'SpeedX Auto Detailing & Care Studio',
    slug: 'speedx-auto-studio',
    category: 'Auto Care',
    tagline: 'High-pressure foam wash, 9H ceramic coating & steam interior detail',
    rating: 4.8,
    reviewCount: 195,
    description: 'Premier automotive detailing hub in Madhapur/Hitec City with high-pressure touchless washing, paint protection, and interior extraction.',
    address: 'Hitec City Main Road, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500081',
    latitude: 17.4475,
    longitude: 78.376,
    phone: '+91 40 2311 0045',
    email: 'service@speedxdetailing.in',
    logoColor: '#f97316',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '08:00 AM',
    closingTime: '07:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:00 AM', '11:00 AM', '01:30 PM', '03:45 PM', '05:15 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-auto-1', name: 'Exterior Snow Foam Wash & Undercarriage Blast', duration: '40 min', durationMinutes: 40, price: 1000, active: true, description: 'PH-neutral snow foam bath, alloy wheel deep scrub, and high-pressure underbody rinse.' },
      { id: 'srv-hyd-auto-2', name: 'Full 9H Nano Ceramic Coating & Paint Polish', duration: '180 min', durationMinutes: 180, price: 12000, active: true, description: 'Multi-stage paint correction, swirl elimination, and durable 3-year hydrophobic seal.' },
      { id: 'srv-hyd-auto-3', name: 'Interior Deep Steam Extraction & AC Sanitize', duration: '60 min', durationMinutes: 60, price: 2500, active: true, description: 'Hot water upholstery shampoo extraction, leather conditioner, and ozone air purification.' },
    ],
    createdAt: '2025-01-05T10:00:00.000Z',
    updatedAt: '2025-01-05T10:00:00.000Z',
  },
  {
    id: 'biz-hyd-zenflow-pilates',
    ownerId: 'user-zenflow-owner',
    ownerName: 'Tanvi Rao',
    name: 'ZenFlow Reformer Pilates & Yoga Sanctuary',
    slug: 'zenflow-pilates-sanctuary',
    category: 'Fitness',
    tagline: 'Allegro reformer core sculpting, sound baths & mindful yoga',
    rating: 4.9,
    reviewCount: 110,
    description: 'Boutique wellness movement studio in Kavuri Hills, Madhapur, offering Allegro 2 reformer sessions, athletic core conditioning, and sound healing.',
    address: 'Kavuri Hills, Madhapur',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    pincode: '500033',
    latitude: 17.441,
    longitude: 78.391,
    phone: '+91 40 2311 8820',
    email: 'flow@zenflowhyderabad.com',
    logoColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    priceRange: '₹₹',
    currency: 'INR',
    openingTime: '06:30 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['07:00 AM', '09:30 AM', '12:00 PM', '04:30 PM', '06:00 PM'],
    weeklyAvailability: DEFAULT_WEEKLY_AVAILABILITY,
    services: [
      { id: 'srv-hyd-fit-1', name: 'Private Classical Reformer Alignment Session', duration: '55 min', durationMinutes: 55, price: 2000, active: true, description: 'One-on-one custom reformer training targeting spinal posture and deep core strength.' },
      { id: 'srv-hyd-fit-2', name: 'Duet Reformer Sculpt Training', duration: '50 min', durationMinutes: 50, price: 1400, active: true, description: 'Semi-private two-person reformer resistance workout with tailored adjustments.' },
      { id: 'srv-hyd-fit-3', name: 'Restorative Hot Yin Yoga & Tibetan Sound Bath', duration: '60 min', durationMinutes: 60, price: 800, active: true, description: 'Deep connective tissue stretching with authentic Tibetan singing bowl sound meditation.' },
    ],
    createdAt: '2025-01-06T10:00:00.000Z',
    updatedAt: '2025-01-06T10:00:00.000Z',
  },
  {
    id: 'biz-happy-paws-grooming',
    ownerId: 'user-happy-paws-owner',
    ownerName: 'Ananya',
    name: 'Happy Paws Grooming',
    slug: 'happy-paws-grooming',
    category: 'Pet Care',
    tagline: 'Gentle, stress-free grooming, luxury baths & breed styling',
    rating: 4.9,
    reviewCount: 112,
    description: 'Boutique pet salon offering gentle one-on-one grooming, soothing oatmeal hydro-baths, sanitary care, and master breed-standard haircutting.',
    address: '1420 Pine St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94109',
    latitude: 37.7901,
    longitude: -122.4205,
    phone: '+1 (415) 555-0195',
    email: 'care@happypawsgrooming.com',
    logoColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '09:00 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '01:30 PM', '03:15 PM', '04:45 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tuesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, open: '09:30', close: '16:30', breaks: [{ start: '13:00', end: '13:30' }] },
      sunday: { enabled: false, open: '10:00', close: '14:00', breaks: [] },
    },
    departments: [
      { id: 'dept-grooming', name: 'Grooming & Styling', description: 'Precision scissor contouring, coat styling & breed cuts' },
      { id: 'dept-spa', name: 'Canine Hydro-Spa', description: 'Deep cleansing hydro-baths, blueberry facials & paw care' },
    ],
    services: [
      { id: 'srv-hp-1', name: 'Basic Grooming', duration: '30 min', durationMinutes: 30, price: 45, active: true, departmentId: 'dept-grooming', description: 'Quick tidy up, face & sanitary trim, ear cleansing, and scented mist.' },
      { id: 'srv-hp-2', name: 'Bath and Brush', duration: '45 min', durationMinutes: 45, price: 55, active: true, departmentId: 'dept-spa', description: 'Deep botanical hydro-bath, blueberry facial, blow-dry, and thorough de-shedding brush.' },
      { id: 'srv-hp-3', name: 'Full Grooming', duration: '60 min', durationMinutes: 60, price: 75, active: true, departmentId: 'dept-grooming', description: 'Bath, brush, full-body precision haircut, scissor styling, paw pad trim, and cologne.' },
      { id: 'srv-hp-4', name: 'Nail Trimming', duration: '20 min', durationMinutes: 20, price: 25, active: true, departmentId: 'dept-spa', description: 'Gentle nail clipping, dremel smoothing, and paw balm moisturization.' },
      { id: 'srv-hp-5', name: 'Breed-Specific Grooming', duration: '75 min', durationMinutes: 75, price: 90, active: true, departmentId: 'dept-grooming', description: 'Standard breed pattern styling (Poodle, Schnauzer, Golden Retriever, Doodle, etc.).' },
    ],
    staff: [
      {
        id: 'st-hp-ananya',
        businessId: 'biz-happy-paws-grooming',
        name: 'Ananya',
        role: 'Pet Groomer',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        email: 'ananya@happypawsgrooming.com',
        phone: '+1 (415) 555-0195',
        genderPreference: 'female',
        qualifications: ['Certified Professional Pet Stylist', 'Fear-Free Certified Professional'],
        experienceYears: 6,
        rating: 4.9,
        reviewCount: 38,
        bio: 'Gentle handling specialist with 6 years experience in low-stress grooming for nervous pups and rescue dogs.',
        serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-3', 'srv-hp-4', 'srv-hp-5'],
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5, 6],
        },
        breakTimes: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
        active: true,
      },
      {
        id: 'st-hp-rahul',
        businessId: 'biz-happy-paws-grooming',
        name: 'Rahul',
        role: 'Senior Pet Groomer',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        email: 'rahul@happypawsgrooming.com',
        phone: '+1 (415) 555-0196',
        genderPreference: 'male',
        qualifications: ['Master Canine Stylist', 'Large Breed & Double Coat Specialist'],
        experienceYears: 8,
        rating: 4.8,
        reviewCount: 45,
        bio: 'Senior stylist celebrated for breed-standard pattern cuts, double-coat shedding management, and large dogs.',
        serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-3', 'srv-hp-4', 'srv-hp-5'],
        workingHours: {
          start: '09:00',
          end: '17:00',
          days: [2, 3, 4, 5, 6],
        },
        breakTimes: [{ start: '12:30', end: '13:30', label: 'Lunch Break' }],
        active: true,
      },
      {
        id: 'st-hp-priya',
        businessId: 'biz-happy-paws-grooming',
        name: 'Priya',
        role: 'Pet Groomer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        email: 'priya@happypawsgrooming.com',
        phone: '+1 (415) 555-0197',
        genderPreference: 'female',
        qualifications: ['Puppy & Kitten Gentle Care', 'Canine CPR & First Aid'],
        experienceYears: 4,
        rating: 4.9,
        reviewCount: 29,
        bio: 'Gentle and patient groomer, perfect for puppies experiencing their first spa day and small gentle breeds.',
        serviceIds: ['srv-hp-1', 'srv-hp-2', 'srv-hp-4'],
        workingHours: {
          start: '10:00',
          end: '18:00',
          days: [1, 2, 3, 4, 5],
        },
        breakTimes: [{ start: '14:00', end: '15:00', label: 'Rest Break' }],
        active: true,
      },
    ],
    createdAt: '2025-01-08T10:00:00.000Z',
    updatedAt: '2025-01-08T10:00:00.000Z',
  },
  {
    id: 'biz-bloom-spa',
    ownerId: 'user-bloom-owner',
    ownerName: 'Elena Rostova',
    name: 'Bloom Spa',
    slug: 'bloom-spa',
    category: 'Spa',
    tagline: 'Sanctuary of tranquility & holistic rejuvenation',
    rating: 4.9,
    reviewCount: 142,
    description: 'Relaxation & Wellness sanctuary offering organic hydro-facials, thermal stone bodywork, and restorative aromatherapy.',
    address: '450 Sutter St, Suite 700',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94108',
    latitude: 37.7895,
    longitude: -122.4082,
    phone: '+1 (415) 555-0192',
    email: 'hello@bloomspa.io',
    logoColor: '#4f46e5',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '09:00 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:30 AM', '11:00 AM', '01:30 PM', '03:15 PM', '05:00 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      tuesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, open: '09:00', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, open: '10:00', close: '16:00', breaks: [] },
      sunday: { enabled: false, open: '10:00', close: '14:00', breaks: [] },
    },
    departments: [
      { id: 'dept-massage', name: 'Bodywork & Massage', description: 'Thermal stone, deep tissue and relaxation' },
      { id: 'dept-skincare', name: 'Holistic Esthetics', description: 'Organic botanical hydro-facials & masks' },
    ],
    staff: [
      {
        id: 'st-bloom-elena',
        businessId: 'biz-bloom-spa',
        name: 'Dr. Elena Rostova',
        role: 'Lead Massage Specialist & Wellness Director',
        avatar: 'https://images.unsplash.com/photo-1594824813627-8152504b2b23?w=200&auto=format&fit=crop&q=80',
        email: 'elena@bloomspa.io',
        phone: '+1 (415) 555-0192',
        genderPreference: 'female',
        qualifications: ['Licensed Massage Therapist', 'Neuromuscular Specialist'],
        experienceYears: 12,
        rating: 4.9,
        reviewCount: 78,
        bio: 'Holistic restorative practitioner specializing in botanical aromatherapy and thermal stone bodywork.',
        serviceIds: ['srv-bloom-1', 'srv-bloom-3', 'srv-bloom-4'],
        workingHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
        breakTimes: [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
        active: true,
      },
      {
        id: 'st-bloom-marcus',
        businessId: 'biz-bloom-spa',
        name: 'Marcus Vance',
        role: 'Master Bodywork Specialist',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        email: 'marcus@bloomspa.io',
        phone: '+1 (415) 555-0193',
        genderPreference: 'male',
        qualifications: ['Certified Deep Tissue Practitioner', 'Myofascial Release'],
        experienceYears: 9,
        rating: 4.8,
        reviewCount: 52,
        bio: 'Deep tissue and athletic recovery expert with customized pressure control and postural release.',
        serviceIds: ['srv-bloom-1', 'srv-bloom-3', 'srv-bloom-4'],
        workingHours: { start: '10:00', end: '18:00', days: [2, 3, 4, 5, 6] },
        breakTimes: [{ start: '13:30', end: '14:30', label: 'Break' }],
        active: true,
      },
      {
        id: 'st-bloom-sophia',
        businessId: 'biz-bloom-spa',
        name: 'Sophia Chen',
        role: 'Senior Holistic Esthetician',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        email: 'sophia@bloomspa.io',
        phone: '+1 (415) 555-0194',
        genderPreference: 'female',
        qualifications: ['Licensed Master Esthetician', 'Organic Hydro-Facial Specialist'],
        experienceYears: 7,
        rating: 4.9,
        reviewCount: 44,
        bio: 'Skin health and organic botanical facial therapist using ultrasonic extraction and floral essences.',
        serviceIds: ['srv-bloom-2'],
        workingHours: { start: '09:00', end: '17:00', days: [1, 3, 4, 5, 6] },
        breakTimes: [{ start: '12:30', end: '13:30', label: 'Lunch Break' }],
        active: true,
      },
    ],
    services: [
      { id: 'srv-bloom-1', name: 'Herbal Steam Therapy & Massage', duration: '60 min', durationMinutes: 60, price: 95, active: true, description: 'Full-body restorative botanical oil massage with aromatic sauna relaxation.' },
      { id: 'srv-bloom-2', name: 'Organic Botanical Hydro-Facial', duration: '50 min', durationMinutes: 50, price: 110, active: true, description: 'Deep pore extraction, vitamin infusion, and cold-pressed floral essence mask.' },
      { id: 'srv-bloom-3', name: 'Deep Tissue Ritual', duration: '75 min', durationMinutes: 75, price: 130, active: true, description: 'Targeted myofascial release focusing on chronic neck, back, and shoulder tension.' },
      { id: 'srv-bloom-4', name: 'Hot Basalt Stone Session', duration: '60 min', durationMinutes: 60, price: 120, active: true, description: 'Smooth heated river stones melting muscular soreness and promoting deep circulation.' },
    ],
    createdAt: '2025-01-10T10:00:00.000Z',
    updatedAt: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'biz-city-wellness-dental',
    ownerId: 'user-dental-owner',
    ownerName: 'Dr. Marcus Chen',
    name: 'City Wellness Dental',
    slug: 'city-wellness-dental',
    category: 'Dental',
    tagline: 'Modern preventive & restorative aesthetic dentistry',
    rating: 4.9,
    reviewCount: 210,
    description: 'Gentle, modern aesthetic dental hygiene, digital 3D intraoral scanning, enamel-safe teeth whitening, and preventive care.',
    address: '220 Montgomery St, 5th Floor',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94104',
    latitude: 37.7909,
    longitude: -122.4026,
    phone: '+1 (415) 555-0144',
    email: 'smile@citywellnessdental.com',
    logoColor: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['09:00 AM', '11:15 AM', '02:00 PM', '03:45 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      tuesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      wednesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      thursday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      friday: { enabled: true, open: '08:30', close: '17:00', breaks: [{ start: '12:30', end: '13:30' }] },
      saturday: { enabled: false, open: '09:00', close: '14:00', breaks: [] },
      sunday: { enabled: false, open: '10:00', close: '14:00', breaks: [] },
    },
    services: [
      { id: 'srv-dent-1', name: 'Comprehensive Dental Cleaning & Exam', duration: '45 min', durationMinutes: 45, price: 120, active: true, description: 'Ultrasonic scaling, enamel polish, periodontal charting, and digital bite-wing X-rays.' },
      { id: 'srv-dent-2', name: 'Aesthetic Consultation & 3D Smile Scan', duration: '30 min', durationMinutes: 30, price: 80, active: true, description: 'High-definition digital orthodontic scan and clear aligner consultation.' },
      { id: 'srv-dent-3', name: 'Laser Teeth Whitening Treatment', duration: '60 min', durationMinutes: 60, price: 250, active: true, description: 'Clinical chairside light-accelerated whitening with zero enamel sensitivity guarantee.' },
    ],
    createdAt: '2025-01-12T10:00:00.000Z',
    updatedAt: '2025-01-12T10:00:00.000Z',
  },
  {
    id: 'biz-apex-precision',
    ownerId: 'user-apex-owner',
    ownerName: 'Dr. Sarah Lin',
    name: 'Apex Precision Clinic',
    slug: 'apex-precision-clinic',
    category: 'Clinic',
    tagline: 'Evidence-based integrative physical health & longevity diagnostics',
    rating: 4.8,
    reviewCount: 98,
    description: 'Integrative health consultations, executive physical assessments, and personalized preventative care therapy.',
    address: '742 Montgomery St, Suite 400',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94111',
    latitude: 37.7963,
    longitude: -122.4035,
    phone: '+1 (415) 555-0188',
    email: 'appointments@apexclinic.io',
    logoColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '08:30 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:45 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '08:30', close: '18:00', breaks: [{ start: '12:30', end: '13:30' }] },
      tuesday: { enabled: true, open: '08:30', close: '18:00', breaks: [{ start: '12:30', end: '13:30' }] },
      wednesday: { enabled: true, open: '08:30', close: '18:00', breaks: [{ start: '12:30', end: '13:30' }] },
      thursday: { enabled: true, open: '08:30', close: '18:00', breaks: [{ start: '12:30', end: '13:30' }] },
      friday: { enabled: true, open: '08:30', close: '17:00', breaks: [{ start: '12:30', end: '13:30' }] },
      saturday: { enabled: false, open: '09:00', close: '13:00', breaks: [] },
      sunday: { enabled: false, open: '09:00', close: '13:00', breaks: [] },
    },
    services: [
      { id: 'srv-apex-1', name: 'Comprehensive Health & Longevity Consultation', duration: '45 min', durationMinutes: 45, price: 95, active: true, description: 'Diagnostic evaluation, blood panel biomarker review, and preventive regimen.' },
      { id: 'srv-apex-2', name: 'Preventative Wellness Assessment', duration: '30 min', durationMinutes: 30, price: 65, active: true, description: 'Cardiovascular risk profiling and ergonomic biomechanics review.' },
    ],
    createdAt: '2025-01-14T10:00:00.000Z',
    updatedAt: '2025-01-14T10:00:00.000Z',
  },
  {
    id: 'biz-lumiere-salon',
    ownerId: 'user-lumiere-owner',
    ownerName: 'Sophie Moreau',
    name: 'Lumière Hair Atelier',
    slug: 'lumiere-hair-atelier',
    category: 'Salon',
    tagline: 'Artisanal haircutting, balayage, and botanical hair repair',
    rating: 4.9,
    reviewCount: 175,
    description: 'Boutique hair salon specializing in bespoke precision cutting, natural sun-kissed balayage, and organic scalp rituals.',
    address: '580 Union St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94133',
    latitude: 37.8005,
    longitude: -122.4089,
    phone: '+1 (415) 555-0166',
    email: 'atelier@lumieresf.com',
    logoColor: '#f43f5e',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '10:00 AM',
    closingTime: '07:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['10:30 AM', '01:00 PM', '03:30 PM', '05:30 PM'],
    weeklyAvailability: {
      monday: { enabled: false, open: '10:00', close: '18:00', breaks: [] },
      tuesday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      wednesday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      thursday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      friday: { enabled: true, open: '10:00', close: '19:00', breaks: [{ start: '14:00', end: '15:00' }] },
      saturday: { enabled: true, open: '09:00', close: '18:00', breaks: [] },
      sunday: { enabled: false, open: '10:00', close: '16:00', breaks: [] },
    },
    services: [
      { id: 'srv-lum-1', name: 'Signature Precision Cut & Botanical Blowout', duration: '60 min', durationMinutes: 60, price: 90, active: true, description: 'Custom hair wash with organic botanical masque followed by precision styling.' },
      { id: 'srv-lum-2', name: 'Bespoke Hand-Painted Balayage & Gloss', duration: '120 min', durationMinutes: 120, price: 210, active: true, description: 'Seamless dimension coloring, bond-builder therapy, and toning gloss finish.' },
      { id: 'srv-lum-3', name: 'Restorative Keratin & Scalp Detox Ritual', duration: '45 min', durationMinutes: 45, price: 75, active: true, description: 'Exfoliating botanical scalp massage and deep restorative protein seal.' },
    ],
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'biz-paws-vet',
    ownerId: 'user-vet-owner',
    ownerName: 'Dr. Rachel Adams',
    name: 'Paws & Whiskers Veterinary Clinic',
    slug: 'paws-whiskers-vet',
    category: 'Veterinary',
    tagline: 'Compassionate medical, dental & wellness care for dogs and cats',
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
    logoColor: '#8b5cf6',
    image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['09:00 AM', '11:15 AM', '01:45 PM', '03:30 PM', '04:45 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      tuesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      wednesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      thursday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      friday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      saturday: { enabled: true, open: '09:00', close: '14:00', breaks: [] },
      sunday: { enabled: false, open: '09:00', close: '14:00', breaks: [] },
    },
    services: [
      { id: 'srv-vet-1', name: 'Comprehensive Veterinary Pet Wellness Exam', duration: '40 min', durationMinutes: 40, price: 85, active: true, description: 'Vital signs, coat, eyes, ears, weight check, and tailored vaccine schedule.' },
      { id: 'srv-vet-2', name: 'Full-Service Canine Grooming & De-Shedding Spa', duration: '60 min', durationMinutes: 60, price: 75, active: true, description: 'Soothing oatmeal bath, gentle ear flush, sanitary trim, and blueberry facial.' },
      { id: 'srv-vet-3', name: 'Companion Animal Dental Care & Hygiene', duration: '50 min', durationMinutes: 50, price: 140, active: true, description: 'Full oral tartar scaling, gum inspection, and preventative fluoride polish.' },
    ],
    createdAt: '2025-01-16T10:00:00.000Z',
    updatedAt: '2025-01-16T10:00:00.000Z',
  },
  {
    id: 'biz-apex-auto',
    ownerId: 'user-auto-owner',
    ownerName: 'Marco Bellini',
    name: 'Apex European Auto Care',
    slug: 'apex-european-auto',
    category: 'Auto Care',
    tagline: 'ASE-certified computerized diagnostics, brakes & synthetic fluids',
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
    logoColor: '#f97316',
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '08:00 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['08:30 AM', '10:00 AM', '01:00 PM', '02:45 PM', '04:15 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '08:00', close: '17:30', breaks: [{ start: '12:00', end: '13:00' }] },
      tuesday: { enabled: true, open: '08:00', close: '17:30', breaks: [{ start: '12:00', end: '13:00' }] },
      wednesday: { enabled: true, open: '08:00', close: '17:30', breaks: [{ start: '12:00', end: '13:00' }] },
      thursday: { enabled: true, open: '08:00', close: '17:30', breaks: [{ start: '12:00', end: '13:00' }] },
      friday: { enabled: true, open: '08:00', close: '17:30', breaks: [{ start: '12:00', end: '13:00' }] },
      saturday: { enabled: false, open: '09:00', close: '14:00', breaks: [] },
      sunday: { enabled: false, open: '09:00', close: '14:00', breaks: [] },
    },
    services: [
      { id: 'srv-auto-1', name: 'Multi-Point Vehicle Inspection & Diagnostics', duration: '45 min', durationMinutes: 45, price: 90, active: true, description: 'OBD-II computer scan, brake thickness, fluid quality, and suspension check.' },
      { id: 'srv-auto-2', name: 'Full Synthetic Oil Service & Filter Replacement', duration: '35 min', durationMinutes: 35, price: 85, active: true, description: 'Premium OEM spec synthetic oil, filter replacement, and tire pressure check.' },
      { id: 'srv-auto-3', name: 'Brake System Safety Overhaul & Pad Replacement', duration: '60 min', durationMinutes: 60, price: 160, active: true, description: 'Ceramic brake pad installation, rotor resurfacing, and brake fluid flush.' },
    ],
    createdAt: '2025-01-18T10:00:00.000Z',
    updatedAt: '2025-01-18T10:00:00.000Z',
  },
  {
    id: 'biz-pulse-athletics',
    ownerId: 'user-pulse-owner',
    ownerName: 'Marcus Vance',
    name: 'Pulse Athletic & Performance Club',
    slug: 'pulse-athletic-club',
    category: 'Fitness',
    tagline: 'High-performance athletic conditioning, HIIT & recovery therapies',
    rating: 4.9,
    reviewCount: 164,
    description: 'Premier functional fitness training facility offering tailored athletic evaluations, HIIT sessions, and contrast hydro-recovery.',
    address: '350 Townsend St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94107',
    latitude: 37.7766,
    longitude: -122.3985,
    phone: '+1 (415) 555-0155',
    email: 'train@pulseathletic.com',
    logoColor: '#10b981',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '06:00 AM',
    closingTime: '08:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['07:00 AM', '09:30 AM', '12:00 PM', '04:30 PM', '06:00 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '06:00', close: '20:30', breaks: [{ start: '13:00', end: '14:00' }] },
      tuesday: { enabled: true, open: '06:00', close: '20:30', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, open: '06:00', close: '20:30', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, open: '06:00', close: '20:30', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, open: '06:00', close: '20:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, open: '07:30', close: '16:00', breaks: [] },
      sunday: { enabled: false, open: '09:00', close: '13:00', breaks: [] },
    },
    services: [
      { id: 'srv-pulse-1', name: 'Comprehensive Functional Movement & Fitness Assessment', duration: '60 min', durationMinutes: 60, price: 80, active: true, description: 'Biomechanical screen, VO2 estimate, core stability diagnostics, and goal protocol.' },
      { id: 'srv-pulse-2', name: 'Contrast Hydrotherapy & Cold Plunge Recovery', duration: '45 min', durationMinutes: 45, price: 65, active: true, description: 'Infrared sauna followed by 45°F cold-water immersion for inflammation clearance.' },
      { id: 'srv-pulse-3', name: 'Small-Group High Intensity Athletic Conditioning', duration: '50 min', durationMinutes: 50, price: 45, active: true, description: 'Coach-guided functional strength intervals, kettlebells, rowers, and core stability.' },
    ],
    createdAt: '2025-01-20T10:00:00.000Z',
    updatedAt: '2025-01-20T10:00:00.000Z',
  },
  {
    id: 'biz-zenith-pilates',
    ownerId: 'user-zenith-owner',
    ownerName: 'Clara Lin',
    name: 'Zenith Reformer Pilates & Yoga',
    slug: 'zenith-pilates-yoga',
    category: 'Fitness',
    tagline: 'Mindful core alignment, reformer sculpting & breathwork sanctuary',
    rating: 4.9,
    reviewCount: 118,
    description: 'Boutique mind-body studio with state-of-the-art Allegro reformers, restorative hot yoga, and sound bath sessions.',
    address: '1890 Market St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94102',
    latitude: 37.7712,
    longitude: -122.4245,
    phone: '+1 (415) 555-0138',
    email: 'connect@zenithpilates.com',
    logoColor: '#059669',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '07:00 AM',
    closingTime: '07:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlotsToday: ['08:00 AM', '10:30 AM', '01:00 PM', '04:00 PM', '06:00 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '07:00', close: '19:30', breaks: [{ start: '12:00', end: '13:00' }] },
      tuesday: { enabled: true, open: '07:00', close: '19:30', breaks: [{ start: '12:00', end: '13:00' }] },
      wednesday: { enabled: true, open: '07:00', close: '19:30', breaks: [{ start: '12:00', end: '13:00' }] },
      thursday: { enabled: true, open: '07:00', close: '19:30', breaks: [{ start: '12:00', end: '13:00' }] },
      friday: { enabled: true, open: '07:00', close: '19:00', breaks: [{ start: '12:00', end: '13:00' }] },
      saturday: { enabled: true, open: '08:00', close: '16:00', breaks: [] },
      sunday: { enabled: true, open: '09:00', close: '15:00', breaks: [] },
    },
    services: [
      { id: 'srv-zen-1', name: 'Private Classical Reformer Alignment Session', duration: '55 min', durationMinutes: 55, price: 95, active: true, description: 'One-on-one custom reformer training targeting deep core, spine posture, and flexibility.' },
      { id: 'srv-zen-2', name: 'Duet Semi-Private Reformer Sculpt', duration: '50 min', durationMinutes: 50, price: 60, active: true, description: 'Two-person customized reformer flow balancing athletic resistance and low-impact control.' },
      { id: 'srv-zen-3', name: 'Restorative Yin Yoga & Crystal Sound Bath', duration: '60 min', durationMinutes: 60, price: 40, active: true, description: 'Subtle fascia stretching with meditative Tibetan crystal singing bowl vibrations.' },
    ],
    createdAt: '2025-01-21T10:00:00.000Z',
    updatedAt: '2025-01-21T10:00:00.000Z',
  },
  {
    id: 'biz-iron-ink',
    ownerId: 'user-ink-owner',
    ownerName: 'Damian Cruz',
    name: 'Iron & Ink Artisanal Tattoo',
    slug: 'iron-ink-tattoo',
    category: 'Tattoo',
    tagline: 'Custom fine-line illustrative & botanical tattoo artistry',
    rating: 5.0,
    reviewCount: 92,
    description: 'Sterile, licensed custom tattoo studio celebrated for single-needle fine lines, intricate botanical motifs, and bespoke ink designs.',
    address: '768 Haight St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94117',
    latitude: 37.7719,
    longitude: -122.4358,
    phone: '+1 (415) 555-0199',
    email: 'booking@ironandinktattoo.com',
    logoColor: '#334155',
    image: 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '11:00 AM',
    closingTime: '08:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['11:30 AM', '02:00 PM', '04:30 PM'],
    weeklyAvailability: {
      monday: { enabled: false, open: '11:00', close: '20:00', breaks: [] },
      tuesday: { enabled: true, open: '11:00', close: '20:00', breaks: [{ start: '15:00', end: '16:00' }] },
      wednesday: { enabled: true, open: '11:00', close: '20:00', breaks: [{ start: '15:00', end: '16:00' }] },
      thursday: { enabled: true, open: '11:00', close: '20:00', breaks: [{ start: '15:00', end: '16:00' }] },
      friday: { enabled: true, open: '11:00', close: '20:00', breaks: [{ start: '15:00', end: '16:00' }] },
      saturday: { enabled: true, open: '11:00', close: '19:00', breaks: [] },
      sunday: { enabled: false, open: '12:00', close: '17:00', breaks: [] },
    },
    services: [
      { id: 'srv-ink-1', name: 'Fine-Line Botanical & Flash Session', duration: '90 min', durationMinutes: 90, price: 150, active: true, description: 'Micro-needle precise floral, geometric, or script tattooing using vegan black carbon ink.' },
      { id: 'srv-ink-2', name: 'Custom Concept Tattoo Consultation & Stencil', duration: '40 min', durationMinutes: 40, price: 50, active: true, description: 'Detailed art design session, skin placement preview, and size digital rendering.' },
      { id: 'srv-ink-3', name: 'Multi-Session Illustrative Sleeve Block', duration: '180 min', durationMinutes: 180, price: 320, active: true, description: 'Extended half-day session for comprehensive arm/leg illustrative compositions.' },
    ],
    createdAt: '2025-01-22T10:00:00.000Z',
    updatedAt: '2025-01-22T10:00:00.000Z',
  },
  {
    id: 'biz-vanguard-advisory',
    ownerId: 'user-advisory-owner',
    ownerName: 'Nathaniel Sterling',
    name: 'Vanguard Wealth & Business Advisory',
    slug: 'vanguard-wealth-advisory',
    category: 'Advisory',
    tagline: 'Strategic tax, fiduciary wealth & business growth advisory',
    rating: 4.9,
    reviewCount: 76,
    description: 'Fiduciary wealth planning, corporate entity tax restructuring, and strategic business exit advisory for entrepreneurs.',
    address: '101 California St, 32nd Floor',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94111',
    latitude: 37.7928,
    longitude: -122.3982,
    phone: '+1 (415) 555-0120',
    email: 'advisory@vanguardwealth.io',
    logoColor: '#4338ca',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$$',
    openingTime: '08:30 AM',
    closingTime: '05:30 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    availableSlotsToday: ['09:00 AM', '11:00 AM', '01:30 PM', '03:30 PM'],
    weeklyAvailability: {
      monday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      tuesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      wednesday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      thursday: { enabled: true, open: '08:30', close: '17:30', breaks: [{ start: '12:30', end: '13:30' }] },
      friday: { enabled: true, open: '08:30', close: '17:00', breaks: [{ start: '12:30', end: '13:30' }] },
      saturday: { enabled: false, open: '09:00', close: '13:00', breaks: [] },
      sunday: { enabled: false, open: '09:00', close: '13:00', breaks: [] },
    },
    services: [
      { id: 'srv-adv-1', name: 'Comprehensive Executive Financial & Wealth Blueprint', duration: '60 min', durationMinutes: 60, price: 195, active: true, description: 'Portfolio asset review, retirement projection modeling, and risk mitigation plan.' },
      { id: 'srv-adv-2', name: 'Small Business Entity Tax Optimization Session', duration: '50 min', durationMinutes: 50, price: 150, active: true, description: 'LLC/S-Corp deduction audit, pass-through optimization, and quarterly compliance.' },
      { id: 'srv-adv-3', name: 'Strategic Business Expansion & Capital Strategy', duration: '45 min', durationMinutes: 45, price: 120, active: true, description: 'Financial KPI benchmarking, cash flow runways, and debt/equity readiness.' },
    ],
    createdAt: '2025-01-23T10:00:00.000Z',
    updatedAt: '2025-01-23T10:00:00.000Z',
  },
  {
    id: 'biz-aura-photography',
    ownerId: 'user-aura-owner',
    ownerName: 'Chloe Bennett',
    name: 'Aura Creative Studio & Portraits',
    slug: 'aura-creative-studio',
    category: 'Photography',
    tagline: 'Executive portraits, editorial branding & cinematic headshots',
    rating: 4.9,
    reviewCount: 104,
    description: 'Natural light studio in Marina/Cow Hollow creating compelling executive headshots, personal brand libraries, and artist portfolios.',
    address: '2280 Chestnut St',
    city: 'San Francisco',
    state: 'CA',
    pincode: '94123',
    latitude: 37.8003,
    longitude: -122.4412,
    phone: '+1 (415) 555-0172',
    email: 'sessions@auracreativestudio.com',
    logoColor: '#6366f1',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop&q=80',
    priceRange: '$$',
    openingTime: '09:30 AM',
    closingTime: '06:00 PM',
    daysOpen: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: ['10:00 AM', '01:00 PM', '03:00 PM', '04:45 PM'],
    weeklyAvailability: {
      monday: { enabled: false, open: '09:30', close: '18:00', breaks: [] },
      tuesday: { enabled: true, open: '09:30', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      wednesday: { enabled: true, open: '09:30', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      thursday: { enabled: true, open: '09:30', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      friday: { enabled: true, open: '09:30', close: '18:00', breaks: [{ start: '13:00', end: '14:00' }] },
      saturday: { enabled: true, open: '10:00', close: '16:00', breaks: [] },
      sunday: { enabled: false, open: '11:00', close: '15:00', breaks: [] },
    },
    services: [
      { id: 'srv-pho-1', name: 'Executive Studio Portrait & Headshot Session', duration: '45 min', durationMinutes: 45, price: 140, active: true, description: 'Studio strobe lighting setup, 2 wardrobe changes, and 3 retouched high-res files.' },
      { id: 'srv-pho-2', name: 'Editorial Personal Brand & Media Package', duration: '90 min', durationMinutes: 90, price: 280, active: true, description: 'Indoor/outdoor natural lighting, 4 wardrobe looks, and 12 magazine-grade edits.' },
      { id: 'srv-pho-3', name: 'Creative Portfolio & Commercial Product Shoot', duration: '60 min', durationMinutes: 60, price: 190, active: true, description: 'Tailored moodboard aesthetic, macro product detail shots, and full commercial license.' },
    ],
    createdAt: '2025-01-24T10:00:00.000Z',
    updatedAt: '2025-01-24T10:00:00.000Z',
  },
];

const STORAGE_KEY = 'schedora_registered_businesses';

export function slugify(text) {
  if (!text) return 'business';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export function generateUniqueSlug(name, existingBusinesses = []) {
  const baseSlug = slugify(name) || 'business';
  let slug = baseSlug;
  let counter = 2;
  while (existingBusinesses.some((b) => b.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

/**
 * Loads stored businesses from local storage or returns seeded list
 */
export function getLocalBusinesses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge seeded businesses that might not be in the stored array yet
        const existingIds = new Set(parsed.map((b) => b.id));
        const missingSeeded = SEEDED_BUSINESSES.filter((b) => !existingIds.has(b.id));
        if (missingSeeded.length > 0) {
          const merged = [...parsed, ...missingSeeded];
          saveLocalBusinesses(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read local businesses:', err);
  }
  return SEEDED_BUSINESSES;
}

/**
 * Saves businesses to local storage
 */
export function saveLocalBusinesses(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Could not write local businesses:', err);
  }
}

/**
 * Fetch all businesses (API first with local persistence fallback)
 */
export async function getBusinesses() {
  try {
    const res = await fetch('/api/businesses');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Ensure every business has a slug
        const withSlugs = data.map((b) => ({
          ...b,
          slug: b.slug || slugify(b.name),
        }));
        saveLocalBusinesses(withSlugs);
        return withSlugs;
      }
    }
  } catch (err) {
    console.warn('API fetch failed, falling back to local/seeded businesses:', err);
  }
  return getLocalBusinesses();
}

/**
 * Find business by unique slug
 */
export async function getBusinessBySlug(slug) {
  const list = await getBusinesses();
  const normalized = (slug || '').toLowerCase().trim();
  return (
    list.find(
      (b) =>
        (b.slug && b.slug.toLowerCase() === normalized) ||
        slugify(b.name) === normalized ||
        b.id === normalized
    ) || null
  );
}

/**
 * Find business by ID
 */
export async function getBusinessById(id) {
  const list = await getBusinesses();
  return list.find((b) => b.id === id) || null;
}

/**
 * Register a new business
 */
export async function registerBusiness(businessData) {
  const currentList = getLocalBusinesses();
  const slug = businessData.slug || generateUniqueSlug(businessData.name || 'New Business', currentList);

  const newBusiness = {
    id: businessData.id || 'biz-' + Date.now(),
    ownerId: businessData.ownerId || 'user-' + Date.now(),
    ownerName: businessData.ownerName || 'Business Owner',
    name: businessData.name || 'New Business',
    slug,
    category: businessData.category || 'Spa',
    tagline: businessData.tagline || 'Welcome to our verified local practice.',
    rating: 5.0,
    reviewCount: 1,
    description: businessData.description || 'Welcome to our verified local practice.',
    address: businessData.address || '',
    city: businessData.city || 'San Francisco',
    state: businessData.state || 'CA',
    pincode: businessData.pincode || '',
    latitude: Number(businessData.latitude) || 37.7895,
    longitude: Number(businessData.longitude) || -122.4082,
    phone: businessData.phone || '',
    email: businessData.email || '',
    logoColor: businessData.logoColor || '#4f46e5',
    image:
      businessData.image ||
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    priceRange: businessData.priceRange || '$$',
    openingTime: businessData.openingTime || '09:00 AM',
    closingTime: businessData.closingTime || '06:00 PM',
    daysOpen: businessData.daysOpen || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    availableSlotsToday: businessData.availableSlotsToday || [
      '09:30 AM',
      '11:00 AM',
      '02:00 PM',
      '03:45 PM',
      '05:15 PM',
    ],
    weeklyAvailability: businessData.weeklyAvailability || DEFAULT_WEEKLY_AVAILABILITY,
    services: businessData.services || [
      {
        id: 'srv-def-1',
        name: 'Standard Appointment Session',
        duration: '45 min',
        durationMinutes: 45,
        price: 75,
        active: true,
        description: 'Standard diagnostic and care session with personalized review.',
      },
      {
        id: 'srv-def-2',
        name: 'Comprehensive Care Service',
        duration: '60 min',
        durationMinutes: 60,
        price: 110,
        active: true,
        description: 'Extended full-spectrum appointment session with tailored consultation.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Try API first
  try {
    const res = await fetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBusiness),
    });
    if (res.ok) {
      const created = await res.json();
      saveLocalBusinesses([created, ...currentList]);
      return created;
    }
  } catch (err) {
    console.warn('API business registration failed, saving locally:', err);
  }

  // Local fallback
  const updatedList = [newBusiness, ...currentList];
  saveLocalBusinesses(updatedList);
  return newBusiness;
}

/**
 * Update an existing business
 */
export async function updateBusiness(id, updateData) {
  try {
    const res = await fetch(`/api/businesses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    if (res.ok) {
      const updated = await res.json();
      const currentList = getLocalBusinesses();
      const newList = currentList.map((b) => (b.id === id ? { ...b, ...updated } : b));
      saveLocalBusinesses(newList);
      return updated;
    }
  } catch (err) {
    console.warn('API business update failed, saving locally:', err);
  }

  const currentList = getLocalBusinesses();
  const newList = currentList.map((b) => (b.id === id ? { ...b, ...updateData, updatedAt: new Date().toISOString() } : b));
  saveLocalBusinesses(newList);
  return newList.find((b) => b.id === id);
}

/**
 * Staff and Specialists helpers
 */
export async function getStaffForBusiness(businessId) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  return (target && target.staff) ? target.staff : [];
}

export async function addStaffToBusiness(businessId, staffData) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target) return null;

  const newStaff = {
    id: staffData.id || `st-${Date.now()}`,
    businessId,
    name: staffData.name,
    role: staffData.role || 'Specialist',
    email: staffData.email || `${staffData.name.toLowerCase().replace(/\s+/g, '.')}@${target.slug || 'schedora'}.com`,
    phone: staffData.phone || '+1 (555) 000-0000',
    avatar: staffData.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(staffData.name)}`,
    genderPreference: staffData.genderPreference || 'unspecified',
    departmentId: staffData.departmentId || undefined,
    qualifications: staffData.qualifications || [],
    experienceYears: Number(staffData.experienceYears) || 3,
    rating: staffData.rating || 5.0,
    reviewCount: staffData.reviewCount || 1,
    bio: staffData.bio || 'Dedicated professional specialist.',
    serviceIds: staffData.serviceIds || (target.services ? target.services.map((s) => s.id) : []),
    workingHours: staffData.workingHours || {
      start: '09:00',
      end: '17:00',
      days: [1, 2, 3, 4, 5],
    },
    breakTimes: staffData.breakTimes || [{ start: '13:00', end: '14:00', label: 'Lunch Break' }],
    active: true,
  };

  const updatedStaff = [...(target.staff || []), newStaff];
  await updateBusiness(businessId, { staff: updatedStaff });
  return newStaff;
}

export async function updateBusinessStaff(businessId, staffId, staffData) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target || !target.staff) return null;

  const updatedStaff = target.staff.map((s) =>
    s.id === staffId ? { ...s, ...staffData, id: staffId } : s
  );

  await updateBusiness(businessId, { staff: updatedStaff });
  return updatedStaff.find((s) => s.id === staffId);
}

export async function toggleStaffActive(businessId, staffId) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target || !target.staff) return null;

  const updatedStaff = target.staff.map((s) =>
    s.id === staffId ? { ...s, active: !s.active } : s
  );

  await updateBusiness(businessId, { staff: updatedStaff });
  return updatedStaff.find((s) => s.id === staffId);
}

export async function deleteStaffFromBusiness(businessId, staffId) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target || !target.staff) return false;

  const updatedStaff = target.staff.filter((s) => s.id !== staffId);
  await updateBusiness(businessId, { staff: updatedStaff });
  return true;
}

/**
 * Departments helpers
 */
export async function getDepartmentsForBusiness(businessId) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  return (target && target.departments) ? target.departments : [];
}

export async function addDepartmentToBusiness(businessId, deptData) {
  const businesses = getLocalBusinesses();
  const target = businesses.find((b) => b.id === businessId);
  if (!target) return null;

  const newDept = {
    id: deptData.id || `dept-${Date.now()}`,
    name: deptData.name,
    description: deptData.description || '',
    businessId,
  };

  const updatedDepts = [...(target.departments || []), newDept];
  await updateBusiness(businessId, { departments: updatedDepts });
  return newDept;
}
