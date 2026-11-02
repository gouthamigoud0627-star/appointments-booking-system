/**
 * Schedora Supabase Client & Realtime Synchronization Layer
 * Connects directly to Supabase PostgreSQL when credentials exist,
 * with seamless local/backend fallback when offline or in development.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)) ||
  'https://fdkibgppjanocqiamsen.supabase.co';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  (typeof process !== 'undefined' && process.env && (process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) ||
  'sb_publishable_tmRDtIGyWeOBb1dhunp-_g_Uemny8wk';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 10
);

export const supabaseConfig = {
  url: supabaseUrl || '',
  isConfigured: isSupabaseConfigured,
};

// Initialize real Supabase client or lightweight mock fallback
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : {
      isConfigured: false,
      from: (table) => ({
        select: (query = '*') => Promise.resolve({ data: [], error: null }),
        insert: (values) => Promise.resolve({ data: values, error: null }),
        update: (values) => Promise.resolve({ data: values, error: null }),
        delete: () => Promise.resolve({ data: null, error: null }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        signUp: ({ email, password }) => Promise.resolve({ data: { user: { email } }, error: null }),
        signInWithPassword: ({ email, password }) => Promise.resolve({ data: { user: { email } }, error: null }),
      },
      channel: (name) => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
        unsubscribe: () => {},
      }),
    };

/**
 * Subscribes to real-time appointment and notification changes
 */
export function subscribeToRealtimeUpdates(callback) {
  if (isSupabaseConfigured && typeof supabase.channel === 'function') {
    const channel = supabase
      .channel('schedora-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        if (callback) callback('appointment', payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (callback) callback('notification', payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Fallback: Listen to WebSocket or window events
  const handleWindowSync = (e) => {
    if (callback) callback('sync', e.detail);
  };
  window.addEventListener('schedora_realtime_sync', handleWindowSync);
  return () => {
    window.removeEventListener('schedora_realtime_sync', handleWindowSync);
  };
}

/**
 * Persists and updates user profile and selected role in Supabase
 */
export async function syncUserProfileToSupabase({
  authId,
  email,
  name,
  phone = '',
  role = 'customer',
  locationCity = 'Hyderabad',
  locationArea = 'Banjara Hills',
}) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || '').trim();
  const firstName = cleanName.split(' ')[0] || 'User';
  const lastName = cleanName.split(' ').slice(1).join(' ') || '';

  if (isSupabaseConfigured && supabase.from) {
    try {
      // 1. Upsert into public.profiles
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .upsert(
          {
            email: cleanEmail,
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            role: role, // 'customer' | 'business' | 'executive'
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'email' }
        )
        .select()
        .single();

      if (profileErr) {
        console.warn('[Supabase Profiles Sync Note]:', profileErr.message);
      }

      // 2. Upsert into public.user_preferences
      await supabase
        .from('user_preferences')
        .upsert(
          {
            customer_email: cleanEmail,
            role: role,
            location_city: locationCity,
            location_area: locationArea,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'customer_email' }
        );

      return profileData;
    } catch (err) {
      console.warn('[Supabase Sync Exception]:', err);
    }
  }

  return { email: cleanEmail, role, first_name: firstName, last_name: lastName };
}

/**
 * Retrieves persisted user profile and role from Supabase
 */
export async function fetchUserProfileFromSupabase(email) {
  if (!email || !isSupabaseConfigured || !supabase.from) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

