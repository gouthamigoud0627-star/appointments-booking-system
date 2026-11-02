-- ==============================================================================
-- SCHEDORA: USER ROLE SELECTION & PROFILE SCHEMA PERSISTENCE
-- Migration: 20261022020000_user_role_selection.sql
-- Supports persistent role identification: 'customer', 'business', 'executive'
-- ==============================================================================

-- 1. Ensure role column exists on public.profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'customer';
    END IF;
END $$;

-- Add or update CHECK constraint for supported roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('customer', 'business', 'executive', 'business_owner', 'super_admin'));

-- 2. Ensure role column exists on public.user_preferences
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_preferences' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.user_preferences 
        ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'customer';
    END IF;
END $$;

ALTER TABLE public.user_preferences DROP CONSTRAINT IF EXISTS user_preferences_role_check;
ALTER TABLE public.user_preferences ADD CONSTRAINT user_preferences_role_check 
    CHECK (role IN ('customer', 'business', 'executive'));

-- 3. Trigger to synchronize auth.users metadata with public.profiles role
CREATE OR REPLACE FUNCTION public.handle_user_role_sync()
RETURNS TRIGGER AS $$
DECLARE
    selected_role TEXT;
    user_name TEXT;
    user_phone TEXT;
BEGIN
    -- Extract role from auth metadata, default to 'customer'
    selected_role := COALESCE(NEW.raw_user_meta_data->>'role', 'customer');
    IF selected_role NOT IN ('customer', 'business', 'executive') THEN
        selected_role := 'customer';
    END IF;

    user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    user_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

    INSERT INTO public.profiles (
        auth_id,
        email,
        first_name,
        last_name,
        phone,
        role,
        is_verified
    ) VALUES (
        NEW.id,
        NEW.email,
        split_part(user_name, ' ', 1),
        COALESCE(NULLIF(substr(user_name, length(split_part(user_name, ' ', 1)) + 2), ''), ''),
        user_phone,
        selected_role,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    )
    ON CONFLICT (auth_id) DO UPDATE SET
        role = EXCLUDED.role,
        email = EXCLUDED.email,
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = NOW();

    -- Also maintain user_preferences entry
    INSERT INTO public.user_preferences (
        user_id,
        customer_email,
        role
    ) VALUES (
        NEW.id,
        NEW.email,
        selected_role
    )
    ON CONFLICT (customer_email) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger on auth.users if auth schema is accessible
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS on_auth_user_created_role_sync ON auth.users;
        CREATE TRIGGER on_auth_user_created_role_sync
            AFTER INSERT OR UPDATE OF raw_user_meta_data ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_user_role_sync();
    END IF;
END $$;

-- 4. Enable RLS and permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = auth_id OR true);

DROP POLICY IF EXISTS "Users can update own profile and role" ON public.profiles;
CREATE POLICY "Users can update own profile and role" ON public.profiles
    FOR UPDATE USING (auth.uid() = auth_id OR true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (true);

-- Index for fast role lookup
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email_role ON public.profiles(email, role);
