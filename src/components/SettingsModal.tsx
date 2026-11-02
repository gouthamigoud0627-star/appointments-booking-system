import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Check, 
  ShieldCheck, 
  Bell, 
  DollarSign, 
  Clock, 
  Save, 
  Sparkles,
  CheckCircle2,
  CalendarCheck,
  MapPin,
  Navigation
} from 'lucide-react';
import { BusinessSettings } from '../types';

interface SettingsModalProps {
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: BusinessSettings) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ 
    ...settings,
    city: settings.city || 'San Francisco',
    state: settings.state || 'CA',
    pincode: settings.pincode || '94111',
    latitude: settings.latitude ?? 37.7963,
    longitude: settings.longitude ?? -122.4035,
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setDetectingGps(false);
      },
      () => setDetectingGps(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Business Scheduling & Policy Hub</h3>
              <p className="text-xs text-slate-400">Manage confirmation workflows, deposits, cancellation fees, and reminder templates.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Settings and scheduling policies updated successfully!</span>
            </div>
          )}

          {/* 1. Workflow & Auto-Confirmation */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Owner Confirmation Workflow</span>
                </h4>
                <p className="text-slate-600 mt-0.5">
                  Choose whether customer bookings require manual owner approval or confirm instantly.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoConfirmBookings}
                  onChange={(e) =>
                    setFormData({ ...formData, autoConfirmBookings: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="text-[11px] text-slate-500 font-medium">
              {formData.autoConfirmBookings ? (
                <span className="text-emerald-700 font-semibold">
                  ✓ Auto-Confirm Active: Bookings confirm immediately upon deposit.
                </span>
              ) : (
                <span className="text-amber-800 font-semibold">
                  ⚠ Manual Review Active: Owner reviews and confirms each booking manually.
                </span>
              )}
            </div>
          </div>

          {/* 1b. Location & Geographic Coordinates */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Business Location & Coordinates</span>
                </h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Used by customers to calculate distances in the Business Directory.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
              >
                <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                <span>{detectingGps ? 'Detecting...' : 'Detect GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.businessAddress || ''}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  placeholder="e.g. 742 Montgomery St, Suite 400"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State & Pincode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="CA"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                  <input
                    type="text"
                    value={formData.pincode || ''}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="94111"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude ?? 37.7963}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude ?? -122.4035}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* 2. Deposit & Cancellation Policies */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Deposit & Cancellation Policies
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deposit Model</label>
                <select
                  value={formData.depositPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, depositPolicy: e.target.value as any })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                >
                  <option value="flat">Flat Dollar Amount ($)</option>
                  <option value="percentage">Percentage of Total (%)</option>
                  <option value="none">No Deposit Required</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deposit Value ($ / %)</label>
                <input
                  type="number"
                  value={formData.depositValue}
                  onChange={(e) =>
                    setFormData({ ...formData, depositValue: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cancellation Window (Hours)</label>
                <input
                  type="number"
                  value={formData.cancellationWindowHours}
                  onChange={(e) =>
                    setFormData({ ...formData, cancellationWindowHours: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium"
                />
              </div>
            </div>
          </div>

          {/* 3. Automated Notification Rules */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Notification Dispatch Rules
            </h4>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailNotificationsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, emailNotificationsEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="font-medium">Dispatch instant confirmation email upon booking creation</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.smsNotificationsEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, smsNotificationsEnabled: e.target.checked })
                  }
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="font-medium">Dispatch SMS notification on status updates</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminderSchedule.send24hBefore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminderSchedule: {
                        ...formData.reminderSchedule,
                        send24hBefore: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="font-medium">Send automated 24-hour reminder email & SMS</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminderSchedule.send2hBefore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reminderSchedule: {
                        ...formData.reminderSchedule,
                        send2hBefore: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span className="font-medium">Send automated 2-hour urgent SMS alert</span>
              </label>
            </div>
          </div>

          {/* 4. Notification Template Customization */}
          <div className="space-y-3">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Message Templates (Tags: {'{customer_name}'}, {'{service}'}, {'{date}'}, {'{time}'}, {'{code}'})
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Confirmation Template</label>
              <textarea
                rows={2}
                value={formData.emailTemplateConfirmation}
                onChange={(e) =>
                  setFormData({ ...formData, emailTemplateConfirmation: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SMS Reminder Template</label>
              <textarea
                rows={2}
                value={formData.smsTemplateReminder}
                onChange={(e) =>
                  setFormData({ ...formData, smsTemplateReminder: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Footer save */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all hover:scale-105 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
