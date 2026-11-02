/**
 * Schedora Login Page (/login)
 * Beautiful, responsive, accessible authentication experience.
 * Features:
 * - Schedora logo & branding
 * - Welcome heading: "Welcome to Schedora"
 * - Subtitle: "Find the right services, appointments, and offers around you."
 * - Upfront Role Selector: Customer | Business Owner | Executive / Staff
 * - Email and password login with Show/Hide password toggle
 * - Loading indicator during authentication
 * - Forgot password modal with email recovery
 * - Terms of Service and Privacy Policy links
 * - Fast 1-Tap Google & Apple social sign-in
 * - Instant 1-click test credentials for all 3 roles
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Building2,
  User,
  Briefcase,
  CheckCircle2,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import SchedoraLogo from '../components/SchedoraLogo.jsx';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const initialRole: 'customer' | 'business' | 'executive' =
    initialRoleParam === 'business'
      ? 'business'
      : initialRoleParam === 'executive'
      ? 'executive'
      : 'customer';

  const [activeTab, setActiveTab] = useState<'customer' | 'business' | 'executive'>(initialRole);
  const { customerLogin, login, executiveLogin, switchBusiness, businesses = [], loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setSocialLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle(activeTab === 'customer' ? 'customer' : 'business');
      } else {
        await loginWithApple(activeTab === 'customer' ? 'customer' : 'business');
      }
      navigate(activeTab === 'customer' ? '/' : '/dashboard');
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed. Please try again.`);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'customer') {
        await customerLogin(identifier, password);
        navigate('/');
      } else if (activeTab === 'executive') {
        await executiveLogin(identifier, password);
        navigate('/dashboard');
      } else {
        await login(identifier, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoCustomerLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await customerLogin('jahnaviaraja0909@gmail.com', 'password123');
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBusinessLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('owner@bloomspa.io', 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoExecutiveLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await executiveLogin('janvi@schedora.io', 'password123');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Language Selector */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <Link
          to="/"
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <span>← Back to Schedora</span>
        </Link>
        <LanguageSelector variant="dropdown" />
      </div>

      {/* Main Schedora Welcome & Branding */}
      <div className="text-center space-y-1.5 pt-1">
        <div className="flex justify-center mb-2">
          <SchedoraLogo variant="stacked" size={44} textSize="text-2xl" showTagline={false} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome to Schedora
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
          Find the right services, appointments, and offers around you.
        </p>
      </div>

      {/* Upfront Persona / Role Selection: Customer | Business | Executive */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
          Who are you logging in as?
        </span>
        <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setError(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('business');
              setError(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'business'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Business</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('executive');
              setError(null);
            }}
            className={`py-2 px-1 rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'executive'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Executive</span>
          </button>
        </div>
      </div>

      {/* Role explanation */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 text-center">
        {activeTab === 'customer' && 'Discover nearby clinics, salons, spas & claim exclusive local offers.'}
        {activeTab === 'business' && 'Manage your practice schedule, staff bookings, and publish business offers.'}
        {activeTab === 'executive' && 'Coordinate institutional meetings, parent-teacher reviews, interviews & sales demos.'}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Authentication Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
            {activeTab === 'customer'
              ? 'Email or Phone Number'
              : activeTab === 'executive'
              ? 'Corporate / Staff Email'
              : 'Business Email or Phone'}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                activeTab === 'customer'
                  ? 'name@example.com or +91 98765 43210'
                  : activeTab === 'executive'
                  ? 'janvi@schedora.io'
                  : 'owner@bloomspa.io'
              }
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-bold text-slate-700 dark:text-slate-200">Password</label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(identifier);
                setShowForgotModal(true);
              }}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || socialLoading}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying Profile & Signing In...</span>
            </>
          ) : (
            <span>
              {activeTab === 'customer'
                ? 'Sign In to Schedora'
                : activeTab === 'executive'
                ? 'Access Executive Workspace'
                : 'Sign In to Business Portal'}
            </span>
          )}
        </button>
      </form>

      {/* Social Auth (Customer & Business) */}
      {activeTab !== 'executive' && (
        <SocialAuthButtons
          onGoogleSignIn={() => handleSocialSignIn('google')}
          onAppleSignIn={() => handleSocialSignIn('apple')}
          loading={socialLoading}
          actionText="Sign in"
        />
      )}

      {/* Registration Link */}
      <div className="text-center pt-2">
        {activeTab === 'customer' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register?role=customer"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Create customer account
            </Link>
          </p>
        ) : activeTab === 'business' ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Need to register a practice?{' '}
            <Link
              to="/register?role=business"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Register your business
            </Link>
          </p>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Setting up a new organization?{' '}
            <Link
              to="/register?role=business&mode=corporate"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Create institution or corporate space
            </Link>
          </p>
        )}
      </div>

      {/* Terms and Privacy Notice */}
      <p className="text-[10px] text-slate-400 text-center leading-normal">
        By signing in, you agree to Schedora's{' '}
        <span className="underline hover:text-indigo-600 cursor-pointer">Terms of Service</span> and{' '}
        <span className="underline hover:text-indigo-600 cursor-pointer">Privacy Policy</span>. We protect your data and never share private calendar records.
      </p>

      {/* Instant 1-Click Demo Accounts */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
          Instant 1-Click Test Credentials
        </p>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <button
            type="button"
            onClick={handleDemoCustomerLogin}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-slate-900 dark:text-white block truncate">Customer</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Jahnavi Raja</span>
          </button>

          <button
            type="button"
            onClick={handleDemoBusinessLogin}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-slate-900 dark:text-white block truncate">Business</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Bloom Spa</span>
          </button>

          <button
            type="button"
            onClick={handleDemoExecutiveLogin}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-300 text-left transition-colors cursor-pointer"
          >
            <span className="font-bold text-slate-900 dark:text-white block truncate">Executive</span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">Director Janvi</span>
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            {forgotSuccess ? (
              <div className="space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Link Sent</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We sent password reset instructions to {forgotEmail || 'your email'}. Please check your inbox.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset your password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter your email address and we'll send you an instant reset link.
                  </p>
                </div>

                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotSuccess(true)}
                    className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Send Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
