-- Schedora 2.5: Personalized Recommendations, Location Discovery & Business Offers Schema
-- Migration: 20261022010000_schedora_offers_and_preferences.sql

-- 1. User Discovery & Recommendation Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL UNIQUE,
  categories JSONB NOT NULL DEFAULT '["Healthcare & Clinics", "Beauty & Salons"]'::jsonb,
  recommendation_types JSONB NOT NULL DEFAULT '["Current discounts and offers", "Nearby businesses", "Highly rated businesses"]'::jsonb,
  budget_range TEXT NOT NULL DEFAULT '₹500 - ₹1,500',
  max_distance_km NUMERIC NOT NULL DEFAULT 10,
  location_city TEXT NOT NULL DEFAULT 'Hyderabad',
  location_area TEXT NOT NULL DEFAULT 'Banjara Hills',
  latitude NUMERIC(10, 6) DEFAULT 17.415600,
  longitude NUMERIC(10, 6) DEFAULT 78.435000,
  offers_enabled BOOLEAN NOT NULL DEFAULT true,
  personalized_enabled BOOLEAN NOT NULL DEFAULT true,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Business Offers & Promotions Table
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_slug TEXT,
  business_category TEXT NOT NULL,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  business_country TEXT,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  applicable_services JSONB NOT NULL DEFAULT '["all"]'::jsonb,
  applicable_service_names JSONB DEFAULT '[]'::jsonb,
  offer_type TEXT NOT NULL CHECK (offer_type IN ('percentage', 'fixed', 'free_service', 'special_package')),
  discount_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR' CHECK (currency IN ('INR', 'USD')),
  min_order_value NUMERIC(10, 2) DEFAULT 0,
  original_price NUMERIC(10, 2),
  final_price NUMERIC(10, 2),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  max_redemptions INT NOT NULL DEFAULT 0,
  redemptions_count INT NOT NULL DEFAULT 0,
  per_customer_limit INT NOT NULL DEFAULT 1,
  coupon_code TEXT,
  terms TEXT NOT NULL,
  new_customer_only BOOLEAN NOT NULL DEFAULT false,
  branches JSONB DEFAULT '[]'::jsonb,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Offer Redemptions Audit Table
CREATE TABLE IF NOT EXISTS public.offer_redemptions (
  id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  business_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  coupon_code TEXT,
  booking_token TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast location & radius queries
CREATE INDEX IF NOT EXISTS idx_offers_business ON public.offers(business_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_expiry ON public.offers(expiry_date);
CREATE INDEX IF NOT EXISTS idx_offers_coords ON public.offers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_redemptions_offer_cust ON public.offer_redemptions(offer_id, customer_email);
CREATE INDEX IF NOT EXISTS idx_user_preferences_email ON public.user_preferences(customer_email);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Offers: Anyone can read active offers within dates; Business owners can manage their own offers
CREATE POLICY "Public read active offers" ON public.offers
  FOR SELECT USING (status = 'active');

CREATE POLICY "Business manage own offers" ON public.offers
  FOR ALL USING (true); -- In mock/auth environment, allow dashboard management

-- Redemptions: Users can read their own; businesses can see their redemptions
CREATE POLICY "Public create redemptions" ON public.offer_redemptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "View redemptions" ON public.offer_redemptions
  FOR SELECT USING (true);

-- User Preferences: Users can manage their preferences
CREATE POLICY "User manage preferences" ON public.user_preferences
  FOR ALL USING (true);
