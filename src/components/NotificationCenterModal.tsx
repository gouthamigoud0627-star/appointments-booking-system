import React, { useState } from 'react';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Check, 
  Send, 
  Filter, 
  Clock, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { NotificationLog } from '../types';

interface NotificationCenterModalProps {
  notifications: NotificationLog[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllRead: () => void;
  onSendTestNotification: (type: 'email' | 'sms' | 'push') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllRead,
  onSendTestNotification,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'push' | 'email' | 'sms'>('all');

  if (!isOpen) return null;

  const filtered = notifications.filter(
    (n) => filterType === 'all' || n.type === filterType
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Notification Center</h3>
              <p className="text-xs text-slate-400">Automated Push, Email & SMS Dispatch Logs</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Test Dispatch Strip */}
        <div className="bg-slate-50 p-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200">
            {(['all', 'push', 'email', 'sms'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md capitalize font-semibold transition-all ${
                  filterType === type ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-medium">Test Dispatch:</span>
            <button
              onClick={() => onSendTestNotification('push')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
            >
              + Push
            </button>
            <button
              onClick={() => onSendTestNotification('email')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
            >
              + Email
            </button>
            <button
              onClick={() => onSendTestNotification('sms')}
              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-bold text-slate-700"
            >
              + SMS
            </button>
          </div>
        </div>

        {/* List of notification items */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No notifications matching this filter.
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`py-3.5 px-3 rounded-xl transition-colors flex items-start gap-3 ${
                  !item.read ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  {item.type === 'push' && <div className="bg-amber-100 text-amber-800 p-1.5 rounded-lg"><Bell className="w-4 h-4" /></div>}
                  {item.type === 'email' && <div className="bg-blue-100 text-blue-800 p-1.5 rounded-lg"><Mail className="w-4 h-4" /></div>}
                  {item.type === 'sms' && <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-lg"><MessageSquare className="w-4 h-4" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Recipient: <strong className="text-slate-600">{item.recipient}</strong></span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold uppercase">{item.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
