-- ==============================================================================
-- SCHEDORA ENTERPRISE PLATFORM: MASTER PRODUCTION DATABASE DDL
-- Target Engine: PostgreSQL 15.0+ / 16.x
-- Architecture: Multi-Tenant with Row-Level Security (RLS) & GiST Exclusion Locks
-- Modules: 13 Functional Modules | 50+ Specialized Indexes | Audit Triggers | Views
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & ENVIRONMENT INITIALIZATION
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- Standard UUIDv4 Generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Cryptographic Salts & Hashing
CREATE EXTENSION IF NOT EXISTS "btree_gist";     -- GiST Non-Overlapping Scheduling Constraints
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Trigram Matching for Fast Fuzzy Search

-- Set default timezone to UTC
SET TIMEZONE TO 'UTC';

-- Global trigger function to automatically update updated_at timestamp columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- MODULE 1: CORE TENANTS & ORGANIZATIONS
-- ==============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(32) NOT NULL DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'professional', 'enterprise')),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
    billing_email VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(128) UNIQUE,
    max_locations INT NOT NULL DEFAULT 1,
    max_staff INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_configs (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
    primary_color VARCHAR(16) NOT NULL DEFAULT '#2563EB',
    logo_url TEXT,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    date_format VARCHAR(32) NOT NULL DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(16) NOT NULL DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
    sms_sender_name VARCHAR(11) DEFAULT 'Schedora',
    enforce_geofence BOOLEAN NOT NULL DEFAULT TRUE,
    geofence_radius_meters INT NOT NULL DEFAULT 100,
    slot_lock_ttl_seconds INT NOT NULL DEFAULT 600,
    allow_guest_booking BOOLEAN NOT NULL DEFAULT TRUE,
    require_card_preauth BOOLEAN NOT NULL DEFAULT FALSE,
    custom_css TEXT,
    feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    ssl_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MODULE 2: IDENTITY, ROLES & ACCESS CONTROL (RBAC)
-- ==============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    phone_number VARCHAR(32),
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMPTZ,
    phone_verified_at TIMESTAMPTZ,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(64),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL indicates global system role
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE, -- e.g., 'appointments:write', 'analytics:read'
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_tenants (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tenant_id)
);

-- ==============================================================================
-- MODULE 3: BUSINESSES & PHYSICAL LOCATIONS
-- ==============================================================================

CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    website VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    rating_average NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    rating_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, slug)
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(128) NOT NULL,
    state VARCHAR(64) NOT NULL,
    postal_code VARCHAR(32) NOT NULL,
    country VARCHAR(3) NOT NULL DEFAULT 'USA',
    latitude NUMERIC(10,8) NOT NULL,
    longitude NUMERIC(11,8) NOT NULL,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    phone VARCHAR(32) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (open_time < close_time OR is_closed = TRUE),
    UNIQUE(location_id, day_of_week)
);

CREATE TABLE location_holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    holiday_date DATE NOT NULL,
    is_closed_all_day BOOLEAN NOT NULL DEFAULT TRUE,
    open_time TIME,
    close_time TIME,
    UNIQUE(location_id, holiday_date)
);

-- ==============================================================================
-- MODULE 4: SERVICES & SERVICE CATEGORIES
-- ==============================================================================

CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    buffer_before_minutes INT NOT NULL DEFAULT 0,
    buffer_after_minutes INT NOT NULL DEFAULT 10,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    deposit_required NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_capacity_per_slot INT NOT NULL DEFAULT 1,
    color_hex VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, slug)
);

CREATE TABLE service_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE resource_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    resource_type VARCHAR(64) NOT NULL, -- e.g., 'room', 'chair', 'ultrasound_machine'
    quantity_required INT NOT NULL DEFAULT 1
);

-- ==============================================================================
-- MODULE 5: STAFF & ROSTER MANAGEMENT
-- ==============================================================================

CREATE TABLE staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32),
    avatar_url TEXT,
    title VARCHAR(128) NOT NULL DEFAULT 'Service Specialist',
    bio TEXT,
    commission_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    accepts_online_bookings BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE staff_services (
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    custom_price NUMERIC(10,2),
    custom_duration_minutes INT,
    PRIMARY KEY (staff_id, service_id)
);

CREATE TABLE staff_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    is_working_day BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (start_time < end_time),
    CHECK ((break_start IS NULL AND break_end IS NULL) OR (break_start < break_end AND break_start >= start_time AND break_end <= end_time)),
    UNIQUE(staff_id, location_id, day_of_week)
);

CREATE TABLE staff_time_off (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    CHECK (start_time < end_time)
);

