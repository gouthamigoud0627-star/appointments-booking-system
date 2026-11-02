import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  User, 
  UserCheck, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Store, 
  KeyRound,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { AuthUser, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: UserRole;
  onLoginSuccess: (user: AuthUser) => void;
  onOpenBusinessRegister?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialRole = 'customer',
  onLoginSuccess,
  onOpenBusinessRegister,
}) => {
  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  // Business specific fields
  const [businessName, setBusinessName] = useState<string>('');
  const [businessCategory, setBusinessCategory] = useState<string>('Wellness');
  const [businessAddress, setBusinessAddress] = useState<string>('');

  // Demo accounts
  const demoCustomers = [
    {
      id: 'usr-cust-1',
      name: 'Alexander Hayes',
      email: 'alex.hayes@example.com',
      desc: 'VIP Client • Active Arrival Pass (TK-9821)',
      badge: 'VIP Active',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-cust-2',
      name: 'Claire Dupont',
      email: 'claire.dupont@example.com',
      desc: 'Frequent Visitor • 4 Bookings Completed',
      badge: 'VIP Member',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
    {
      id: 'usr-cust-3',
      name: 'Julian Vance-Smith',
      email: 'julian.vs@example.com',
      desc: 'Standard Client • 2 Sessions Booked',
      badge: 'Client',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const demoBusinesses = [
    {
      id: 'usr-biz-1',
      name: 'Apex Precision Care & Studio',
      owner: 'Dr. Elena Rostova',
      email: 'appointments@apexstudio.io',
      desc: 'Clinic & Diagnostic Center • 4 Specialists Active',
      category: 'Clinic',
      badge: 'Primary Venue',
    },
    {
      id: 'usr-biz-2',
      name: 'Bloom Spa',
      owner: 'Maya Lin',
      email: 'hello@bloomspa.io',
      desc: 'Hydrotherapy & Holistic Spa • 6 Slots Available Today',
      category: 'Spa',
      badge: 'Popular',
    },
    {
      id: 'usr-biz-3',
      name: 'Lumière Hair & Aesthetics',
      owner: 'Jean-Luc Moreau',
      email: 'stylist@lumieresalon.com',
      desc: 'Boutique Salon & Styling • 4.9 Star Rating',
      category: 'Salon',
      badge: 'Verified',
    },
    {
      id: 'usr-biz-4',
      name: 'Zenith Physiotherapy & Sports Clinic',
      owner: 'Dr. Marcus Vance',
      email: 'team@zenithclinic.com',
      desc: 'Physical Rehabilitation & Sports Medicine',
      category: 'Clinic',
      badge: 'Medical',
    },
  ];

  useEffect(() => {
    if (isOpen) {
      setActiveRole(initialRole);
      setIsRegisterMode(false);
      setErrorMessage(null);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleDemoLogin = async (demoId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoId, role: activeRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('schedora_auth_user', JSON.stringify(data.user));
        localStorage.setItem('schedora_auth_token', data.token);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Login failed');
      }
    } catch (err: any) {
      setErrorMessage('Could not connect to authentication service.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode
      ? {
          role: activeRole,
          name: name.trim() || (activeRole === 'business' ? businessName : 'Guest Customer'),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          businessName: activeRole === 'business' ? businessName : undefined,
          businessCategory: activeRole === 'business' ? businessCategory : undefined,
          businessAddress: activeRole === 'business' ? businessAddress : undefined,
        }
      : {
          role: activeRole,
          email: email.trim().toLowerCase(),
          password,
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('schedora_auth_user', JSON.stringify(data.user));
        localStorage.setItem('schedora_auth_token', data.token);
        onLoginSuccess(data.user);
        onClose();
      } else {
        setErrorMessage(data.error || 'Authentication failed. Please check your entries.');
      }
    } catch (err: any) {
      setErrorMessage('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
              activeRole === 'business'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/20 shadow-lg'
                : 'bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-indigo-500/20 shadow-lg'
            }`}>
              {activeRole === 'business' ? <Building2 className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {activeRole === 'business' ? 'Business Portal Login' : 'Customer Account Login'}
              </h3>
              <p className="text-xs text-slate-300">
                {activeRole === 'business'
                  ? 'Access Business Hub, arrival check-in & roster'
                  : 'View appointment passes, physical arrival tokens & history'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Switcher Tabs */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl">
            <button
              type="button"
              id="auth-role-customer-btn"
              onClick={() => {
                setActiveRole('customer');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'customer'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Customer Login</span>
            </button>

            <button
              type="button"
              id="auth-role-business-btn"
              onClick={() => {
                setActiveRole('business');
                setErrorMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                activeRole === 'business'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Business Login</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Demo 1-Click Login Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                1-Click Instant Demo Access
              </span>
              <span className="text-[10px] text-slate-400 font-medium">No password needed</span>
            </div>

            {activeRole === 'customer' ? (
              <div className="space-y-2">
                {demoCustomers.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => handleDemoLogin(cust.id)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={cust.avatar}
                        alt={cust.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                          {cust.name}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold">
                            {cust.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">{cust.desc}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {demoBusinesses.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => handleDemoLogin(biz.id)}
                    disabled={loading}
                    className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 flex items-center gap-1.5">
                        {biz.name}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {biz.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Owner: {biz.owner} • {biz.desc}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 my-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Or Sign In With Email
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Custom Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegisterMode && (
              <>
                {activeRole === 'business' ? (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business Name</label>
                      <div className="relative">
                        <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Apex Wellness & Aesthetics"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                        >
                          <option value="Wellness">Wellness & Health</option>
                          <option value="Salon">Salon & Hair Care</option>
                          <option value="Spa">Spa & Massage</option>
                          <option value="Clinic">Clinic & Medical</option>
                          <option value="Fitness">Fitness & Yoga</option>
                          <option value="Consulting">Professional Consulting</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Owner Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Physical Venue Address</label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={businessAddress}
                          onChange={(e) => setBusinessAddress(e.target.value)}
                          placeholder="e.g. 742 Montgomery St, San Francisco"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (SMS passes)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {activeRole === 'business' ? 'Business Email Address' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeRole === 'business' ? 'owner@yourbusiness.com' : 'you@example.com'}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 mt-2 ${
                activeRole === 'business'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
              }`}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : isRegisterMode ? (
                <span>Create {activeRole === 'business' ? 'Business' : 'Customer'} Account</span>
              ) : (
                <span>Sign In as {activeRole === 'business' ? 'Business Owner' : 'Customer'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="pt-2 text-center text-xs text-slate-600">
            {isRegisterMode ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(false)}
                  className="font-bold text-indigo-600 hover:underline"
                >
                  Sign In instead
                </button>
              </p>
            ) : (
              <p>
                {activeRole === 'business' ? 'New small business? ' : "Don't have a customer profile? "}
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(true)}
                  className={`font-bold hover:underline ${activeRole === 'business' ? 'text-emerald-700' : 'text-indigo-600'}`}
                >
                  {activeRole === 'business' ? 'Register your business on Schedora' : 'Create customer account'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure TLS Encryption • Schedora Unified Auth</span>
          </div>
          <span>v3.0</span>
        </div>
      </div>
    </div>
  );
};
