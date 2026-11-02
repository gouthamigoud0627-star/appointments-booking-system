/**
 * Schedora Authentication & Multi-Tenant Context
 * Provides session management, credential validation, business isolation, customer onboarding & profiles.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBusinesses, registerBusiness as apiRegisterBusiness, updateBusiness as apiUpdateBusiness, SEEDED_BUSINESSES } from '../lib/business.js';
import { signInWithGoogle, signInWithApple, firebaseSignOut } from '../lib/firebase.ts';
import { syncUserProfileToSupabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'schedora_auth_session';
const CUSTOMER_AUTH_STORAGE_KEY = 'schedora_customer_session';
const ACCOUNTS_STORAGE_KEY = 'schedora_registered_accounts';
const CUSTOMER_ACCOUNTS_STORAGE_KEY = 'schedora_customer_accounts';

// Seeded default accounts for instant testing
const DEFAULT_BUSINESS_ACCOUNTS = [
  {
    id: 'user-bloom-owner',
    email: 'owner@bloomspa.io',
    phone: '+1 (555) 019-2834',
    password: 'password123',
    ownerName: 'Elena Rostova',
    businessId: 'biz-bloom-spa',
  },
  {
    id: 'user-dental-owner',
    email: 'smile@citywellnessdental.com',
    phone: '+1 (555) 014-9982',
    password: 'password123',
    ownerName: 'Dr. Marcus Chen',
    businessId: 'biz-city-wellness-dental',
  },
];

const DEFAULT_CUSTOMER_ACCOUNTS = [
  {
    id: 'cust-jahnavi',
    email: 'jahnaviaraja0909@gmail.com',
    phone: '+91 98765 43210',
    password: 'password123',
    name: 'Jahnavi Raja',
    age: 26,
    gender: 'female',
    locationCity: 'Hyderabad',
    locationArea: 'Banjara Hills',
    language: 'en',
    notificationPreferences: {
      appointmentConfirmations: true,
      appointmentReminders: true,
      reschedulingUpdates: true,
      cancellationUpdates: true,
      businessMessages: true,
      promotionalNotifications: false,
      channelEmail: true,
      channelPush: true,
    },
  },
];

function getStoredBusinessAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Could not read stored business accounts:', err);
  }
  return DEFAULT_BUSINESS_ACCOUNTS;
}

function saveStoredBusinessAccounts(accounts) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Could not save business accounts:', err);
  }
}

function getStoredCustomerAccounts() {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Could not read customer accounts:', err);
  }
  return DEFAULT_CUSTOMER_ACCOUNTS;
}

function saveStoredCustomerAccounts(accounts) {
  try {
    localStorage.setItem(CUSTOMER_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Could not save customer accounts:', err);
  }
}

export function AuthProvider({ children }) {
  // Business Session
  const [currentUser, setCurrentUser] = useState(null); // active business owner
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [businesses, setBusinesses] = useState(SEEDED_BUSINESSES);

  // Customer Session
  const [customerUser, setCustomerUser] = useState(null);

  const [loading, setLoading] = useState(true);

  // Load sessions on startup
  useEffect(() => {
    async function initAuth() {
      try {
        const allBiz = await getBusinesses();
        setBusinesses(allBiz);

        // 1. Restore Business Session
        const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
        if (rawSession) {
          const session = JSON.parse(rawSession);
          if (session && session.user && session.businessId) {
            const matchingBusiness = allBiz.find((b) => b.id === session.businessId);
            if (matchingBusiness) {
              setCurrentUser(session.user);
              setCurrentBusiness(matchingBusiness);
            }
          }
        }

        // 2. Restore Customer Session
        const rawCust = localStorage.getItem(CUSTOMER_AUTH_STORAGE_KEY);
        if (rawCust) {
          const custSession = JSON.parse(rawCust);
          if (custSession && custSession.id) {
            setCustomerUser(custSession);
          }
        } else {
          // Default to Jahnavi for seamless zero-barrier testing
          setCustomerUser(DEFAULT_CUSTOMER_ACCOUNTS[0]);
        }
      } catch (err) {
        console.warn('Failed to restore auth sessions:', err);
      } finally {
        setLoading(false);
      }
    }
    initAuth();
  }, []);

  /**
   * BUSINESS AUTHENTICATION
   */
  const login = async (emailOrPhone, password) => {
    const identifier = (emailOrPhone || '').trim().toLowerCase();
    const accounts = getStoredBusinessAccounts();
    const account = accounts.find(
      (a) => a.email.toLowerCase() === identifier || (a.phone && a.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
    );

    if (!account) {
      throw new Error('No business account found with this email or phone.');
    }

    if (account.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    const all = await getBusinesses();
    const business = all.find((b) => b.id === account.businessId) || SEEDED_BUSINESSES[0];

    const userObj = {
      id: account.id,
      email: account.email,
      phone: account.phone,
      name: account.ownerName,
      role: 'business_owner',
      businessId: business.id,
      businessName: business.name,
    };

    setCurrentUser(userObj);
    setCurrentBusiness(business);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: userObj,
        businessId: business.id,
      })
    );

    return { user: userObj, business };
  };

  const register = async ({ businessName, ownerName, email, password, phone, category, address, city, state, pincode }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const accounts = getStoredBusinessAccounts();

    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address is already registered.');
    }

    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    const userId = 'user-' + Date.now();

    const newBiz = await apiRegisterBusiness({
      name: businessName,
      ownerId: userId,
      ownerName: ownerName,
      email: cleanEmail,
      phone: phone || '',
      category: category || 'Spa',
      address: address || '',
      city: city || 'San Francisco',
      state: state || 'CA',
      pincode: pincode || '',
    });

    const newAccount = {
      id: userId,
      email: cleanEmail,
      phone: phone || '',
      password,
      ownerName,
      businessId: newBiz.id,
    };

    const updatedAccounts = [...accounts, newAccount];
    saveStoredBusinessAccounts(updatedAccounts);

    const userObj = {
      id: userId,
      email: cleanEmail,
      phone: phone || '',
      name: ownerName,
      role: 'business_owner',
      businessId: newBiz.id,
      businessName: newBiz.name,
    };

    setCurrentUser(userObj);
    setCurrentBusiness(newBiz);

    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: userObj,
        businessId: newBiz.id,
      })
    );

    // Persist business user profile and role in Supabase
    syncUserProfileToSupabase({
      authId: userId,
      email: cleanEmail,
      name: ownerName,
      phone: phone || '',
      role: 'business',
      locationCity: city || 'San Francisco',
      locationArea: address || '',
    }).catch(() => {});

    return { user: userObj, business: newBiz };
  };

  const switchBusiness = async (businessId) => {
    const all = businesses && businesses.length > 0 ? businesses : await getBusinesses();
    const target = all.find((b) => b.id === businessId || b.slug === businessId);
    if (target) {
      setCurrentBusiness(target);
      const accounts = getStoredBusinessAccounts();
      const matchingAccount = accounts.find((a) => a.businessId === target.id);
      const userObj = matchingAccount
        ? {
            id: matchingAccount.id,
            email: matchingAccount.email,
            phone: matchingAccount.phone,
            name: matchingAccount.ownerName,
            role: 'business_owner',
            businessId: target.id,
            businessName: target.name,
          }
        : {
            id: target.ownerId || `user-${target.id}`,
            email: target.email || `owner@${target.slug || 'business'}.com`,
            name: target.ownerName || target.name,
            role: 'business_owner',
            businessId: target.id,
            businessName: target.name,
          };
      setCurrentUser(userObj);
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          user: userObj,
          businessId: target.id,
        })
      );
      return target;
    }
    return null;
  };

  const updateBusiness = async (updateData) => {
    if (!currentBusiness) throw new Error('No active business to update.');
    const updated = await apiUpdateBusiness(currentBusiness.id, updateData);
    setCurrentBusiness(updated);
    return updated;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentBusiness(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  /**
   * CUSTOMER AUTHENTICATION & ONBOARDING
   */
  const customerLogin = async (emailOrPhone, password) => {
    const identifier = (emailOrPhone || '').trim().toLowerCase();
    const accounts = getStoredCustomerAccounts();
    const account = accounts.find(
      (a) =>
        a.email.toLowerCase() === identifier ||
        (a.phone && a.phone.replace(/\D/g, '') === identifier.replace(/\D/g, ''))
    );

    if (!account) {
      throw new Error('No customer account found with this email or phone.');
    }

    if (account.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    setCustomerUser(account);
    localStorage.setItem(CUSTOMER_AUTH_STORAGE_KEY, JSON.stringify(account));
    return account;
  };

  const executiveLogin = async (emailOrId, password) => {
    const identifier = (emailOrId || '').trim().toLowerCase();
    const DEFAULT_EXEC_ACCOUNTS = [
      {
        id: 'user-janvi-exec',
        email: 'janvi@schedora.io',
        password: 'password123',
        name: 'Janvi Patel',
        role: 'admin',
        title: 'Director of Product & Engineering',
      },
      {
        id: 'user-marcus-exec',
        email: 'marcus.chen@apex.io',
        password: 'password123',
        name: 'Dr. Marcus Chen',
        role: 'faculty_member',
        title: 'Senior Systems Architect',
      },
      {
        id: 'user-elena-exec',
        email: 'elena@apex.io',
        password: 'password123',
        name: 'Elena Rostova',
        role: 'business_staff',
        title: 'Principal Operations Specialist',
      },
    ];

    const match = DEFAULT_EXEC_ACCOUNTS.find((a) => a.email.toLowerCase() === identifier);
    if (match && match.password !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    const cleanName = match
      ? match.name
      : (identifier.split('@')[0] || 'Executive')
          .split(/[._-]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');

    const userObj = {
      id: match ? match.id : `user-exec-${Date.now()}`,
      email: identifier,
      name: cleanName,
      role: match ? match.role : 'admin',
      title: match ? match.title : 'Executive Lead',
    };

    setCurrentUser(userObj);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userObj, role: 'executive' }));

    // Persist in Supabase
    syncUserProfileToSupabase({
      authId: userObj.id,
      email: identifier,
      name: userObj.name,
      role: 'executive',
      locationCity: 'Global',
      locationArea: 'Executive HQ',
    }).catch(() => {});

    return userObj;
  };

  const executiveRegister = async ({ name, email, password, organizationName, title }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim() || 'Executive Lead';

    const userObj = {
      id: `user-exec-${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      role: 'executive',
      title: title || 'Executive Director',
      organizationName: organizationName || 'Corporate',
      createdAt: new Date().toISOString(),
    };

    setCurrentUser(userObj);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userObj, role: 'executive' }));

    // Persist in Supabase
    syncUserProfileToSupabase({
      authId: userObj.id,
      email: cleanEmail,
      name: cleanName,
      role: 'executive',
      locationCity: 'Global',
      locationArea: organizationName || 'Corporate HQ',
    }).catch(() => {});

    return userObj;
  };

  const customerRegister = async ({ name, email, phone, password, age, dob, gender, locationCity, locationArea, language }) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const accounts = getStoredCustomerAccounts();

    if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const newCustomer = {
      id: 'cust-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password,
      role: 'customer',
      age: age || '',
      dob: dob || '',
      gender: gender || 'prefer_not_to_say',
      locationCity: locationCity || 'Hyderabad',
      locationArea: locationArea || 'Downtown',
      language: language || 'en',
      notificationPreferences: {
        appointmentConfirmations: true,
        appointmentReminders: true,
        reschedulingUpdates: true,
        cancellationUpdates: true,
        businessMessages: true,
        promotionalNotifications: false,
        channelEmail: true,
        channelPush: true,
      },
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...accounts, newCustomer];
    saveStoredCustomerAccounts(updatedAccounts);

    setCustomerUser(newCustomer);
    localStorage.setItem(CUSTOMER_AUTH_STORAGE_KEY, JSON.stringify(newCustomer));

    // Persist in Supabase
    syncUserProfileToSupabase({
      authId: newCustomer.id,
      email: cleanEmail,
      name: newCustomer.name,
      phone: cleanPhone,
      role: 'customer',
      locationCity: newCustomer.locationCity,
      locationArea: newCustomer.locationArea,
    }).catch(() => {});

    return newCustomer;
  };

  const updateCustomerProfile = (updates) => {
    if (!customerUser) return null;
    const updated = { ...customerUser, ...updates };
    setCustomerUser(updated);
    localStorage.setItem(CUSTOMER_AUTH_STORAGE_KEY, JSON.stringify(updated));

    const accounts = getStoredCustomerAccounts();
    const idx = accounts.findIndex((a) => a.id === customerUser.id);
    if (idx !== -1) {
      accounts[idx] = updated;
      saveStoredCustomerAccounts(accounts);
    }
    return updated;
  };

  const customerLogout = () => {
    setCustomerUser(null);
    localStorage.removeItem(CUSTOMER_AUTH_STORAGE_KEY);
    firebaseSignOut().catch(() => {});
  };

  /**
   * FIREBASE SOCIAL AUTHENTICATION (Google & Apple)
   */
  const loginWithSocial = async (providerName, role = 'customer') => {
    const fn = providerName === 'apple' ? signInWithApple : signInWithGoogle;
    const { user: fbUser, error: authError } = await fn();

    if (authError || !fbUser) {
      throw new Error(authError || `${providerName} sign-in failed`);
    }

    const email = fbUser.email || `${fbUser.uid}@schedora.io`;
    const displayName = fbUser.displayName || (providerName === 'apple' ? 'Apple User' : 'Google User');
    const photoURL = fbUser.photoURL || '';

    if (role === 'business') {
      const accounts = getStoredBusinessAccounts();
      let account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());

      let biz;
      if (!account) {
        // Automatically onboard new business with Google/Apple
        biz = await apiRegisterBusiness({
          name: `${displayName}'s Studio`,
          ownerId: fbUser.uid,
          ownerName: displayName,
          email: email,
          phone: fbUser.phoneNumber || '',
          category: 'Spa',
          address: '450 Sutter St',
          city: 'San Francisco',
          state: 'CA',
          pincode: '94108',
        });

        account = {
          id: fbUser.uid,
          email: email,
          phone: fbUser.phoneNumber || '',
          ownerName: displayName,
          businessId: biz.id,
          provider: providerName,
        };

        saveStoredBusinessAccounts([...accounts, account]);
      } else {
        const allBiz = await getBusinesses();
        biz = allBiz.find((b) => b.id === account.businessId) || SEEDED_BUSINESSES[0];
      }

      const userObj = {
        id: fbUser.uid,
        email,
        name: displayName,
        photoURL,
        role: 'business_owner',
        businessId: biz.id,
        businessName: biz.name,
        provider: providerName,
      };

      setCurrentUser(userObj);
      setCurrentBusiness(biz);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userObj, businessId: biz.id }));
      return { user: userObj, business: biz };
    } else {
      // Customer role
      const accounts = getStoredCustomerAccounts();
      let customer = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());

      if (!customer) {
        customer = {
          id: 'cust-' + fbUser.uid.slice(0, 8),
          firebaseUid: fbUser.uid,
          name: displayName,
          email: email,
          phone: fbUser.phoneNumber || '+91 98765 43210',
          photoURL,
          age: 26,
          gender: 'prefer_not_to_say',
          locationCity: 'Hyderabad',
          locationArea: 'Banjara Hills',
          language: 'en',
          provider: providerName,
          notificationPreferences: {
            appointmentConfirmations: true,
            appointmentReminders: true,
            reschedulingUpdates: true,
            cancellationUpdates: true,
            businessMessages: true,
            promotionalNotifications: false,
            channelWhatsApp: true,
            channelSMS: true,
            channelEmail: true,
            channelPush: true,
          },
          createdAt: new Date().toISOString(),
        };
        saveStoredCustomerAccounts([...accounts, customer]);
      }

      setCustomerUser(customer);
      localStorage.setItem(CUSTOMER_AUTH_STORAGE_KEY, JSON.stringify(customer));
      return customer;
    }
  };

  const loginWithGoogle = (role = 'customer') => loginWithSocial('google', role);
  const loginWithApple = (role = 'customer') => loginWithSocial('apple', role);

  const value = {
    // Business
    currentUser,
    currentBusiness,
    businesses: businesses || SEEDED_BUSINESSES,
    userBusinesses: businesses || SEEDED_BUSINESSES,
    switchBusiness,
    updateBusiness,
    login,
    register,
    logout,
    isAuthenticated: Boolean(currentUser && currentBusiness),

    // Customer
    customerUser,
    isCustomerAuthenticated: Boolean(customerUser),
    customerLogin,
    customerRegister,
    updateCustomerProfile,
    customerLogout,

    // Executive & Corporate
    executiveLogin,
    executiveRegister,

    // Active Role & Profile Sync
    userRole: customerUser
      ? 'customer'
      : (currentUser?.role === 'executive' ? 'executive' : (currentUser ? 'business' : null)),
    syncUserProfileToSupabase,

    // Firebase Google & Apple Auth
    loginWithGoogle,
    loginWithApple,

    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