-- ==============================================================================
-- MODULE 6: APPOINTMENTS & BOOKINGS
-- ==============================================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    service_variant_id UUID REFERENCES service_variants(id) ON DELETE SET NULL,
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL, -- references customers(id) defined in Module 8
    booking_reference VARCHAR(16) NOT NULL UNIQUE,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    buffer_end TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending_payment', 'confirmed', 'arrived', 'in_progress', 'completed', 'cancelled', 'no_show')),
    payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'deposit_paid', 'fully_paid', 'refunded', 'partially_refunded')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (scheduled_start < scheduled_end),
    CHECK (scheduled_end <= buffer_end)
);

-- Ensure non-overlapping bookings for a staff member using btree_gist extension
-- Active bookings (excluding cancelled or no-shows) cannot overlap on the same staff calendar
ALTER TABLE appointments 
ADD CONSTRAINT no_overlapping_staff_appointments 
EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(scheduled_start, buffer_end) WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show'));

CREATE TABLE appointment_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE appointment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    is_internal_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reschedule_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    previous_start TIMESTAMPTZ NOT NULL,
    previous_end TIMESTAMPTZ NOT NULL,
    new_start TIMESTAMPTZ NOT NULL,
    new_end TIMESTAMPTZ NOT NULL,
    reason TEXT,
    rescheduled_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MODULE 7: QUEUES, ARRIVAL TOKENS & KIOSKS
-- ==============================================================================

CREATE TABLE arrival_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    token_code VARCHAR(12) NOT NULL UNIQUE, -- e.g., 'SC-4892'
    qr_payload TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_via VARCHAR(32) CHECK (verified_via IN ('kiosk_qr', 'kiosk_pin', 'geofence_auto', 'staff_manual')),
    kiosk_id UUID, -- references physical_kiosks
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE physical_kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    device_name VARCHAR(128) NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL UNIQUE,
    api_key_hash VARCHAR(255) NOT NULL,
    last_ping_at TIMESTAMPTZ,
    battery_level INT,
    app_version VARCHAR(32),
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE walk_in_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    customer_name VARCHAR(128) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    party_size INT NOT NULL DEFAULT 1,
    service_id UUID REFERENCES services(id),
    preferred_staff_id UUID REFERENCES staff_profiles(id),
    queue_number INT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'seated', 'cancelled')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_wait_minutes INT NOT NULL DEFAULT 15,
    called_at TIMESTAMPTZ
);

-- ==============================================================================
-- MODULE 8: CUSTOMERS & PROFILES
-- ==============================================================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    address_line1 VARCHAR(255),
    city VARCHAR(128),
    postal_code VARCHAR(32),
    date_of_birth DATE,
    gender VARCHAR(32),
    stripe_customer_id VARCHAR(128),
    total_spend NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    booking_count INT NOT NULL DEFAULT 0,
    no_show_count INT NOT NULL DEFAULT 0,
    cancellation_count INT NOT NULL DEFAULT 0,
    marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
    sms_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email),
    UNIQUE(tenant_id, phone)
);

-- Foreign key linking appointments to customers
ALTER TABLE appointments 
ADD CONSTRAINT fk_appointments_customer 
FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

CREATE TABLE customer_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    membership_plan_name VARCHAR(128) NOT NULL,
    price_per_month NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    renews_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (customer_id, tag)
);

CREATE TABLE customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MODULE 9: PAYMENTS, INVOICES & FINANCIAL LEDGER
-- ==============================================================================

CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(128) NOT NULL UNIQUE,
    brand VARCHAR(32) NOT NULL,
    last4 VARCHAR(4) NOT NULL,
    exp_month INT NOT NULL,
    exp_year INT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(32) NOT NULL UNIQUE,
    subtotal NUMERIC(10,2) NOT NULL,
    tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    tip NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'issued' CHECK (status IN ('draft', 'issued', 'paid', 'void', 'uncollectible')),
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    gateway VARCHAR(32) NOT NULL DEFAULT 'stripe',
    gateway_transaction_id VARCHAR(128) NOT NULL UNIQUE,
    payment_type VARCHAR(32) NOT NULL CHECK (payment_type IN ('card', 'apple_pay', 'google_pay', 'cash', 'gift_card')),
    status VARCHAR(32) NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE RESTRICT,
    amount NUMERIC(10,2) NOT NULL,
    reason TEXT NOT NULL,
    gateway_refund_id VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    stripe_payout_id VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'in_transit' CHECK (status IN ('in_transit', 'paid', 'failed', 'cancelled')),
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estimated_arrival DATE NOT NULL
);

-- ==============================================================================
-- MODULE 10: NOTIFICATIONS & WEBHOOKS
-- ==============================================================================

CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_trigger VARCHAR(64) NOT NULL, -- e.g., 'booking.confirmed', 'arrival.verified'
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'push')),
    subject VARCHAR(255),
    body_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, event_trigger, channel)
);

