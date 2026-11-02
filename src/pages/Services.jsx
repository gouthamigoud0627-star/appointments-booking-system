/**
 * Service Catalog Management (/services)
 * Manage services, pricing, durations, buffer times, categories, and staff assignments.
 */

import React, { useState } from 'react';
import {
  Scissors,
  PlusCircle,
  Clock,
  DollarSign,
  Tag,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Services() {
  const { currentBusiness, updateBusiness } = useAuth();

  const [services, setServices] = useState(currentBusiness?.services || [
    { id: 'srv-1', name: 'Herbal Steam Therapy & Massage', durationMinutes: 60, price: 95, category: 'Bodywork', active: true, description: 'Botanical oil massage with restorative sauna relaxation.' },
    { id: 'srv-2', name: 'Organic Botanical Hydro-Facial', durationMinutes: 50, price: 110, category: 'Skincare', active: true, description: 'Deep pore extraction and floral essence hydration.' },
    { id: 'srv-3', name: 'Deep Tissue Ritual', durationMinutes: 75, price: 130, category: 'Bodywork', active: true, description: 'Myofascial release for chronic tension.' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    durationMinutes: 45,
    price: 80,
    category: 'General',
    description: '',
  });

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newSrv = {
      id: 'srv-' + Date.now(),
      name: formData.name,
      durationMinutes: Number(formData.durationMinutes) || 45,
      duration: `${formData.durationMinutes} min`,
      price: Number(formData.price) || 50,
      category: formData.category || 'General',
      description: formData.description,
      active: true,
    };

    const updatedServices = [...services, newSrv];
    setServices(updatedServices);

    if (currentBusiness) {
      await updateBusiness({ services: updatedServices });
    }

    setModalOpen(false);
    setFormData({ name: '', durationMinutes: 45, price: 80, category: 'General', description: '' });
  };

  const handleToggleActive = async (id) => {
    const updated = services.map((s) => (s.id === id ? { ...s, active: !s.active } : s));
    setServices(updated);
    if (currentBusiness) {
      await updateBusiness({ services: updated });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-700/60">
              <Layers className="w-3.5 h-3.5" />
              <span>Menu & Offerings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Service Management
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Configure treatments, consultations, pricing tiers, and durations for online customer booking.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`bg-white rounded-3xl border p-6 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
              srv.active ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {srv.category || 'Service'}
                </span>
                <button
                  onClick={() => handleToggleActive(srv.id)}
                  title={srv.active ? 'Click to disable: customers cannot book this service while paused' : 'Click to enable: make bookable for clients'}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all border ${
                    srv.active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {srv.active ? '✓ Enabled' : '⏸ Disabled (Unavailable)'}
                </button>
              </div>

              <h3 className="font-bold text-base text-slate-900 leading-snug">{srv.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {srv.description || 'Professional appointment session customized to client requirements.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>{srv.durationMinutes || srv.duration} mins</span>
              </span>
              <span className="text-indigo-600 text-base">${srv.price}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add New Service</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Executive Physical Exam, Precision Scissor Cut..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Price ($ USD)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Category Tag
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Consultations, Diagnostic, Therapy..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explain what the customer will experience..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-600 focus:outline-none"
                />
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
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
