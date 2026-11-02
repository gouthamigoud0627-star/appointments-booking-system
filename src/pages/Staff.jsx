/**
 * Staff & Specialists Management (/staff)
 * Manage practitioner profiles, roles, daily rosters, assigned services, and active statuses.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  PlusCircle,
  Clock,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Award,
  Star,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getStaffForBusiness, saveStaffMember, toggleStaffActive } from '../lib/staff.js';

export default function Staff() {
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'biz-happy-paws-grooming';

  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    const list = getStaffForBusiness(businessId);
    if (list && list.length > 0) {
      setStaffList(list);
    } else {
      // Fallback default list
      setStaffList([
        {
          id: 'st-1',
          businessId,
          name: currentBusiness?.ownerName || 'Dr. Elena Rostova',
          role: 'Lead Specialist & Medical Director',
          email: currentBusiness?.email || 'elena@bloomspa.io',
          phone: currentBusiness?.phone || '+1 (415) 555-0192',
          genderPreference: 'female',
          experienceYears: 10,
          rating: 4.9,
          reviewCount: 48,
          active: true,
          serviceIds: ['srv-1', 'srv-2'],
          workingHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
        },
      ]);
    }
  }, [businessId, currentBusiness]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'Specialist',
    email: '',
    phone: '',
    genderPreference: 'female',
    experienceYears: 4,
    hoursStart: '09:00',
    hoursEnd: '17:00',
  });

  const handleAddStaff = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newStaffData = {
      name: formData.name,
      role: formData.role,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@schedora.io`,
      phone: formData.phone || '+1 (555) 000-0000',
      genderPreference: formData.genderPreference,
      experienceYears: Number(formData.experienceYears) || 3,
      rating: 5.0,
      reviewCount: 0,
      active: true,
      serviceIds: (currentBusiness?.services || []).map((s) => s.id),
      workingHours: {
        start: formData.hoursStart,
        end: formData.hoursEnd,
        days: [1, 2, 3, 4, 5, 6],
      },
    };

    const updated = saveStaffMember(businessId, newStaffData);
    if (updated) {
      setStaffList(updated);
    } else {
      setStaffList([...staffList, { ...newStaffData, id: 'st-' + Date.now() }]);
    }
    setModalOpen(false);
    setFormData({
      name: '',
      role: 'Specialist',
      email: '',
      phone: '',
      genderPreference: 'female',
      experienceYears: 4,
      hoursStart: '09:00',
      hoursEnd: '17:00',
    });
  };

  const handleToggleActive = (id) => {
    const updated = toggleStaffActive(businessId, id);
    if (updated && updated.length > 0) {
      setStaffList(updated);
    } else {
      setStaffList(staffList.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Award className="w-3.5 h-3.5" />
              <span>Practitioner Team</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Staff & Specialist Directory
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Assign practitioners to treatments, manage working shifts, and maintain staff availability.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((st) => (
          <div
            key={st.id}
            className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
              st.active ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: st.avatarColor }}
                >
                  {st.name.charAt(0)}
                </div>
                <button
                  onClick={() => handleToggleActive(st.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    st.active
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {st.active ? 'Active Roster' : 'Inactive'}
                </button>
              </div>

              <div>
                <h3 className="font-bold text-base text-slate-900">{st.name}</h3>
                <p className="text-xs text-indigo-600 font-medium">{st.role}</p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{st.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{st.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{st.hours}</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>{st.days}</span>
              <span className="font-semibold text-slate-700">{st.servicesCount} Services Assigned</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Team Specialist</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Designation / Role Title
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g. Lead Aesthetician, Senior Diagnostic Specialist..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="practitioner@practice.com"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                >
                  Save Specialist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