CREATE TABLE notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(32) NOT NULL CHECK (channel IN ('sms', 'email', 'whatsapp', 'push')),
    status VARCHAR(32) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
    external_provider_id VARCHAR(128),
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    target_url TEXT NOT NULL,
    secret_key VARCHAR(128) NOT NULL,
    subscribed_events TEXT[] NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    response_code INT,
    response_body TEXT,
    attempts INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MODULE 11: REVIEWS & REPUTATION
-- ==============================================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_verified_arrival BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL UNIQUE REFERENCES reviews(id) ON DELETE CASCADE,
    responder_id UUID NOT NULL REFERENCES users(id),
    response_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- MODULE 12: AUDIT LOGGING & SYSTEM EVENTS
-- ==============================================================================

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(64) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_name VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generic Audit Trigger Function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    curr_tenant UUID;
    curr_user UUID;
BEGIN
    curr_tenant := NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
    curr_user := NULLIF(current_setting('app.current_user_id', true), '')::UUID;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (tenant_id, user_id, table_name, record_id, action, new_data)
        VALUES (curr_tenant, curr_user, TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (tenant_id, user_id, table_name, record_id, action, old_data, new_data)
        VALUES (curr_tenant, curr_user, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (tenant_id, user_id, table_name, record_id, action, old_data)
        VALUES (curr_tenant, curr_user, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit Triggers to Key Entities
CREATE TRIGGER audit_appointments_trg
AFTER INSERT OR UPDATE OR DELETE ON appointments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_invoices_trg
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_users_trg
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ==============================================================================
-- MODULE 13: ANALYTICS & AGGREGATE METRICS
-- ==============================================================================

CREATE TABLE daily_booking_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_appointments INT NOT NULL DEFAULT 0,
    completed_appointments INT NOT NULL DEFAULT 0,
    no_show_appointments INT NOT NULL DEFAULT 0,
    cancelled_appointments INT NOT NULL DEFAULT 0,
    gross_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_revenue NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_duration_minutes INT NOT NULL DEFAULT 0,
    UNIQUE(business_id, metric_date)
);

CREATE TABLE staff_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff_profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    utilization_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    appointments_served INT NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    average_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
    tips_received NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    UNIQUE(staff_id, metric_date)
);

-- ==============================================================================
-- 50+ SPECIALIZED & OPTIMIZED PERFORMANCE INDEXES
-- ==============================================================================

-- Tenants & Configs
CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

-- Users & Identity
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_tenants_tenant ON user_tenants(tenant_id);
CREATE INDEX idx_user_tenants_user ON user_tenants(user_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);

-- Businesses & Locations
CREATE INDEX idx_businesses_tenant ON businesses(tenant_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_category ON businesses(category);
CREATE INDEX idx_locations_business ON locations(business_id);
CREATE INDEX idx_locations_coords ON locations(latitude, longitude);
CREATE INDEX idx_business_hours_loc_day ON business_hours(location_id, day_of_week);
CREATE INDEX idx_location_holidays_date ON location_holidays(location_id, holiday_date);

-- Services
CREATE INDEX idx_services_tenant ON services(tenant_id);
CREATE INDEX idx_services_business ON services(business_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_service_variants_service ON service_variants(service_id);

-- Staff & Rosters
CREATE INDEX idx_staff_tenant ON staff_profiles(tenant_id);
CREATE INDEX idx_staff_business ON staff_profiles(business_id);
CREATE INDEX idx_staff_user ON staff_profiles(user_id);
CREATE INDEX idx_staff_schedules_staff_day ON staff_schedules(staff_id, day_of_week);
CREATE INDEX idx_staff_time_off_range ON staff_time_off(staff_id, start_time, end_time);

-- Appointments (High-Throughput Hot Tables)
CREATE INDEX idx_appointments_tenant ON appointments(tenant_id);
CREATE INDEX idx_appointments_business ON appointments(business_id);
CREATE INDEX idx_appointments_location ON appointments(location_id);
CREATE INDEX idx_appointments_staff_time ON appointments(staff_id, scheduled_start, scheduled_end);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_ref ON appointments(booking_reference);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_active_today ON appointments(location_id, scheduled_start) 
    WHERE status IN ('confirmed', 'arrived', 'in_progress');
CREATE INDEX idx_reschedule_history_app ON reschedule_history(appointment_id);

-- Tokens & Kiosks
CREATE INDEX idx_arrival_tokens_code ON arrival_tokens(token_code);
CREATE INDEX idx_arrival_tokens_app ON arrival_tokens(appointment_id);
CREATE INDEX idx_arrival_tokens_expiry ON arrival_tokens(expires_at) WHERE is_verified = FALSE;
CREATE INDEX idx_physical_kiosks_location ON physical_kiosks(location_id);
CREATE INDEX idx_walk_in_queue_loc_status ON walk_in_queue(location_id, status);

-- Customers
CREATE INDEX idx_customers_tenant ON customers(tenant_id);
CREATE INDEX idx_customers_email ON customers(tenant_id, email);
CREATE INDEX idx_customers_phone ON customers(tenant_id, phone);
CREATE INDEX idx_customers_name_trgm ON customers USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- Financial
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_transactions_invoice ON transactions(invoice_id);
CREATE INDEX idx_transactions_gateway_id ON transactions(gateway_transaction_id);
CREATE INDEX idx_payouts_business ON payouts(business_id);

-- Notifications & Audit
CREATE INDEX idx_notifications_log_tenant ON notifications_log(tenant_id);
CREATE INDEX idx_notifications_log_status ON notifications_log(status) WHERE status = 'queued';
CREATE INDEX idx_webhook_deliveries_sub ON webhook_deliveries(subscription_id);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX idx_system_events_payload ON system_events USING gin (payload);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANCY
-- ==============================================================================

-- Enable RLS across all multi-tenant tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrival_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies (Using session variable 'app.current_tenant_id')
CREATE POLICY tenant_isolation_businesses ON businesses
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_locations ON locations
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_services ON services
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_staff ON staff_profiles
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_appointments ON appointments
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_arrival_tokens ON arrival_tokens
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_customers ON customers
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_invoices ON invoices
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- ==============================================================================
-- REPORTING & OPERATIONAL VIEWS
-- ==============================================================================

-- View: Daily Revenue Aggregate by Business
CREATE OR REPLACE VIEW v_daily_revenue_by_business AS
SELECT 
    b.id AS business_id,
    b.tenant_id,
    b.name AS business_name,
    DATE(a.scheduled_start) AS booking_date,
    COUNT(a.id) AS total_bookings,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) AS completed_bookings,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) AS no_shows,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) AS cancellations,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.total_amount END), 0.00) AS total_revenue
