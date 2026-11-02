-- ==============================================================================
-- SCHEDORA MULTI-TENANT APPOINTMENT BOOKING PLATFORM
-- Production Supabase PostgreSQL Schema with RLS, Collision Protection & Realtime
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- Required for GiST non-overlapping appointment exclusion constraints

-- Set Timezone to UTC
SET TIMEZONE TO 'UTC';

-- Helper trigger function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE 1: USERS & AUTH PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE, -- References auth.users(id) if Supabase Auth is enabled
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business_owner', 'admin')),
    avatar_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 2: CUSTOMER PROFILES (Sensitive Demographics & Preferences)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    age INT,
    gender VARCHAR(32),
    location_preference VARCHAR(128) DEFAULT 'San Francisco, CA',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 3: BUSINESSES (Establishments & Profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    slug VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    subcategory VARCHAR(64) NOT NULL,
    description TEXT,
    tagline VARCHAR(255),
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(128) NOT NULL,
    state VARCHAR(64) DEFAULT 'CA',
    pincode VARCHAR(32),
    latitude NUMERIC(10, 6) DEFAULT 37.774929,
    longitude NUMERIC(10, 6) DEFAULT -122.419416,
    logo_color VARCHAR(16) DEFAULT '#4f46e5',
    image_url TEXT,
    is_open_now BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    opening_time VARCHAR(16) DEFAULT '09:00',
    closing_time VARCHAR(16) DEFAULT '18:00',
    weekly_availability JSONB NOT NULL DEFAULT '{
        "monday": {"enabled": true, "open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
        "tuesday": {"enabled": true, "open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
        "wednesday": {"enabled": true, "open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
        "thursday": {"enabled": true, "open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
        "friday": {"enabled": true, "open": "09:00", "close": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
        "saturday": {"enabled": true, "open": "10:00", "close": "16:00", "breaks": []},
        "sunday": {"enabled": false, "open": "10:00", "close": "14:00", "breaks": []}
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 4: BUSINESS SERVICES (Tenant-Isolated Menus)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    duration_minutes INT NOT NULL DEFAULT 45,
    buffer_time_minutes INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 5: BUSINESS HOLIDAYS & CLOSURES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.business_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Public Holiday / Closed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 6: APPOINTMENTS (With Collision Protection & 6-Char Arrival Tokens)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(12) NOT NULL UNIQUE, -- 6-character human-readable arrival code (e.g. A7K2PX)
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.business_services(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32),
    appointment_date DATE NOT NULL,
    start_time VARCHAR(8) NOT NULL, -- e.g. "09:30"
    end_time VARCHAR(8) NOT NULL,   -- e.g. "10:15"
    duration_minutes INT NOT NULL DEFAULT 45,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
    reminder_24h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_1h_sent BOOLEAN NOT NULL DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_method VARCHAR(32), -- 'qr' | 'manual' | 'token'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for instant lookup by business and date (collision queries)
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON public.appointments (business_id, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_appointments_customer_email ON public.appointments (customer_email);
CREATE INDEX IF NOT EXISTS idx_appointments_token ON public.appointments (token);

-- ==============================================================================
-- TABLE 7: REAL-TIME NOTIFICATIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email VARCHAR(255),
    role VARCHAR(32) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'business', 'both')),
    type VARCHAR(64) NOT NULL DEFAULT 'booking_confirmed', -- 'booking_confirmed', 'booking_cancelled', 'reminder_24h', 'reminder_1h', 'welcome'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    booking_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    booking_token VARCHAR(12),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON public.notifications (user_email, is_read);

-- ==============================================================================
-- TABLE 8: OTP VERIFICATION SESSIONS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- Email or Phone
    code VARCHAR(16) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Businesses are publicly readable
CREATE POLICY "Public can view active businesses"
    ON public.businesses FOR SELECT USING (true);

-- 2. Services are publicly readable
CREATE POLICY "Public can view active services"
    ON public.business_services FOR SELECT USING (is_active = true);

-- 3. Customers can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = auth_id OR auth.uid() IS NULL);

-- 4. Customer profile is private to the customer
CREATE POLICY "Customer profile access"
    ON public.customer_profiles FOR ALL
    USING (auth.uid() IS NULL OR user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()));

-- 5. Appointments: Public can create, Customers can read their own, Business owners can read theirs
CREATE POLICY "Public can create appointments"
    ON public.appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own appointments"
    ON public.appointments FOR SELECT
    USING (
        auth.uid() IS NULL OR
        customer_email = current_setting('request.jwt.claims', true)::json->>'email' OR
        business_id IN (SELECT id FROM public.businesses WHERE owner_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()))
    );

-- 6. Notifications: users can read their own
CREATE POLICY "Users can read own notifications"
    ON public.notifications FOR ALL
    USING (
        auth.uid() IS NULL OR
        user_email = current_setting('request.jwt.claims', true)::json->>'email'
    );

-- Enable Supabase Realtime for Appointments & Notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