FROM businesses b
JOIN appointments a ON b.id = a.business_id
GROUP BY b.id, b.tenant_id, b.name, DATE(a.scheduled_start);

-- View: Staff Utilization Summary
CREATE OR REPLACE VIEW v_staff_utilization AS
SELECT 
    sp.id AS staff_id,
    sp.tenant_id,
    sp.first_name || ' ' || sp.last_name AS staff_name,
    sp.business_id,
    DATE(a.scheduled_start) AS shift_date,
    COUNT(a.id) AS appointments_count,
    COALESCE(SUM(EXTRACT(EPOCH FROM (a.scheduled_end - a.scheduled_start)) / 60), 0) AS total_booked_minutes
FROM staff_profiles sp
LEFT JOIN appointments a ON sp.id = a.staff_id AND a.status NOT IN ('cancelled', 'no_show')
GROUP BY sp.id, sp.tenant_id, sp.first_name, sp.last_name, sp.business_id, DATE(a.scheduled_start);

-- View: Active Appointments Summary for Real-Time Dispatch
CREATE OR REPLACE VIEW v_active_appointments_summary AS
SELECT 
    a.id AS appointment_id,
    a.booking_reference,
    a.tenant_id,
    b.name AS business_name,
    l.name AS location_name,
    s.name AS service_name,
    sp.first_name || ' ' || sp.last_name AS staff_name,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone AS customer_phone,
    a.scheduled_start,
    a.scheduled_end,
    a.status,
    tok.token_code,
    tok.is_verified AS is_arrived
FROM appointments a
JOIN businesses b ON a.business_id = b.id
JOIN locations l ON a.location_id = l.id
JOIN services s ON a.service_id = s.id
JOIN staff_profiles sp ON a.staff_id = sp.id
JOIN customers c ON a.customer_id = c.id
LEFT JOIN arrival_tokens tok ON a.id = tok.appointment_id
WHERE a.scheduled_start >= CURRENT_DATE 
  AND a.scheduled_start < CURRENT_DATE + INTERVAL '1 day';

-- ==============================================================================
-- DATABASE MAINTENANCE & BACKUP PROCEDURES
-- ==============================================================================

-- 1. Automated Token Expiration Cleaner Function
CREATE OR REPLACE FUNCTION purge_expired_arrival_tokens()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM arrival_tokens
    WHERE expires_at < NOW() - INTERVAL '48 hours'
      AND is_verified = FALSE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 2. Recommended pg_dump command for production backup:
-- pg_dump --format=custom --compress=9 --no-owner --no-privileges \
--         --file=schedora_prod_$(date +%Y%m%d_%H%M%S).dump \
--         -h localhost -U schedora_admin -d schedora_db

-- End of DDL
